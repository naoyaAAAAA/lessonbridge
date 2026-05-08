from datetime import datetime
import secrets
import string

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import Base, engine, get_db


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="LessonBridge API",
    description="API for sharing class-wide posts with parents and handling private parent-teacher conversations.",
    version="0.3.0",
)


origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_parent_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"PARENT-{random_part}"


@app.get("/")
def read_root():
    return {
        "message": "LessonBridge API is running",
        "status": "ok",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "lessonbridge-backend",
    }


# -------------------------
# Teacher APIs: Parents
# -------------------------

@app.post("/api/parents", response_model=schemas.ParentResponse)
def create_parent(
    parent: schemas.ParentCreate,
    db: Session = Depends(get_db),
):
    parent_code = generate_parent_code()

    while db.query(models.Parent).filter(models.Parent.parent_code == parent_code).first():
        parent_code = generate_parent_code()

    db_parent = models.Parent(
        name=parent.name,
        child_name=parent.child_name,
        parent_code=parent_code,
    )

    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)

    return db_parent


@app.get("/api/parents", response_model=list[schemas.ParentResponse])
def list_parents(db: Session = Depends(get_db)):
    return db.query(models.Parent).order_by(models.Parent.created_at.desc()).all()


# -------------------------
# Teacher APIs: Posts
# -------------------------

@app.post("/api/posts", response_model=schemas.PostResponse)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
):
    db_post = models.Post(
        title=post.title,
        category=post.category,
        target_group=post.target_group,
        content=post.content,
        homework=post.homework,
        home_support=post.home_support,
        next_plan=post.next_plan,
        message_to_parents=post.message_to_parents,
    )

    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    return db_post


@app.get("/api/posts", response_model=list[schemas.PostResponse])
def list_posts(db: Session = Depends(get_db)):
    return db.query(models.Post).order_by(models.Post.created_at.desc()).all()


@app.get("/api/posts/{post_id}", response_model=schemas.PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return post


@app.post("/api/posts/{post_id}/share", response_model=schemas.PostResponse)
def share_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_shared = True
    post.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(post)

    return post

# -------------------------
# Parent APIs: Login and Posts
# -------------------------

@app.post("/api/parent/login", response_model=schemas.ParentLoginResponse)
def parent_login(
    request: schemas.ParentLoginRequest,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.parent_code == request.parent_code)
        .first()
    )

    if not parent:
        raise HTTPException(status_code=404, detail="Invalid parent code")

    return parent


@app.get("/api/parent/posts", response_model=list[schemas.PostResponse])
def list_shared_posts_for_parent(
    parent_code: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.parent_code == parent_code)
        .first()
    )

    if not parent:
        raise HTTPException(status_code=404, detail="Invalid parent code")

    return (
        db.query(models.Post)
        .filter(models.Post.is_shared == True)
        .order_by(models.Post.created_at.desc())
        .all()
    )


@app.get("/api/parent/posts/{post_id}", response_model=schemas.PostResponse)
def get_shared_post_for_parent(
    post_id: int,
    parent_code: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.parent_code == parent_code)
        .first()
    )

    if not parent:
        raise HTTPException(status_code=404, detail="Invalid parent code")

    post = (
        db.query(models.Post)
        .filter(
            models.Post.id == post_id,
            models.Post.is_shared == True,
        )
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Shared post not found")

    return post

# -------------------------
# Parent APIs: Private Messages
# -------------------------

@app.get(
    "/api/parent/posts/{post_id}/messages",
    response_model=list[schemas.MessageResponse],
)
def list_parent_messages(
    post_id: int,
    parent_code: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.parent_code == parent_code)
        .first()
    )

    if not parent:
        raise HTTPException(status_code=404, detail="Invalid parent code")

    post = (
        db.query(models.Post)
        .filter(
            models.Post.id == post_id,
            models.Post.is_shared == True,
        )
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Shared post not found")

    return (
        db.query(models.Message)
        .filter(
            models.Message.post_id == post.id,
            models.Message.parent_id == parent.id,
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )


@app.post(
    "/api/parent/posts/{post_id}/messages",
    response_model=schemas.MessageResponse,
)
def create_parent_message(
    post_id: int,
    parent_code: str,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(models.Parent)
        .filter(models.Parent.parent_code == parent_code)
        .first()
    )

    if not parent:
        raise HTTPException(status_code=404, detail="Invalid parent code")

    post = (
        db.query(models.Post)
        .filter(
            models.Post.id == post_id,
            models.Post.is_shared == True,
        )
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Shared post not found")

    db_message = models.Message(
        post_id=post.id,
        parent_id=parent.id,
        sender_type="parent",
        message=message.message,
    )

    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return db_message

# -------------------------
# Teacher APIs: Private Threads
# -------------------------

@app.get(
    "/api/posts/{post_id}/threads",
    response_model=list[schemas.ThreadResponse],
)
def list_threads_for_teacher(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    parent_ids = (
        db.query(models.Message.parent_id)
        .filter(models.Message.post_id == post.id)
        .distinct()
        .all()
    )

    threads = []

    for row in parent_ids:
        parent_id = row[0]
        parent = db.query(models.Parent).filter(models.Parent.id == parent_id).first()

        if not parent:
            continue

        messages = (
            db.query(models.Message)
            .filter(
                models.Message.post_id == post.id,
                models.Message.parent_id == parent.id,
            )
            .order_by(models.Message.created_at.asc())
            .all()
        )

        threads.append(
            {
                "parent": parent,
                "messages": messages,
            }
        )

    return threads


@app.get(
    "/api/posts/{post_id}/threads/{parent_id}",
    response_model=schemas.ThreadResponse,
)
def get_thread_for_teacher(
    post_id: int,
    parent_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    parent = db.query(models.Parent).filter(models.Parent.id == parent_id).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    messages = (
        db.query(models.Message)
        .filter(
            models.Message.post_id == post.id,
            models.Message.parent_id == parent.id,
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return {
        "parent": parent,
        "messages": messages,
    }


@app.post(
    "/api/posts/{post_id}/threads/{parent_id}/messages",
    response_model=schemas.MessageResponse,
)
def create_teacher_message(
    post_id: int,
    parent_id: int,
    message: schemas.TeacherMessageCreate,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    parent = db.query(models.Parent).filter(models.Parent.id == parent_id).first()

    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    db_message = models.Message(
        post_id=post.id,
        parent_id=parent.id,
        sender_type="teacher",
        message=message.message,
    )

    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return db_message
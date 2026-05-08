from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# -------------------------
# Post Schemas
# -------------------------

class PostCreate(BaseModel):
    title: str
    category: str
    target_group: str
    content: str
    homework: Optional[str] = ""
    home_support: Optional[str] = ""
    next_plan: Optional[str] = ""
    message_to_parents: Optional[str] = ""


class PostResponse(BaseModel):
    id: int
    title: str
    category: str
    target_group: str
    content: str
    homework: Optional[str]
    home_support: Optional[str]
    next_plan: Optional[str]
    message_to_parents: Optional[str]
    is_shared: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Parent Schemas
# -------------------------

class ParentCreate(BaseModel):
    name: str
    child_name: Optional[str] = ""


class ParentResponse(BaseModel):
    id: int
    name: str
    child_name: Optional[str]
    parent_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class ParentLoginRequest(BaseModel):
    parent_code: str


class ParentLoginResponse(BaseModel):
    id: int
    name: str
    child_name: Optional[str]
    parent_code: str


# -------------------------
# Message Schemas
# -------------------------

class MessageCreate(BaseModel):
    message: str


class TeacherMessageCreate(BaseModel):
    message: str


class MessageResponse(BaseModel):
    id: int
    post_id: int
    parent_id: int
    sender_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    parent: ParentResponse
    messages: List[MessageResponse]


class PostDetailResponse(PostResponse):
    messages: List[MessageResponse] = []
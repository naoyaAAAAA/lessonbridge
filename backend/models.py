from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    target_group = Column(String, nullable=False)

    content = Column(Text, nullable=False)
    homework = Column(Text, nullable=True)
    home_support = Column(Text, nullable=True)
    next_plan = Column(Text, nullable=True)
    message_to_parents = Column(Text, nullable=True)

    is_shared = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship(
        "Message",
        back_populates="post",
        cascade="all, delete-orphan",
    )


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    child_name = Column(String, nullable=True)
    parent_code = Column(String, unique=True, index=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship(
        "Message",
        back_populates="parent",
        cascade="all, delete-orphan",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)

    sender_type = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="messages")
    parent = relationship("Parent", back_populates="messages")
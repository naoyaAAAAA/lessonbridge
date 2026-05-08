## 日本語概要

LessonBridgeは、塾講師が保護者全体に授業内容・宿題・家庭学習のポイントを共有し、保護者からの個別相談に対応できるWebアプリです。

塾講師として働く中で、授業中に見えたクラス全体の課題や家庭で見てほしいポイントが、保護者に十分伝わりにくいことに課題を感じました。そこで、講師が全体向けの共有投稿を作成し、保護者がそれを読んだうえで先生に個別相談できる仕組みを作りました。

このMVPでは、講師側アプリ・保護者側アプリ・FastAPIバックエンドを分けて実装しています。講師は投稿作成・共有・保護者返信確認・返信ができ、保護者は保護者コードでログインして共有投稿を閲覧し、先生に個別メッセージを送れます。

# LessonBridge

LessonBridge is a web application that helps cram school teachers share class-wide lesson updates with parents and continue private conversations with each parent.

The project was built as a small full-stack MVP using React, FastAPI, SQLite, and GitHub.

## Concept

In cram school and tutoring settings, teachers often notice important learning issues during class:

- what the class struggled with
- what students started to understand
- what parents should check at home
- what homework should focus on
- what should be handled in the next lesson

However, these observations are often not shared clearly with parents. Communication can become one-way, and parents may not know what happened in class or how to support their child at home.

LessonBridge solves this by allowing teachers to publish class-wide posts for parents and letting each parent reply privately to the teacher.

## Core Flow

```text
Teacher creates a shared post
        ↓
Teacher shares it with parents
        ↓
Parent reads the shared post
        ↓
Parent sends a private message to the teacher
        ↓
Teacher replies in a private thread
```

## Main Features

### Teacher App

- Create class-wide posts
- View all posts
- Share posts with parents
- View private parent replies for each post
- Reply to each parent individually

### Parent App

- Login with a parent code
- View shared posts from the teacher
- Read lesson content, homework, home support points, and next lesson plan
- Send a private message to the teacher
- View the message thread with the teacher

### Backend API

- Manage shared posts
- Manage parent accounts with parent codes
- Store private messages between teachers and parents
- Provide separate API flows for teacher-side and parent-side apps

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

### Development

- Git
- GitHub
- REST API
- Swagger UI

## Project Structure

```text
lessonbridge/
├─ backend/
│  ├─ main.py
│  ├─ database.py
│  ├─ models.py
│  ├─ schemas.py
│  └─ requirements.txt
│
├─ teacher-app/
│  ├─ src/
│  │  ├─ App.jsx
│  │  └─ App.css
│  └─ package.json
│
├─ parent-app/
│  ├─ src/
│  │  ├─ App.jsx
│  │  └─ App.css
│  └─ package.json
│
├─ docs/
├─ README.md
└─ .gitignore
```

## Architecture

```text
Teacher App  ----\
                  \
                   FastAPI Backend ---- SQLite
                  /
Parent App   ----/
```

The teacher app and parent app are separate React applications.  
Both communicate with the same FastAPI backend through REST APIs.

## Data Model

### Post

Represents a class-wide shared post created by the teacher.

```text
id
title
category
target_group
content
homework
home_support
next_plan
message_to_parents
is_shared
created_at
updated_at
```

### Parent

Represents a parent user who can access the parent app using a parent code.

```text
id
name
child_name
parent_code
created_at
```

### Message

Represents a private message between a parent and the teacher, linked to a specific post.

```text
id
post_id
parent_id
sender_type
message
created_at
```

`sender_type` is either:

```text
parent
teacher
```

## API Overview

### Health Check

```text
GET /api/health
```

### Teacher APIs

```text
POST /api/parents
GET  /api/parents

POST /api/posts
GET  /api/posts
GET  /api/posts/{post_id}
POST /api/posts/{post_id}/share

GET  /api/posts/{post_id}/threads
GET  /api/posts/{post_id}/threads/{parent_id}
POST /api/posts/{post_id}/threads/{parent_id}/messages
```

### Parent APIs

```text
POST /api/parent/login

GET  /api/parent/posts
GET  /api/parent/posts/{post_id}

GET  /api/parent/posts/{post_id}/messages
POST /api/parent/posts/{post_id}/messages
```

## How to Run

### 1. Backend

```powershell
cd backend
.\.venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger UI:

```text
http://localhost:8000/docs
```

### 2. Teacher App

```powershell
cd teacher-app
npm install
npm run dev -- --port 5173
```

Teacher app:

```text
http://localhost:5173
```

### 3. Parent App

```powershell
cd parent-app
npm install
npm run dev -- --port 5174
```

Parent app:

```text
http://localhost:5174
```

## Demo Flow

### Step 1: Create a Parent

Use Swagger UI or the backend API.

```json
{
  "name": "山田花子",
  "child_name": "山田太郎"
}
```

The backend returns a parent code such as:

```text
PARENT-A8K3ZQ
```

### Step 2: Create a Post in the Teacher App

Example:

```text
Title: 小5算数 割合と比の授業報告
Category: 授業報告
Target: 小5算数クラス
Content: 本日は割合と比の文章題を扱いました。
Homework: 基本問題2題、文章題2題
Home Support: 答えだけでなく、線分図を書いているか確認してください。
Next Plan: 次回は線分図から式を立てる練習をします。
```

### Step 3: Share the Post

Click:

```text
保護者に共有する
```

Then the post becomes visible in the parent app.

### Step 4: Login in the Parent App

Enter the parent code:

```text
PARENT-A8K3ZQ
```

The parent can now view shared posts.

### Step 5: Parent Sends a Private Message

Example:

```text
家でも文章題になると手が止まります。宿題を見るとき、どこまで手伝えばよいでしょうか？
```

### Step 6: Teacher Replies

The teacher can open the parent thread from the teacher app and reply privately.

Example:

```text
最初は線分図を書くところだけ一緒に確認し、式を立てる部分は本人に考えさせてみてください。
```

## What I Focused On

This MVP focuses on the core communication loop:

```text
class-wide sharing
private parent response
teacher follow-up
```

Rather than building a large student management system, I focused on one practical problem:

> Teachers need a simple way to share class-wide learning updates with parents and continue individual communication when needed.

## Future Improvements

- Better UI layout for teacher-side thread management
- Real authentication instead of parent-code-only login
- Separate teacher accounts
- Parent notification system
- Rich text editor for posts
- Search and filtering for posts
- Unread message indicators
- Deployment to a public environment
- Mobile-first parent app improvements
- AI-assisted post drafting

## Current Status

MVP completed locally:

- Backend API implemented
- Teacher app implemented
- Parent app implemented
- Teacher-to-parent shared post flow works
- Parent-to-teacher private message flow works
- Teacher reply flow works
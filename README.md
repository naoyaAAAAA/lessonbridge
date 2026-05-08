# LessonBridge

LessonBridge is a web application that helps private tutors and cram school teachers share lesson reports with parents.

The goal is to make communication after each lesson more transparent and actionable. Teachers can write lesson reports, and parents can read them from a separate parent-facing app and send comments back.

## Problem

In tutoring and cram school settings, teachers often observe important details during lessons, such as:

- what the student understood
- where the student struggled
- what improved compared with the previous lesson
- what should be reviewed at home
- what should be handled in the next lesson

However, these details are not always communicated clearly to parents. Lesson reports often become one-way messages that only describe what was covered.

LessonBridge aims to turn lesson reports into a communication loop between teachers and parents.

## Main Users

### Teacher

- Creates students
- Writes lesson reports
- Publishes reports
- Reads parent comments

### Parent

- Opens the parent app
- Enters a parent code
- Reads published lesson reports
- Sends acknowledgements and comments

## Tech Stack

- Frontend: React + Vite
- Backend: Python + FastAPI
- Database: SQLite
- API: REST API
- Version Control: Git / GitHub

## Project Structure

```text
lessonbridge/
├─ backend/
├─ teacher-app/
├─ parent-app/
├─ docs/
├─ README.md
└─ .gitignore
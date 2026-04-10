# Django Backend Setup Guide

This guide walks you through setting up the Django backend for this project.

## Prerequisites

- Python 3.x installed on your machine
- Terminal / Command Prompt access

---

## Setup Instructions

### 1. Create the Backend Folder

Create a folder named `backend` in the root of the project directory.

### 2. Open a Terminal and Follow the Steps Below

#### A. Navigate into the backend folder
```bash
cd backend
```

#### B. Install `virtualenv`
```bash
python -m pip install virtualenv
```

#### C. Create a virtual environment
```bash
python -m venv venv
```

#### D. Activate the virtual environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

> ✅ You should see `(venv)` appear at the beginning of your terminal prompt once activated.

#### E. Install Django
```bash
python -m pip install Django
```

#### F. Verify the Django installation
```bash
python -m django --version
```

#### G. Create the Django project
```bash
django-admin startproject spcdashboard .
```

> ⚠️ The `.` at the end is important — it creates the project in the current directory instead of a subdirectory.

#### H. Create the API app
```bash
python manage.py startapp api
```

#### I. Create database migrations
```bash
python manage.py makemigrations
```

#### J. Apply migrations to the database
```bash
python manage.py migrate
```

#### K. Start the development server
```bash
python manage.py runserver
```

> 🚀 The server will be running at `http://127.0.0.1:8000/` by default.

---

## Quick Reference

| Step | Command |
|------|---------|
| Navigate to folder | `cd backend` |
| Install virtualenv | `python -m pip install virtualenv` |
| Create venv | `python -m venv venv` |
| Activate venv (Windows) | `venv\Scripts\activate` |
| Activate venv (Mac/Linux) | `source venv/bin/activate` |
| Install Django | `python -m pip install Django` |
| Check Django version | `python -m django --version` |
| Create project | `django-admin startproject spcdashboard .` |
| Create API app | `python manage.py startapp api` |
| Make migrations | `python manage.py makemigrations` |
| Apply migrations | `python manage.py migrate` |
| Run server | `python manage.py runserver` |

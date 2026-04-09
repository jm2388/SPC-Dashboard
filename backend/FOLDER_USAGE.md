# Backend Folder Usage

This backend is a small Django project. Based on the current files, these are the main folders and what they are used for.

## `backend/crud/`

This is the main Django project configuration package.

- `settings.py`: global Django settings such as installed apps, middleware, SQLite database config, timezone, and static file setup
- `urls.py`: root URL routing; it exposes Django admin and includes routes from the `api` app
- `asgi.py`: ASGI application entry point for async-compatible deployments
- `wsgi.py`: WSGI application entry point for traditional Python web server deployments

In short, `crud/` controls project-level setup and bootstrapping.

## `backend/api/`

This is the Django app where business logic and API features are intended to live.

- `models.py`: database models for the app
- `views.py`: request handling / endpoint logic
- `urls.py`: app-level URL definitions
- `admin.py`: Django admin registrations
- `tests.py`: automated tests for this app
- `apps.py`: app registration/config
- `migrations/`: database migration files for schema changes

Right now, most of these files are still close to the default Django starter template, so `api/` is the main feature area but is not heavily implemented yet.

## `backend/api/migrations/`

This folder stores Django migration history for the `api` app.

- It currently only contains `__init__.py`, which means no actual schema migration files have been created yet.

## `backend/venv/`

This is the local Python virtual environment for the backend.

- It contains the Python interpreter, `pip`, Django, and other installed packages used by the project
- It is for dependency isolation, not application logic

## Other Important Backend Files

- `manage.py`: Django command entry point used for running the server, migrations, tests, and admin commands
- `db.sqlite3`: the current SQLite development database file

## Current Structure Summary

- `crud/` = project configuration
- `api/` = app code / future backend features
- `migrations/` = database schema history
- `venv/` = local Python environment

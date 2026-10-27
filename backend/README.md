# Pixelonics Onboarding Portal - Backend API

FastAPI backend for Pixelonics × Pandosoft India Private Limited Client Onboarding Portal.

## Features

- **Multi-role Authentication**: Customer, Pixelonics Operations, Pandosoft Compliance
- **Application Management**: Create, update, submit applications
- **Document Management**: Upload, generate (DOCX/PDF), verify documents
- **Review Workflows**: Operations review and Compliance review
- **Corrections**: Request and respond to corrections
- **Audit Trail**: Complete audit logging
- **Notifications**: System notifications

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

3. Run migrations:
```bash
alembic upgrade head
```

4. Start server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

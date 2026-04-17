# HireFlow

AI-driven recruitment and candidate assessment platform with:

- A FastAPI backend for auth, jobs, applications, assessments, interview orchestration, reports, and analytics
- A Next.js web app for HR and candidate workflows
- A Flutter client for mobile-first access to core flows

This README reflects the code currently present in the repository, not just the original hackathon concept.


## What The System Does

HireFlow covers a broad recruitment pipeline:

- HR users can register, post jobs, review applicants, track funnel metrics, schedule interviews, and trigger reports or hiring actions.
- Candidates can register, build profiles, upload resumes, apply to jobs, take assessments, attend AI-driven interviews, and monitor application status.
- The platform includes AI-assisted resume parsing, ATS scoring, adaptive interview flows, mock interviews, voice analysis, placement prep tooling, and proctoring support.

## Repository Structure

```text
.
|-- backend/        FastAPI application and AI services
|-- frontend/       Next.js 16 web app
|-- flutter_app/    Flutter client
|-- clean.py        Local utility script
|-- clean_backend.py
|-- clean_consoles.py
`-- README.md
```

## Architecture Overview

### Backend

The backend entrypoint is `backend/main.py`. It creates the FastAPI app, initializes the database, enables CORS, and mounts the feature routers.

Core backend modules currently wired into the app:

- `authentication`: registration, login, JWT-based identity, current user APIs
- `job_management_module`: CRUD for job postings
- `applications`: job applications, applicant views, status tracking, dashboard stats
- `candidate_profile`: candidate education, skills, projects, certifications, profile completion
- `profile`: resume-backed profile parsing and persistence
- `resume_parsing`: resume upload and structured extraction
- `assessment`: technical and aptitude assessment flow
- `ai_interview_bot`: interview WebSocket flow, code execution endpoint, TTS/STT hooks
- `mock_interview`: company-specific mock interview sessions with scorecards
- `proctoring`: violation reporting and session termination
- `voice_analysis`: post-interview voice analysis reports
- `reports`: generated candidate reports and downloads
- `scheduling`: interview scheduling, rescheduling, and notifications
- `candidate_dashboard` and `hr_dashboard`: dashboard analytics
- `hr_actions`: offer and rejection workflows
- `recruitment_strategy`: AI-generated recruiting strategy support
- `hr_ai_assistant`: AI command endpoint for HR-side assistance
- `ATS_score`: candidate scoring and ranking against jobs
- `experience`: experience wall / peer-sharing feed
- `prep`: placement preparation and resume/report utilities

Default database behavior:

- Uses `DATABASE_URL` when provided
- Falls back to SQLite at `backend/hireflow.db` semantics via `sqlite:///./hireflow.db`

### Web Frontend

The web app lives in `frontend/` and uses:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Radix/shadcn-style UI primitives

Implemented web areas include:

- Landing page and auth screens
- Candidate dashboard, profile creation, applications, jobs, prep, assessment, and interview pages
- HR dashboard, jobs, applicants, reports, recruitment strategy, and voice report views
- Real-time interview and mock interview UI with WebSocket support
- Browser-based speech recognition and media/proctoring helpers

The web app talks to the backend using:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_BACKEND_WS`

When unset, the code generally falls back to `http://127.0.0.1:8000` or the matching `ws://127.0.0.1:8000`.

### Flutter App

The Flutter client in `flutter_app/` is branded as HireFlow and uses:

- `go_router`
- `flutter_riverpod`
- `dio`
- `flutter_secure_storage`
- `speech_to_text`
- `flutter_tts`

Current mobile structure includes:

- Auth flows
- Candidate shell and dashboard screens
- Candidate profile, jobs, applications, notifications, and mock interview screens
- HR shell with jobs, applicants, dashboard, reports, profile, and strategy screens

## API Surface At A Glance

Representative backend routes currently mounted:

- `/v1/auth`
- `/jobs`
- `/v1/applications`
- `/v1/candidate`
- `/api/profile`
- `/resume`
- `/v1/assessment`
- `/interview` and `/ws/interview/{session_id}`
- `/mock/start` and `/ws/mock/{session_id}`
- `/v1/proctoring`
- `/v1/scheduling`
- `/v1/reports`
- `/v1/hr/dashboard`
- `/v1/hr/actions`
- `/v1/recruitment-strategy`
- `/v1/hr/ai-command`
- `/ats-scores`
- `/experience`
- `/prep`
- `/analysis`
- `/api/tts`
- `/api/transcribe`

Start the backend and open `http://127.0.0.1:8000/` to see the service status payload and mounted endpoint groups.

## AI And External Service Dependencies

Several modules depend on external AI or infrastructure services:

- OpenAI for interview generation, mock interview logic, prep/report generation, voice analysis, and assessment support
- Groq for resume parsing, ATS scoring, report generation, recruitment strategy, and HR assistant flows
- Sarvam for text-to-speech and speech-to-text support
- Jdoodle for code execution during technical interview or assessment scenarios
- Cloudinary for document upload/storage workflows
- Tavily for company intelligence in mock interview flows
- SMTP credentials for notification email delivery

## Environment Variables

The code references the following environment variables.

### Backend

```env
DATABASE_URL=
JWT_SECRET_KEY=

OPENAI_API_KEY=
GROQ_API_KEY=
SARVAM_API_KEY=
TAVILY_API_KEY=

JDOODLE_CLIENT_ID=
JDOODLE_CLIENT_SECRET=

CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
SENDER_MAIL=
SENDER_PASSWORD=
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BACKEND_WS=ws://127.0.0.1:8000
```

## Local Development

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend default URL:

```text
http://127.0.0.1:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

### 3. Flutter App

```bash
cd flutter_app
flutter pub get
flutter run
```

## Testing And Validation

This repo already contains several backend validation scripts and tests, including:

- `backend/test_adaptive_bot.py`
- `backend/test_mixed_assessment.py`
- `backend/test_frontend_payload.py`
- `backend/test_imports.py`
- `backend/test_compiler.py`
- `backend/test_parsing_validation.py`
- `backend/verify_models.py`

The frontend also includes standard lint/build scripts:

```bash
cd frontend
npm run lint
npm run build
```

## Contributor Starting Points

If you are onboarding to the codebase, these files are the best entrypoints:

- `backend/main.py`: backend composition and router wiring
- `backend/authentication/database.py`: database bootstrapping
- `frontend/app/page.tsx`: web landing page
- `frontend/app/candidate/interview/page.tsx`: candidate AI interview entry
- `frontend/components/mock-interview/MockInterviewRoomImpl.tsx`: mock interview client flow
- `flutter_app/lib/main.dart`: Flutter app bootstrap

## Notes

- The root README has been updated to match the current implementation, but subproject READMEs in `frontend/` and `flutter_app/` are still lightweight.
- Some advanced flows will not work locally until the required API keys and third-party credentials are configured.
- The repository appears to be an actively evolving hackathon-to-product codebase, so expect rapid iteration and some partially integrated modules.

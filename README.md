# HireFlow — AI-Driven Autonomous Recruitment Platform

> **Quantum Arena Hackathon Project**  
> A full-stack, AI-powered recruitment ecosystem that automates the entire hiring pipeline — from job posting and resume parsing to AI interviews, proctored assessments, candidate reports, and offer management.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Core Modules](#core-modules)
  - [AI & Intelligence Layer](#ai--intelligence-layer)
  - [Candidate Features](#candidate-features)
  - [HR Features](#hr-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Flutter App Setup](#flutter-app-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**HireFlow** is an end-to-end autonomous recruitment platform that orchestrates the complete hiring lifecycle without manual intervention. It consists of three interconnected clients:

| Client | Technology | Role |
|--------|------------|------|
| **Web App (HR)** | Next.js 16 + TypeScript | HR dashboard — manage jobs, review candidates, run assessments |
| **Web App (Candidate)** | Next.js 16 + TypeScript | Candidate portal — apply for jobs, take AI interviews & assessments |
| **Mobile App** | Flutter 3 (Dart) | Cross-platform mobile experience for candidates |
| **Backend API** | FastAPI (Python) | Central API server powering all three clients |

The system leverages **LLMs (OpenAI / Groq)**, **Sarvam AI** for TTS/STT in Indian languages, **JDoodle** for live code execution, **Beyond Presence** for avatar-driven interviews, and **Cloudinary** for media storage.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         HireFlow Platform                                  │
│                                                                            │
│   ┌─────────────────────┐     ┌────────────────────────┐                  │
│   │  Next.js Web App     │     │   Flutter Mobile App    │                 │
│   │  (HR + Candidate)    │     │   (Candidate Portal)    │                 │
│   │  :3000               │     │   Android / iOS          │                │
│   └────────┬────────────┘     └──────────┬─────────────┘                  │
│            │  REST / WebSocket            │  REST (Dio)                    │
│            └────────────────┬────────────┘                                │
│                             │                                              │
│                  ┌──────────▼────────────┐                                │
│                  │  FastAPI Backend       │                                │
│                  │  Python 3.11+  :8000   │                               │
│                  │  SQLite / PostgreSQL   │                                │
│                  └──────────┬────────────┘                                │
│                             │                                              │
│       ┌─────────────────────┼───────────────────────┐                    │
│       │                     │                        │                    │
│  ┌────▼─────┐  ┌────────────▼──────┐  ┌────────────▼────────┐           │
│  │  OpenAI  │  │   Sarvam AI TTS/  │  │  JDoodle Code        │          │
│  │  / Groq  │  │   STT (Indian LLM)│  │  Execution API       │          │
│  └──────────┘  └───────────────────┘  └─────────────────────┘           │
│                                                                            │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │  Cloudinary     │  │  Beyond Presence │  │  Tavily Web Search       │  │
│  │  (Media/Docs)   │  │  (AI Avatar)     │  │  (Prep & Strategy)      │  │
│  └────────────────┘  └─────────────────┘  └─────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async REST API & WebSocket server |
| **SQLAlchemy + Alembic** | ORM & database migrations |
| **SQLite** (dev) / **PostgreSQL** (prod) | Relational database |
| **OpenAI API** | LLM completions for interview generation, analysis |
| **Groq API** | Fast LLM inference (Llama models) |
| **Sarvam AI** | Indian-language TTS & STT |
| **JDoodle API** | Remote code compilation & execution |
| **Beyond Presence** | Photorealistic AI avatar for interviews |
| **Cloudinary** | Resume, profile image, and file storage |
| **WeasyPrint + ReportLab** | PDF report generation |
| **Tavily** | Agentic web search for prep & strategy |
| **PyMuPDF / pdfminer** | PDF parsing & resume extraction |
| **python-docx** | DOCX resume parsing |
| **gTTS** | Fallback text-to-speech |
| **Matplotlib / Pillow** | Headless chart generation for reports |
| **PyJWT + Passlib/bcrypt** | JWT authentication |

### Frontend (Next.js)
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework with SSR/SSG |
| **TypeScript** | Type safety |
| **TailwindCSS v4** | Utility-first styling |
| **shadcn/ui + Radix UI** | Accessible component library |
| **Framer Motion** | Animations and page transitions |
| **GSAP** | Advanced scroll and timeline animations |
| **TensorFlow.js + COCO-SSD** | Client-side AI proctoring (object detection) |
| **face-api.js** | Face detection for proctoring |
| **Spline** | 3D interactive scenes |
| **Three.js** | 3D graphics |
| **Lottie** | Rich vector animations |
| **react-hook-form + zod** | Form state management & validation |
| **LiveKit** | Real-time audio/video streaming |
| **date-fns** | Date utilities |

### Flutter Mobile App
| Technology | Purpose |
|---|---|
| **Flutter 3 / Dart** | Cross-platform mobile framework |
| **go_router** | Declarative routing |
| **Riverpod + hooks_riverpod** | State management |
| **Dio** | HTTP client |
| **Google Fonts** | Typography |
| **flutter_secure_storage** | Secure JWT token storage |
| **speech_to_text + flutter_tts** | Voice interaction |
| **file_picker** | Resume and document upload |
| **syncfusion_flutter_pdfviewer** | In-app PDF report viewer |
| **cached_network_image** | Optimized image loading |
| **shimmer** | Loading skeleton animations |

---

## Features

### Core Modules

#### Authentication & Authorization
- JWT-based authentication with role separation (`candidate` / `hr`)
- Route-level middleware guards in Next.js (cookie-based role check)
- Candidates are redirected to `/candidate`, HR users to `/hr`
- Profile completion gate — candidates must complete their profile before applying

#### Job Management
- HR can create, update, and delete job postings with title, description, required skills, experience, location, salary range, and interview configuration depth
- Candidates can browse and filter all active jobs and apply with a single click
- ATS scoring runs automatically on each application to rank candidates

#### Applications Pipeline
- Multi-stage application tracking: `Applied → Assessment → Interview → Completed → Offered / Rejected`
- HR can view all applicants per job, ranked by ATS score
- Detailed application view with transcript, violations, and AI-generated report

---

### AI & Intelligence Layer

#### AI Interview Bot (WebSocket)
The live interview is conducted entirely over a WebSocket connection at `/ws/interview/{session_id}`.

**Interview flow:**
1. HR creates a job with a configurable **interview depth** (shallow / standard / deep)
2. On interview day the system auto-generates a structured multi-section script using an LLM
3. A **greeting** is generated and delivered as both text and synthesised audio
4. An **adaptive bot** steers the conversation, asking follow-up questions based on each candidate response
5. The bot can switch to a **coding challenge section** (sent as a structured JSON object), a **behavioral section**, or gracefully **end the interview**
6. At the end, a **background task** auto-triggers PDF report generation

**Message types handled:**
| Type | Direction | Description |
|---|---|---|
| `candidate_response` | Client → Server | Text reply from candidate |
| `move_to_next_section` | Client → Server | Advance to next interview section |
| `code_submission` | Client → Server | Submit code for evaluation |
| `run_code` | Client → Server | Run code (JDoodle) without submitting |
| `proctor_event` | Client → Server | Report a proctoring violation |
| `ping` | Client → Server | Keepalive heartbeat |
| `interview_started` | Server → Client | Script + metadata on start |
| `follow_up_question` | Server → Client | Next bot question + audio |
| `coding_challenge` | Server → Client | DSA problem payload |
| `behavioral_question` | Server → Client | Behavioral question + audio |
| `interview_ended` | Server → Client | Graceful end with summary |
| `interview_complete` | Server → Client | All sections completed |
| `error` | Server → Client | Any server-side error |

#### Text-to-Speech & Speech-to-Text
- Primary TTS via **Sarvam AI** (Indian-language support, multiple voices)
- STT transcription via Sarvam AI's audio processing endpoint
- Fallback TTS via **gTTS** for offline/low-latency use cases
- React hooks (`useSarvamTTS`, `useSTT`, `useWebSocketTTS`) abstract the voice pipeline in the frontend
- Flutter uses native `speech_to_text` and `flutter_tts` packages

#### AI Avatar (Beyond Presence)
- Interactive photorealistic avatar for the interview session
- Configured via `BEYOND_PRESENCE_API_KEY`, `AVATAR_ID`, and `AGENT_ID`
- Backend proxy routes in `avatar/routes.py` manage credential forwarding

#### Adaptive Interview Bot
- Located in `backend/ai_interview_bot/services/adaptive_interview_bot.py`
- Adjusts question difficulty, tone, and depth based on real-time evaluation of candidate answers
- Supports `end_interview` and `escalate_to_human` actions

#### Assessment Module
- HR can configure online assessments per application
- Mixed assessment types: MCQ, coding (DSA), and behavioral
- Live code execution via **JDoodle** API (`assessment/dsa_service.py`)
- AI-generated assessment questions tailored to the job description
- Client-side proctoring enforced during assessment (camera, face detection, tab-switch detection)

#### AI Proctoring
- **Client-side** (Next.js): TensorFlow.js + COCO-SSD detects multiple people, mobile phones, and other objects; face-api.js detects face absence
- **Server-side**: Violation events are logged per session in `proctoring/routes.py`
- Flagging thresholds can trigger interview termination
- Violations are stored in the application record and surfaced in the HR report

#### ATS Score
- `ATS_score/route.py` computes a resume-to-job-description match score using an LLM prompt
- Score is attached to each application and used to rank candidates on the HR dashboard

#### AI-Generated Candidate Reports
- After an interview completes, `reports/service.py` runs in the background to produce a structured JSON analysis
- Includes: overall score, communication score, technical score, DSA score, proctoring score, behavioral score, strengths, weaknesses, and a recommendation
- PDF export via **WeasyPrint** using a Jinja2 HTML template with embedded charts
- HR can view the report at `/hr/reports/[applicationId]`
- Candidates can view their own report at `/candidate/reports/[applicationId]`
- Flutter app renders the report natively as a rich multi-section dashboard (score gauges, progress bars)

#### Voice Analysis
- Module: `voice_analysis/voice_analysis_service.py`
- Analyses audio recordings for pace, filler words, confidence, and clarity
- Results stored per application; viewable by HR in the voice report section

#### Mock Interview (Candidate Practice)
- Fully standalone practice interview at `/candidate/mock-interview`
- Multi-turn conversational bot in `mock_interview/routes.py`
- Generates a scorecard with feedback on each message
- Company intel service fetches real company context via Tavily search

#### AI Placement Prep
- Module: `prep/` — resume-aware preparation report
- Candidates upload or re-use their existing resume
- LLM generates a personalised study guide covering DSA topics, system design, and behavioral advice
- Available on both Web (`/candidate/prep`) and Flutter app

#### Resume Analyzer
- Module: `resume_analyzer/` — generates a detailed ATS report for any uploaded resume
- PDF/DOCX parsing via PyMuPDF and pdfminer
- Spits out section-by-section feedback, keyword gaps, and an overall score
- Available on Web and Flutter

#### Experience Wall
- Community feature — candidates can post their interview experiences
- Module: `experience/`
- Available in the candidate dashboard (`/candidate/experience`)

#### Email Scheduling & Notifications
- `scheduling/routes.py` manages interview schedule records
- `notifications/email_service.py` sends transactional emails via SMTP (Gmail)
- Notification dropdown on the candidate dashboard

#### Recruitment Strategy Generator
- `recruitment_strategy/service.py` uses Tavily + LLM to generate a contextual hiring strategy for a given job role
- HR can generate and view a markdown strategy document from the HR dashboard (`/hr/recruitment-strategy`)

#### HR AI Command Assistant
- `hr_ai_assistant/routes.py` — natural language command interface for HR
- HR types a command (e.g., "show me top Python candidates") and the assistant returns structured data or actions

---

### Candidate Features

| Feature | Web Route | Flutter Screen |
|---|---|---|
| Dashboard | `/candidate` | `CandidateDashboardScreen` |
| Browse & Apply for Jobs | `/candidate/jobs` | `JobsScreen` |
| My Applications | `/candidate/applications` | `ApplicationsScreen` |
| AI Interview | `/candidate/interview` | — |
| Proctored Assessment | `/candidate/assessment` | — |
| Mock Interview Practice | `/candidate/mock-interview` | `MockInterviewScreen` |
| AI Placement Prep | `/candidate/prep` | `PrepScreen` |
| Resume Analyzer | `/candidate/resume-analyzer` | `ResumeAnalyzerScreen` |
| View AI Report | `/candidate/reports/[id]` | `ReportsScreen` |
| Experience Wall | `/candidate/experience` | `ExperienceScreen` |
| Profile | `/candidate/profile` | `ProfileScreen` |
| Interview Schedule | `/candidate/schedule` | — |
| Notifications | Dropdown (layout) | `NotificationsScreen` |

---

### HR Features

| Feature | Web Route |
|---|---|
| HR Dashboard | `/hr` |
| Job Management | `/hr/jobs` |
| View Applicants | `/hr/applicants/[jobId]` |
| Candidate Report | `/hr/reports/[applicationId]` |
| Voice Analysis Report | `/hr/voice-report/[applicationId]` |
| Recruitment Strategy | `/hr/recruitment-strategy` |
| Interview Questions Preview | `/hr/questions` |
| HR Profile | `/hr/profile` |

---

## Project Structure

```
project/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # App entrypoint — all routers registered here
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variable template
│   ├── hireflow.db                 # SQLite database (dev)
│   ├── alembic/                    # Database migration scripts
│   │
│   ├── authentication/             # JWT auth, User model, password hashing
│   ├── profile/                    # HR profile management
│   ├── candidate_profile/          # Candidate profile (skills, education, projects)
│   ├── job_management_module/      # Job CRUD (HR only)
│   ├── applications/               # Application pipeline & status management
│   ├── scheduling/                 # Interview scheduling & calendar
│   ├── notifications/              # Email notification service (SMTP)
│   │
│   ├── ai_interview_bot/           # Core AI interview engine
│   │   ├── router.py               # WebSocket + REST interview handler
│   │   ├── code_router.py          # Code execution REST endpoint
│   │   ├── tts_router.py           # TTS endpoint
│   │   ├── config.py               # Interview prompts & LLM config
│   │   └── services/
│   │       ├── adaptive_interview_bot.py   # Adaptive question generation
│   │       ├── interview_script_generator.py
│   │       ├── interview_session.py        # In-memory session manager
│   │       ├── code_executor.py            # JDoodle integration
│   │       ├── sarvam_service.py           # Sarvam TTS/STT
│   │       └── proctoring.py              # Violation logging
│   │
│   ├── assessment/                 # Proctored online assessment
│   │   ├── assessment_service.py   # MCQ + behavioral question generation
│   │   ├── dsa_service.py          # DSA problem generation + JDoodle execution
│   │   └── routes.py
│   │
│   ├── reports/                    # AI report generation & PDF export
│   │   ├── service.py              # LLM analysis + background task trigger
│   │   └── routes.py
│   │
│   ├── ATS_score/                  # Resume-to-JD matching score
│   ├── proctoring/                 # Violation storage endpoint
│   ├── voice_analysis/             # Audio analysis service
│   ├── mock_interview/             # Candidate practice interviews
│   ├── prep/                       # AI placement preparation report
│   ├── resume_analyzer/            # Resume quality & ATS report
│   ├── resume_parsing/             # Resume file parsing (PDF/DOCX)
│   ├── recruitment_strategy/       # HR strategy generator (Tavily + LLM)
│   ├── hr_ai_assistant/            # HR NL command interface
│   ├── hr_actions/                 # Offer / reject actions
│   ├── hr_dashboard/               # HR dashboard stats API
│   ├── candidate_dashboard/        # Candidate dashboard stats API
│   ├── experience/                 # Experience wall posts
│   ├── avatar/                     # Beyond Presence avatar proxy
│   ├── middleware/                 # Custom FastAPI middleware
│   └── mcp_server/                 # MCP tool server integration
│
├── frontend/                       # Next.js 16 Web Application
│   ├── app/
│   │   ├── page.tsx                # Landing page (3D + animations)
│   │   ├── layout.tsx              # Root layout
│   │   ├── login/ & register/      # Auth pages
│   │   ├── complete-profile/       # Profile completion wizard
│   │   ├── candidate/
│   │   │   ├── (dashboard)/        # Candidate dashboard layout + all sub-pages
│   │   │   │   ├── page.tsx        # Candidate dashboard home
│   │   │   │   ├── jobs/           # Job listing & apply
│   │   │   │   ├── applications/   # My applications
│   │   │   │   ├── mock-interview/ # Practice interviews
│   │   │   │   ├── prep/           # AI prep report
│   │   │   │   ├── resume-analyzer/
│   │   │   │   ├── reports/        # AI candidate report view
│   │   │   │   ├── experience/     # Experience wall
│   │   │   │   ├── profile/        # Candidate profile
│   │   │   │   └── schedule/       # Interview schedule
│   │   │   ├── interview/          # Live AI interview page (WebSocket)
│   │   │   └── assessment/         # Proctored assessment page
│   │   └── hr/
│   │       ├── page.tsx            # HR dashboard home
│   │       ├── layout.tsx          # HR sidebar layout
│   │       ├── jobs/               # Job management
│   │       ├── applicants/         # Applicant review
│   │       ├── reports/            # Candidate AI reports
│   │       ├── voice-report/       # Voice analysis reports
│   │       ├── recruitment-strategy/
│   │       ├── questions/          # Interview question preview
│   │       └── profile/            # HR company profile
│   │
│   ├── components/                 # Shared React components
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── auth/                   # Login / Register forms
│   │   ├── candidate/              # Candidate-specific components
│   │   ├── hr/                     # HR-specific components
│   │   ├── interview/              # Interview UI (avatar, transcript, code editor)
│   │   ├── mock-interview/         # Mock interview chat UI
│   │   ├── prep/                   # Prep report components
│   │   ├── experience/             # Experience wall cards
│   │   └── chat/                   # AI assistant chat UI
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAIProctoring.ts      # TF.js + COCO-SSD proctoring
│   │   ├── useProctoring.ts        # Proctoring session manager
│   │   ├── useCamera.ts            # Camera stream management
│   │   ├── useFaceRecognition.ts   # face-api.js integration
│   │   ├── useSTT.ts               # Speech-to-text hook
│   │   ├── useSarvamTTS.ts         # Sarvam TTS hook
│   │   ├── useWebSocketTTS.ts      # WebSocket + TTS pipeline
│   │   ├── useVoiceMonitoring.ts   # Microphone monitoring
│   │   ├── useProfileState.ts      # Profile form state
│   │   ├── useProfileSubmission.ts # Profile save logic
│   │   └── useTimer.ts             # Interview/assessment countdown
│   │
│   ├── services/                   # API service wrappers
│   ├── lib/                        # Utility functions
│   └── middleware.ts               # Next.js route auth middleware
│
├── flutter_app/                    # Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart               # App entry point
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   │   └── api_constants.dart  # All API endpoint constants
│   │   │   ├── router/
│   │   │   │   └── app_router.dart     # go_router route definitions
│   │   │   ├── theme/                  # App color scheme & typography
│   │   │   └── utils/                  # Shared utilities
│   │   ├── data/
│   │   │   ├── models/                 # Dart data models
│   │   │   └── services/
│   │   │       ├── api_service.dart    # Dio HTTP client (auth headers)
│   │   │       └── auth_service.dart   # Login/register + token storage
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   │   ├── auth/               # Login & Register screens
│   │   │   │   ├── candidate/
│   │   │   │   │   ├── dashboard/      # Candidate dashboard screen
│   │   │   │   │   ├── jobs/           # Job listing screen
│   │   │   │   │   ├── applications/   # My applications screen
│   │   │   │   │   ├── reports/        # AI report viewer (native)
│   │   │   │   │   ├── mock_interview/ # Practice interview screen
│   │   │   │   │   ├── prep/           # AI prep screen
│   │   │   │   │   ├── resume_analyzer/# Resume analyzer screen
│   │   │   │   │   ├── experience/     # Experience wall screen
│   │   │   │   │   ├── profile/        # Profile screen
│   │   │   │   │   └── notifications/  # Notifications screen
│   │   │   │   ├── hr/                 # HR screens (if applicable)
│   │   │   │   └── landing/            # Onboarding / splash screens
│   │   │   └── widgets/                # Shared Flutter widgets
│   │   └── providers/                  # Riverpod providers
│   └── pubspec.yaml                # Flutter dependencies
│
└── Fine_Tune_LLM.ipynb             # Research notebook for LLM fine-tuning experiments
```

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | >= 3.11 | Backend runtime |
| Node.js | >= 18 | Frontend dev server |
| npm | >= 9 | Package manager |
| Flutter SDK | >= 3.7.0 | Mobile app |
| Dart SDK | >= 3.7.0 | Included with Flutter |
| Git | Any | Version control |

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv v_env
# Windows
v_env\Scripts\activate
# macOS/Linux
source v_env/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) Install heavy ML dependencies for voice analysis
pip install librosa soundfile openai-whisper

# 5. Copy and configure environment variables
copy .env.example .env
# Edit .env with your API keys (see Environment Variables section below)

# 6. Run the development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
copy .env.example .env.local
# Edit .env.local with your values

# 4. Start the development server
npm run dev
```

The web app will be available at `http://localhost:3000`.

---

### Flutter App Setup

```bash
# 1. Navigate to the flutter app directory
cd flutter_app

# 2. Install Flutter packages
flutter pub get

# 3. Update the API base URL
# Open: lib/core/constants/api_constants.dart
# Change baseUrl to your backend URL:
#   static const String baseUrl = 'http://YOUR_BACKEND_IP:8000';

# 4. Run on a connected device or emulator
flutter run

# Or build for a specific platform
flutter build apk          # Android APK
flutter build ios          # iOS (requires macOS + Xcode)
flutter build web          # Web
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | Yes |
| `ALGORITHM` | JWT algorithm (default: `HS256`) | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (default: `60`) | Yes |
| `DATABASE_URL` | SQLAlchemy DB URL (default: `sqlite:///./hireflow.db`) | Yes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 completions | Yes |
| `GROQ_API_KEY` | Groq API key for fast Llama inference | Yes |
| `SARVAM_API_KEY` | Sarvam AI key for Indian-language TTS/STT | Yes |
| `JDOODLE_CLIENT_ID` | JDoodle API client ID (code execution) | Yes |
| `JDOODLE_CLIENT_SECRET` | JDoodle API client secret | Yes |
| `CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_URL` | Cloudinary URL | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `TAVILY_API_KEY` | Tavily search API key | Yes |
| `SMTP_SERVER` | Email SMTP server (default: `smtp.gmail.com`) | Yes |
| `SMTP_PORT` | SMTP port (default: `587`) | Yes |
| `SMTP_EMAIL` | Sender email address | Yes |
| `SMTP_PASSWORD` | Sender email password / app password | Yes |
| `BEYOND_PRESENCE_API_KEY` | Beyond Presence avatar API key | Optional |
| `AVATAR_ID` | Beyond Presence avatar ID | Optional |

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST URL (e.g., `http://127.0.0.1:8000`) |
| `NEXT_PUBLIC_BACKEND_WS` | Backend WebSocket URL (e.g., `ws://127.0.0.1:8000`) |
| `NEXT_PUBLIC_BEYOND_API_KEY` | Beyond Presence public API key |
| `NEXT_PUBLIC_AVATAR_ID` | Beyond Presence avatar ID |
| `NEXT_PUBLIC_AGENT_ID` | Beyond Presence agent ID |

---

## API Reference

The backend exposes the following route groups, all documented interactively at `/docs`:

| Prefix | Module | Description |
|---|---|---|
| `/v1/auth` | `authentication` | Register, login, get current user |
| `/jobs` | `job_management_module` | CRUD for job postings |
| `/v1/applications` | `applications` | Apply, view, update applications |
| `/v1/candidate` | `candidate_profile` | Candidate profile, skills, education |
| `/api/profile` | `profile` | HR profile management |
| `/v1/scheduling` | `scheduling` | Interview schedule management |
| `/v1/assessment` | `assessment` | Start/submit assessments |
| `/v1/candidate/dashboard` | `candidate_dashboard` | Candidate stats & activity feed |
| `/v1/hr/dashboard` | `hr_dashboard` | HR stats, recent applicants, top candidates |
| `/v1/hr/actions` | `hr_actions` | Send offer / reject candidate |
| `/v1/hr/ai-command` | `hr_ai_assistant` | NL command processing for HR |
| `/v1/proctoring` | `proctoring` | Report violations, terminate session |
| `/v1/resume` | `resume_parsing` | Parse resume files (PDF/DOCX) |
| `/v1/reports` | `reports` | Generate, download, and view AI reports |
| `/v1/recruitment-strategy` | `recruitment_strategy` | Generate hiring strategy |
| `/v1/experience-wall` | `experience` | Get/post experience entries |
| `/prep` | `prep` | AI placement prep report |
| `/mock` | `mock_interview` | Practice mock interview sessions |
| `/analysis` | `voice_analysis` | Voice/audio analysis |
| `/v1/resume-analyzer` | `resume_analyzer` | Resume ATS score & detailed report |
| `/interview` | `ai_interview_bot` | Interview script REST + WebSocket |
| `/ws/interview/{session_id}` | `ai_interview_bot` | Live interview WebSocket |

---

## Deployment

### Backend (Render / Railway / EC2)

```bash
# Set all environment variables in your hosting dashboard
# Start command:
uvicorn main:app --host 0.0.0.0 --port $PORT
```

> Update CORS origins in `main.py` to include your production domain.

### Frontend (Vercel)

```bash
# Connect your GitHub repo to Vercel
# Set environment variables in the Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_BACKEND_WS=wss://your-backend.onrender.com
```

The production frontend is deployed at: `https://quantum-arena-ten.vercel.app`

### Flutter App (Android)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project was built for the **Quantum Arena Hackathon** and is intended for demonstration purposes.

---

<div align="center">
  <b>Built for the Quantum Arena Hackathon</b>
</div>
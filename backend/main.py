from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_interview_bot.router import router as ai_router
from ai_interview_bot.code_router import code_router
from ai_interview_bot.tts_router import router as tts_router
from authentication.database import engine, Base, init_db
from authentication.routes import router as auth_router
from resume_parsing.routes import router as resume_router
from job_management_module.routes import router as jobs_router
from applications.routes import router as applications_router
from profile.routes import router as profile_router
from candidate_profile.routes import router as candidate_router
from scheduling.routes import router as scheduling_router
from assessment.routes import router as assessment_router
from candidate_dashboard.routes import router as candidate_dashboard_router
from hr_dashboard.routes import router as hr_dashboard_router
from hr_actions.routes import router as hr_actions_router
from proctoring.routes import router as proctoring_router
from ATS_score.route import router as ats_router
from reports.routes import router as reports_router
from recruitment_strategy.routes import router as recruitment_strategy_router
from hr_ai_assistant.routes import router as hr_ai_assistant_router
from experience.routes import router as experience_router
from prep.routes import router as prep_router
from mock_interview.routes import router as mock_interview_router
from voice_analysis.routes import router as voice_analysis_router
from resume_analyzer.routes import router as resume_analyzer_router
from resume_analyzer.models import ResumeAnalysis

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="AI Recruitment System",
    description="Autonomous recruitment and candidate assessment system",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-driven-autonomous-recruitment-an.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "AI Recruitment System Running",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/v1/auth",
            "jobs": "/jobs",
            "applications": "/v1/applications",
            "profile": "/v1/profile",
            "candidate": "/v1/candidate",
            "scheduling": "/v1/scheduling",
            "assessment": "/v1/assessment",
            "candidate_dashboard": "/v1/candidate/dashboard",
            "hr_dashboard": "/v1/hr/dashboard",
            "hr_actions": "/v1/hr/actions",
            "proctoring": "/v1/proctoring",
            "resume": "/v1/resume",
            "interview": "/interview",
            "experience_wall": "/experience",
            "placement_prep": "/prep",
            "mock_interview": "/mock",
            "voice_analysis": "/analysis"
        }
    }

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(profile_router)
app.include_router(candidate_router)
app.include_router(scheduling_router)
app.include_router(assessment_router)
app.include_router(candidate_dashboard_router)
app.include_router(hr_dashboard_router)
app.include_router(hr_actions_router)
app.include_router(proctoring_router)
app.include_router(resume_router)
app.include_router(ai_router)
app.include_router(code_router)
app.include_router(tts_router)
app.include_router(ats_router)
app.include_router(reports_router)
app.include_router(recruitment_strategy_router)
app.include_router(hr_ai_assistant_router)
app.include_router(experience_router)
app.include_router(prep_router)
app.include_router(mock_interview_router)
app.include_router(voice_analysis_router)
app.include_router(resume_analyzer_router)



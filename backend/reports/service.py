import matplotlib
matplotlib.use("Agg")
import asyncio
import base64
import io
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from groq import Groq
from jinja2 import Template
   # Use non-GUI backend for servers

from matplotlib import pyplot as plt

from sqlalchemy.orm import Session

from applications.models import Application
from assessment.models import Assessment
from authentication.database import SessionLocal
from reports.models import CandidateReport

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
REPORTS_DIR = Path("backend/generated_reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

REPORT_TEMPLATE = Template(
    """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: Arial, sans-serif; color: #2D2A24; font-size: 12px; }
      h1, h2, h3 { margin: 0 0 10px; color: #2D2A24; }
      .page-break { page-break-before: always; }
      .hero { border: 1px solid #d6cdc2; background: #f9f6f0; padding: 18px; border-radius: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .card { border: 1px solid #e5ddd2; border-radius: 12px; padding: 14px; margin-bottom: 14px; }
      .metric { font-size: 22px; font-weight: bold; margin-top: 4px; }
      .label { color: #7a7268; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .list { margin: 8px 0 0 18px; }
      img { max-width: 100%; border-radius: 10px; }
      .muted { color: #6e665c; }
      .recommendation { font-size: 20px; font-weight: bold; color: #b8915c; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e5ddd2; padding: 8px; text-align: left; }
      th { background: #f3ede5; }
    </style>
  </head>
  <body>
    <section class="hero">
      <h1>Candidate Evaluation Report</h1>
      <div class="grid">
        <div>
          <div class="label">Candidate</div>
          <div class="metric">{{ candidate_name }}</div>
        </div>
        <div>
          <div class="label">Job Role</div>
          <div class="metric">{{ job_title }}</div>
        </div>
        <div>
          <div class="label">Application ID</div>
          <div class="metric">{{ application_id }}</div>
        </div>
        <div>
          <div class="label">Final Recommendation</div>
          <div class="recommendation">{{ final_recommendation }}</div>
        </div>
      </div>
      <div class="card">
        <h3>Candidate Summary</h3>
        <p>{{ candidate_summary }}</p>
        <p><strong>Assessment score:</strong> {{ assessment_score }} / 100</p>
        <p><strong>Interview summary:</strong> {{ interview_summary }}</p>
      </div>
    </section>

    <section class="page-break">
      <h2>Assessment Analysis</h2>
      <div class="grid">
        <div class="card">
          <div class="label">Total Score</div>
          <div class="metric">{{ assessment_score }} / 100</div>
          <p class="muted">Accuracy: {{ accuracy_percent }}%</p>
          <p class="muted">Duration: {{ assessment_duration_minutes }} min</p>
        </div>
        <div class="card">
          <h3>Violations</h3>
          <p>{{ assessment_violation_count }} logged during assessment.</p>
          <ul class="list">
            {% for violation in assessment_violations %}
            <li>{{ violation.type }} at {{ violation.timestamp }}</li>
            {% endfor %}
          </ul>
        </div>
      </div>
      <div class="card">
        <h3>Section Scores</h3>
        <img src="data:image/png;base64,{{ charts.section_scores }}" alt="Section Scores" />
      </div>
      <div class="grid">
        <div class="card">
          <h3>Accuracy Breakdown</h3>
          <img src="data:image/png;base64,{{ charts.accuracy }}" alt="Accuracy Chart" />
        </div>
        <div class="card">
          <h3>Time Spent</h3>
          <img src="data:image/png;base64,{{ charts.timeline }}" alt="Timeline Chart" />
        </div>
      </div>
    </section>

    <section class="page-break">
      <h2>AI Interview Analysis</h2>
      <div class="grid">
        <div class="card">
          <div class="label">Interview Duration</div>
          <div class="metric">{{ interview_duration_minutes }} min</div>
          <p class="muted">Responses analysed: {{ response_count }}</p>
        </div>
        <div class="card">
          <div class="label">Interview Status</div>
          <div class="metric">{{ ai_interview_status }}</div>
          <p class="muted">Violations: {{ interview_violation_count }}</p>
        </div>
      </div>
      <div class="card">
        <h3>Evaluation Summary</h3>
        <p>{{ interview_summary }}</p>
      </div>
      <div class="grid">
        <div class="card">
          <h3>Skill Ratings</h3>
          <img src="data:image/png;base64,{{ charts.skill_ratings }}" alt="Skill Ratings" />
        </div>
        <div class="card">
          <h3>Confidence & Topic Coverage</h3>
          <img src="data:image/png;base64,{{ charts.topic_coverage }}" alt="Topic Coverage" />
        </div>
      </div>
    </section>

    <section class="page-break">
      <h2>Strengths, Weaknesses & Recommendation</h2>
      <div class="card">
        <h3>Strengths</h3>
        <ul class="list">{% for item in strengths %}<li>{{ item }}</li>{% endfor %}</ul>
      </div>
      <div class="card">
        <h3>Areas for Improvement</h3>
        <ul class="list">{% for item in weaknesses %}<li>{{ item }}</li>{% endfor %}</ul>
      </div>
      <div class="card">
        <h3>Behavioral Observations</h3>
        <ul class="list">{% for item in behavioral_observations %}<li>{{ item }}</li>{% endfor %}</ul>
      </div>
      <div class="card">
        <h3>Final Recommendation</h3>
        <p class="recommendation">{{ final_recommendation }}</p>
      </div>
    </section>
  </body>
</html>
"""
)


def _fig_to_base64() -> str:
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight", dpi=180)
    plt.close()
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _build_bar_chart(labels: List[str], values: List[float], title: str) -> str:
    plt.figure(figsize=(6.5, 3.2))
    plt.bar(labels, values, color=["#B8915C", "#D4B88A", "#8A6F47"])
    plt.title(title)
    plt.ylim(0, max(max(values, default=1), 100))
    return _fig_to_base64()


def _build_pie_chart(values: List[float], labels: List[str], title: str) -> str:
    plt.figure(figsize=(5, 4))
    plt.pie(values, labels=labels, autopct="%1.1f%%", colors=["#B8915C", "#E7D7BE"])
    plt.title(title)
    return _fig_to_base64()


def _build_timeline_chart(labels: List[str], values: List[float], title: str) -> str:
    plt.figure(figsize=(6.5, 3.2))
    plt.plot(labels, values, marker="o", color="#9F7A4F", linewidth=2)
    plt.fill_between(labels, values, color="#E7D7BE", alpha=0.35)
    plt.title(title)
    return _fig_to_base64()


def _safe_json_load(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


def _generate_llm_summary(context: Dict[str, Any]) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return {
            "candidate_summary": "Assessment and interview data were consolidated into an evaluation report.",
            "interview_summary": "Interview data captured from the AI session and transcript.",
            "strengths": ["Demonstrated progression through the evaluation stages."],
            "weaknesses": ["Further manual review recommended for nuanced judgment."],
            "behavioral_observations": ["See transcript and analytics for detailed evidence."],
            "final_recommendation": "Neutral",
        }

    prompt = f"""
Return valid JSON only with keys:
candidate_summary, interview_summary, strengths, weaknesses, behavioral_observations, final_recommendation.

Context:
{json.dumps(context, default=str, indent=2)}
"""
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert hiring analyst. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return _safe_json_load(response.choices[0].message.content.strip())


def _build_report_context(
    db: Session,
    application_id: int,
    stored_llm_summary: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise ValueError("Application not found")

    assessment = db.query(Assessment).filter(Assessment.application_id == application_id).first()
    assessment_data = dict(application.assessment_data or {})
    interview_feedback = dict(application.interview_feedback or {})
    transcript = list(application.interview_transcript or [])

    mcq_score = float(assessment.mcq_score or 0) if assessment else 0.0
    coding_score = float(assessment.dsa_score or 0) if assessment else 0.0
    total_score = float(application.assessment_score or 0)
    correct_answers = 0
    total_mcq = 0
    if assessment:
        total_mcq = len(assessment.answers)
        correct_answers = sum(1 for answer in assessment.answers if answer.is_correct)

    accuracy_percent = round((correct_answers / total_mcq) * 100, 1) if total_mcq else 0.0
    assessment_duration_minutes = 0
    if assessment and assessment.started_at and assessment.completed_at:
        assessment_duration_minutes = max(
            1,
            int((assessment.completed_at - assessment.started_at).total_seconds() // 60),
        )

    assessment_violations = [
        violation
        for violation in assessment_data.get("violations", [])
        if violation.get("stage") == "assessment"
    ]
    interview_violations = [
        violation
        for violation in interview_feedback.get("violations", [])
        if violation.get("stage") == "interview"
    ]

    interview_duration_minutes = interview_feedback.get("duration_minutes")
    if interview_duration_minutes is None:
        started_at = interview_feedback.get("started_at")
        completed_at = interview_feedback.get("completed_at")
        if started_at and completed_at:
            start_dt = datetime.fromisoformat(started_at)
            end_dt = datetime.fromisoformat(completed_at)
            interview_duration_minutes = max(1, int((end_dt - start_dt).total_seconds() // 60))
        else:
            interview_duration_minutes = 0

    skill_ratings = interview_feedback.get(
        "skill_ratings",
        {"Communication": 70, "Technical Depth": 68, "Confidence": 65, "Problem Solving": 72},
    )
    topic_coverage = interview_feedback.get(
        "topic_coverage",
        {"Behavioral": 80, "Coding": 75, "System Design": 55},
    )

    section_times = assessment_data.get(
        "time_spent_by_section",
        {"MCQ": max(1, int(assessment_duration_minutes * 0.4)) if assessment_duration_minutes else 20,
         "Coding": max(1, int(assessment_duration_minutes * 0.6)) if assessment_duration_minutes else 40},
    )

    llm_context = {
        "candidate_name": application.user.name if application.user else "Candidate",
        "job_title": application.job.title if application.job else f"Job #{application.job_id}",
        "application_id": application.id,
        "assessment_score": total_score,
        "assessment_breakdown": {"mcq": mcq_score, "coding": coding_score, "accuracy_percent": accuracy_percent},
        "assessment_violations": assessment_violations,
        "interview_status": interview_feedback.get("ai_interview_status", "completed"),
        "interview_summary_source": interview_feedback,
        "transcript_excerpt": transcript[:12],
    }
    llm_summary = stored_llm_summary or _generate_llm_summary(llm_context)

    charts = {
        "section_scores": _build_bar_chart(["MCQ", "Coding", "Total"], [mcq_score, coding_score, total_score], "Assessment Section Scores"),
        "accuracy": _build_pie_chart(
            [correct_answers, max(total_mcq - correct_answers, 0)] if total_mcq else [1],
            ["Correct", "Incorrect"] if total_mcq else ["No MCQ Data"],
            "Assessment Accuracy",
        ),
        "timeline": _build_timeline_chart(list(section_times.keys()), list(section_times.values()), "Time Spent Per Section"),
        "skill_ratings": _build_bar_chart(list(skill_ratings.keys()), list(skill_ratings.values()), "AI Interview Skill Ratings"),
        "topic_coverage": _build_bar_chart(list(topic_coverage.keys()), list(topic_coverage.values()), "Interview Topic Coverage"),
    }

    return {
        "application": application,
        "assessment": assessment,
        "assessment_data": assessment_data,
        "interview_feedback": interview_feedback,
        "interview_transcript": transcript,
        "charts": charts,
        "chart_metadata": {
            "section_scores": ["MCQ", "Coding", "Total"],
            "skill_ratings": skill_ratings,
            "topic_coverage": topic_coverage,
        },
        "llm_summary": llm_summary,
        "render_context": {
            "candidate_name": application.user.name if application.user else "Candidate",
            "job_title": application.job.title if application.job else f"Job #{application.job_id}",
            "application_id": application.id,
            "assessment_score": round(total_score, 1),
            "interview_summary": llm_summary.get("interview_summary", "Interview summary unavailable."),
            "candidate_summary": llm_summary.get("candidate_summary", "Candidate summary unavailable."),
            "final_recommendation": llm_summary.get("final_recommendation", "Neutral"),
            "accuracy_percent": accuracy_percent,
            "assessment_duration_minutes": assessment_duration_minutes,
            "assessment_violation_count": len(assessment_violations),
            "assessment_violations": assessment_violations[:8],
            "interview_duration_minutes": interview_duration_minutes,
            "response_count": len([item for item in transcript if item.get("speaker") == "candidate"]),
            "ai_interview_status": interview_feedback.get("ai_interview_status", "completed"),
            "interview_violation_count": len(interview_violations),
            "strengths": llm_summary.get("strengths", []),
            "weaknesses": llm_summary.get("weaknesses", []),
            "behavioral_observations": llm_summary.get("behavioral_observations", []),
            "charts": charts,
        },
    }


def build_report_response_payload(db: Session, report: CandidateReport) -> Dict[str, Any]:
    context = _build_report_context(
        db,
        report.application_id,
        stored_llm_summary=dict(report.llm_summary_json or {}) or None,
    )
    application = context["application"]
    assessment_data = context["assessment_data"]
    interview_feedback = context["interview_feedback"]
    llm_summary = context["llm_summary"]
    render_context = context["render_context"]
    chart_metadata = dict(report.chart_metadata_json or {})

    section_scores = {
        "MCQ": round(float(context["assessment"].mcq_score or 0), 1) if context["assessment"] else 0.0,
        "Coding": round(float(context["assessment"].dsa_score or 0), 1) if context["assessment"] else 0.0,
        "Total": round(float(application.assessment_score or 0), 1),
    }
    time_spent_by_section = {
        key: float(value)
        for key, value in (
            assessment_data.get("time_spent_by_section")
            or {
                "MCQ": max(1, int(render_context["assessment_duration_minutes"] * 0.4))
                if render_context["assessment_duration_minutes"]
                else 20,
                "Coding": max(1, int(render_context["assessment_duration_minutes"] * 0.6))
                if render_context["assessment_duration_minutes"]
                else 40,
            }
        ).items()
    }

    return {
        "id": report.id,
        "application_id": report.application_id,
        "report_type": report.report_type,
        "status": report.status,
        "pdf_path": report.pdf_path,
        "pdf_url": report.pdf_url,
        "llm_summary_json": report.llm_summary_json,
        "chart_metadata_json": chart_metadata,
        "generated_at": report.generated_at,
        "error_message": report.error_message,
        "created_at": report.created_at,
        "subject": {
            "candidate_name": application.user.name if application.user else "Candidate",
            "candidate_id": application.candidate_id,
            "job_title": application.job.title if application.job else f"Job #{application.job_id}",
            "job_id": application.job_id,
            "application_status": application.status,
        },
        "assessment": {
            "score": round(float(application.assessment_score or 0), 1),
            "accuracy_percent": render_context["accuracy_percent"],
            "duration_minutes": render_context["assessment_duration_minutes"],
            "violation_count": render_context["assessment_violation_count"],
            "violations": render_context["assessment_violations"],
            "section_scores": section_scores,
            "time_spent_by_section": time_spent_by_section,
        },
        "interview": {
            "score": round(float(application.interview_score or 0), 1),
            "duration_minutes": int(render_context["interview_duration_minutes"] or 0),
            "status": str(render_context["ai_interview_status"]),
            "violation_count": render_context["interview_violation_count"],
            "violations": [
                violation
                for violation in interview_feedback.get("violations", [])
                if violation.get("stage") == "interview"
            ],
            "response_count": int(render_context["response_count"]),
            "skill_ratings": {
                key: float(value)
                for key, value in (
                    interview_feedback.get("skill_ratings")
                    or chart_metadata.get("skill_ratings")
                    or {}
                ).items()
            },
            "topic_coverage": {
                key: float(value)
                for key, value in (
                    interview_feedback.get("topic_coverage")
                    or chart_metadata.get("topic_coverage")
                    or {}
                ).items()
            },
            "summary": render_context["interview_summary"],
        },
        "strengths": list(llm_summary.get("strengths", [])),
        "weaknesses": list(llm_summary.get("weaknesses", [])),
        "behavioral_observations": list(llm_summary.get("behavioral_observations", [])),
        "final_recommendation": llm_summary.get("final_recommendation"),
        "candidate_summary": llm_summary.get("candidate_summary"),
        "interview_summary": llm_summary.get("interview_summary"),
        "chart_images": context["charts"],
    }


def generate_candidate_report(db: Session, application_id: int) -> CandidateReport:
    from weasyprint import HTML

    report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
    if not report:
        report = CandidateReport(application_id=application_id, status="pending")
        db.add(report)
        db.commit()
        db.refresh(report)

    report.status = "generating"
    report.error_message = None
    db.commit()

    context = _build_report_context(db, application_id)
    application = context["application"]
    report_dir = REPORTS_DIR / f"application_{application_id}"
    report_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = report_dir / "candidate_evaluation_report.pdf"

    html = REPORT_TEMPLATE.render(**context["render_context"])
    HTML(string=html, base_url=str(report_dir.resolve())).write_pdf(str(pdf_path))

    report.status = "completed"
    report.pdf_path = str(pdf_path.resolve())
    report.pdf_url = f"/v1/reports/{report.id}/download" if report.id else None
    report.llm_summary_json = context["llm_summary"]
    report.chart_metadata_json = context["chart_metadata"]
    report.generated_at = datetime.utcnow()

    application.interview_feedback = dict(application.interview_feedback or {})
    application.interview_feedback["report_generated_at"] = report.generated_at.isoformat()

    db.commit()
    db.refresh(report)
    return report


def generate_candidate_report_safe(application_id: int) -> None:
    db = SessionLocal()
    try:
        generate_candidate_report(db, application_id)
    except Exception as error:
        report = db.query(CandidateReport).filter(CandidateReport.application_id == application_id).first()
        if report:
            report.status = "failed"
            report.error_message = str(error)
            db.commit()
    finally:
        db.close()


async def generate_candidate_report_background(application_id: int) -> None:
    await asyncio.to_thread(generate_candidate_report_safe, application_id)

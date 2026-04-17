"""
AI Report Generator for Placement Prep
========================================
Sends structured prompt to GPT-4o → returns 8-section JSON report.
Generates downloadable PDF via ReportLab.
"""

import os
import io
import json
import logging
from typing import Optional
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

REPORT_SCHEMA_PROMPT = """
You are a senior placement coach and tech hiring expert. Given the candidate profile and target details,
generate a comprehensive placement preparation report as a JSON object with EXACTLY these 8 keys:

{
  "executive_summary": {
    "readiness_score": <int 0-100>,
    "summary": "<2-3 sentence overview>",
    "strengths": ["<str>", ...],
    "quick_wins": ["<str>", ...]
  },
  "skill_gap_analysis": {
    "strong_skills": ["<skill>", ...],
    "gap_skills": [{"skill": "<str>", "importance": "high|medium|low", "resource": "<free URL>"}],
    "priority_order": ["<skill>", ...]
  },
  "resume_ats_analysis": {
    "ats_score": <int 0-100>,
    "keyword_gaps": ["<keyword>", ...],
    "formatting_tips": ["<tip>", ...],
    "impact_rewrites": [{"original": "<str>", "improved": "<str>"}]
  },
  "prep_plan_week1": {
    "theme": "<str>",
    "daily_tasks": [
      {"day": "Day 1", "topic": "<str>", "tasks": ["<str>"], "hours": <int>}
    ]
  },
  "prep_plan_week2": {
    "theme": "<str>",
    "daily_tasks": [
      {"day": "Day 8", "topic": "<str>", "tasks": ["<str>"], "hours": <int>}
    ]
  },
  "dsa_system_design_roadmap": {
    "dsa_topics": [{"topic": "<str>", "priority": "high|medium|low", "leetcode_pattern": "<str>"}],
    "system_design_topics": ["<str>", ...],
    "recommended_problems": [{"title": "<str>", "url": "<free URL>", "difficulty": "<str>"}]
  },
  "behavioral_prep": {
    "star_stories": [
      {"situation": "<str>", "task": "<str>", "action": "<str>", "result": "<str>", "question_fit": "<str>"}
    ],
    "common_questions": ["<str>", ...],
    "tips": ["<str>", ...]
  },
  "resource_directory": {
    "free_courses": [{"name": "<str>", "url": "<free URL>", "platform": "<str>"}],
    "youtube_channels": [{"name": "<str>", "url": "<str>"}],
    "practice_platforms": [{"name": "<str>", "url": "<str>", "focus": "<str>"}],
    "books": [{"title": "<str>", "free_url": "<str or null>"}]
  }
}

Return ONLY the raw JSON. No markdown. No explanation.
"""


def generate_prep_report(
    resume_summary: str,
    job_role: str,
    target_companies: list[str],
    days_available: int,
    current_tech_stack: str,
    weakest_skill: str,
) -> dict:
    """Call GPT-4o with all context and get structured 8-section report."""

    companies_str = ", ".join(target_companies) if target_companies else "top tech companies"

    user_message = f"""
CANDIDATE RESUME CONTEXT:
{resume_summary}

TARGET DETAILS:
- Desired Role: {job_role}
- Target Companies: {companies_str}
- Days Available for Prep: {days_available}
- Current Tech Stack: {current_tech_stack}
- Weakest Area / Skill: {weakest_skill}

Generate the 8-section placement prep report JSON now.
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": REPORT_SCHEMA_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.4,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


# ─── PDF Generation ──────────────────────────────────────────────────────────

def generate_pdf_from_report(report: dict, candidate_name: str, job_role: str) -> bytes:
    """Generate a well-structured PDF from the 8-section report dict using ReportLab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, PageBreak
        )
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
    except ImportError:
        raise RuntimeError("reportlab not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2.5*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    BRAND = colors.HexColor("#B8915C")
    DARK  = colors.HexColor("#2D2A24")

    h1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=BRAND,
                         fontSize=22, spaceAfter=4)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=DARK,
                         fontSize=13, spaceAfter=3, spaceBefore=10)
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9,
                           leading=14, spaceAfter=4)
    bullet = ParagraphStyle("Bullet", parent=body, leftIndent=14,
                              bulletIndent=4, spaceAfter=2)

    def para(text, style=body): return Paragraph(str(text), style)
    def hr(): return HRFlowable(width="100%", thickness=0.5, color=BRAND, spaceAfter=6)
    def space(h=6): return Spacer(1, h)

    story = []

    # ── Cover ──
    story.append(para(f"<font color='#B8915C'><b>HireFlow</b></font> — Placement Prep Report", h1))
    story.append(para(f"Candidate: <b>{candidate_name}</b> | Target Role: <b>{job_role}</b>", body))
    story.append(hr())
    story.append(space(8))

    section_titles = {
        "executive_summary": "1. Executive Summary & Readiness Score",
        "skill_gap_analysis": "2. Skill Gap Analysis",
        "resume_ats_analysis": "3. Resume ATS Analysis",
        "prep_plan_week1": "4. Day-by-Day Prep Plan — Week 1",
        "prep_plan_week2": "5. Day-by-Day Prep Plan — Week 2",
        "dsa_system_design_roadmap": "6. DSA & System Design Roadmap",
        "behavioral_prep": "7. Behavioral Prep & STAR Stories",
        "resource_directory": "8. Free Resource Directory",
    }

    for key, title in section_titles.items():
        section = report.get(key, {})
        if not section:
            continue

        story.append(para(title, h2))
        story.append(hr())

        if key == "executive_summary":
            score = section.get("readiness_score", "N/A")
            story.append(para(f"<b>Readiness Score: {score}/100</b>", body))
            story.append(para(section.get("summary", ""), body))
            for s in section.get("strengths", []):
                story.append(para(f"✓ {s}", bullet))
            story.append(para("<b>Quick Wins:</b>", body))
            for q in section.get("quick_wins", []):
                story.append(para(f"→ {q}", bullet))

        elif key == "skill_gap_analysis":
            strong = section.get("strong_skills", [])
            if strong:
                story.append(para(f"<b>Strong Skills:</b> {', '.join(strong)}", body))
            gaps = section.get("gap_skills", [])
            if gaps:
                story.append(para("<b>Gap Skills to Learn:</b>", body))
                for g in gaps:
                    story.append(para(f"• [{g.get('importance','').upper()}] {g.get('skill','')} — {g.get('resource','')}", bullet))

        elif key == "resume_ats_analysis":
            story.append(para(f"<b>ATS Score: {section.get('ats_score','N/A')}/100</b>", body))
            kw = section.get("keyword_gaps", [])
            if kw:
                story.append(para(f"<b>Keyword Gaps:</b> {', '.join(kw)}", body))
            for tip in section.get("formatting_tips", []):
                story.append(para(f"• {tip}", bullet))
            rewrites = section.get("impact_rewrites", [])
            for rw in rewrites[:3]:
                story.append(para(f"<b>Before:</b> {rw.get('original','')}", bullet))
                story.append(para(f"<b>After:</b> {rw.get('improved','')}", bullet))
                story.append(space(4))

        elif key in ("prep_plan_week1", "prep_plan_week2"):
            story.append(para(f"<b>Theme:</b> {section.get('theme','')}", body))
            for day in section.get("daily_tasks", []):
                story.append(para(f"<b>{day.get('day','')}</b> — {day.get('topic','')} ({day.get('hours',0)}h)", body))
                for t in day.get("tasks", []):
                    story.append(para(f"  • {t}", bullet))

        elif key == "dsa_system_design_roadmap":
            story.append(para("<b>DSA Topics:</b>", body))
            for t in section.get("dsa_topics", []):
                story.append(para(f"• [{t.get('priority','').upper()}] {t.get('topic','')} — Pattern: {t.get('leetcode_pattern','')}", bullet))
            story.append(para(f"<b>System Design:</b> {', '.join(section.get('system_design_topics', []))}", body))
            story.append(para("<b>Recommended Problems:</b>", body))
            for p in section.get("recommended_problems", [])[:5]:
                story.append(para(f"• {p.get('title','')} ({p.get('difficulty','')}) — {p.get('url','')}", bullet))

        elif key == "behavioral_prep":
            for story_item in section.get("star_stories", [])[:2]:
                story.append(para(f"<b>Question:</b> {story_item.get('question_fit','')}", body))
                story.append(para(f"S: {story_item.get('situation','')}", bullet))
                story.append(para(f"T: {story_item.get('task','')}", bullet))
                story.append(para(f"A: {story_item.get('action','')}", bullet))
                story.append(para(f"R: {story_item.get('result','')}", bullet))
                story.append(space(4))
            for tip in section.get("tips", []):
                story.append(para(f"→ {tip}", bullet))

        elif key == "resource_directory":
            story.append(para("<b>Free Courses:</b>", body))
            for c in section.get("free_courses", []):
                story.append(para(f"• {c.get('name','')} ({c.get('platform','')}) — {c.get('url','')}", bullet))
            story.append(para("<b>YouTube:</b>", body))
            for y in section.get("youtube_channels", []):
                story.append(para(f"• {y.get('name','')} — {y.get('url','')}", bullet))
            story.append(para("<b>Practice Platforms:</b>", body))
            for pl in section.get("practice_platforms", []):
                story.append(para(f"• {pl.get('name','')} ({pl.get('focus','')}) — {pl.get('url','')}", bullet))

        story.append(space(12))

    doc.build(story)
    return buffer.getvalue()

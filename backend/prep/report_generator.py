"""
AI Report Generator for Placement Prep
========================================
Sends a richly structured prompt to GPT-4o → returns a 10-section JSON report.
Generates a premium PDF via ReportLab with charts, progress bars, and color-coded elements.
"""

import os
import io
import json
import base64
import logging
from typing import Optional

import matplotlib
matplotlib.use("Agg")
from matplotlib import pyplot as plt
import numpy as np
from openai import OpenAI

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or "")

# ─── Colors ───────────────────────────────────────────────────────────────────
INDIGO   = "#6366f1"
BLUE     = "#3b82f6"
GREEN    = "#22c55e"
AMBER    = "#f59e0b"
RED      = "#ef4444"
PURPLE   = "#8b5cf6"
DARK     = "#1e1b4b"
LIGHT_BG = "#f8f9ff"

# ─── Schema Prompt ────────────────────────────────────────────────────────────

REPORT_SCHEMA_PROMPT = """
You are a world-class senior placement coach, tech hiring strategist, and career development expert.
Given the candidate's resume, target role, and preparation context, produce a DEEPLY DETAILED, HIGHLY ANALYTICAL
placement preparation report as a JSON object with EXACTLY these 10 keys.

Return ONLY raw JSON — no markdown, no explanation, no ```json fences.

{
  "executive_summary": {
    "readiness_score": <int 0-100>,
    "readiness_tier": "<Not Ready | Developing | Partially Ready | Ready | Highly Ready>",
    "summary": "<4-5 sentence analytical overview covering technical readiness, communication strengths, role alignment, and key risks>",
    "strengths": ["<specific strength with brief rationale>", ...],  // 4-6 items
    "quick_wins": ["<concrete action that gives immediate impact>", ...],  // 4-6 items
    "critical_gaps": ["<gap that must be closed before interviewing>", ...]  // 2-4 items
  },

  "job_fit_analysis": {
    "fit_score": <int 0-100>,
    "alignment_summary": "<3-4 sentences on how well the candidate's background aligns with the role>",
    "matching_qualifications": ["<qualification>", ...],
    "missing_qualifications": [{"skill": "<str>", "gap_severity": "critical|high|medium|low"}],
    "compensation_estimate": "<range in INR or USD depending on context>",
    "interview_difficulty_forecast": "<Easy | Moderate | Hard | Very Hard>",
    "competitor_comparisons": "<2-3 sentences on how this candidate compares to typical applicants for this role>"
  },

  "skill_gap_analysis": {
    "strong_skills": ["<skill>", ...],
    "gap_skills": [
      {"skill": "<str>", "importance": "high|medium|low", "estimated_hours_to_learn": <int>, "resource": "<free URL>"}
    ],
    "priority_order": ["<skill>", ...],
    "tech_stack_coverage_percent": <int 0-100>,
    "skill_radar": {
      "dsa_algo": <int 0-100>,
      "system_design": <int 0-100>,
      "core_cs_fundamentals": <int 0-100>,
      "frameworks_tools": <int 0-100>,
      "communication": <int 0-100>,
      "problem_solving_speed": <int 0-100>
    }
  },

  "resume_ats_analysis": {
    "ats_score": <int 0-100>,
    "match_percent_for_role": <int 0-100>,
    "keyword_gaps": ["<keyword>", ...],
    "keyword_matches": ["<keyword that already exists>", ...],
    "formatting_tips": ["<tip>", ...],
    "impact_rewrites": [
      {"original": "<current bullet>", "improved": "<STAR-rewritten bullet with numbers>", "why": "<improvement reason>"}
    ],
    "linkedin_tips": ["<specific LinkedIn profile improvement>", ...],
    "section_scores": {
      "work_experience": <int 0-100>,
      "education": <int 0-100>,
      "skills": <int 0-100>,
      "projects": <int 0-100>,
      "summary_headline": <int 0-100>
    }
  },

  "prep_plan_week1": {
    "theme": "<str>",
    "time_commitment_daily_hours": <int>,
    "daily_tasks": [
      {
        "day": "Day 1",
        "topic": "<str>",
        "tasks": ["<specific task>", ...],
        "hours": <int>,
        "priority": "critical|high|medium",
        "resources": ["<url or book>"]
      }
    ]
  },

  "prep_plan_week2": {
    "theme": "<str>",
    "time_commitment_daily_hours": <int>,
    "daily_tasks": [
      {
        "day": "Day 8",
        "topic": "<str>",
        "tasks": ["<specific task>", ...],
        "hours": <int>,
        "priority": "critical|high|medium",
        "resources": ["<url or book>"]
      }
    ]
  },

  "dsa_system_design_roadmap": {
    "overall_dsa_readiness": "<Not Started | Beginner | Intermediate | Advanced>",
    "estimated_problems_solved": <int>,
    "dsa_topics": [
      {"topic": "<str>", "priority": "high|medium|low", "leetcode_pattern": "<str>", "example_problems": ["<problem title>"]}
    ],
    "system_design_topics": [
      {"topic": "<str>", "level": "L1|L2|L3", "key_concepts": ["<concept>"]}
    ],
    "recommended_problems": [
      {"title": "<str>", "url": "<free URL>", "difficulty": "<Easy|Medium|Hard>", "pattern": "<str>", "companies": ["<company>"]}
    ],
    "mock_interview_schedule": ["<suggestion>", ...]
  },

  "behavioral_prep": {
    "star_stories": [
      {
        "question_fit": "<str>",
        "situation": "<str>",
        "task": "<str>",
        "action": "<str>",
        "result": "<str>",
        "impact_metrics": "<quantify the result if possible>"
      }
    ],
    "common_questions": ["<str>", ...],
    "tips": ["<str>", ...],
    "culture_fit_score": <int 0-100>,
    "red_flags_to_avoid": ["<behavioral red flag to not demonstrate>", ...]
  },

  "mock_interview_strategy": {
    "recommended_platform_schedule": [
      {"platform": "<str>", "focus": "<str>", "sessions_per_week": <int>, "url": "<str>"}
    ],
    "expected_question_types": [
      {"type": "<Coding|System Design|Behavioral|HR>", "frequency": "high|medium|low", "tips": "<str>"}
    ],
    "time_management_tips": ["<tip>", ...],
    "company_specific_insights": [
      {"company": "<str>", "interview_style": "<str>", "key_focus_areas": ["<area>"]}
    ]
  },

  "mental_wellness_plan": {
    "stress_level_forecast": "<Low | Moderate | High>",
    "burnout_risk": "<Low | Medium | High>",
    "daily_routine_tips": ["<tip>", ...],
    "confidence_building_exercises": ["<exercise>", ...],
    "recommended_breaks_per_day": <int>,
    "motivational_insight": "<1 impactful motivational paragraph tailored to the candidate's situation>"
  },

  "resource_directory": {
    "free_courses": [{"name": "<str>", "url": "<free URL>", "platform": "<str>", "hours": <int>, "rating": "<4.x/5>"}],
    "youtube_channels": [{"name": "<str>", "url": "<str>", "specialty": "<str>"}],
    "practice_platforms": [{"name": "<str>", "url": "<str>", "focus": "<str>", "free_tier": true}],
    "books": [{"title": "<str>", "author": "<str>", "free_url": "<str or null>", "best_for": "<str>"}],
    "communities": [{"name": "<str>", "url": "<str>", "type": "Discord|Slack|Reddit|LinkedIn"}]
  }
}
"""


# ─── Chart Helpers ────────────────────────────────────────────────────────────

plt.rcParams.update({
    "font.family": "sans-serif",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.25,
    "grid.linestyle": "--",
})


def _fig_to_bytes() -> bytes:
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight", dpi=160)
    plt.close()
    return buffer.getvalue()


def _build_radar_image(categories: list, values: list, title: str) -> bytes:
    N = len(categories)
    if N < 3:
        return _build_bar_image(categories, values, title)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]
    norm = [min(v, 100) / 100.0 for v in values]
    norm += norm[:1]
    fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True))
    ax.plot(angles, norm, "o-", linewidth=2.5, color=INDIGO)
    ax.fill(angles, norm, alpha=0.2, color=INDIGO)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=8)
    ax.set_ylim(0, 1)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["25", "50", "75", "100"], size=7, color="#9ca3af")
    ax.set_title(title, size=10, fontweight="bold", color=DARK, pad=14)
    ax.spines["polar"].set_visible(False)
    ax.grid(color="#e5e7eb", linestyle="--", alpha=0.5)
    fig.patch.set_facecolor(LIGHT_BG)
    return _fig_to_bytes()


def _build_bar_image(labels: list, values: list, title: str, color: str = INDIGO) -> bytes:
    fig, ax = plt.subplots(figsize=(7, 3.5))
    colors = [GREEN if v >= 75 else BLUE if v >= 55 else AMBER if v >= 35 else RED for v in values]
    bars = ax.bar(labels, values, color=colors, width=0.5, zorder=2)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                f"{val:.0f}", ha="center", va="bottom", fontsize=8, fontweight="bold", color=DARK)
    ax.set_ylim(0, max(max(values, default=1) * 1.2, 100))
    ax.set_title(title, fontsize=10, fontweight="bold", color=DARK, pad=10)
    ax.tick_params(axis="x", labelsize=8)
    ax.tick_params(axis="y", labelsize=8)
    fig.patch.set_facecolor(LIGHT_BG)
    ax.set_facecolor(LIGHT_BG)
    plt.tight_layout()
    return _fig_to_bytes()


def _build_hbar_image(labels: list, values: list, title: str) -> bytes:
    fig, ax = plt.subplots(figsize=(7, max(2.5, len(labels) * 0.5)))
    colors = [GREEN if v >= 75 else BLUE if v >= 55 else AMBER if v >= 35 else RED for v in values]
    y_pos = range(len(labels))
    ax.barh(list(y_pos), values, color=colors, height=0.5, zorder=2)
    for i, val in enumerate(values):
        ax.text(min(val + 1.5, 98), i, f"{val:.0f}", va="center", ha="left",
                fontsize=8, fontweight="bold", color=DARK)
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(labels, fontsize=8)
    ax.set_xlim(0, 115)
    ax.set_title(title, fontsize=10, fontweight="bold", color=DARK, pad=10)
    ax.set_xlabel("Score / 100", fontsize=8)
    fig.patch.set_facecolor(LIGHT_BG)
    ax.set_facecolor(LIGHT_BG)
    plt.tight_layout()
    return _fig_to_bytes()


def _build_gauge_image(score: int, label: str) -> bytes:
    fig, ax = plt.subplots(figsize=(4, 2.5), subplot_kw=dict(aspect="equal"))
    theta_start = np.pi
    theta_end = 0
    bg = plt.matplotlib.patches.Wedge((0.5, 0.1), 0.4, 0, 180, width=0.13,
                                       facecolor="#e5e7eb", transform=ax.transData)
    ax.add_patch(bg)
    portion = score / 100.0
    fill_angle = portion * 180
    color = GREEN if score >= 75 else BLUE if score >= 55 else AMBER if score >= 35 else RED
    fill = plt.matplotlib.patches.Wedge((0.5, 0.1), 0.4, 0, fill_angle, width=0.13,
                                         facecolor=color, transform=ax.transData)
    ax.add_patch(fill)
    ax.text(0.5, 0.12, f"{score}", ha="center", va="center",
            fontsize=24, fontweight="bold", color=DARK, transform=ax.transData)
    ax.text(0.5, -0.05, label, ha="center", va="center",
            fontsize=8, color="#6b7280", transform=ax.transData)
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.15, 0.6)
    ax.axis("off")
    fig.patch.set_facecolor(LIGHT_BG)
    plt.tight_layout()
    return _fig_to_bytes()


# ─── Core Generation ──────────────────────────────────────────────────────────

def generate_prep_report(
    resume_summary: str,
    job_role: str,
    target_companies: list,
    auto_tech_stack: str = "Not specified (infer from resume)",
) -> dict:
    """Call GPT-4o with resume + role + companies and return the structured 10-section report."""

    companies_str = ", ".join(target_companies) if target_companies else "top tech companies"

    user_message = f"""
CANDIDATE RESUME CONTEXT:
{resume_summary}

AUTO-DETECTED TECH PROFILE (from candidate's saved profile):
{auto_tech_stack}

TARGET DETAILS:
- Desired Role: {job_role}
- Target Companies: {companies_str}

Instructions:
- Analyse the resume deeply and infer everything the candidate needs to know.
- Identify their current strengths, gaps, weaknesses, and tech stack from the resume data.
- Do NOT ask for or mention missing fields — infer them all from context.
- Tailor ALL advice (DSA, system design, behavioral, plan, resources) specifically to
  the {job_role} role at {companies_str}.
- Be extremely specific and personalized — not generic.

Generate the FULL 10-section placement prep report JSON now.
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": REPORT_SCHEMA_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.35,
        max_tokens=6000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


# ─── PDF Generation ──────────────────────────────────────────────────────────

def generate_pdf_from_report(report: dict, candidate_name: str, job_role: str) -> bytes:
    """Generate a premium, analytics-rich PDF from the 10-section report dict using ReportLab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, PageBreak, Image, KeepTogether
        )
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    except ImportError:
        raise RuntimeError("reportlab not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.8 * cm, leftMargin=1.8 * cm,
        topMargin=2.2 * cm, bottomMargin=1.8 * cm,
    )

    styles = getSampleStyleSheet()

    C_INDIGO  = colors.HexColor(INDIGO)
    C_BLUE    = colors.HexColor(BLUE)
    C_GREEN   = colors.HexColor(GREEN)
    C_AMBER   = colors.HexColor(AMBER)
    C_RED     = colors.HexColor(RED)
    C_DARK    = colors.HexColor(DARK)
    C_BG      = colors.HexColor("#f1f5f9")
    C_LIGHT   = colors.HexColor("#e0e7ff")

    # Styles
    title_s  = ParagraphStyle("Title", parent=styles["Heading1"], textColor=C_INDIGO, fontSize=20, spaceAfter=2, fontName="Helvetica-Bold")
    sub_s    = ParagraphStyle("Sub",   parent=styles["Normal"],   textColor=colors.HexColor("#6b7280"), fontSize=9, spaceAfter=10)
    h2       = ParagraphStyle("H2",    parent=styles["Heading2"], textColor=C_DARK, fontSize=13, spaceAfter=4, spaceBefore=12, fontName="Helvetica-Bold")
    h3       = ParagraphStyle("H3",    parent=styles["Heading3"], textColor=C_INDIGO, fontSize=10, spaceAfter=3, spaceBefore=6, fontName="Helvetica-Bold")
    body     = ParagraphStyle("Body",  parent=styles["Normal"],   fontSize=9, leading=14, spaceAfter=4, textColor=C_DARK)
    bullet_s = ParagraphStyle("Blt",   parent=body, leftIndent=14, bulletIndent=4, spaceAfter=2)
    small_s  = ParagraphStyle("Sm",    parent=body, fontSize=8, textColor=colors.HexColor("#6b7280"))
    center_s = ParagraphStyle("Ctr",   parent=body, alignment=TA_CENTER)
    good_s   = ParagraphStyle("Good",  parent=bullet_s, textColor=colors.HexColor("#15803d"))
    warn_s   = ParagraphStyle("Warn",  parent=bullet_s, textColor=colors.HexColor("#92400e"))
    bad_s    = ParagraphStyle("Bad",   parent=bullet_s, textColor=colors.HexColor("#dc2626"))
    crit_s   = ParagraphStyle("Crit",  parent=bullet_s, textColor=colors.HexColor("#991b1b"), fontName="Helvetica-Bold")

    def p(text, style=body):   return Paragraph(str(text), style)
    def hr(color=C_INDIGO):    return HRFlowable(width="100%", thickness=1.0, color=color, spaceAfter=6, spaceBefore=6)
    def sp(h=6):               return Spacer(1, h)
    def embed_image(img_bytes, w=13 * cm, h=5 * cm):
        bio = io.BytesIO(img_bytes)
        return Image(bio, width=w, height=h, kind="proportional")

    def priority_color(priority: str):
        return {"critical": bad_s, "high": warn_s, "medium": body, "low": small_s}.get(priority.lower(), body)

    def score_badge(score: int, prefix: str = "") -> str:
        if score >= 80:
            color = "green"
        elif score >= 60:
            color = "blue"
        elif score >= 40:
            color = "#d97706"
        else:
            color = "red"
        return f"{prefix}<font color='{color}'><b>{score}/100</b></font>"

    # ── Table helper
    def simple_table(data: list, col_widths=None, header=True) -> Table:
        style = TableStyle([
            ("FONTNAME",    (0, 0), (-1, 0 if header else -1), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("BACKGROUND",  (0, 0), (-1, 0), C_BG),
            ("TEXTCOLOR",   (0, 0), (-1, 0), C_DARK),
            ("ALIGN",       (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
            ("PADDING",     (0, 0), (-1, -1), 5),
        ])
        t = Table(data, colWidths=col_widths)
        t.setStyle(style)
        return t

    story = []

    # ═══════════════════════════════════════════════════
    # COVER
    # ═══════════════════════════════════════════════════
    story.append(p("Quantum Arena — Placement Prep Intelligence Report", title_s))
    story.append(p(f"Candidate: <b>{candidate_name}</b>  ·  Target Role: <b>{job_role}</b>", sub_s))
    story.append(hr())
    story.append(sp(6))

    # Executive Summary
    exec_sum = report.get("executive_summary", {})
    readiness_score = exec_sum.get("readiness_score", 0)
    readiness_tier  = exec_sum.get("readiness_tier", "—")

    gauge_bytes = _build_gauge_image(readiness_score, "Readiness Score")
    gauge_img   = embed_image(gauge_bytes, w=6 * cm, h=4 * cm)

    summary_text = p(exec_sum.get("summary", ""), body)

    cover_table = Table(
        [[gauge_img, summary_text]],
        colWidths=[7 * cm, 10.8 * cm],
    )
    cover_table.setStyle(TableStyle([
        ("VALIGN",  (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (0, 0), C_LIGHT),
        ("ROUNDEDCORNERS", [10]),
    ]))
    story.append(cover_table)
    story.append(sp(10))

    story.append(p(f"<b>Readiness Tier:</b> <font color='{INDIGO}'>{readiness_tier}</font>", body))
    story.append(sp(4))

    # Strengths, Quick Wins, Critical Gaps in 3 columns
    strengths_col  = [p("<b>🟢 Strengths</b>", h3)] + [p(f"✓ {s}", good_s)   for s in exec_sum.get("strengths", [])]
    quickwins_col  = [p("<b>⚡ Quick Wins</b>", h3)] + [p(f"→ {q}", bullet_s) for q in exec_sum.get("quick_wins", [])]
    critgaps_col   = [p("<b>🔴 Critical Gaps</b>", h3)] + [p(f"✗ {g}", bad_s) for g in exec_sum.get("critical_gaps", [])]

    summary_cols = Table(
        [[strengths_col, quickwins_col, critgaps_col]],
        colWidths=[5.8 * cm, 5.8 * cm, 5.8 * cm],
    )
    summary_cols.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9ff")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_cols)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: JOB FIT ANALYSIS
    # ═══════════════════════════════════════════════════
    jfa = report.get("job_fit_analysis", {})
    if jfa:
        story.append(p("🎯 Job Fit Analysis", h2))
        story.append(hr())

        fit_score = jfa.get("fit_score", 0)
        fit_gauge = _build_gauge_image(fit_score, "Fit Score")
        fit_img   = embed_image(fit_gauge, w=5 * cm, h=3.5 * cm)
        fit_desc  = "\n".join([
            f"<b>Fit Score:</b> {score_badge(fit_score)}",
            f"<b>Difficulty Forecast:</b> {jfa.get('interview_difficulty_forecast', '—')}",
            f"<b>Compensation Estimate:</b> {jfa.get('compensation_estimate', '—')}",
            "",
            jfa.get("alignment_summary", ""),
        ])
        fit_row = Table([[fit_img, p(fit_desc, body)]], colWidths=[6 * cm, 11.4 * cm])
        fit_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("PADDING", (0, 0), (-1, -1), 6)]))
        story.append(fit_row)
        story.append(sp(8))

        mq = jfa.get("matching_qualifications", [])
        miq = jfa.get("missing_qualifications", [])
        if mq:
            story.append(p("<b>✅ Matching Qualifications</b>", h3))
            for q in mq:
                story.append(p(f"✓ {q}", good_s))
        if miq:
            story.append(p("<b>❌ Missing Qualifications</b>", h3))
            tbl_data = [["Skill/Qualification", "Gap Severity"]]
            for m in miq:
                sev = m.get("gap_severity", "medium")
                col = {"critical": "#dc2626", "high": "#d97706", "medium": "#3b82f6", "low": "#22c55e"}.get(sev, "#374151")
                tbl_data.append([m.get("skill", ""), f"<font color='{col}'><b>{sev.upper()}</b></font>"])
            fix_cols = [p(r[0], body) if isinstance(r[0], str) else r[0] for r in tbl_data[1:]]
            tbl_data = [tbl_data[0]] + [[Paragraph(str(r[0]), body), Paragraph(str(r[1]), body)] for r in tbl_data[1:]]
            story.append(simple_table(tbl_data, col_widths=[12 * cm, 5.4 * cm]))

        if jfa.get("competitor_comparisons"):
            story.append(sp(6))
            story.append(p(f"<b>📊 Market Comparison:</b> {jfa['competitor_comparisons']}", body))
        story.append(sp(10))

    # ═══════════════════════════════════════════════════
    # SECTION: SKILL GAP ANALYSIS
    # ═══════════════════════════════════════════════════
    sga = report.get("skill_gap_analysis", {})
    if sga:
        story.append(p("🔬 Skill Gap Analysis", h2))
        story.append(hr())

        strong = sga.get("strong_skills", [])
        if strong:
            story.append(p(f"<b>💪 Strong Skills:</b> {', '.join(strong)}", body))
            story.append(sp(4))

        skill_radar = sga.get("skill_radar", {})
        if skill_radar:
            radar_bytes = _build_radar_image(
                list(skill_radar.keys()),
                [float(v) for v in skill_radar.values()],
                "Skill Competency Radar"
            )
            story.append(embed_image(radar_bytes, w=11 * cm, h=9 * cm))
            story.append(sp(6))

        gaps = sga.get("gap_skills", [])
        if gaps:
            story.append(p("<b>⚠️ Skill Gaps to Close</b>", h3))
            tbl_data = [["Skill", "Importance", "~Hours to Learn", "Resource"]]
            for g in gaps:
                imp = g.get("importance", "medium")
                imp_col = {"high": RED, "medium": AMBER, "low": GREEN}.get(imp, BLUE)
                tbl_data.append([
                    Paragraph(g.get("skill", ""), body),
                    Paragraph(f"<font color='{imp_col}'><b>{imp.upper()}</b></font>", body),
                    Paragraph(str(g.get("estimated_hours_to_learn", "—")), body),
                    Paragraph(g.get("resource", "—"), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[5 * cm, 2.5 * cm, 2.5 * cm, 7.4 * cm]))

        story.append(sp(6))
        po = sga.get("priority_order", [])
        if po:
            story.append(p(f"<b>📋 Learning Priority Order:</b> {' → '.join(po)}", body))
        tc = sga.get("tech_stack_coverage_percent", None)
        if tc is not None:
            story.append(p(f"<b>Tech Stack Coverage:</b> {score_badge(tc, prefix='')}", body))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: RESUME ATS ANALYSIS
    # ═══════════════════════════════════════════════════
    ats = report.get("resume_ats_analysis", {})
    if ats:
        story.append(p("📄 Resume & ATS Analysis", h2))
        story.append(hr())

        ats_score    = ats.get("ats_score", 0)
        match_score  = ats.get("match_percent_for_role", 0)
        sec_scores   = ats.get("section_scores", {})

        scores_data = [
            ["ATS Score", ats_score],
            ["Role Match", match_score],
        ] + [[k, v] for k, v in sec_scores.items()]

        bar_bytes = _build_bar_image(
            [r[0] for r in scores_data],
            [float(r[1]) for r in scores_data],
            "Resume Section Scores"
        )
        story.append(embed_image(bar_bytes, w=13 * cm, h=5 * cm))
        story.append(sp(8))

        kw_gaps  = ats.get("keyword_gaps", [])
        kw_match = ats.get("keyword_matches", [])

        kw_row = Table(
            [[
                [p("<b>✅ Present Keywords</b>", h3)] + [p(f"• {k}", good_s) for k in kw_match],
                [p("<b>❌ Missing Keywords</b>", h3)] + [p(f"• {k}", bad_s)  for k in kw_gaps],
            ]],
            colWidths=[9 * cm, 8.4 * cm],
        )
        kw_row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(kw_row)
        story.append(sp(8))

        rewrites = ats.get("impact_rewrites", [])
        if rewrites:
            story.append(p("<b>✍️ Bullet Impact Rewrites</b>", h3))
            for rw in rewrites[:4]:
                story.append(p(f"<b>Before:</b> {rw.get('original', '')}", warn_s))
                story.append(p(f"<b>After:</b>  {rw.get('improved', '')}", good_s))
                if rw.get("why"):
                    story.append(p(f"<i>Why: {rw['why']}</i>", small_s))
                story.append(sp(4))

        fmt_tips = ats.get("formatting_tips", [])
        if fmt_tips:
            story.append(p("<b>📐 Formatting Tips</b>", h3))
            for t in fmt_tips:
                story.append(p(f"• {t}", bullet_s))

        li_tips = ats.get("linkedin_tips", [])
        if li_tips:
            story.append(p("<b>🔗 LinkedIn Optimization</b>", h3))
            for t in li_tips:
                story.append(p(f"• {t}", bullet_s))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: PREP PLAN (WEEK 1 + 2)
    # ═══════════════════════════════════════════════════
    for week_key, week_label in [("prep_plan_week1", "📅 Week 1 Prep Plan"), ("prep_plan_week2", "📅 Week 2 Prep Plan")]:
        week = report.get(week_key, {})
        if not week:
            continue
        story.append(p(week_label, h2))
        story.append(hr())
        story.append(p(f"<b>Theme:</b> {week.get('theme', '')}  ·  "
                       f"<b>Daily Commitment:</b> {week.get('time_commitment_daily_hours', '—')} hrs/day", body))
        story.append(sp(6))

        tbl_data = [["Day", "Topic", "Priority", "Hours", "Tasks"]]
        for day in week.get("daily_tasks", []):
            pri = day.get("priority", "medium")
            pri_col = {"critical": RED, "high": AMBER, "medium": BLUE, "low": GREEN}.get(pri, BLUE)
            tasks_text = "\n".join(f"• {t}" for t in day.get("tasks", []))
            tbl_data.append([
                Paragraph(day.get("day", ""), body),
                Paragraph(day.get("topic", ""), body),
                Paragraph(f"<font color='{pri_col}'><b>{pri.upper()}</b></font>", body),
                Paragraph(str(day.get("hours", "—")), center_s),
                Paragraph(tasks_text, small_s),
            ])
        story.append(simple_table(tbl_data, col_widths=[1.8 * cm, 3.5 * cm, 2 * cm, 1.5 * cm, 8.6 * cm]))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: DSA & SYSTEM DESIGN ROADMAP
    # ═══════════════════════════════════════════════════
    dsa = report.get("dsa_system_design_roadmap", {})
    if dsa:
        story.append(p("⚙️ DSA & System Design Roadmap", h2))
        story.append(hr())

        story.append(p(
            f"<b>DSA Readiness:</b> {dsa.get('overall_dsa_readiness', '—')}  ·  "
            f"<b>Est. Problems Solved:</b> {dsa.get('estimated_problems_solved', '—')}",
            body
        ))
        story.append(sp(6))

        dsa_topics = dsa.get("dsa_topics", [])
        if dsa_topics:
            story.append(p("<b>📌 DSA Topics</b>", h3))
            tbl_data = [["Topic", "Priority", "LeetCode Pattern", "Example Problems"]]
            for t in dsa_topics:
                pri = t.get("priority", "medium")
                pri_col = {"high": RED, "medium": AMBER, "low": GREEN}.get(pri, BLUE)
                tbl_data.append([
                    Paragraph(t.get("topic", ""), body),
                    Paragraph(f"<font color='{pri_col}'><b>{pri.upper()}</b></font>", body),
                    Paragraph(t.get("leetcode_pattern", ""), small_s),
                    Paragraph(", ".join(t.get("example_problems", [])[:2]), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[4 * cm, 2 * cm, 4 * cm, 7.4 * cm]))
            story.append(sp(8))

        sd_topics = dsa.get("system_design_topics", [])
        if sd_topics:
            story.append(p("<b>🏗️ System Design Topics</b>", h3))
            if isinstance(sd_topics[0], dict):
                tbl_data = [["Topic", "Level", "Key Concepts"]]
                for t in sd_topics:
                    tbl_data.append([
                        Paragraph(t.get("topic", ""), body),
                        Paragraph(t.get("level", ""), body),
                        Paragraph(", ".join(t.get("key_concepts", [])), small_s),
                    ])
                story.append(simple_table(tbl_data, col_widths=[5 * cm, 2 * cm, 10.4 * cm]))
            else:
                for t in sd_topics:
                    story.append(p(f"• {t}", bullet_s))
            story.append(sp(8))

        recs = dsa.get("recommended_problems", [])
        if recs:
            story.append(p("<b>🎯 Recommended Practice Problems</b>", h3))
            tbl_data = [["Problem", "Difficulty", "Pattern", "URL"]]
            for pr in recs[:8]:
                diff = pr.get("difficulty", "Medium")
                diff_col = {"Easy": GREEN, "Medium": AMBER, "Hard": RED}.get(diff, BLUE)
                tbl_data.append([
                    Paragraph(pr.get("title", ""), body),
                    Paragraph(f"<font color='{diff_col}'><b>{diff}</b></font>", body),
                    Paragraph(pr.get("pattern", ""), small_s),
                    Paragraph(pr.get("url", ""), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[5 * cm, 2 * cm, 4 * cm, 6.4 * cm]))

        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: BEHAVIORAL PREP
    # ═══════════════════════════════════════════════════
    beh = report.get("behavioral_prep", {})
    if beh:
        story.append(p("🧠 Behavioral Prep & STAR Stories", h2))
        story.append(hr())

        cult = beh.get("culture_fit_score", None)
        if cult is not None:
            story.append(p(f"<b>Culture Fit Score:</b> {score_badge(cult)}", body))
            story.append(sp(4))

        for si in beh.get("star_stories", [])[:3]:
            story.append(p(f"<b>❓ Question:</b> {si.get('question_fit', '—')}", h3))
            story.append(p(f"<b>S:</b> {si.get('situation', '')}", bullet_s))
            story.append(p(f"<b>T:</b> {si.get('task', '')}", bullet_s))
            story.append(p(f"<b>A:</b> {si.get('action', '')}", bullet_s))
            story.append(p(f"<b>R:</b> {si.get('result', '')}", bullet_s))
            if si.get("impact_metrics"):
                story.append(p(f"<i>📈 Impact: {si['impact_metrics']}</i>", good_s))
            story.append(sp(6))

        rf = beh.get("red_flags_to_avoid", [])
        if rf:
            story.append(p("<b>🚩 Red Flags to Avoid Showing</b>", h3))
            for flag in rf:
                story.append(p(f"✗ {flag}", bad_s))
        story.append(sp(6))
        for tip in beh.get("tips", []):
            story.append(p(f"→ {tip}", bullet_s))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: MOCK INTERVIEW STRATEGY
    # ═══════════════════════════════════════════════════
    mis = report.get("mock_interview_strategy", {})
    if mis:
        story.append(p("🎙️ Mock Interview Strategy", h2))
        story.append(hr())

        platforms = mis.get("recommended_platform_schedule", [])
        if platforms:
            tbl_data = [["Platform", "Focus", "Sessions/Week", "URL"]]
            for pl in platforms:
                tbl_data.append([
                    Paragraph(pl.get("platform", ""), body),
                    Paragraph(pl.get("focus", ""), body),
                    Paragraph(str(pl.get("sessions_per_week", "—")), center_s),
                    Paragraph(pl.get("url", ""), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[4 * cm, 5 * cm, 2.5 * cm, 6 * cm]))
            story.append(sp(8))

        eq = mis.get("expected_question_types", [])
        if eq:
            story.append(p("<b>📋 Expected Question Types</b>", h3))
            tbl_data = [["Type", "Frequency", "Tips"]]
            for q in eq:
                freq = q.get("frequency", "medium")
                freq_col = {"high": RED, "medium": AMBER, "low": GREEN}.get(freq, BLUE)
                tbl_data.append([
                    Paragraph(q.get("type", ""), body),
                    Paragraph(f"<font color='{freq_col}'><b>{freq.upper()}</b></font>", body),
                    Paragraph(q.get("tips", ""), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[3.5 * cm, 2.5 * cm, 11.4 * cm]))
            story.append(sp(8))

        company = mis.get("company_specific_insights", [])
        if company:
            story.append(p("<b>🏢 Company-Specific Insights</b>", h3))
            for c in company:
                story.append(p(f"<b>{c.get('company', '')}:</b> {c.get('interview_style', '')}", body))
                for area in c.get("key_focus_areas", []):
                    story.append(p(f"  → {area}", bullet_s))
                story.append(sp(4))

        tips = mis.get("time_management_tips", [])
        if tips:
            story.append(p("<b>⏱️ Time Management Tips</b>", h3))
            for t in tips:
                story.append(p(f"• {t}", bullet_s))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: MENTAL WELLNESS PLAN
    # ═══════════════════════════════════════════════════
    mwp = report.get("mental_wellness_plan", {})
    if mwp:
        story.append(p("💆 Mental Wellness & Motivation Plan", h2))
        story.append(hr())
        story.append(p(
            f"<b>Stress Level Forecast:</b> {mwp.get('stress_level_forecast', '—')}  ·  "
            f"<b>Burnout Risk:</b> {mwp.get('burnout_risk', '—')}  ·  "
            f"<b>Recommended Breaks/Day:</b> {mwp.get('recommended_breaks_per_day', '—')}",
            body
        ))
        story.append(sp(6))

        motivational = mwp.get("motivational_insight", "")
        if motivational:
            moto_table = Table(
                [[p(f'"{motivational}"', body)]],
                colWidths=[17.4 * cm],
            )
            moto_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e0e7ff")),
                ("PADDING", (0, 0), (-1, -1), 12),
                ("ROUNDEDCORNERS", [8]),
            ]))
            story.append(moto_table)
            story.append(sp(8))

        routine = mwp.get("daily_routine_tips", [])
        if routine:
            story.append(p("<b>🌅 Daily Routine Tips</b>", h3))
            for t in routine:
                story.append(p(f"• {t}", bullet_s))
            story.append(sp(6))

        exercises = mwp.get("confidence_building_exercises", [])
        if exercises:
            story.append(p("<b>💪 Confidence Building</b>", h3))
            for e in exercises:
                story.append(p(f"→ {e}", bullet_s))
        story.append(PageBreak())

    # ═══════════════════════════════════════════════════
    # SECTION: RESOURCE DIRECTORY
    # ═══════════════════════════════════════════════════
    rd = report.get("resource_directory", {})
    if rd:
        story.append(p("📚 Free Resource Directory", h2))
        story.append(hr())

        courses = rd.get("free_courses", [])
        if courses:
            story.append(p("<b>🎓 Free Courses</b>", h3))
            tbl_data = [["Course", "Platform", "Rating", "Hours", "URL"]]
            for c in courses:
                tbl_data.append([
                    Paragraph(c.get("name", ""), body),
                    Paragraph(c.get("platform", ""), body),
                    Paragraph(str(c.get("rating", "—")), center_s),
                    Paragraph(str(c.get("hours", "—")), center_s),
                    Paragraph(c.get("url", ""), small_s),
                ])
            story.append(simple_table(tbl_data, col_widths=[5 * cm, 2.5 * cm, 1.5 * cm, 1.5 * cm, 6.9 * cm]))
            story.append(sp(8))

        yt = rd.get("youtube_channels", [])
        if yt:
            story.append(p("<b>▶️ YouTube Channels</b>", h3))
            for y in yt:
                story.append(p(f"• <b>{y.get('name', '')}</b>  ({y.get('specialty', '')})  — {y.get('url', '')}", bullet_s))
            story.append(sp(6))

        platforms = rd.get("practice_platforms", [])
        if platforms:
            story.append(p("<b>🖥️ Practice Platforms</b>", h3))
            for pl in platforms:
                story.append(p(f"• <b>{pl.get('name', '')}</b> ({pl.get('focus', '')}) — {pl.get('url', '')}", bullet_s))
            story.append(sp(6))

        books = rd.get("books", [])
        if books:
            story.append(p("<b>📖 Books</b>", h3))
            for b in books:
                free = f" [Free: {b['free_url']}]" if b.get("free_url") else ""
                story.append(p(f"• <b>{b.get('title', '')}</b> by {b.get('author', '')} — Best for: {b.get('best_for', '')}{free}", bullet_s))
            story.append(sp(6))

        communities = rd.get("communities", [])
        if communities:
            story.append(p("<b>🤝 Communities</b>", h3))
            for c in communities:
                story.append(p(f"• [{c.get('type', '')}] <b>{c.get('name', '')}</b> — {c.get('url', '')}", bullet_s))

    # Footer
    story.append(sp(14))
    story.append(hr(colors.HexColor("#e5e7eb")))
    story.append(p(
        f"Generated by <b>Quantum Arena AI Platform</b> · Candidate: <b>{candidate_name}</b> · "
        f"Role: <b>{job_role}</b> · This report is AI-generated. Use as a guide, not a guarantee.",
        small_s
    ))

    doc.build(story)
    return buffer.getvalue()

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
from matplotlib import pyplot as plt
import numpy as np

from sqlalchemy.orm import Session

from applications.models import Application
from assessment.models import Assessment
from authentication.database import SessionLocal
from reports.models import CandidateReport

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
REPORTS_DIR = Path("backend/generated_reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Premium HTML Template ────────────────────────────────────────────────────
REPORT_TEMPLATE = Template(
    """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Arial', sans-serif;
        color: #1a1a2e;
        font-size: 11px;
        background: #f8f9ff;
      }

      /* ── COVER ── */
      .cover {
        background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        color: white;
        padding: 48px 40px 40px;
        min-height: 260px;
        position: relative;
      }
      .cover-badge {
        display: inline-block;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 20px;
        padding: 4px 14px;
        font-size: 9px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #c9b8ff;
        margin-bottom: 16px;
      }
      .cover h1 {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin-bottom: 6px;
        color: #ffffff;
      }
      .cover-sub { font-size: 12px; color: #a8b4ff; margin-bottom: 24px; }
      .cover-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 16px;
        border-top: 1px solid rgba(255,255,255,0.15);
        padding-top: 20px;
      }
      .cover-meta-item .clabel {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #8892d4;
        margin-bottom: 4px;
      }
      .cover-meta-item .cvalue {
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
      }
      .rec-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .rec-hire { background: #22c55e; color: white; }
      .rec-strong { background: #3b82f6; color: white; }
      .rec-maybe { background: #f59e0b; color: white; }
      .rec-reject { background: #ef4444; color: white; }
      .rec-neutral { background: #8b5cf6; color: white; }

      /* ── CONTENT WRAPPER ── */
      .content { padding: 24px 30px; }
      .page-break { page-break-before: always; padding-top: 24px; }

      /* ── SECTION HEADERS ── */
      .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .section-icon {
        width: 28px; height: 28px;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      .icon-blue { background: #dbeafe; }
      .icon-purple { background: #ede9fe; }
      .icon-green { background: #dcfce7; }
      .icon-amber { background: #fef3c7; }
      .icon-red { background: #fee2e2; }
      .icon-indigo { background: #e0e7ff; }
      .section-title {
        font-size: 15px;
        font-weight: 700;
        color: #1e1b4b;
        letter-spacing: -0.2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, #6366f1, transparent);
        margin-bottom: 16px;
        border-radius: 2px;
      }

      /* ── CARDS ── */
      .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 14px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      }
      .card-title {
        font-weight: 700;
        font-size: 11px;
        color: #374151;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      /* ── GRIDS ── */
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }

      /* ── SCORE BOXES ── */
      .score-box {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 14px;
        text-align: center;
      }
      .score-number {
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 2px;
      }
      .score-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #6b7280;
      }
      .score-blue { color: #3b82f6; }
      .score-green { color: #22c55e; }
      .score-amber { color: #f59e0b; }
      .score-purple { color: #8b5cf6; }
      .score-red { color: #ef4444; }
      .score-indigo { color: #6366f1; }

      /* ── PROGRESS BARS ── */
      .progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .progress-label { width: 110px; font-size: 10px; color: #374151; flex-shrink: 0; }
      .progress-bar-bg {
        flex: 1;
        height: 7px;
        background: #f3f4f6;
        border-radius: 10px;
        overflow: hidden;
      }
      .progress-bar-fill {
        height: 100%;
        border-radius: 10px;
      }
      .progress-value { width: 30px; text-align: right; font-size: 10px; font-weight: 700; }

      /* ── TAGS ── */
      .tag {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 20px;
        font-size: 9px;
        font-weight: 600;
        margin: 2px;
      }
      .tag-blue { background: #dbeafe; color: #1d4ed8; }
      .tag-green { background: #dcfce7; color: #15803d; }
      .tag-red { background: #fee2e2; color: #dc2626; }
      .tag-amber { background: #fef3c7; color: #92400e; }
      .tag-purple { background: #ede9fe; color: #6d28d9; }
      .tag-gray { background: #f3f4f6; color: #4b5563; }

      /* ── ALERT BOXES ── */
      .alert {
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 10px;
        border-left: 4px solid;
      }
      .alert-green { background: #f0fdf4; border-color: #22c55e; }
      .alert-red { background: #fef2f2; border-color: #ef4444; }
      .alert-amber { background: #fffbeb; border-color: #f59e0b; }
      .alert-blue { background: #eff6ff; border-color: #3b82f6; }
      .alert-title { font-weight: 700; font-size: 10px; margin-bottom: 4px; }

      /* ── TABLES ── */
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-size: 10px; }
      th { background: #f9fafb; font-weight: 700; color: #374151; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
      tr:nth-child(even) td { background: #f9fafb; }

      /* ── LISTS ── */
      .item-list { list-style: none; }
      .item-list li { padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 10px; color: #374151; }
      .item-list li:last-child { border-bottom: none; }
      .item-list li::before { content: "▸ "; color: #6366f1; font-size: 9px; }

      /* ── TRANSCRIPT EXCERPTS ── */
      .transcript-item {
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 8px;
        font-size: 9.5px;
      }
      .transcript-ai { background: #eff6ff; border-left: 3px solid #3b82f6; }
      .transcript-candidate { background: #f0fdf4; border-left: 3px solid #22c55e; }
      .transcript-role { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 3px; }

      /* ── VIOLATION FLAGS ── */
      .violation-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        margin-bottom: 6px;
        font-size: 9.5px;
      }
      .violation-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #f97316;
        margin-top: 2px;
        flex-shrink: 0;
      }

      img { max-width: 100%; border-radius: 10px; }
      .muted { color: #9ca3af; font-size: 9.5px; }
    </style>
  </head>
  <body>
    <!-- ══ COVER SECTION ══════════════════════════════════════════════════════ -->
    <div class="cover">
      <div class="cover-badge">🤖 AI-Generated Evaluation · Quantum Arena Platform</div>
      <h1>Candidate Evaluation Report</h1>
      <div class="cover-sub">Comprehensive AI-Powered Hiring Intelligence Report</div>

      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <div class="clabel">Candidate</div>
          <div class="cvalue">{{ candidate_name }}</div>
        </div>
        <div class="cover-meta-item">
          <div class="clabel">Applied Role</div>
          <div class="cvalue">{{ job_title }}</div>
        </div>
        <div class="cover-meta-item">
          <div class="clabel">Application ID</div>
          <div class="cvalue">#{{ application_id }}</div>
        </div>
        <div class="cover-meta-item">
          <div class="clabel">Final Recommendation</div>
          <div class="cvalue">
            {% set rec = final_recommendation | lower %}
            {% if "strong" in rec %}
              <span class="rec-badge rec-strong">{{ final_recommendation }}</span>
            {% elif "hire" in rec %}
              <span class="rec-badge rec-hire">{{ final_recommendation }}</span>
            {% elif "maybe" in rec or "consider" in rec or "conditional" in rec %}
              <span class="rec-badge rec-maybe">{{ final_recommendation }}</span>
            {% elif "reject" in rec or "no hire" in rec %}
              <span class="rec-badge rec-reject">{{ final_recommendation }}</span>
            {% else %}
              <span class="rec-badge rec-neutral">{{ final_recommendation }}</span>
            {% endif %}
          </div>
        </div>
      </div>
    </div>

    <!-- ══ PAGE 1: EXECUTIVE OVERVIEW ════════════════════════════════════════ -->
    <div class="content">

      <!-- Score Summary Strip -->
      <div class="grid-4" style="margin-bottom: 16px; margin-top: 10px;">
        <div class="score-box">
          <div class="score-number score-blue">{{ assessment_score }}</div>
          <div class="score-label">Assessment Score</div>
        </div>
        <div class="score-box">
          <div class="score-number score-green">{{ accuracy_percent }}%</div>
          <div class="score-label">MCQ Accuracy</div>
        </div>
        <div class="score-box">
          <div class="score-number score-purple">{{ hiring_confidence_score | default('—') }}</div>
          <div class="score-label">Hiring Confidence</div>
        </div>
        <div class="score-box">
          <div class="score-number score-amber">{{ risk_level | default('Medium') }}</div>
          <div class="score-label" style="font-size:8px;">Risk Level</div>
        </div>
      </div>

      <!-- Candidate Summary -->
      <div class="card">
        <div class="card-title">📋 Executive Candidate Summary</div>
        <p style="color:#374151; line-height:1.7; font-size:10.5px;">{{ candidate_summary }}</p>
        <div style="margin-top: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span class="muted">Key Signals:</span>
          {% for signal in key_signals | default([]) %}
            <span class="tag tag-blue">{{ signal }}</span>
          {% endfor %}
        </div>
      </div>

      <!-- Competency Breakdown -->
      <div class="card">
        <div class="card-title">🎯 Competency Breakdown</div>
        {% for comp in competency_scores | default([]) %}
          <div class="progress-row">
            <div class="progress-label">{{ comp.name }}</div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill"
                   style="width: {{ comp.score }}%;
                          background: {% if comp.score >= 80 %}#22c55e{% elif comp.score >= 60 %}#3b82f6{% elif comp.score >= 40 %}#f59e0b{% else %}#ef4444{% endif %};">
              </div>
            </div>
            <div class="progress-value">{{ comp.score }}</div>
          </div>
        {% else %}
          <p class="muted">Competency data not available.</p>
        {% endfor %}
      </div>

      <!-- Risk & Growth -->
      <div class="grid-2">
        <div class="card">
          <div class="card-title">⚠️ Risk Flags</div>
          {% for flag in risk_flags | default([]) %}
            <div class="alert alert-amber">
              <div class="alert-title">{{ flag.category | default('Flag') }}</div>
              <div>{{ flag.detail }}</div>
            </div>
          {% else %}
            <div class="alert alert-green"><div class="alert-title">✅ No significant risk flags detected.</div></div>
          {% endfor %}
        </div>
        <div class="card">
          <div class="card-title">🚀 Growth Potential</div>
          <p style="font-size:10.5px; color:#374151; line-height:1.6; margin-bottom:8px;">{{ growth_potential | default('Not assessed.') }}</p>
          <div>
            {% for trait in growth_traits | default([]) %}
              <span class="tag tag-purple">{{ trait }}</span>
            {% endfor %}
          </div>
        </div>
      </div>

    </div>

    <!-- ══ PAGE 2: ASSESSMENT DEEP-DIVE ═════════════════════════════════════ -->
    <div class="content page-break">
      <div class="section-header">
        <div class="section-icon icon-blue">📊</div>
        <div class="section-title">Assessment Deep-Dive Analysis</div>
      </div>
      <div class="section-divider"></div>

      <div class="grid-3" style="margin-bottom: 14px;">
        <div class="score-box">
          <div class="score-number score-blue">{{ assessment_score }} <span style="font-size:12px; font-weight:400; color:#9ca3af;">/ 100</span></div>
          <div class="score-label">Total Score</div>
        </div>
        <div class="score-box">
          <div class="score-number score-green">{{ accuracy_percent }}%</div>
          <div class="score-label">MCQ Accuracy</div>
        </div>
        <div class="score-box">
          <div class="score-number score-amber">{{ assessment_duration_minutes }} min</div>
          <div class="score-label">Duration</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Section Score Comparison</div>
        <img src="data:image/png;base64,{{ charts.section_scores }}" alt="Section Scores" />
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">MCQ Accuracy Distribution</div>
          <img src="data:image/png;base64,{{ charts.accuracy }}" alt="Accuracy" />
        </div>
        <div class="card">
          <div class="card-title">Time Spent Per Section</div>
          <img src="data:image/png;base64,{{ charts.timeline }}" alt="Timeline" />
        </div>
      </div>

      <div class="card">
        <div class="card-title">🛑 Proctoring Violations ({{ assessment_violation_count }} total)</div>
        {% if assessment_violations %}
          {% for v in assessment_violations %}
            <div class="violation-item">
              <div class="violation-dot"></div>
              <div><strong>{{ v.type | default(v.get('event', 'Violation')) }}</strong>
                {% if v.timestamp %}· {{ v.timestamp }}{% endif %}
                {% if v.detail or v.description %}
                  <br><span class="muted">{{ v.detail or v.description }}</span>
                {% endif %}
              </div>
            </div>
          {% endfor %}
        {% else %}
          <div class="alert alert-green"><div class="alert-title">✅ No violations recorded during assessment.</div></div>
        {% endif %}
      </div>

      <!-- Performance Commentary -->
      <div class="card">
        <div class="card-title">📝 Assessment Performance Commentary</div>
        <p style="font-size:10.5px; line-height:1.7; color:#374151;">{{ assessment_commentary | default(interview_summary) }}</p>
      </div>
    </div>

    <!-- ══ PAGE 3: AI INTERVIEW ANALYSIS ════════════════════════════════════ -->
    <div class="content page-break">
      <div class="section-header">
        <div class="section-icon icon-purple">🤖</div>
        <div class="section-title">AI Interview Analysis</div>
      </div>
      <div class="section-divider"></div>

      <div class="grid-4" style="margin-bottom: 14px;">
        <div class="score-box">
          <div class="score-number score-indigo">{{ interview_duration_minutes }} min</div>
          <div class="score-label">Duration</div>
        </div>
        <div class="score-box">
          <div class="score-number score-blue">{{ response_count }}</div>
          <div class="score-label">Responses</div>
        </div>
        <div class="score-box">
          <div class="score-number score-purple">{{ interview_violation_count }}</div>
          <div class="score-label">Violations</div>
        </div>
        <div class="score-box">
          <div class="score-number" style="font-size:14px; {% if ai_interview_status == 'completed' %}color: #22c55e;{% else %}color: #f59e0b;{% endif %}">
            {{ ai_interview_status | title }}
          </div>
          <div class="score-label">Status</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">💬 Interview Evaluation Summary</div>
        <p style="font-size:10.5px; line-height:1.7; color:#374151;">{{ interview_summary }}</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">Skill Ratings Radar</div>
          <img src="data:image/png;base64,{{ charts.skill_ratings }}" alt="Skill Ratings" />
        </div>
        <div class="card">
          <div class="card-title">Topic Coverage</div>
          <img src="data:image/png;base64,{{ charts.topic_coverage }}" alt="Topic Coverage" />
        </div>
      </div>

      <!-- Communication Quality -->
      <div class="card">
        <div class="card-title">🗣️ Communication Quality Assessment</div>
        <p style="font-size:10.5px; line-height:1.7; color:#374151;">{{ communication_quality | default('Communication quality was assessed during the AI interview session.') }}</p>
        <div style="margin-top: 8px;">
          <span class="muted">Detected traits: </span>
          {% for trait in communication_traits | default([]) %}
            <span class="tag tag-blue">{{ trait }}</span>
          {% endfor %}
        </div>
      </div>

      <!-- Interview Transcript Excerpts -->
      {% if interview_transcript_excerpts %}
      <div class="card">
        <div class="card-title">📄 Key Interview Transcript Excerpts</div>
        {% for item in interview_transcript_excerpts %}
          {% if item.speaker == "ai" or item.speaker == "interviewer" %}
            <div class="transcript-item transcript-ai">
              <div class="transcript-role">🤖 AI Interviewer</div>
              <div>{{ item.text | default(item.content, '') | truncate(200) }}</div>
            </div>
          {% elif item.speaker == "candidate" or item.speaker == "user" %}
            <div class="transcript-item transcript-candidate">
              <div class="transcript-role">👤 Candidate</div>
              <div>{{ item.text | default(item.content, '') | truncate(200) }}</div>
            </div>
          {% endif %}
        {% endfor %}
      </div>
      {% endif %}
    </div>

    <!-- ══ PAGE 4: STRENGTHS, GAPS & FINAL VERDICT ══════════════════════════ -->
    <div class="content page-break">
      <div class="section-header">
        <div class="section-icon icon-green">✅</div>
        <div class="section-title">Strengths, Gaps &amp; Final Hiring Verdict</div>
      </div>
      <div class="section-divider"></div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title" style="color: #15803d;">💪 Core Strengths</div>
          <ul class="item-list">
            {% for item in strengths %}
              <li>{{ item }}</li>
            {% else %}
              <li>No specific strengths recorded.</li>
            {% endfor %}
          </ul>
        </div>
        <div class="card">
          <div class="card-title" style="color: #dc2626;">🔻 Areas for Improvement</div>
          <ul class="item-list">
            {% for item in weaknesses %}
              <li>{{ item }}</li>
            {% else %}
              <li>No significant gaps identified.</li>
            {% endfor %}
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🧠 Behavioral &amp; Soft Skill Observations</div>
        <ul class="item-list">
          {% for item in behavioral_observations %}
            <li>{{ item }}</li>
          {% else %}
            <li>Behavioral data was not collected or is inconclusive.</li>
          {% endfor %}
        </ul>
      </div>

      <!-- Hiring Recommendation Verdict Box -->
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 14px; padding: 24px; color: white; margin-bottom: 14px;">
        <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #a5b4fc; margin-bottom: 8px;">Final Hiring Recommendation</div>
        <div style="font-size: 22px; font-weight: 800; margin-bottom: 10px;">{{ final_recommendation }}</div>
        <p style="font-size: 10.5px; color: #c7d2fe; line-height: 1.6;">{{ hiring_rationale | default(candidate_summary) }}</p>
      </div>

      <!-- Competency Radar Chart -->
      <div class="card">
        <div class="card-title">🎯 Full Competency Profile</div>
        <img src="data:image/png;base64,{{ charts.competency_radar }}" alt="Competency Radar" />
      </div>

      <!-- Red Flags -->
      {% if red_flags %}
      <div class="card">
        <div class="card-title" style="color: #dc2626;">🚩 Red Flags &amp; HR Notes</div>
        {% for flag in red_flags %}
          <div class="alert alert-red">
            <div class="alert-title">{{ flag.category | default('Red Flag') }}</div>
            <div>{{ flag.detail }}</div>
          </div>
        {% endfor %}
      </div>
      {% endif %}

      <!-- Suggested Next Steps -->
      <div class="card">
        <div class="card-title">🔜 Suggested Next Steps</div>
        <ul class="item-list">
          {% for step in next_steps | default([]) %}
            <li>{{ step }}</li>
          {% else %}
            <li>Proceed with standard HR review process.</li>
            <li>Conduct reference checks before final offer.</li>
          {% endfor %}
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 14px;">
        Generated by <strong>Quantum Arena AI Platform</strong> · Report ID #{{ application_id }} ·
        This report is AI-generated and should be reviewed by a qualified HR professional.
      </div>
    </div>
  </body>
</html>
"""
)


# ─── Chart Helpers ────────────────────────────────────────────────────────────

plt.rcParams.update({
    "font.family": "sans-serif",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.linestyle": "--",
})


def _fig_to_base64() -> str:
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight", dpi=180)
    plt.close()
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _build_bar_chart(labels: List[str], values: List[float], title: str) -> str:
    fig, ax = plt.subplots(figsize=(6.5, 3.3))
    colors = ["#6366f1", "#3b82f6", "#8b5cf6"] * ((len(labels) // 3) + 1)
    bars = ax.bar(labels, values, color=colors[: len(labels)], width=0.55, zorder=2)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                f"{val:.0f}", ha="center", va="bottom", fontsize=8, fontweight="bold", color="#1e1b4b")
    ax.set_ylim(0, max(max(values, default=1) * 1.2, 100))
    ax.set_title(title, fontsize=10, fontweight="bold", color="#1e1b4b", pad=10)
    ax.set_ylabel("Score", fontsize=8, color="#6b7280")
    ax.tick_params(axis="x", labelsize=8)
    ax.tick_params(axis="y", labelsize=8)
    fig.patch.set_facecolor("#f8f9ff")
    ax.set_facecolor("#f8f9ff")
    return _fig_to_base64()


def _build_pie_chart(values: List[float], labels: List[str], title: str) -> str:
    fig, ax = plt.subplots(figsize=(5, 4))
    wedge_colors = ["#6366f1", "#e5e7eb"]
    if len(values) == 1:
        wedge_colors = ["#6b7280"]
    wedges, texts, autotexts = ax.pie(
        values, labels=labels, autopct="%1.1f%%",
        colors=wedge_colors[: len(values)],
        startangle=90, pctdistance=0.82,
        wedgeprops={"edgecolor": "white", "linewidth": 2},
    )
    for at in autotexts:
        at.set_fontsize(8)
        at.set_fontweight("bold")
    ax.set_title(title, fontsize=10, fontweight="bold", color="#1e1b4b", pad=10)
    fig.patch.set_facecolor("#f8f9ff")
    return _fig_to_base64()


def _build_timeline_chart(labels: List[str], values: List[float], title: str) -> str:
    fig, ax = plt.subplots(figsize=(6.5, 3.2))
    x = range(len(labels))
    ax.plot(list(x), values, marker="o", color="#6366f1", linewidth=2.5, markersize=7, zorder=3)
    ax.fill_between(list(x), values, alpha=0.15, color="#6366f1")
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, fontsize=8)
    ax.set_title(title, fontsize=10, fontweight="bold", color="#1e1b4b", pad=10)
    ax.set_ylabel("Minutes", fontsize=8, color="#6b7280")
    fig.patch.set_facecolor("#f8f9ff")
    ax.set_facecolor("#f8f9ff")
    return _fig_to_base64()


def _build_radar_chart(categories: List[str], values: List[float], title: str) -> str:
    N = len(categories)
    if N < 3:
        return _build_bar_chart(categories, values, title)

    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]
    norm_values = [min(v, 100) / 100 for v in values]
    norm_values += norm_values[:1]

    fig, ax = plt.subplots(figsize=(5.5, 5), subplot_kw=dict(polar=True))
    ax.plot(angles, norm_values, "o-", linewidth=2.5, color="#6366f1")
    ax.fill(angles, norm_values, alpha=0.25, color="#6366f1")
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, size=8)
    ax.set_ylim(0, 1)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["25", "50", "75", "100"], size=7, color="#9ca3af")
    ax.set_title(title, size=10, fontweight="bold", color="#1e1b4b", pad=16)
    ax.spines["polar"].set_visible(False)
    ax.grid(color="#e5e7eb", linestyle="--", alpha=0.6)
    fig.patch.set_facecolor("#f8f9ff")
    return _fig_to_base64()


def _build_horizontal_bar(labels: List[str], values: List[float], title: str) -> str:
    fig, ax = plt.subplots(figsize=(6.5, max(2.5, len(labels) * 0.42)))
    colors = ["#22c55e" if v >= 75 else "#3b82f6" if v >= 55 else "#f59e0b" if v >= 35 else "#ef4444" for v in values]
    y_pos = range(len(labels))
    bars = ax.barh(list(y_pos), values, color=colors, height=0.55, zorder=2)
    for bar, val in zip(bars, values):
        ax.text(min(val + 2, 98), bar.get_y() + bar.get_height() / 2,
                f"{val:.0f}", va="center", ha="left", fontsize=8, fontweight="bold", color="#1e1b4b")
    ax.set_yticks(list(y_pos))
    ax.set_yticklabels(labels, fontsize=8)
    ax.set_xlim(0, 110)
    ax.set_title(title, fontsize=10, fontweight="bold", color="#1e1b4b", pad=10)
    ax.set_xlabel("Score / 100", fontsize=8, color="#6b7280")
    fig.patch.set_facecolor("#f8f9ff")
    ax.set_facecolor("#f8f9ff")
    plt.tight_layout()
    return _fig_to_base64()


# ─── Safe JSON ────────────────────────────────────────────────────────────────

def _safe_json_load(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


# ─── LLM Summary with Rich Analysis ──────────────────────────────────────────

def _generate_llm_summary(context: Dict[str, Any]) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return {
            "candidate_summary": "Assessment and interview data were consolidated into an evaluation report.",
            "interview_summary": "Interview data captured from the AI session and transcript.",
            "assessment_commentary": "The candidate completed the assessment within the allotted time.",
            "strengths": ["Demonstrated progression through the evaluation stages."],
            "weaknesses": ["Further manual review recommended for nuanced judgment."],
            "behavioral_observations": ["See transcript and analytics for detailed evidence."],
            "final_recommendation": "Neutral",
            "hiring_rationale": "Based on available data, a neutral recommendation is provided pending further review.",
            "hiring_confidence_score": 50,
            "risk_level": "Medium",
            "risk_flags": [],
            "red_flags": [],
            "growth_potential": "Cannot be assessed without a full interview transcript.",
            "growth_traits": [],
            "communication_quality": "Communication quality was not fully evaluated.",
            "communication_traits": [],
            "competency_scores": [
                {"name": "Technical Depth", "score": 60},
                {"name": "Communication", "score": 60},
                {"name": "Problem Solving", "score": 60},
                {"name": "Confidence", "score": 60},
            ],
            "key_signals": ["Data pending"],
            "next_steps": ["Review manually with HR team."],
        }

    prompt = f"""You are an elite hiring intelligence analyst at a top-tier tech company.
Given the candidate's assessment results, interview session data, and transcript, produce a RICH, INSIGHTFUL evaluation.

Return ONLY a valid JSON object with EXACTLY these keys (no extras, no markdown):

{{
  "candidate_summary": "<3-5 sentence executive narrative covering technical aptitude, communication style, and overall impression>",
  "interview_summary": "<3-4 sentence evaluation of their interview performance including depth of answers, confidence, and key moments>",
  "assessment_commentary": "<2-3 sentence analysis of assessment performance pattern - time management, accuracy, section differences>",
  "strengths": ["<specific strength with evidence>", ...],  // 4-6 items, specific & evidenced
  "weaknesses": ["<specific gap with context>", ...],       // 3-5 items
  "behavioral_observations": ["<observation>", ...],        // 4-6 behavioral/soft-skill notes
  "final_recommendation": "<Strong Hire | Hire | Conditional Hire | No Hire | Requires Further Review>",
  "hiring_rationale": "<3-4 sentence rationale that directly links evidence to the recommendation>",
  "hiring_confidence_score": <integer 0-100, how confident are you in this recommendation>,
  "risk_level": "<Low | Medium | High>",
  "risk_flags": [
    {{"category": "<Integrity|Technical|Communication|Engagement>", "detail": "<specific concern>"}}
  ],
  "red_flags": [
    {{"category": "<Integrity|Background|Technical|Behavioral>", "detail": "<serious concern>"}}
  ],
  "growth_potential": "<2-3 sentences on long-term growth potential and learning trajectory>",
  "growth_traits": ["<trait>", ...],  // 3-5 positive growth indicators
  "communication_quality": "<2-3 sentences evaluating clarity, structure, vocabulary, and listening during interview>",
  "communication_traits": ["<trait>", ...],  // 3-5 communication traits observed
  "competency_scores": [
    {{"name": "Technical Depth", "score": <0-100>}},
    {{"name": "Communication", "score": <0-100>}},
    {{"name": "Problem Solving", "score": <0-100>}},
    {{"name": "Confidence", "score": <0-100>}},
    {{"name": "Analytical Thinking", "score": <0-100>}},
    {{"name": "Cultural Fit", "score": <0-100>}},
    {{"name": "Adaptability", "score": <0-100>}}
  ],
  "key_signals": ["<signal>", ...],  // 4-6 short bullet signals (e.g. "Strong DSA", "Hesitant under pressure")
  "next_steps": ["<step>", ...]      // 3-5 concrete next steps for HR
}}

CANDIDATE CONTEXT:
{json.dumps(context, default=str, indent=2)}
"""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an elite hiring intelligence analyst. "
                    "You produce deeply insightful, evidence-based candidate evaluations. "
                    "Return valid JSON only — no markdown, no explanation."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=3000,
    )
    raw = response.choices[0].message.content.strip()
    return _safe_json_load(raw)


# ─── Build Report Context ─────────────────────────────────────────────────────

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
        v for v in assessment_data.get("violations", [])
        if v.get("stage") == "assessment"
    ]
    interview_violations = [
        v for v in interview_feedback.get("violations", [])
        if v.get("stage") == "interview"
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
        {
            "MCQ": max(1, int(assessment_duration_minutes * 0.4)) if assessment_duration_minutes else 20,
            "Coding": max(1, int(assessment_duration_minutes * 0.6)) if assessment_duration_minutes else 40,
        },
    )

    # Build rich LLM context
    llm_context = {
        "candidate_name": application.user.name if application.user else "Candidate",
        "job_title": application.job.title if application.job else f"Job #{application.job_id}",
        "application_id": application.id,
        "assessment_score": total_score,
        "assessment_breakdown": {
            "mcq": mcq_score,
            "coding": coding_score,
            "accuracy_percent": accuracy_percent,
            "duration_minutes": assessment_duration_minutes,
            "total_mcq": total_mcq,
            "correct_answers": correct_answers,
        },
        "assessment_violations": assessment_violations,
        "interview_status": interview_feedback.get("ai_interview_status", "completed"),
        "interview_duration_minutes": interview_duration_minutes,
        "interview_response_count": len([x for x in transcript if x.get("speaker") == "candidate"]),
        "interview_violation_count": len(interview_violations),
        "skill_ratings": skill_ratings,
        "topic_coverage": topic_coverage,
        "interview_feedback_blob": interview_feedback,
        "transcript_excerpt": transcript[:15],
    }
    llm_summary = stored_llm_summary or _generate_llm_summary(llm_context)

    # Competency radar data
    competency_scores = llm_summary.get("competency_scores", [
        {"name": k, "score": float(v)} for k, v in skill_ratings.items()
    ])
    competency_labels = [c["name"] for c in competency_scores]
    competency_values = [float(c["score"]) for c in competency_scores]

    charts = {
        "section_scores": _build_bar_chart(
            ["MCQ", "Coding", "Total"], [mcq_score, coding_score, total_score],
            "Assessment Section Scores"
        ),
        "accuracy": _build_pie_chart(
            [correct_answers, max(total_mcq - correct_answers, 0)] if total_mcq else [1],
            ["Correct", "Incorrect"] if total_mcq else ["No MCQ Data"],
            "MCQ Accuracy Distribution",
        ),
        "timeline": _build_timeline_chart(
            list(section_times.keys()), list(section_times.values()),
            "Time Spent Per Section (min)"
        ),
        "skill_ratings": _build_horizontal_bar(
            list(skill_ratings.keys()), [float(v) for v in skill_ratings.values()],
            "AI Interview Skill Ratings"
        ),
        "topic_coverage": _build_bar_chart(
            list(topic_coverage.keys()), [float(v) for v in topic_coverage.values()],
            "Interview Topic Coverage"
        ),
        "competency_radar": _build_radar_chart(
            competency_labels, competency_values,
            "Competency Profile Radar"
        ),
    }

    # Pick a few transcript excerpts to embed
    transcript_excerpts = [
        item for item in transcript[:10]
        if item.get("text") or item.get("content")
    ]

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
            "accuracy_percent": accuracy_percent,
            "assessment_duration_minutes": assessment_duration_minutes,
            "assessment_violation_count": len(assessment_violations),
            "assessment_violations": assessment_violations[:8],
            "interview_duration_minutes": interview_duration_minutes,
            "response_count": len([x for x in transcript if x.get("speaker") == "candidate"]),
            "ai_interview_status": interview_feedback.get("ai_interview_status", "completed"),
            "interview_violation_count": len(interview_violations),
            # LLM-generated rich fields
            "interview_summary": llm_summary.get("interview_summary", "Interview summary unavailable."),
            "candidate_summary": llm_summary.get("candidate_summary", "Candidate summary unavailable."),
            "assessment_commentary": llm_summary.get("assessment_commentary", ""),
            "final_recommendation": llm_summary.get("final_recommendation", "Neutral"),
            "hiring_rationale": llm_summary.get("hiring_rationale", ""),
            "hiring_confidence_score": llm_summary.get("hiring_confidence_score", "—"),
            "risk_level": llm_summary.get("risk_level", "Medium"),
            "risk_flags": llm_summary.get("risk_flags", []),
            "red_flags": llm_summary.get("red_flags", []),
            "growth_potential": llm_summary.get("growth_potential", ""),
            "growth_traits": llm_summary.get("growth_traits", []),
            "communication_quality": llm_summary.get("communication_quality", ""),
            "communication_traits": llm_summary.get("communication_traits", []),
            "competency_scores": competency_scores,
            "key_signals": llm_summary.get("key_signals", []),
            "next_steps": llm_summary.get("next_steps", []),
            "strengths": llm_summary.get("strengths", []),
            "weaknesses": llm_summary.get("weaknesses", []),
            "behavioral_observations": llm_summary.get("behavioral_observations", []),
            "interview_transcript_excerpts": transcript_excerpts,
            "charts": charts,
        },
    }


# ─── Public API: Build API response payload ───────────────────────────────────

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
                if render_context["assessment_duration_minutes"] else 20,
                "Coding": max(1, int(render_context["assessment_duration_minutes"] * 0.6))
                if render_context["assessment_duration_minutes"] else 40,
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
            "commentary": llm_summary.get("assessment_commentary", ""),
        },
        "interview": {
            "score": round(float(application.interview_score or 0), 1),
            "duration_minutes": int(render_context["interview_duration_minutes"] or 0),
            "status": str(render_context["ai_interview_status"]),
            "violation_count": render_context["interview_violation_count"],
            "violations": [
                v for v in interview_feedback.get("violations", [])
                if v.get("stage") == "interview"
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
            "communication_quality": llm_summary.get("communication_quality", ""),
            "communication_traits": llm_summary.get("communication_traits", []),
        },
        "analysis": {
            "competency_scores": llm_summary.get("competency_scores", []),
            "key_signals": llm_summary.get("key_signals", []),
            "risk_level": llm_summary.get("risk_level", "Medium"),
            "risk_flags": llm_summary.get("risk_flags", []),
            "red_flags": llm_summary.get("red_flags", []),
            "growth_potential": llm_summary.get("growth_potential", ""),
            "growth_traits": llm_summary.get("growth_traits", []),
            "hiring_confidence_score": llm_summary.get("hiring_confidence_score", 50),
        },
        "strengths": list(llm_summary.get("strengths", [])),
        "weaknesses": list(llm_summary.get("weaknesses", [])),
        "behavioral_observations": list(llm_summary.get("behavioral_observations", [])),
        "final_recommendation": llm_summary.get("final_recommendation"),
        "hiring_rationale": llm_summary.get("hiring_rationale", ""),
        "next_steps": llm_summary.get("next_steps", []),
        "candidate_summary": llm_summary.get("candidate_summary"),
        "interview_summary": llm_summary.get("interview_summary"),
        "chart_images": context["charts"],
    }


# ─── Generate PDF ─────────────────────────────────────────────────────────────

def generate_candidate_report(db: Session, application_id: int) -> CandidateReport:
    try:
        from reportlab.lib.pagesizes import A4
        _use_reportlab = True
    except ImportError:
        _use_reportlab = False

    # Try WeasyPrint, fall back to ReportLab-based HTML-to-PDF, then plain file
    try:
        from weasyprint import HTML as WeasyHTML
        _renderer = "weasyprint"
    except ImportError:
        _renderer = "reportlab_fallback"

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

    html_str = REPORT_TEMPLATE.render(**context["render_context"])

    if _renderer == "weasyprint":
        from weasyprint import HTML as WeasyHTML
        WeasyHTML(string=html_str, base_url=str(report_dir.resolve())).write_pdf(str(pdf_path))
    else:
        # Fallback: save HTML and use xhtml2pdf or just store the HTML
        html_path = report_dir / "candidate_evaluation_report.html"
        html_path.write_text(html_str, encoding="utf-8")
        try:
            from xhtml2pdf import pisa
            with open(str(pdf_path), "wb") as f:
                pisa.CreatePDF(html_str, dest=f)
        except ImportError:
            # Last resort: just save the HTML, rename as pdf so the path is valid
            import shutil
            shutil.copy(str(html_path), str(pdf_path))

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

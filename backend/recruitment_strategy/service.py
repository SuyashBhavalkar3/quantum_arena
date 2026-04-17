import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from groq import Groq

from recruitment_strategy.schemas import RecruitmentStrategyGenerateRequest

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def ensure_list(value: Any) -> list[str]:
    if isinstance(value, dict):
        return [str(item) for item in value.values()]
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def replace_currency(text: Any) -> Any:
    if isinstance(text, str):
        return text.replace("$", "\u20b9").replace("USD", "INR")
    return text


def _infer_market_competition(role: str, company_category: str) -> str:
    normalized_role = role.lower()
    high_competition_keywords = [
        "ai",
        "ml",
        "data scientist",
        "backend",
        "full stack",
        "product manager",
        "devops",
        "security",
    ]
    if any(keyword in normalized_role for keyword in high_competition_keywords):
        return "high"
    if company_category == "startup":
        return "medium"
    return "low"


def _derive_company_offering(payload: RecruitmentStrategyGenerateRequest) -> str:
    offerings = {
        "startup": (
            "Hands-on ownership, faster growth opportunities, flexible responsibilities, "
            "lean hiring decisions, mission-driven visibility, and competitive \u20b98-18 LPA bands depending on role."
        ),
        "mid-size": (
            "Balanced compensation, structured growth paths, hybrid flexibility, team stability, "
            "practical ownership, and market-aligned \u20b912-28 LPA salary bands."
        ),
        "enterprise": (
            "Brand credibility, larger teams, formal benefits, clearer internal mobility, "
            "and stable compensation bands such as \u20b918-40 LPA for high-demand roles."
        ),
    }
    return offerings[payload.company_category]


def _derive_competitor_offerings(
    payload: RecruitmentStrategyGenerateRequest, market_competition: str
) -> str:
    baseline = {
        "startup": "Higher fixed pay in \u20b9 LPA terms from larger firms, remote flexibility, and brand recognition.",
        "mid-size": "Specialist career ladders, remote-friendly policies, and stronger total compensation packages in INR.",
        "enterprise": "Faster-growth environments, stronger equity upside, and more flexible team structures.",
    }[payload.company_category]

    if market_competition == "high":
        return f"{baseline} Competitors are likely to move faster and market aggressively to top candidates."
    if market_competition == "medium":
        return f"{baseline} Competitors are likely to compete on speed and candidate experience."
    return baseline


def _safe_json_load(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


def _build_fallback_strategy(payload: RecruitmentStrategyGenerateRequest) -> Dict[str, Any]:
    hires = payload.number_of_candidates_to_hire
    market_competition = _infer_market_competition(
        payload.role_to_hire_for, payload.company_category
    )
    company_offering = _derive_company_offering(payload)
    competitor_offerings = _derive_competitor_offerings(payload, market_competition)
    competition_multiplier = {"low": 22, "medium": 30, "high": 40}[market_competition]
    timeline_pressure = 1.15 if payload.hiring_timeline_days <= 30 else 1.0

    applications = max(hires * competition_multiplier, hires)
    applications = int(round(applications * timeline_pressure))
    resume_screening = max(int(round(applications * 0.4)), hires)
    assessment = max(int(round(resume_screening * 0.5)), hires)
    interview = max(int(round(assessment * 0.35)), hires)

    return {
        "executive_summary": (
            f"To hire {hires} {payload.role_to_hire_for} candidates in "
            f"{payload.hiring_timeline_days} days, use an automation-heavy funnel and "
            "keep decision latency low across screening and interview stages."
        ),
        "market_competition": market_competition,
        "company_offering": company_offering,
        "competitor_offerings": competitor_offerings,
        "hiring_funnel_strategy": {
            "applications": applications,
            "resume_screening": resume_screening,
            "assessment": assessment,
            "interview": interview,
            "final_hires": hires,
        },
        "time_optimization_plan": [
            "Run resume screening and recruiter review in parallel with daily decision SLAs.",
            "Launch assessment batches twice per week to avoid idle pipeline time.",
            "Use AI interview scheduling and automated reminders to reduce drop-off.",
        ],
        "cost_optimization_suggestions": [
            "Automate the first resume screen to reduce recruiter time on low-fit applications.",
            "Use AI interviews before live panels to cut interviewer hours.",
            "Prioritize high-intent sourcing channels before paid outbound campaigns and benchmark offers in \u20b9 LPA.",
        ],
        "competitive_hiring_advice": [
            "Shorten the application-to-interview cycle to improve candidate conversion.",
            "Lead with the strongest parts of the offer package in outreach and job copy.",
            "Reduce time-to-feedback, especially if the market is competitive.",
        ],
        "sourcing_strategy": [
            "LinkedIn outbound for active and passive role-specific talent.",
            "Referral campaigns targeting adjacent engineering or product networks.",
            "GitHub, portfolio communities, and niche domain groups for deeper role fit.",
        ],
        "risk_warnings": [
            "A compressed timeline can reduce interviewer availability and decision quality.",
            "Offer attractiveness may be weaker than competitors if compensation is not explicit in \u20b9 LPA terms.",
            "High competition roles need faster feedback loops to avoid candidate drop-off.",
        ],
    }


def generate_recruitment_strategy(payload: RecruitmentStrategyGenerateRequest) -> Dict[str, Any]:
    fallback = _build_fallback_strategy(payload)
    if not GROQ_API_KEY:
        return fallback

    prompt = f"""
Return valid JSON only with keys:
executive_summary, hiring_funnel_strategy, time_optimization_plan,
cost_optimization_suggestions, competitive_hiring_advice, sourcing_strategy, risk_warnings.

Rules:
- hiring_funnel_strategy must contain integer keys: applications, resume_screening, assessment, interview, final_hires
- recommendations must be concise, practical, and specific to the role and timeline
- risk_warnings should be concrete and actionable
- infer market competition, company offering posture, and competitor advantage from the role, hiring timeline, and company category
- use Indian market compensation language only; prefer \u20b9 and LPA instead of $ or USD
- never use dollar-denominated examples; convert any compensation example to Indian market INR/LPA phrasing

Also return:
- market_competition
- company_offering
- competitor_offerings

Input:
{json.dumps(payload.model_dump(), indent=2)}
"""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": "You are a recruitment strategy consultant for the Indian hiring market. Return valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )
    content = response.choices[0].message.content.strip()
    strategy = _safe_json_load(content)

    strategy["time_optimization_plan"] = ensure_list(strategy.get("time_optimization_plan"))
    strategy["cost_optimization_suggestions"] = ensure_list(
        strategy.get("cost_optimization_suggestions")
    )
    strategy["competitive_hiring_advice"] = ensure_list(
        strategy.get("competitive_hiring_advice")
    )
    strategy["sourcing_strategy"] = ensure_list(strategy.get("sourcing_strategy"))
    strategy["risk_warnings"] = ensure_list(strategy.get("risk_warnings"))

    strategy["company_offering"] = replace_currency(
        str(strategy.get("company_offering", fallback["company_offering"]))
    )
    strategy["competitor_offerings"] = replace_currency(
        str(strategy.get("competitor_offerings", fallback["competitor_offerings"]))
    )
    strategy["executive_summary"] = replace_currency(
        str(strategy.get("executive_summary", fallback["executive_summary"]))
    )
    strategy["time_optimization_plan"] = [
        replace_currency(item) for item in strategy["time_optimization_plan"]
    ]
    strategy["cost_optimization_suggestions"] = [
        replace_currency(item) for item in strategy["cost_optimization_suggestions"]
    ]
    strategy["competitive_hiring_advice"] = [
        replace_currency(item) for item in strategy["competitive_hiring_advice"]
    ]
    strategy["sourcing_strategy"] = [
        replace_currency(item) for item in strategy["sourcing_strategy"]
    ]
    strategy["risk_warnings"] = [
        replace_currency(item) for item in strategy["risk_warnings"]
    ]

    return {
        "market_competition": strategy.get("market_competition", fallback["market_competition"]),
        "company_offering": strategy.get("company_offering", fallback["company_offering"]),
        "competitor_offerings": strategy.get(
            "competitor_offerings", fallback["competitor_offerings"]
        ),
        "executive_summary": strategy.get("executive_summary", fallback["executive_summary"]),
        "hiring_funnel_strategy": strategy.get(
            "hiring_funnel_strategy", fallback["hiring_funnel_strategy"]
        ),
        "time_optimization_plan": strategy.get(
            "time_optimization_plan", fallback["time_optimization_plan"]
        ),
        "cost_optimization_suggestions": strategy.get(
            "cost_optimization_suggestions", fallback["cost_optimization_suggestions"]
        ),
        "competitive_hiring_advice": strategy.get(
            "competitive_hiring_advice", fallback["competitive_hiring_advice"]
        ),
        "sourcing_strategy": strategy.get("sourcing_strategy", fallback["sourcing_strategy"]),
        "risk_warnings": strategy.get("risk_warnings", fallback["risk_warnings"]),
    }

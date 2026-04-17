"""
Company Intel Service
======================
Uses Tavily API to gather company intelligence for mock interviews.
Results cached in-memory with 7-day TTL.
"""

import os
import logging
import time
from typing import Optional
from openai import OpenAI

logger = logging.getLogger(__name__)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# In-memory cache: {company_lower: {"data": {...}, "cached_at": timestamp}}
_intel_cache: dict = {}
CACHE_TTL_SECONDS = 7 * 24 * 3600  # 7 days


def _fetch_tavily(query: str, max_results: int = 5) -> list[dict]:
    """Call Tavily Search API and return list of results."""
    try:
        import requests
        resp = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "max_results": max_results,
                "include_answer": True,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])
    except Exception as e:
        logger.warning(f"Tavily fetch failed for '{query}': {e}")
        return []


def _synthesize_intel(company: str, raw_results: list[dict]) -> dict:
    """Send raw Tavily snippets to GPT-4o to produce structured company intel."""
    snippets = "\n\n".join(
        f"SOURCE: {r.get('url','')}\n{r.get('content','')[:400]}"
        for r in raw_results[:8]
    )

    prompt = f"""
You are a hiring intelligence analyst. Based on the web snippets below, extract structured information
about {company} for a mock technical interview. Return ONLY valid JSON with this structure:

{{
  "company": "{company}",
  "tech_stack": ["<tech>", ...],
  "culture_keywords": ["<keyword>", ...],
  "interview_format": "<description of their typical interview process>",
  "known_question_types": ["<type>", ...],
  "glassdoor_sentiment": "<positive|mixed|negative>",
  "recent_highlights": ["<str>", ...]
}}

WEB SNIPPETS:
{snippets}

Return ONLY the JSON. No markdown.
"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Intel synthesis failed: {e}")
        return {
            "company": company,
            "tech_stack": [],
            "culture_keywords": [],
            "interview_format": "Standard technical interview with coding and system design rounds.",
            "known_question_types": ["DSA", "System Design", "Behavioral"],
            "glassdoor_sentiment": "mixed",
            "recent_highlights": [],
        }


def get_company_intel(company: str) -> dict:
    """
    Main entry point. Returns cached intel if fresh, otherwise fetches from Tavily + GPT-4o.
    """
    key = company.strip().lower()
    now = time.time()

    # Check cache
    if key in _intel_cache:
        cached = _intel_cache[key]
        if now - cached["cached_at"] < CACHE_TTL_SECONDS:
            logger.info(f"Company intel cache HIT for '{company}'")
            return cached["data"]

    logger.info(f"Company intel cache MISS for '{company}', fetching...")

    # Fetch from Tavily
    queries = [
        f"{company} technical interview process 2024 2025",
        f"{company} tech stack programming languages",
        f"{company} glassdoor interview experience",
        f"{company} software engineer job description requirements",
    ]

    all_results = []
    for q in queries:
        all_results.extend(_fetch_tavily(q, max_results=3))

    intel = _synthesize_intel(company, all_results)
    _intel_cache[key] = {"data": intel, "cached_at": now}
    return intel


def get_popular_companies() -> list[str]:
    """Return popular tech companies for autocomplete."""
    return [
        "Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix",
        "Uber", "Airbnb", "Stripe", "Salesforce", "Oracle", "IBM",
        "Infosys", "TCS", "Wipro", "Cognizant", "Accenture", "HCL",
        "Flipkart", "Paytm", "Zomato", "Swiggy", "CRED", "Razorpay",
        "PhonePe", "Nykaa", "Zepto", "MindTree", "Mphasis", "Persistent",
        "JP Morgan", "Goldman Sachs", "Morgan Stanley", "Deutsche Bank",
        "Adobe", "SAP", "Atlassian", "Twilio", "Datadog", "Snowflake",
    ]

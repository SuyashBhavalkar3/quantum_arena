"""
Resume Parser for Prep Feature
================================
Downloads resume from Cloudinary URL, extracts text using PyMuPDF (fitz).
Falls back to pdfminer.six if PyMuPDF is unavailable.
Does NOT touch any existing resume parsing logic in resume_parsing/ module.
"""

import io
import os
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


def _fetch_pdf_bytes(url: str) -> bytes:
    """Download PDF bytes from a remote URL."""
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    return response.content


def _extract_with_pymupdf(pdf_bytes: bytes) -> str:
    """Extract text using PyMuPDF (fitz). Fastest and most accurate."""
    import fitz  # PyMuPDF
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


def _extract_with_pdfminer(pdf_bytes: bytes) -> str:
    """Fallback: extract text using pdfminer.six."""
    from pdfminer.high_level import extract_text as pdfminer_extract
    return pdfminer_extract(io.BytesIO(pdf_bytes))


def extract_resume_text(resume_url: str) -> str:
    """
    Main entry: fetch PDF from Cloudinary URL, extract all text.
    Tries PyMuPDF first, falls back to pdfminer.
    """
    try:
        pdf_bytes = _fetch_pdf_bytes(resume_url)
    except Exception as e:
        logger.error(f"Failed to fetch resume from URL {resume_url}: {e}")
        raise ValueError(f"Could not download resume: {e}")

    # Try PyMuPDF first
    try:
        text = _extract_with_pymupdf(pdf_bytes)
        logger.info("Resume parsed with PyMuPDF")
        return text
    except ImportError:
        logger.warning("PyMuPDF not installed, falling back to pdfminer")
    except Exception as e:
        logger.warning(f"PyMuPDF failed: {e}, falling back to pdfminer")

    # Fallback to pdfminer
    try:
        text = _extract_with_pdfminer(pdf_bytes)
        logger.info("Resume parsed with pdfminer")
        return text
    except Exception as e:
        logger.error(f"pdfminer also failed: {e}")
        raise ValueError(f"Could not extract text from resume: {e}")


def build_resume_summary(parsed_data: Optional[dict], raw_text: str) -> str:
    """
    Combine structured parsed_data (from existing resume_parsing module)
    with raw extracted text into one rich context string for the AI prompt.
    """
    parts = []

    if parsed_data:
        # Skills
        skills = parsed_data.get("skills", [])
        if skills:
            skill_names = [s.get("name", str(s)) if isinstance(s, dict) else str(s) for s in skills]
            parts.append(f"SKILLS: {', '.join(skill_names)}")

        # Education
        education = parsed_data.get("education", [])
        for edu in education[:3]:
            if isinstance(edu, dict):
                parts.append(f"EDUCATION: {edu.get('degree', '')} at {edu.get('institution', '')} ({edu.get('year', '')})")

        # Experience
        experiences = parsed_data.get("experiences", [])
        for exp in experiences[:3]:
            if isinstance(exp, dict):
                parts.append(f"EXPERIENCE: {exp.get('title', '')} at {exp.get('company', '')} - {exp.get('description', '')[:200]}")

        # Projects
        projects = parsed_data.get("projects", [])
        for proj in projects[:3]:
            if isinstance(proj, dict):
                parts.append(f"PROJECT: {proj.get('name', '')} - {proj.get('description', '')[:200]}")

    if raw_text:
        # Include first 3000 chars of raw text as context
        parts.append(f"\nRAW RESUME CONTENT (truncated):\n{raw_text[:3000]}")

    return "\n".join(parts)

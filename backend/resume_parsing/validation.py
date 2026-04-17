"""
Validation utilities for parsed resume data
"""

def validate_and_normalize_parsed_data(parsed_data: dict) -> dict:
    """
    Validates and normalizes parsed resume data to ensure:
    1. education is always an array
    2. experience is always an array
    3. certifications is always an array
    4. projects is always an array
    
    Returns normalized data structure.
    """
    normalized = parsed_data.copy()
    
    # Normalize education to array
    if "education" in normalized:
        if isinstance(normalized["education"], dict):
            normalized["education"] = [normalized["education"]]
        elif not isinstance(normalized["education"], list):
            normalized["education"] = []
    else:
        normalized["education"] = []
    
    # Normalize experience to array
    if "experience" in normalized:
        if isinstance(normalized["experience"], dict):
            normalized["experience"] = [normalized["experience"]]
        elif not isinstance(normalized["experience"], list):
            normalized["experience"] = []
    else:
        normalized["experience"] = []
    
    # Normalize certifications to array
    if "certifications" in normalized:
        certs = normalized["certifications"]
        if isinstance(certs, str):
            # Split comma-separated string into array of objects
            if certs.strip():
                normalized["certifications"] = [
                    {"title": cert.strip()} 
                    for cert in certs.split(",") 
                    if cert.strip()
                ]
            else:
                normalized["certifications"] = []
        elif isinstance(certs, list):
            # Ensure each item is a dict with "title" key
            result = []
            for cert in certs:
                if isinstance(cert, str):
                    result.append({"title": cert.strip()})
                elif isinstance(cert, dict) and cert.get("title"):
                    result.append(cert)
            normalized["certifications"] = result
        else:
            normalized["certifications"] = []
    else:
        normalized["certifications"] = []
    
    # Normalize projects to array
    if "projects" in normalized:
        if isinstance(normalized["projects"], dict):
            normalized["projects"] = [normalized["projects"]]
        elif not isinstance(normalized["projects"], list):
            normalized["projects"] = []
    else:
        normalized["projects"] = []
    
    # Ensure skills is an object (not array)
    if "skills" not in normalized or not isinstance(normalized["skills"], dict):
        normalized["skills"] = {}
    
    return normalized


def count_parsed_items(parsed_data: dict) -> dict:
    """
    Returns count of items in each section for debugging
    """
    return {
        "education_count": len(parsed_data.get("education", [])),
        "experience_count": len(parsed_data.get("experience", [])),
        "certifications_count": len(parsed_data.get("certifications", [])),
        "projects_count": len(parsed_data.get("projects", [])),
        "has_skills": bool(parsed_data.get("skills", {}))
    }

PARSING_PROMPT = """
Extract structured JSON from the resume below.

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON - no explanation, no markdown, no code blocks
2. Extract ALL experiences as separate objects in an array
3. Extract ALL education entries as separate objects in an array
4. Extract ALL certifications as separate objects in an array
5. If a section has only one item, still return it as an array with one object
6. Do NOT merge multiple experiences/education/certifications into one

Structure:

{
"name": "",
"email": "",
"phone": "",
"education": [
    {
        "degree": "",
        "institution": "",
        "field_of_study": "",
        "start_date": "",
        "end_date": "",
        "grade": "",
        "graduation_date": "",
        "marks": "",
        "location": ""
    }
],
"experience": [
    {
        "company_name": "",
        "job_title": "",
        "start_date": "",
        "end_date": "",
        "location": "",
        "is_current": false,
        "description": "",
        "marks": ""
    }
],
"skills": {
    "languages": "",
    "backend_technologies": "",
    "databases": "",
    "ai_ml_frameworks": "",
    "tools_platforms": "",
    "core_competencies": ""
},
"projects": [
    {
        "project_name": "",
        "description": "",
        "github_url": ""
    }
],
"certifications": [
    {
        "title": ""
    }
],
"github_profile_url": "",
"linkedin_url": ""
}

EXAMPLES:

If resume has 2 experiences:
"experience": [
    {"company_name": "ABC", "job_title": "Engineer", "start_date": "2022", "end_date": "2024", "location": "NYC", "is_current": false, "description": "Built APIs"},
    {"company_name": "XYZ", "job_title": "Intern", "start_date": "2021", "end_date": "2022", "location": "SF", "is_current": false, "description": "Developed features"}
]

If resume has 3 certifications:
"certifications": [
    {"title": "AWS Certified"},
    {"title": "Google Cloud Professional"},
    {"title": "Azure Fundamentals"}
]

Resume Text:
"""
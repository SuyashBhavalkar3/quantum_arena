"""
Test script to verify resume parsing handles multiple items correctly
"""
import json
from resume_parsing.validation import validate_and_normalize_parsed_data, count_parsed_items

# Test Case 1: Multiple experiences as array (correct format)
test_case_1 = {
    "name": "John Doe",
    "email": "john@example.com",
    "experience": [
        {
            "company_name": "ABC Corp",
            "job_title": "Software Engineer",
            "start_date": "2022",
            "end_date": "2024",
            "location": "NYC",
            "is_current": False,
            "description": "Built scalable APIs"
        },
        {
            "company_name": "XYZ Inc",
            "job_title": "Backend Intern",
            "start_date": "2021",
            "end_date": "2022",
            "location": "SF",
            "is_current": False,
            "description": "Developed features"
        }
    ],
    "certifications": [
        {"title": "AWS Certified"},
        {"title": "Google Cloud Professional"}
    ]
}

# Test Case 2: Single experience as object (needs normalization)
test_case_2 = {
    "name": "Jane Smith",
    "experience": {
        "company_name": "Tech Co",
        "job_title": "Developer",
        "start_date": "2023",
        "end_date": "2024"
    },
    "certifications": "AWS Certified, Azure Fundamentals"
}

# Test Case 3: Empty/missing fields
test_case_3 = {
    "name": "Bob Johnson",
    "email": "bob@example.com"
}

print("=" * 70)
print("TESTING RESUME PARSING VALIDATION")
print("=" * 70)

# Test 1
print("\n[TEST 1] Multiple experiences and certifications (array format)")
print("-" * 70)
normalized_1 = validate_and_normalize_parsed_data(test_case_1)
counts_1 = count_parsed_items(normalized_1)
print(f"Counts: {counts_1}")
print(f"Experience count: {counts_1['experience_count']} (expected: 2)")
print(f"Certifications count: {counts_1['certifications_count']} (expected: 2)")
assert counts_1['experience_count'] == 2, "Should have 2 experiences"
assert counts_1['certifications_count'] == 2, "Should have 2 certifications"
print("✅ PASSED")

# Test 2
print("\n[TEST 2] Single experience as object + comma-separated certifications")
print("-" * 70)
normalized_2 = validate_and_normalize_parsed_data(test_case_2)
counts_2 = count_parsed_items(normalized_2)
print(f"Counts: {counts_2}")
print(f"Experience count: {counts_2['experience_count']} (expected: 1)")
print(f"Certifications count: {counts_2['certifications_count']} (expected: 2)")
assert counts_2['experience_count'] == 1, "Should have 1 experience"
assert counts_2['certifications_count'] == 2, "Should have 2 certifications"
print("✅ PASSED")

# Test 3
print("\n[TEST 3] Missing fields (should default to empty arrays)")
print("-" * 70)
normalized_3 = validate_and_normalize_parsed_data(test_case_3)
counts_3 = count_parsed_items(normalized_3)
print(f"Counts: {counts_3}")
assert counts_3['experience_count'] == 0, "Should have 0 experiences"
assert counts_3['education_count'] == 0, "Should have 0 education"
assert counts_3['certifications_count'] == 0, "Should have 0 certifications"
print("✅ PASSED")

# Test 4: Verify structure
print("\n[TEST 4] Verify normalized structure")
print("-" * 70)
assert isinstance(normalized_1['experience'], list), "experience should be list"
assert isinstance(normalized_1['certifications'], list), "certifications should be list"
assert isinstance(normalized_2['experience'], list), "experience should be list"
assert isinstance(normalized_2['certifications'], list), "certifications should be list"
print("✅ PASSED - All fields are arrays")

print("\n" + "=" * 70)
print("✅ ALL TESTS PASSED")
print("=" * 70)

# Show example normalized output
print("\n[EXAMPLE] Normalized output for Test Case 2:")
print(json.dumps(normalized_2, indent=2))

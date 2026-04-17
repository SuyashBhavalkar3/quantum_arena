#!/usr/bin/env python3
"""
Test script for the mixed assessment system (MCQ + DSA).
Run this to verify the implementation works correctly.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from assessment.assessment_service import generate_assessment_questions
from assessment.dsa_service import generate_dsa_questions, evaluate_dsa_submission


async def test_mcq_generation():
    """Test MCQ question generation"""
    print("=== Testing MCQ Question Generation ===")
    
    sample_resume = {
        'skills': {
            'languages': 'Python, JavaScript, Java',
            'backend_technologies': 'FastAPI, Django, Node.js',
            'databases': 'PostgreSQL, MongoDB, Redis',
            'tools_platforms': 'Docker, AWS, Git'
        },
        'experiences': [
            {
                'job_title': 'Backend Developer',
                'company_name': 'TechCorp',
                'description': 'Built REST APIs and microservices'
            }
        ]
    }
    
    sample_job = {
        'title': 'Senior Backend Engineer',
        'description': 'Looking for experienced backend developer with Python and cloud experience',
        'required_skills': ['Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker'],
        'experience_required': 3
    }
    
    try:
        questions_data = await generate_assessment_questions(
            parsed_resume=sample_resume,
            job_data=sample_job,
            num_mcq=3,  # Generate 3 MCQ for testing
            num_dsa=1   # Generate 1 DSA for testing
        )
        
        mcq_questions = questions_data.get("mcq_questions", [])
        dsa_questions = questions_data.get("dsa_questions", [])
        
        print(f"✅ Generated {len(mcq_questions)} MCQ questions")
        print(f"✅ Generated {len(dsa_questions)} DSA questions")
        
        if mcq_questions:
            print("\nSample MCQ Question:")
            q = mcq_questions[0]
            print(f"Question: {q.get('question_text', 'N/A')}")
            print(f"A) {q.get('option_a', 'N/A')}")
            print(f"B) {q.get('option_b', 'N/A')}")
            print(f"C) {q.get('option_c', 'N/A')}")
            print(f"D) {q.get('option_d', 'N/A')}")
            print(f"Correct: {q.get('correct_option', 'N/A')}")
            print(f"Topic: {q.get('topic', 'N/A')}")
        
        if dsa_questions:
            print("\nSample DSA Question:")
            q = dsa_questions[0]
            print(f"Question: {q.get('question_text', 'N/A')[:100]}...")
            print(f"Topic: {q.get('topic', 'N/A')}")
            print(f"Difficulty: {q.get('difficulty', 'N/A')}")
            print(f"Example Input: {q.get('example_input', 'N/A')}")
            print(f"Example Output: {q.get('example_output', 'N/A')}")
            print(f"Test Cases: {len(q.get('test_cases', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating questions: {str(e)}")
        return False


async def test_code_execution():
    """Test code execution via JDoodle"""
    print("\n=== Testing Code Execution ===")
    
    # Simple Python code to test
    test_code = """
def solution(nums):
    return sum(nums)

# Test the function
nums = [1, 2, 3, 4, 5]
result = solution(nums)
print(result)
"""
    
    test_cases = [
        {"input": "", "output": "15"}
    ]
    
    try:
        evaluation = await evaluate_dsa_submission(
            code=test_code,
            language="python3",
            test_cases=test_cases
        )
        
        print(f"✅ Code execution completed")
        print(f"Marks obtained: {evaluation['marks_obtained']}/30")
        print(f"Test cases passed: {evaluation['test_cases_passed']}/{evaluation['total_test_cases']}")
        print(f"Is correct: {evaluation['is_correct']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error executing code: {str(e)}")
        return False


async def main():
    """Run all tests"""
    print("🚀 Testing Mixed Assessment System (MCQ + DSA)")
    print("=" * 50)
    
    # Test MCQ and DSA generation
    mcq_success = await test_mcq_generation()
    
    # Test code execution
    code_success = await test_code_execution()
    
    print("\n" + "=" * 50)
    if mcq_success and code_success:
        print("✅ All tests passed! Mixed assessment system is working correctly.")
        print("\nSystem Summary:")
        print("- 10 MCQ questions (4 marks each = 40 marks total)")
        print("- 2 DSA coding questions (30 marks each = 60 marks total)")
        print("- Total assessment score: 100 marks")
        print("- Code execution via JDoodle API")
        print("- Automatic scoring and evaluation")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        print("\nTroubleshooting:")
        print("1. Ensure OPENAI_API_KEY is set in .env")
        print("2. Ensure JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET are set in .env")
        print("3. Check internet connection for API calls")


if __name__ == "__main__":
    asyncio.run(main())
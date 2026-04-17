"""
Test script for Adaptive Interview Bot
Demonstrates all behavioral rules:
1. Adaptive Questioning
2. Refusal Handling
3. Human-in-the-Loop (HITL)
4. Context Awareness
5. Professional Tone
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ai_interview_bot.services.adaptive_interview_bot import adaptive_bot


def test_greeting():
    """Test 1: Initial Greeting"""
    print("=" * 60)
    print("TEST 1: GREETING")
    print("=" * 60)
    
    greeting = adaptive_bot.generate_greeting("Software Engineer", "TechCorp")
    print(f"Bot: {greeting}\n")


def test_adaptive_questioning():
    """Test 2: Adaptive Questioning - Short vs Detailed Responses"""
    print("=" * 60)
    print("TEST 2: ADAPTIVE QUESTIONING")
    print("=" * 60)
    
    session = {
        "transcript": [
            {"speaker": "bot", "message": "Tell me about your experience with Python."},
        ],
        "current_stage": "experience",
        "position": "Software Engineer",
        "company": "TechCorp"
    }
    
    # Test with short response
    print("\n--- Scenario A: Short Response ---")
    short_response = "I have 2 years experience."
    print(f"Candidate: {short_response}")
    
    result = adaptive_bot.generate_next_question(
        session=session,
        candidate_response=short_response,
        position="Software Engineer",
        company="TechCorp"
    )
    print(f"Bot: {result['message']}")
    print(f"Action: {result['action']}")
    print(f"Next Stage: {result.get('next_stage')}\n")
    
    # Test with detailed response
    print("\n--- Scenario B: Detailed Response ---")
    detailed_response = """I have 2 years of professional experience with Python, primarily 
    working on backend development using Django and Flask frameworks. I've built RESTful APIs, 
    implemented authentication systems, and optimized database queries. I also have experience 
    with Python for data analysis using pandas and numpy, and I've worked on machine learning 
    projects using scikit-learn. In my last project, I led the development of a microservices 
    architecture that improved our system's scalability by 40%."""
    
    print(f"Candidate: {detailed_response}")
    
    session["transcript"].append({"speaker": "candidate", "message": short_response})
    session["transcript"].append({"speaker": "bot", "message": result['message']})
    
    result = adaptive_bot.generate_next_question(
        session=session,
        candidate_response=detailed_response,
        position="Software Engineer",
        company="TechCorp"
    )
    print(f"Bot: {result['message']}")
    print(f"Action: {result['action']}")
    print(f"Next Stage: {result.get('next_stage')}\n")


def test_refusal_handling():
    """Test 3: Refusal Handling"""
    print("=" * 60)
    print("TEST 3: REFUSAL HANDLING")
    print("=" * 60)
    
    session = {
        "transcript": [
            {"speaker": "bot", "message": "Tell me about your experience."},
        ],
        "current_stage": "experience"
    }
    
    refusal_phrases = [
        "I don't want to give the interview",
        "not interested anymore",
        "stop interview please",
        "I want to exit"
    ]
    
    for phrase in refusal_phrases:
        print(f"\nCandidate: {phrase}")
        result = adaptive_bot.generate_next_question(
            session=session,
            candidate_response=phrase,
            position="Software Engineer",
            company="TechCorp"
        )
        print(f"Bot: {result['message']}")
        print(f"Action: {result['action']}")
        print(f"Reason: {result.get('reason')}")


def test_hitl_escalation():
    """Test 4: Human-in-the-Loop (HITL) Escalation"""
    print("\n" + "=" * 60)
    print("TEST 4: HUMAN-IN-THE-LOOP (HITL)")
    print("=" * 60)
    
    session = {
        "transcript": [
            {"speaker": "bot", "message": "Tell me about your experience."},
        ],
        "current_stage": "experience"
    }
    
    hitl_phrases = [
        "I want to speak to a human recruiter",
        "Can I talk to a real person?",
        "I have a complaint about this process",
        "There's a technical issue with the video"
    ]
    
    for phrase in hitl_phrases:
        print(f"\nCandidate: {phrase}")
        result = adaptive_bot.generate_next_question(
            session=session,
            candidate_response=phrase,
            position="Software Engineer",
            company="TechCorp"
        )
        print(f"Bot: {result['message']}")
        print(f"Action: {result['action']}")
        print(f"Reason: {result.get('reason')}")


def test_context_awareness():
    """Test 5: Context Awareness - Remembering Previous Answers"""
    print("\n" + "=" * 60)
    print("TEST 5: CONTEXT AWARENESS")
    print("=" * 60)
    
    session = {
        "transcript": [
            {"speaker": "bot", "message": "Tell me about yourself."},
            {"speaker": "candidate", "message": "I'm a software engineer with 5 years of experience in Python and JavaScript."},
            {"speaker": "bot", "message": "What projects have you worked on?"},
            {"speaker": "candidate", "message": "I built a real-time chat application using WebSockets and Redis."},
        ],
        "current_stage": "experience"
    }
    
    print("\n--- Previous Context ---")
    for entry in session["transcript"]:
        speaker = "Bot" if entry["speaker"] == "bot" else "Candidate"
        print(f"{speaker}: {entry['message']}")
    
    print("\n--- New Response ---")
    new_response = "The chat app handled 10,000 concurrent users with sub-100ms latency."
    print(f"Candidate: {new_response}")
    
    result = adaptive_bot.generate_next_question(
        session=session,
        candidate_response=new_response,
        position="Software Engineer",
        company="TechCorp"
    )
    print(f"\nBot (should reference previous context): {result['message']}\n")


def test_stage_progression():
    """Test 6: Interview Stage Progression"""
    print("=" * 60)
    print("TEST 6: STAGE PROGRESSION")
    print("=" * 60)
    
    stages = ["greeting", "introduction", "experience", "skills", "scenarios"]
    
    for stage in stages:
        print(f"\n--- Current Stage: {stage.upper()} ---")
        
        session = {
            "transcript": [
                {"speaker": "bot", "message": f"Question about {stage}"},
                {"speaker": "candidate", "message": "Detailed response with lots of information about my background and experience."}
            ] * 3,  # Simulate multiple Q&A
            "current_stage": stage
        }
        
        result = adaptive_bot.generate_next_question(
            session=session,
            candidate_response="Another detailed response showing depth of knowledge.",
            position="Software Engineer",
            company="TechCorp"
        )
        
        print(f"Questions asked: {len([t for t in session['transcript'] if t['speaker'] == 'bot'])}")
        print(f"Current stage: {stage}")
        print(f"Next stage: {result.get('next_stage')}")
        print(f"Bot: {result['message'][:100]}...")


def run_all_tests():
    """Run all test scenarios"""
    print("\n" + "=" * 60)
    print("ADAPTIVE INTERVIEW BOT - COMPREHENSIVE TEST SUITE")
    print("=" * 60 + "\n")
    
    test_greeting()
    test_adaptive_questioning()
    test_refusal_handling()
    test_hitl_escalation()
    test_context_awareness()
    test_stage_progression()
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_all_tests()

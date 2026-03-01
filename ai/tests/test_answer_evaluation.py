"""
Test script for answer evaluation endpoint
Run this after starting the AI service (python simple_api.py)
"""
import requests
import json

# Configuration
API_URL = "http://localhost:8000"

def test_answer_evaluation():
    """Test the answer evaluation endpoint with sample data"""
    
    print("=" * 60)
    print("TESTING ANSWER EVALUATION ENDPOINT")
    print("=" * 60)
    
    # Test Case 1: Good Technical Answer
    print("\n[TEST 1] Evaluating a GOOD technical answer...")
    test_data_good = {
        "question": "What is the difference between let, const, and var in JavaScript?",
        "answer": """Let and const are block-scoped while var is function-scoped. 
        Const cannot be reassigned after declaration, making it ideal for constant values. 
        Let can be reassigned but remains block-scoped, which prevents many common bugs. 
        Var hoists to the top of its function scope and can lead to unexpected behavior. 
        Modern JavaScript prefers const and let for better code safety.""",
        "state": "resume-based",
        "resume_data": {
            "name": "John Doe",
            "skills": ["JavaScript", "React", "Node.js", "Python"],
            "experience": [
                {"title": "Senior Developer", "company": "Tech Corp"}
            ]
        }
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/evaluate-answer",
            json=test_data_good,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"   Score: {result['data']['score']}/10")
            print(f"   Signal: {result['data']['signal']}")
            print(f"   Feedback: {result['data']['feedback']}")
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test Case 2: Average Answer
    print("\n[TEST 2] Evaluating an AVERAGE answer...")
    test_data_average = {
        "question": "Explain how REST APIs work",
        "answer": "REST APIs use HTTP methods like GET and POST to communicate between client and server.",
        "state": "resume-based"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/evaluate-answer",
            json=test_data_average,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"   Score: {result['data']['score']}/10")
            print(f"   Signal: {result['data']['signal']}")
            print(f"   Feedback: {result['data']['feedback']}")
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test Case 3: Poor Answer
    print("\n[TEST 3] Evaluating a POOR answer...")
    test_data_poor = {
        "question": "What is polymorphism in object-oriented programming?",
        "answer": "I don't know.",
        "state": "deep-dive"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/evaluate-answer",
            json=test_data_poor,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"   Score: {result['data']['score']}/10")
            print(f"   Signal: {result['data']['signal']}")
            print(f"   Feedback: {result['data']['feedback']}")
        else:
            print(f"❌ Failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("If all 3 tests passed, the endpoint is working correctly!")
    print("Expected results:")
    print("  - Test 1 should get GOOD signal (score >= 7)")
    print("  - Test 2 should get AVERAGE signal (score 4-6)")
    print("  - Test 3 should get BAD signal (score <= 3)")
    print("=" * 60)


def test_health():
    """Quick health check"""
    print("\n[HEALTH CHECK] Testing if AI service is running...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ AI Service is running!")
            return True
        else:
            print("❌ AI Service returned error")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to AI service: {e}")
        print("   Make sure to run: python simple_api.py")
        return False


if __name__ == "__main__":
    if test_health():
        test_answer_evaluation()
    else:
        print("\n⚠️  Please start the AI service first:")
        print("   cd ai")
        print("   python simple_api.py")

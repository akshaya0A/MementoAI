"""
Test script to process a specific person's data through TRA
"""

import requests
import json
from datetime import datetime

def test_person_processing():
    """Test processing a specific person through the TRA system"""
    
    # Replace this with the person you want to process
    person_name = "John Doe"  # Change this to any name you want
    person_email = "john.doe@example.com"  # Change this to their email
    
    print(f"🔍 Processing candidate: {person_name}")
    print("=" * 50)
    
    # Create the API request data
    request_data = {
        "sources": [
            {
                "source_id": "github_profile",
                "source_type": "github",
                "url": f"https://api.github.com/users/{person_name.lower().replace(' ', '')}",
                "metadata": {"person_name": person_name}
            },
            {
                "source_id": "resume_data",
                "source_type": "resume",
                "file_content": f"{person_name}\nSoftware Engineer\nPython, Machine Learning\n5 years experience",
                "filename": f"{person_name.lower().replace(' ', '_')}_resume.txt",
                "metadata": {"person_name": person_name}
            },
            {
                "source_id": "crm_contact",
                "source_type": "crm",
                "data": {
                    "first_name": person_name.split()[0],
                    "last_name": person_name.split()[1] if len(person_name.split()) > 1 else "",
                    "email": person_email,
                    "company": "Tech Corp",
                    "title": "Senior Software Engineer"
                },
                "metadata": {"person_name": person_name}
            }
        ],
        "processing_options": {
            "enable_contradiction_detection": True,
            "calculate_extraordinary_index": True,
            "generate_action_plans": True
        },
        "metadata": {
            "person_name": person_name,
            "created_at": datetime.now().isoformat()
        }
    }
    
    try:
        # Send the request to the TRA API
        print("📡 Sending request to TRA API...")
        response = requests.post(
            "http://localhost:8000/process-candidate",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Successfully processed candidate!")
            print(f"📋 Request ID: {result['request_id']}")
            print(f"📊 Status: {result['status']}")
            print(f"💬 Message: {result['message']}")
            
            # Get the processed candidates
            print("\n👥 Fetching processed candidates...")
            candidates_response = requests.get("http://localhost:8000/candidates")
            if candidates_response.status_code == 200:
                candidates = candidates_response.json()
                print(f"📈 Found {len(candidates)} processed candidates")
                
                for candidate in candidates:
                    print(f"\n🎯 Candidate: {candidate['candidate_id']}")
                    print(f"   Name: {candidate['name']}")
                    print(f"   Email: {candidate['email']}")
                    print(f"   Extraordinary Index: {candidate['extraordinary_index']['overall_score']:.2f}")
                    print(f"   Confidence: {candidate['confidence_score']:.2f}")
                    print(f"   Sources: {candidate['source_count']}")
                    print(f"   Contradictions: {candidate['contradictions']}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to TRA server")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    # You can change these values to process different people
    test_person_processing()

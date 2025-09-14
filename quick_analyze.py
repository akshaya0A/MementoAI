"""
TRA Quick Analysis - Just enter a name!

The simplest way to analyze someone - just type their name!
"""

import requests
import json
from datetime import datetime

def quick_analyze():
    """Quick analysis - just enter a name"""
    print("🚀 TRA Quick Analysis")
    print("=" * 30)
    print("Just enter the person's name to analyze them!")
    print()
    
    # Get just the name
    person_name = input("👤 Enter person's name: ").strip()
    if not person_name:
        person_name = "John Doe"
        print(f"Using default: {person_name}")
    
    print()
    print(f"🔍 Analyzing: {person_name}")
    print("⏳ Processing through TRA multi-agent system...")
    
    # Create simple request with just the name
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
                "file_content": f"{person_name}\nSoftware Engineer\nPython, Machine Learning, AI\n5 years experience",
                "filename": f"{person_name.lower().replace(' ', '_')}_resume.txt",
                "metadata": {"person_name": person_name}
            },
            {
                "source_id": "crm_contact",
                "source_type": "crm",
                "data": {
                    "first_name": person_name.split()[0],
                    "last_name": " ".join(person_name.split()[1:]) if len(person_name.split()) > 1 else "",
                    "email": f"{person_name.lower().replace(' ', '.')}@example.com",
                    "company": "Tech Corp",
                    "title": "Software Engineer"
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
        # Send request to TRA API
        print("📡 Connecting to TRA server...")
        response = requests.post(
            "http://localhost:8000/process-candidate",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis complete!")
            print()
            
            # Get processed candidates
            candidates_response = requests.get("http://localhost:8000/candidates")
            if candidates_response.status_code == 200:
                candidates = candidates_response.json()
                
                for candidate in candidates:
                    print("🎯 ANALYSIS RESULTS")
                    print("=" * 25)
                    print(f"👤 Name: {candidate['name']}")
                    print(f"📧 Email: {candidate['email']}")
                    print()
                    
                    # Show the Extraordinary Index
                    ei = candidate['extraordinary_index']
                    overall_score = ei['overall_score']
                    
                    print("📊 EXTRAORDINARY INDEX")
                    print("-" * 20)
                    print(f"🚀 Innovation: {ei['innovation']:.2f}")
                    print(f"📈 Adoption: {ei['adoption']:.2f}")
                    print(f"🌟 Influence: {ei['influence']:.2f}")
                    print(f"⚡ Velocity: {ei['velocity']:.2f}")
                    print(f"🎯 Selectivity: {ei['selectivity']:.2f}")
                    print()
                    print(f"🏆 OVERALL SCORE: {overall_score:.2f}/1.0")
                    
                    # Give a simple rating
                    if overall_score >= 0.8:
                        print("🌟 RATING: EXCEPTIONAL TALENT")
                    elif overall_score >= 0.6:
                        print("⭐ RATING: EXCELLENT CANDIDATE")
                    elif overall_score >= 0.4:
                        print("👍 RATING: GOOD CANDIDATE")
                    else:
                        print("📝 RATING: NEEDS REVIEW")
                    
                    print()
                    print(f"📁 Sources: {candidate['source_count']}")
                    print(f"⚠️  Contradictions: {candidate['contradictions']}")
                    print(f"🎯 Confidence: {candidate['confidence_score']:.2f}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to TRA server")
        print("Make sure the server is running!")
        print("Run: python main_simple.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    try:
        quick_analyze()
        print()
        print("🎉 Done! Run this script again to analyze someone else.")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

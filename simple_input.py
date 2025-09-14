"""
TRA Simple Text Input Interface

Just type the person's name and details in normal text - no JSON required!
"""

import requests
import json
from datetime import datetime

def get_person_info():
    """Get person information through simple text input"""
    print("🚀 Talent Resolution Agent (TRA) - Simple Input")
    print("=" * 50)
    print("Just type the person's information below:")
    print()
    
    # Get person details through simple text input
    person_name = input("👤 Full Name: ").strip()
    if not person_name:
        person_name = "John Doe"
        print(f"Using default: {person_name}")
    
    person_email = input("📧 Email: ").strip()
    if not person_email:
        person_email = f"{person_name.lower().replace(' ', '.')}@example.com"
        print(f"Using default: {person_email}")
    
    person_company = input("🏢 Company: ").strip()
    if not person_company:
        person_company = "Tech Corp"
        print(f"Using default: {person_company}")
    
    person_title = input("💼 Job Title: ").strip()
    if not person_title:
        person_title = "Software Engineer"
        print(f"Using default: {person_title}")
    
    person_skills = input("🛠️ Skills (comma-separated): ").strip()
    if not person_skills:
        person_skills = "Python, Machine Learning, AI"
        print(f"Using default: {person_skills}")
    
    person_location = input("📍 Location: ").strip()
    if not person_location:
        person_location = "San Francisco, CA"
        print(f"Using default: {person_location}")
    
    print()
    print("📊 Data Sources to include:")
    print("1. GitHub Profile")
    print("2. Resume/CV")
    print("3. CRM Data")
    print("4. Research Papers (ArXiv)")
    print("5. All of the above")
    
    choice = input("Choose (1-5): ").strip()
    if not choice:
        choice = "5"
        print("Using default: All sources")
    
    return {
        "name": person_name,
        "email": person_email,
        "company": person_company,
        "title": person_title,
        "skills": person_skills,
        "location": person_location,
        "sources_choice": choice
    }

def process_person(person_info):
    """Process the person through TRA system"""
    print()
    print("🔄 Processing candidate through TRA system...")
    print("=" * 50)
    
    # Create the API request data based on user input
    request_data = {
        "sources": [],
        "processing_options": {
            "enable_contradiction_detection": True,
            "calculate_extraordinary_index": True,
            "generate_action_plans": True
        },
        "metadata": {
            "person_name": person_info["name"],
            "created_at": datetime.now().isoformat()
        }
    }
    
    # Add data sources based on user choice
    sources_choice = person_info["sources_choice"]
    
    if sources_choice in ["1", "5"]:  # GitHub
        request_data["sources"].append({
            "source_id": "github_profile",
            "source_type": "github",
            "url": f"https://api.github.com/users/{person_info['name'].lower().replace(' ', '')}",
            "metadata": {"person_name": person_info["name"]}
        })
        print("✅ Added GitHub profile source")
    
    if sources_choice in ["2", "5"]:  # Resume
        resume_content = f"{person_info['name']}\n{person_info['title']}\n{person_info['skills']}\n{person_info['company']}\n{person_info['location']}"
        request_data["sources"].append({
            "source_id": "resume_data",
            "source_type": "resume",
            "file_content": resume_content,
            "filename": f"{person_info['name'].lower().replace(' ', '_')}_resume.txt",
            "metadata": {"person_name": person_info["name"]}
        })
        print("✅ Added Resume/CV source")
    
    if sources_choice in ["3", "5"]:  # CRM
        request_data["sources"].append({
            "source_id": "crm_contact",
            "source_type": "crm",
            "data": {
                "first_name": person_info["name"].split()[0],
                "last_name": " ".join(person_info["name"].split()[1:]) if len(person_info["name"].split()) > 1 else "",
                "email": person_info["email"],
                "company": person_info["company"],
                "title": person_info["title"],
                "location": person_info["location"]
            },
            "metadata": {"person_name": person_info["name"]}
        })
        print("✅ Added CRM data source")
    
    if sources_choice in ["4", "5"]:  # ArXiv
        request_data["sources"].append({
            "source_id": "arxiv_papers",
            "source_type": "arxiv",
            "url": f"http://export.arxiv.org/api/query?search_query=au:{person_info['name'].replace(' ', '+')}",
            "metadata": {"person_name": person_info["name"]}
        })
        print("✅ Added Research Papers source")
    
    try:
        # Send request to TRA API
        print()
        print("📡 Sending data to TRA API...")
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
            print()
            print("👥 Fetching processed candidates...")
            candidates_response = requests.get("http://localhost:8000/candidates")
            if candidates_response.status_code == 200:
                candidates = candidates_response.json()
                print(f"📈 Found {len(candidates)} processed candidates")
                
                for candidate in candidates:
                    print()
                    print("🎯 CANDIDATE ANALYSIS RESULTS")
                    print("=" * 40)
                    print(f"👤 Name: {candidate['name']}")
                    print(f"📧 Email: {candidate['email']}")
                    print(f"📊 Extraordinary Index: {candidate['extraordinary_index']['overall_score']:.2f}/1.0")
                    print(f"🎯 Confidence Score: {candidate['confidence_score']:.2f}/1.0")
                    print(f"📁 Sources Processed: {candidate['source_count']}")
                    print(f"⚠️  Contradictions Found: {candidate['contradictions']}")
                    
                    print()
                    print("📈 DETAILED SCORES:")
                    print("-" * 20)
                    print(f"🚀 Innovation: {candidate['extraordinary_index']['innovation']:.2f}")
                    print(f"📈 Adoption: {candidate['extraordinary_index']['adoption']:.2f}")
                    print(f"🌟 Influence: {candidate['extraordinary_index']['influence']:.2f}")
                    print(f"⚡ Velocity: {candidate['extraordinary_index']['velocity']:.2f}")
                    print(f"🎯 Selectivity: {candidate['extraordinary_index']['selectivity']:.2f}")
                    
                    # Interpret the overall score
                    overall_score = candidate['extraordinary_index']['overall_score']
                    if overall_score >= 0.8:
                        rating = "🌟 EXCEPTIONAL"
                    elif overall_score >= 0.6:
                        rating = "⭐ EXCELLENT"
                    elif overall_score >= 0.4:
                        rating = "👍 GOOD"
                    else:
                        rating = "📝 NEEDS REVIEW"
                    
                    print()
                    print(f"🏆 OVERALL RATING: {rating}")
                    print(f"💡 This candidate has an {overall_score:.1%} Extraordinary Index score")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to TRA server")
        print("Make sure the server is running on http://localhost:8000")
        print("Run: python main_simple.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main function"""
    try:
        # Get person information
        person_info = get_person_info()
        
        # Process the person
        process_person(person_info)
        
        print()
        print("🎉 Analysis complete!")
        print("=" * 30)
        print("To analyze another person, run this script again.")
        print("To stop the server, press Ctrl+C in the server window.")
        
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()

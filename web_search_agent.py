import asyncio
import os
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.streaming import stream_async

load_dotenv()

dedalus_key = os.getenv('DEDALUS_API_KEY')
anthropic_key = os.getenv('ANTHROPIC_API_KEY')
serpapi_key = os.getenv('SERPAPI_KEY')

def get_person_info():
    """Get person's information from user input"""
    print("=== Personal Information Research Agent ===")
    print("Enter the person's details (press Enter to skip optional fields):")
    
    first_name = input("First Name: ").strip()
    last_name = input("Last Name: ").strip()
    school = input("School/University: ").strip()
    location = input("Location (City, State/Country): ").strip()
    additional_info = input("Any additional info (age, profession, interests, etc.): ").strip()
    
    if not first_name or not last_name:
        print("Error: First name and last name are required!")
        return None
    
    return {
        'first_name': first_name,
        'last_name': last_name,
        'school': school,
        'location': location,
        'additional_info': additional_info
    }

async def research_person(person_info):
    """Research information about a specific person"""
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    
    # Build search query based on available information
    query_parts = [f"{person_info['first_name']} {person_info['last_name']}"]
    
    if person_info['school']:
        query_parts.append(f"school: {person_info['school']}")
    
    if person_info['location']:
        query_parts.append(f"location: {person_info['location']}")
    
    if person_info['additional_info']:
        query_parts.append(person_info['additional_info'])
    
    search_query = " ".join(query_parts)
    
    research_prompt = f"""I need to research information about {person_info['first_name']} {person_info['last_name']}. 
    Please help me find:
    
    1. **Social Media Presence**: 
       - LinkedIn profile and professional information
       - Twitter/X posts and activity
       - Instagram, Facebook, or other social platforms
       - Any public social media posts or mentions
    
    2. **Academic & Professional Information**:
       - School/university records and achievements
       - Academic awards, honors, or recognitions
       - Research papers, publications, or projects
       - Professional accomplishments and career highlights
    
    3. **Competitions & Achievements**:
       - Academic competitions, hackathons, or contests
       - Sports achievements or athletic records
       - Awards, scholarships, or recognitions
       - Any notable competitions or events participated in
    
    4. **Personal Life & Fun Facts**:
       - Hobbies, interests, or special talents
       - Community involvement or volunteer work
       - Personal projects or side ventures
       - Interesting personal stories or achievements
       - Any public interviews, articles, or features
    
    5. **Online Presence**:
       - Personal websites or portfolios
       - GitHub, Stack Overflow, or other professional profiles
       - Any blogs, articles, or content they've created
       - News mentions or media coverage
    
    Search for: {search_query}
    
    Please provide a comprehensive summary with relevant links and sources. Focus on publicly available information and be respectful of privacy."""

    result = await runner.run(
        input=research_prompt,
        model="openai/gpt-4.1",
        mcp_servers=[
            "joerup/exa-mcp",        # Semantic search engine
            "tsion/brave-search-mcp"  # Privacy-focused web search
        ]
    )

    return result.final_output

async def main():
    """Main function to run the personal research agent"""
    while True:
        person_info = get_person_info()
        
        if person_info is None:
            continue
        
        print(f"\n🔍 Researching information about {person_info['first_name']} {person_info['last_name']}...")
        print("This may take a few moments...\n")
        
        try:
            results = await research_person(person_info)
            print("=" * 80)
            print(f"RESEARCH RESULTS FOR {person_info['first_name'].upper()} {person_info['last_name'].upper()}")
            print("=" * 80)
            print(results)
            print("\n" + "=" * 80)
            
        except Exception as e:
            print(f"❌ Error during research: {str(e)}")
        
        # Ask if user wants to research another person
        another = input("\nWould you like to research another person? (y/n): ").strip().lower()
        if another != 'y':
            break
    
    print("\n👋 Thank you for using the Personal Information Research Agent!")

if __name__ == "__main__":
    asyncio.run(main())

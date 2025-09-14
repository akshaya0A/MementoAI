import asyncio
import os
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.streaming import stream_async

load_dotenv()

dedalus_key = os.getenv('DEDALUS_API_KEY')
anthropic_key = os.getenv('ANTHROPIC_API_KEY')
serpapi_key = os.getenv('SERPAPI_KEY')

async def research_person_demo(first_name, last_name, school="", location="", additional_info=""):
    """Demo function to research information about a specific person"""
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    
    # Build search query based on available information
    query_parts = [f"{first_name} {last_name}"]
    
    if school:
        query_parts.append(f"school: {school}")
    
    if location:
        query_parts.append(f"location: {location}")
    
    if additional_info:
        query_parts.append(additional_info)
    
    search_query = " ".join(query_parts)
    
    research_prompt = f"""I need to research information about {first_name} {last_name}. 
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
    """Demo function with sample data"""
    # Sample person for demonstration
    sample_person = {
        'first_name': 'Elon',
        'last_name': 'Musk',
        'school': 'University of Pennsylvania',
        'location': 'Austin, Texas',
        'additional_info': 'CEO of Tesla and SpaceX, entrepreneur'
    }
    
    print("=" * 80)
    print("PERSONAL INFORMATION RESEARCH AGENT - DEMO")
    print("=" * 80)
    print(f"Researching: {sample_person['first_name']} {sample_person['last_name']}")
    print(f"School: {sample_person['school']}")
    print(f"Location: {sample_person['location']}")
    print(f"Additional Info: {sample_person['additional_info']}")
    print("=" * 80)
    print("🔍 Starting research... This may take a few moments...\n")
    
    try:
        results = await research_person_demo(
            sample_person['first_name'],
            sample_person['last_name'],
            sample_person['school'],
            sample_person['location'],
            sample_person['additional_info']
        )
        
        print("=" * 80)
        print(f"RESEARCH RESULTS FOR {sample_person['first_name'].upper()} {sample_person['last_name'].upper()}")
        print("=" * 80)
        print(results)
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"❌ Error during research: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())

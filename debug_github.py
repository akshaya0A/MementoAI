#!/usr/bin/env python3
"""
Debug script to test GitHub API directly
"""

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_github_api():
    """Test GitHub API directly"""
    username = "nic-olo"
    base_url = "https://api.github.com"
    token = os.getenv("GITHUB_TOKEN")
    
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
        print(f"🔑 Using GitHub token: {token[:10]}...")
    else:
        print("⚠️ No GitHub token found - using public API (rate limited)")
    
    async with aiohttp.ClientSession() as session:
        # Test user profile
        print(f"\n🔍 Testing GitHub API for user: {username}")
        
        try:
            url = f"{base_url}/users/{username}"
            print(f"📡 Requesting: {url}")
            
            async with session.get(url, headers=headers) as response:
                print(f"📊 Status Code: {response.status}")
                print(f"📋 Headers: {dict(response.headers)}")
                
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ SUCCESS! User found:")
                    print(f"   Name: {data.get('name', 'N/A')}")
                    print(f"   Login: {data.get('login', 'N/A')}")
                    print(f"   Public Repos: {data.get('public_repos', 'N/A')}")
                    print(f"   Followers: {data.get('followers', 'N/A')}")
                    print(f"   Following: {data.get('following', 'N/A')}")
                    print(f"   Location: {data.get('location', 'N/A')}")
                    print(f"   Bio: {data.get('bio', 'N/A')}")
                    
                elif response.status == 404:
                    print(f"❌ User '{username}' not found on GitHub")
                    
                elif response.status == 403:
                    print(f"❌ Rate limit exceeded or forbidden")
                    rate_limit = response.headers.get('X-RateLimit-Remaining', 'Unknown')
                    print(f"   Rate limit remaining: {rate_limit}")
                    
                else:
                    print(f"❌ Error: {response.status}")
                    error_text = await response.text()
                    print(f"   Error details: {error_text}")
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")
        
        # Test repositories
        try:
            url = f"{base_url}/users/{username}/repos"
            print(f"\n📡 Requesting repos: {url}")
            
            async with session.get(url, headers=headers) as response:
                print(f"📊 Status Code: {response.status}")
                
                if response.status == 200:
                    repos = await response.json()
                    print(f"✅ Found {len(repos)} repositories")
                    
                    if repos:
                        print(f"📁 Sample repos:")
                        for i, repo in enumerate(repos[:3]):
                            print(f"   {i+1}. {repo.get('name')} - {repo.get('stargazers_count', 0)} stars")
                    else:
                        print(f"📁 No repositories found")
                        
                else:
                    print(f"❌ Failed to get repositories: {response.status}")
                    
        except Exception as e:
            print(f"❌ Repos request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_github_api())

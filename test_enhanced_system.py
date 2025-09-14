#!/usr/bin/env python3
"""
Test the enhanced TRA system with background processing and status tracking
"""

import requests
import json
import time

def test_enhanced_system():
    """Test the enhanced system with background processing"""
    
    base_url = "http://localhost:8000"
    
    # Test payload
    payload = {
        "candidate_id": "nicolo-micheletti",
        "identifiers": {
            "github": "nic-olo",
            "linkedin": "https://www.linkedin.com/in/nicolo-m/",
            "arxiv": "Nicolo Micheletti",
            "pdfs": "nicolo_resume.pdf"
        },
        "data_sources": [
            "github",
            "arxiv",
            "linkedin",
            "pdfs"
        ],
        "include_social_media": True,
        "priority": "normal"
    }
    
    print("🚀 Testing Enhanced TRA System...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Step 1: Start processing
        print("\n📡 Step 1: Starting background processing...")
        response = requests.post(f"{base_url}/process-candidate", json=payload)
        
        if response.status_code != 200:
            print(f"❌ Failed to start processing: {response.status_code}")
            print(f"Error: {response.text}")
            return
        
        result = response.json()
        request_id = result["request_id"]
        print(f"✅ Processing started!")
        print(f"   Request ID: {request_id}")
        print(f"   Status: {result['status']}")
        print(f"   Message: {result['message']}")
        
        # Step 2: Monitor progress
        print(f"\n📊 Step 2: Monitoring progress...")
        max_wait_time = 30  # 30 seconds max
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            status_response = requests.get(f"{base_url}/status/{request_id}")
            
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"   Status: {status['status']} | Progress: {status['progress']:.1%} | Step: {status['current_step']}")
                
                if status['status'] == 'completed':
                    print(f"✅ Processing completed!")
                    break
                elif status['status'] == 'failed':
                    print(f"❌ Processing failed: {status.get('error_message', 'Unknown error')}")
                    return
            else:
                print(f"❌ Failed to get status: {status_response.status_code}")
                return
            
            time.sleep(1)  # Check every second
        
        # Step 3: Get final result
        print(f"\n📋 Step 3: Getting final result...")
        result_response = requests.get(f"{base_url}/result/{request_id}")
        
        if result_response.status_code == 200:
            final_result = result_response.json()
            print(f"✅ Final result retrieved!")
            
            # Show scores
            if 'extraordinary_index' in final_result:
                scores = final_result['extraordinary_index']
                print(f"\n📈 Concrete Scores:")
                print(f"   Innovation: {scores.get('innovation_score', 'N/A')}")
                print(f"   Adoption: {scores.get('adoption_score', 'N/A')}")
                print(f"   Influence: {scores.get('influence_score', 'N/A')}")
                print(f"   Velocity: {scores.get('velocity_score', 'N/A')}")
                print(f"   Selectivity: {scores.get('selectivity_score', 'N/A')}")
                print(f"   Overall: {scores.get('overall_score', 'N/A')}")
            
            # Show action plan
            if 'action_plan' in final_result:
                actions = final_result['action_plan'].get('actions', [])
                print(f"\n🎯 Action Plan:")
                print(f"   Actions Generated: {len(actions)}")
                for i, action in enumerate(actions, 1):
                    print(f"   {i}. {action.get('action_type', 'Unknown')} - {action.get('status', 'Unknown')}")
            
            print(f"\n⏱️ Processing Time: {final_result.get('processing_time_seconds', 'N/A')}s")
            print(f"👤 Human Review Required: {final_result.get('requires_human_review', 'N/A')}")
            
        else:
            print(f"❌ Failed to get result: {result_response.status_code}")
            print(f"Error: {result_response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - server not running")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check():
    """Test the enhanced health check"""
    
    base_url = "http://localhost:8000"
    
    print("\n🏥 Testing Health Check...")
    
    try:
        response = requests.get(f"{base_url}/health")
        
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Health Check Passed!")
            print(f"   Status: {health['status']}")
            print(f"   Version: {health['version']}")
            print(f"   Orchestrators:")
            for name, status in health['orchestrators'].items():
                print(f"     {name}: {status}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            print(f"Error: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - server not running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_health_check()
    test_enhanced_system()

import requests
import time

# Quick test samples
quick_samples = [
    "This movie was absolutely fantastic! The acting was superb and the plot was engaging.",
    "This was the worst experience ever. Terrible service and poor quality.",
    "The food was delicious and the service was excellent. Highly recommended!",
    "Awful product. Broke after a week and customer service was unhelpful.",
    "Great book! The writing is brilliant and the story is captivating."
]

def quick_test():
    """Quick test of the sentiment analysis API"""
    
    print("🚀 Quick Sentiment Analysis Test")
    print("=" * 40)
    
    # Check if server is running
    try:
        health_response = requests.get("http://localhost:5000/api/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Server is running!")
        else:
            print("❌ Server health check failed")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Please start the Flask app first:")
        print("   python app.py")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    print("\n📝 Testing samples:")
    print("-" * 40)
    
    for i, text in enumerate(quick_samples, 1):
        try:
            response = requests.post(
                "http://localhost:5000/api/predict",
                json={"text": text},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if "error" in result:
                    print(f"❌ Sample {i}: Error - {result['error']}")
                else:
                    sentiment = result.get("sentiment", "Unknown")
                    confidence = result.get("confidence", 0)
                    
                    # Add emoji based on sentiment
                    emoji = "😊" if sentiment == "Positive" else "😞" if sentiment == "Negative" else "😐"
                    
                    print(f"{emoji} Sample {i}: {sentiment} ({confidence}%)")
                    print(f"   Text: {text[:60]}...")
                    print()
            else:
                print(f"❌ Sample {i}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Sample {i}: Error - {e}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    print("🎯 Quick test completed!")

if __name__ == "__main__":
    quick_test() 
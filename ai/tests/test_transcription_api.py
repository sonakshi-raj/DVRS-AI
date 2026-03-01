"""
Test script for STT transcription API endpoint

This script tests the /api/transcribe endpoint with different audio/video formats.
"""

import requests
import sys
from pathlib import Path

AI_SERVICE_URL = "http://localhost:8000"


def test_health_check():
    """Check if AI service is running"""
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ AI Service is running")
            return True
        else:
            print(f"❌ AI Service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to AI service at {AI_SERVICE_URL}")
        print("   Make sure to run: python simple_api.py")
        return False


def test_transcribe_api(audio_file_path):
    """Test the transcription API with an audio file"""
    print(f"\n📤 Testing transcription with: {Path(audio_file_path).name}")
    print(f"   File size: {Path(audio_file_path).stat().st_size / 1024:.1f} KB")
    
    try:
        with open(audio_file_path, 'rb') as f:
            files = {'file': (Path(audio_file_path).name, f)}
            
            print("   Uploading and transcribing...")
            response = requests.post(
                f"{AI_SERVICE_URL}/api/transcribe",
                files=files,
                timeout=60  # 60 second timeout for transcription
            )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                result = data.get('data', {})
                print(f"\n✅ Transcription successful!")
                print(f"   Language: {result.get('language', 'unknown')}")
                print(f"   Words: {result.get('word_count', 0)}")
                print(f"   Characters: {result.get('char_count', 0)}")
                print(f"\n   Transcript:")
                print(f"   {'-' * 60}")
                print(f"   {result.get('text', '(empty)')}")
                print(f"   {'-' * 60}")
                return True
            else:
                print(f"❌ API returned success=false")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ API returned status {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timed out after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        return False


def find_sample_files():
    """Find sample audio/video files in the project"""
    samples_dir = Path(__file__).parent / "samples"
    if not samples_dir.exists():
        return []
    
    audio_extensions = ['.mp3', '.wav', '.m4a', '.webm', '.mp4', '.avi', '.flac', '.ogg']
    files = []
    for ext in audio_extensions:
        files.extend(samples_dir.glob(f"*{ext}"))
    
    return files


def main():
    """Run transcription API tests"""
    print("\n🧪 TESTING TRANSCRIPTION API")
    print("=" * 60)
    
    # Check if AI service is running
    if not test_health_check():
        print("\n⚠️  Please start the AI service first:")
        print("   cd ai")
        print("   python simple_api.py")
        return
    
    print("\n" + "=" * 60)
    
    # Find sample files
    sample_files = find_sample_files()
    
    if not sample_files:
        print("\n⚠️  No sample audio/video files found")
        print("\nTo test transcription:")
        print("  1. Create directory: ai/tests/samples/")
        print("  2. Add audio/video files (mp3, wav, webm, mp4, etc.)")
        print("  3. Run this test again")
        print("\nOR provide a file path:")
        
        file_path = input("\nEnter path to audio/video file (or press Enter to skip): ").strip()
        if file_path and Path(file_path).exists():
            sample_files = [Path(file_path)]
        else:
            print("\nSkipping transcription test.")
            return
    
    # Test each sample file
    print(f"\nFound {len(sample_files)} sample file(s)")
    results = []
    
    for i, sample_file in enumerate(sample_files, 1):
        print(f"\n{'=' * 60}")
        print(f"TEST {i}/{len(sample_files)}")
        print(f"{'=' * 60}")
        result = test_transcribe_api(str(sample_file))
        results.append((sample_file.name, result))
    
    # Summary
    print(f"\n{'=' * 60}")
    print("TEST SUMMARY")
    print(f"{'=' * 60}")
    for filename, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {filename}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

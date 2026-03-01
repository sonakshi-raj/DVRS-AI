"""
Test script for Speech-to-Text service

This script tests the STT abstraction layer and Whisper implementation.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from stt.stt_service import get_stt_service, WhisperLocalSTT


def check_dependencies():
    """Check if required dependencies are installed"""
    print("=" * 60)
    print("CHECKING DEPENDENCIES")
    print("=" * 60)
    
    # Check Whisper
    try:
        import whisper
        print(f"✅ openai-whisper is installed (version: {whisper.__version__ if hasattr(whisper, '__version__') else 'unknown'})")
    except ImportError as e:
        print(f"❌ openai-whisper not installed: {e}")
        print("\nTo install:")
        print("  pip install openai-whisper")
        return False
    
    # Check ffmpeg-python
    try:
        import ffmpeg
        print("✅ ffmpeg-python is installed")
    except ImportError:
        print("❌ ffmpeg-python not installed")
        print("\nTo install:")
        print("  pip install ffmpeg-python")
        return False
    
    # Check ffmpeg system binary
    import shutil
    if shutil.which('ffmpeg'):
        print("✅ ffmpeg system binary found")
    else:
        print("⚠️  ffmpeg system binary not found (optional for now)")
        print("   Whisper can still process many audio/video formats")
        print("\n   To install FFmpeg later:")
        print("   - Windows: Download from https://ffmpeg.org/download.html")
        print("   - Or use: winget install Gyan.FFmpeg")
    
    print()
    return True


def test_stt_abstraction():
    """Test the STT abstraction layer"""
    print("=" * 60)
    print("TEST 1: STT Abstraction Layer")
    print("=" * 60)
    
    # Test factory function
    try:
        stt = get_stt_service('whisper_local', model_size='base')
        print(f"✅ Created STT service: {stt.get_provider_name()}")
    except Exception as e:
        print(f"❌ Failed to create STT service: {e}")
        return False
    
    # Test invalid provider
    try:
        invalid_stt = get_stt_service('invalid_provider')
        print("❌ Should have raised error for invalid provider")
        return False
    except ValueError as e:
        print(f"✅ Correctly rejected invalid provider: {e}")
    
    print()
    return True


def test_whisper_transcription():
    """Test Whisper transcription with a sample sentence"""
    print("=" * 60)
    print("TEST 2: Whisper Transcription")
    print("=" * 60)
    print("\n⚠️  This test requires a sample audio/video file.")
    print("To test transcription:")
    print("1. Place an audio/video file in: ai/tests/samples/test_audio.mp3")
    print("2. Or provide a file path when prompted")
    
    # Check for sample file
    sample_file = Path(__file__).parent / "samples" / "test_audio.mp3"
    
    if not sample_file.exists():
        print(f"\n❌ Sample file not found: {sample_file}")
        print("\nSkipping transcription test for now.")
        print("You can test manually by:")
        print("  1. Creating ai/tests/samples/ directory")
        print("  2. Adding a test audio file (mp3, wav, webm, etc.)")
        print("  3. Running this test again")
        print()
        return True  # Don't fail the test, just skip
    
    try:
        # Create STT service
        stt = WhisperLocalSTT(model_size='base')
        print(f"\nUsing: {stt.get_provider_name()}")
        print(f"Transcribing: {sample_file.name}")
        
        # Transcribe
        result = stt.transcribe(str(sample_file))
        
        print("\n📝 TRANSCRIPTION RESULT:")
        print(f"   Text: {result['text']}")
        print(f"   Language: {result['language']}")
        print(f"   Confidence: {result['confidence']}")
        print("\n✅ Transcription successful!")
        
    except Exception as e:
        print(f"\n❌ Transcription failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    return True


def main():
    """Run all tests"""
    print("\n🧪 TESTING STT SERVICE")
    print("=" * 60)
    
    # Check dependencies first
    if not check_dependencies():
        print("\n⚠️  Please install missing dependencies and try again.")
        print("\nQuick install:")
        print("  pip install -r requirements.txt")
        return
    
    # Run tests
    tests = [
        ("STT Abstraction", test_stt_abstraction),
        ("Whisper Transcription", test_whisper_transcription),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    print("=" * 60)


if __name__ == "__main__":
    main()

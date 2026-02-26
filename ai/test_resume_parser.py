"""
Simple test script to verify resume parsing works before building API
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test imports
try:
    from resume_parsing.extraction.extract import extract_text
    from resume_parsing.cleaning.clean_text import clean_text
    from resume_parsing.llm.hf_llm import HuggingFaceLLM
    from resume_parsing.llm.llm_extract import extract_structured_resume
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test LLM initialization
try:
    llm = HuggingFaceLLM()
    print("✅ LLM initialized successfully")
    print(f"   Model: meta-llama/Meta-Llama-3-8B-Instruct")
except Exception as e:
    print(f"❌ LLM initialization failed: {e}")
    print("   Make sure HUGGINGFACEHUB_API_TOKEN is set in .env")
    sys.exit(1)

print("\n🎉 Resume parser is ready!")
print("\nNext: Test with actual resume file")

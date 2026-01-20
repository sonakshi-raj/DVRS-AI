import os
import json
from pathlib import Path
from resume_parsing.extraction.extract import extract_text
from resume_parsing.cleaning.clean_text import clean_text
from resume_parsing.llm.llm_extract import extract_structured_resume
from resume_parsing.llm.hf_llm import HuggingFaceLLM   

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = PROJECT_ROOT / ".env"

assert ENV_PATH.exists(), f".env not found at {ENV_PATH}"

for line in ENV_PATH.read_text().splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        os.environ[k] = v

def main():
    resume_path = Path(__file__).parent / "test_resume.pdf"
    assert resume_path.exists(), f"Resume not found at {resume_path}"

    raw = extract_text(resume_path)
    print("\n=== RAW ===\n", raw[:400])

    cleaned = clean_text(raw)
    print("\n=== CLEANED ===\n", cleaned[:400])

    # print("\n=== RAW ===\n", raw)
    # print("\n=== CLEANED ===\n", cleaned)

    llm = HuggingFaceLLM()
    structured = extract_structured_resume(llm, cleaned)

    print("\n=== STRUCTURED ===\n")
    print(json.dumps(structured.model_dump(), indent=2))


if __name__ == "__main__":
    main()

"""
Minimal FastAPI server - ONLY for resume parsing (Step 2)
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
from dotenv import load_dotenv

from resume_parsing.extraction.extract import extract_text
from resume_parsing.cleaning.clean_text import clean_text
from resume_parsing.llm.hf_llm import HuggingFaceLLM
from resume_parsing.llm.llm_extract import extract_structured_resume

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Resume Parser", version="0.1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200", "http://localhost:5002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM once
llm = None

def get_llm():
    global llm
    if llm is None:
        llm = HuggingFaceLLM()
    return llm

# Temp upload directory
TEMP_UPLOAD_DIR = Path(__file__).parent / "temp_uploads"
TEMP_UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "resume-parser", "version": "0.1.0"}


@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse uploaded resume and extract structured data
    """
    try:
        # Save uploaded file temporarily
        file_path = TEMP_UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text from PDF/DOCX
        raw_text = extract_text(file_path)
        
        # Clean the text
        cleaned_text = clean_text(raw_text)
        
        # Extract structured data using LLM
        llm_instance = get_llm()
        resume_data = extract_structured_resume(llm_instance, cleaned_text)
        
        # Clean up temp file
        file_path.unlink()
        
        return {
            "success": True,
            "data": resume_data.model_dump(),
            "message": "Resume parsed successfully"
        }
        
    except ValueError as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Resume Parser API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

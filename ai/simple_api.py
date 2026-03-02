"""
Minimal FastAPI server - Resume parsing and question generation
"""
from urllib import request

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from pathlib import Path
import shutil
from dotenv import load_dotenv

from resume_parsing.extraction.extract import extract_text
from resume_parsing.cleaning.clean_text import clean_text
from resume_parsing.llm.hf_llm import HuggingFaceLLM
from resume_parsing.llm.llm_extract import extract_structured_resume
from resume_parsing.llm.generate_question import generate_question
from resume_parsing.llm.evaluate_answer import evaluate_answer
from stt.stt_service import get_stt_service

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
stt = None

def get_llm():
    global llm
    if llm is None:
        llm = HuggingFaceLLM()
    return llm

def get_stt():
    global stt
    if stt is None:
        # Use 'small' model for better accuracy (base -> small -> medium -> large)
        # Options: 'tiny', 'base', 'small', 'medium', 'large'
        # 'small' is ~2x better than 'base' with moderate speed tradeoff
        stt = get_stt_service('whisper_local', model_size='small')
        print(f"Initialized STT: {stt.get_provider_name()}")
    return stt

# Temp upload directory
TEMP_UPLOAD_DIR = Path(__file__).parent / "temp_uploads"
TEMP_UPLOAD_DIR.mkdir(exist_ok=True)


# Pydantic models for request/response
class QuestionRequest(BaseModel):
    state: str  # introduction, resume-based, follow-up, deep-dive, closing
    resume_data: Optional[Dict] = None
    job_description: Optional[str] = None
    conversation_history: Optional[List[Dict]] = None


class EvaluationRequest(BaseModel):
    question: str
    answer: str
    state: Optional[str] = "unknown"
    resume_data: Optional[Dict] = None


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


@app.post("/api/generate-question")
async def generate_interview_question(request: QuestionRequest):
    """
    Generate interview question based on state and context
    """
    try:
        llm_instance = get_llm()
        
        question_data = generate_question(
            llm=llm_instance,
            state=request.state,
            resume_data=request.resume_data,
            job_description=request.job_description,
            conversation_history=request.conversation_history
        )
        
        return {
            "success": True,
            "data": question_data,
            "message": "Question generated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")


@app.post("/api/evaluate-answer")
async def evaluate_interview_answer(request: EvaluationRequest):
    """
    Evaluate an interview answer and return score, feedback, and signal
    """
    try:
        llm_instance = get_llm()
        print("DEBUG QUESTION:", request.question)
        print("DEBUG ANSWER:", request.answer)
        evaluation_result = evaluate_answer(
            llm=llm_instance,
            question=request.question,
            answer=request.answer,
            state=request.state,
            resume_data=request.resume_data
        )
        print("DEBUG EVALUATION RESULT:", evaluation_result)
        return {
            "success": True,
            "evaluation": evaluation_result
        }
        
    except Exception as e:
        print("🔥 FULL ERROR:", repr(e))
        raise


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio/video file to text using Whisper STT
    
    Supports: mp3, wav, m4a, webm, mp4, avi, etc.
    """
    # Validate file
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Save uploaded file temporarily
    temp_dir = Path("temp_uploads")
    temp_dir.mkdir(exist_ok=True)
    
    file_extension = Path(file.filename).suffix or ".webm"
    temp_path = temp_dir / f"audio_{Path(file.filename).stem}{file_extension}"
    
    try:
        # Save file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📁 Saved uploaded file: {temp_path.name} ({temp_path.stat().st_size} bytes)")
        
        # Get STT service
        stt_service = get_stt()
        
        # Transcribe
        result = stt_service.transcribe(str(temp_path))
        
        print(f"✅ Transcription complete: {len(result['text'])} characters")
        print("📝 Transcribed text:", result['text'])
        return {
            "transcript": result['text'],
            "language": result['language'],
            "word_count": len(result['text'].split()),
            "char_count": len(result['text'])
        }
        
    except Exception as e:
        print(f"❌ Transcription error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # pass
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()
            print(f"🗑️  Deleted temp file: {temp_path.name}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Resume Parser API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

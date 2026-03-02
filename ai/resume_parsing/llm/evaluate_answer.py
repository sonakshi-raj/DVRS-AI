"""
Answer evaluation using LLM with rubric-based scoring
"""
from pathlib import Path
import json
import re
from typing import Dict, Optional

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
if not token:
    raise RuntimeError("HUGGINGFACEHUB_API_TOKEN not set")

def load_evaluation_prompt() -> str:
    """Load the answer evaluation prompt template"""
    prompt_path = Path(__file__).parent / "prompts" / "answer_evaluation.txt"
    with open(prompt_path, 'r') as f:
        return f.read()


def evaluate_answer(
    llm,
    question: str,
    answer: str,
    state: str = "unknown",
    resume_data: Optional[Dict] = None
) -> Dict:
    """
    Evaluate an interview answer using LLM with rubric-based scoring

    Args:
        llm: LLM instance (HuggingFaceLLM)
        question: The interview question that was asked
        answer: The candidate's answer
        state: Current interview state (for context)
        resume_data: Optional resume data for context

    Returns:
        Dict with keys:
        - technical_accuracy (int 1-10)
        - depth (int 1-10)
        - clarity (int 1-10)
        - relevance (int 1-10)
        - final_score (float)
        - signal (GOOD/AVERAGE/BAD)
        - feedback (str)
    """

    # Prepare resume context
    resume_context = "Not available"
    if resume_data:
        name = resume_data.get('name', 'Unknown')
        skills = resume_data.get('skills', [])
        experience = resume_data.get('experience', [])

        skills_str = ', '.join(skills[:5]) if skills else 'Not listed'
        exp_count = len(experience) if experience else 0

        resume_context = f"Candidate: {name}, Skills: {skills_str}, Experience: {exp_count} positions"

    # Load and format prompt
    prompt_template = load_evaluation_prompt()
    prompt = prompt_template.format(
        question=question,
        answer=answer,
        state=state,
        resume_context=resume_context
    )

    # Call LLM
    try:
        response_obj = llm.invoke(prompt)

        # Extract content from response object
        content = getattr(response_obj, "content", None)
        if not content or not content.strip():
            raise ValueError("LLM returned empty response")

        response = content.strip()

        # Parse JSON response
        json_match = re.search(r'\{[^}]+\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(response)

        # Extract rubric scores
        technical = int(result.get("technical_accuracy", 5))
        depth = int(result.get("depth", 5))
        clarity = int(result.get("clarity", 5))
        relevance = int(result.get("relevance", 5))

        # Clamp values 1–10
        technical = max(1, min(10, technical))
        depth = max(1, min(10, depth))
        clarity = max(1, min(10, clarity))
        relevance = max(1, min(10, relevance))

        # Calculate weighted final score
        final_score = round(
            (technical * 0.40) +
            (depth * 0.25) +
            (clarity * 0.20) +
            (relevance * 0.15),
            2
        )

        signal = result.get("signal", "").upper()
        if signal not in ["GOOD", "AVERAGE", "BAD"]:
            if final_score >= 7:
                signal = "GOOD"
            elif final_score >= 4:
                signal = "AVERAGE"
            else:
                signal = "BAD"

        feedback = result.get("feedback", "Answer evaluated.")

        return {
            "technical_accuracy": technical,
            "depth": depth,
            "clarity": clarity,
            "relevance": relevance,
            "final_score": final_score,
            "signal": signal,
            "feedback": feedback
        }

    except Exception:
        # Fallback to basic scoring if LLM fails
        return {
            "technical_accuracy": 5,
            "depth": 5,
            "clarity": 5,
            "relevance": 5,
            "final_score": 5.0,
            "signal": "AVERAGE",
            "feedback": "Automated evaluation temporarily unavailable."
        }
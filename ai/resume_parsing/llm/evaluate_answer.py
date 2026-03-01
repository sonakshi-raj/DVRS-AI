"""
Answer evaluation using LLM
"""
from pathlib import Path
import json
import re
from typing import Dict, Optional


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
    Evaluate an interview answer using LLM
    
    Args:
        llm: LLM instance (HuggingFaceLLM)
        question: The interview question that was asked
        answer: The candidate's answer
        state: Current interview state (for context)
        resume_data: Optional resume data for context
        
    Returns:
        Dict with keys: score (int 1-10), feedback (str), signal (str)
    """
    
    # Prepare resume context
    resume_context = "Not available"
    if resume_data:
        # Extract relevant info from resume
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
        # Try to extract JSON from the response
        json_match = re.search(r'\{[^}]+\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(response)
        
        # Validate and normalize the result
        score = int(result.get('score', 5))
        score = max(1, min(10, score))  # Clamp between 1-10
        
        feedback = result.get('feedback', 'Answer evaluated.')
        signal = result.get('signal', 'AVERAGE').upper()
        
        # Validate signal
        if signal not in ['GOOD', 'AVERAGE', 'BAD']:
            # Derive from score
            if score >= 7:
                signal = 'GOOD'
            elif score >= 4:
                signal = 'AVERAGE'
            else:
                signal = 'BAD'
        
        return {
            'score': score,
            'feedback': feedback,
            'signal': signal
        }
        
    except Exception as e:
        # Fallback to basic scoring if LLM fails
        return {
            'score': 5,
            'feedback': f'Answer received. Automated evaluation temporarily unavailable.',
            'signal': 'AVERAGE'
        }

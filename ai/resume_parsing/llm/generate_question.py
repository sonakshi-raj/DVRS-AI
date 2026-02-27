"""
Question generation using LLM
"""
from pathlib import Path
import json
import re


def load_prompt_template():
    """Load question generation prompt template"""
    prompt_path = Path(__file__).parent / "prompts" / "question_generation.txt"
    return prompt_path.read_text()


def generate_question(llm, state, resume_data=None, job_description=None, conversation_history=None):
    """
    Generate interview question using LLM
    
    Args:
        llm: HuggingFaceLLM instance
        state: Current interview state (introduction, resume-based, follow-up, deep-dive, closing)
        resume_data: Parsed resume data (optional)
        job_description: Job description text (optional)
        conversation_history: List of previous Q&A pairs (optional)
    
    Returns:
        dict: Generated question with difficulty and category
    """
    # Load template
    template = load_prompt_template()
    
    # Build resume context
    resume_context = ""
    if resume_data:
        # Extract key info from resume
        skills = resume_data.get('skills', [])
        experiences = resume_data.get('experiences', [])
        projects = resume_data.get('projects', [])
        
        if skills:
            resume_context += f"\nCANDIDATE SKILLS: {', '.join(skills[:10])}"
        
        if experiences:
            exp_summary = []
            for exp in experiences[:3]:  # Top 3 experiences
                role = exp.get('role', 'N/A')
                org = exp.get('organization', 'N/A')
                exp_summary.append(f"{role} at {org}")
            resume_context += f"\nWORK EXPERIENCE: {'; '.join(exp_summary)}"
        
        if projects:
            proj_summary = []
            for proj in projects[:3]:  # Top 3 projects
                name = proj.get('name', 'N/A')
                techs = proj.get('technologies', [])
                proj_summary.append(f"{name} ({', '.join(techs[:3])})")
            resume_context += f"\nPROJECTS: {'; '.join(proj_summary)}"
    
    if not resume_context:
        resume_context = "\nCANDIDATE RESUME: Not provided"
    
    # Build conversation history
    history_text = ""
    if conversation_history and len(conversation_history) > 0:
        history_text = "\nPREVIOUS CONVERSATION:"
        for i, qa in enumerate(conversation_history[-3:], 1):  # Last 3 Q&A pairs
            history_text += f"\nQ{i}: {qa.get('question', 'N/A')}"
            history_text += f"\nA{i}: {qa.get('answer', 'N/A')[:200]}..."  # Truncate long answers
    else:
        history_text = "\nPREVIOUS CONVERSATION: None (this is the first question)"
    
    # Fill template
    prompt = template.format(
        state=state,
        job_description=job_description or "General technical interview",
        resume_context=resume_context,
        conversation_history=history_text
    )
    
    # Call LLM
    response = llm.invoke(prompt)
    response_text = response.content
    
    # Parse JSON from response
    try:
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            
            # Validate structure
            if 'question' in result:
                return {
                    'question': result.get('question', ''),
                    'difficulty': result.get('difficulty', 'medium'),
                    'category': result.get('category', 'technical')
                }
    except json.JSONDecodeError:
        pass
    
    # Fallback: return response as question
    return {
        'question': response_text.strip(),
        'difficulty': 'medium',
        'category': 'general'
    }

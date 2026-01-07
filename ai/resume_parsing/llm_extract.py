import json
from pathlib import Path
# from pydantic import ValidationError
from schema import ResumeSchema

def load_prompt() -> str:
    prompt_path = Path(__file__).resolve().parents[0] / "prompts" / "resume_extraction.txt"
    return prompt_path.read_text()

def build_prompt(resume_text: str, schema_json: str) -> str:
    template = load_prompt()
    return template.format(
        resume_text = resume_text,
        schema = schema_json
    )

def _parse_and_validate_response(resp) -> ResumeSchema:
    content = resp.content.strip()

    if not content:
        raise ValueError("LLM returned empty response")

    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:].strip()

    data = json.loads(content)
    return ResumeSchema.model_validate(data)



def extract_structured_resume(llm, cleaned_text: str) -> ResumeSchema:
    schema_json = ResumeSchema.model_json_schema()
    prompt = build_prompt(cleaned_text, json.dumps(schema_json, indent=2))

    response = llm.invoke(prompt)
    try:
        return _parse_and_validate_response(response)
    except ValueError as first_err:
        retry = llm.invoke(prompt)
        try:
            return _parse_and_validate_response(retry)
        except ValueError as second_err:
            repair_instructions = (
                "The previous response was intended to be JSON but is malformed. "
                "Here is the exact text the model returned:\n\n" + response.content + "\n\n"
                "Please transform the above into valid JSON that exactly matches the provided schema and "
                "return only the JSON with no surrounding markdown or explanations."
            )

            repair_prompt = repair_instructions + "\nSCHEMA:\n" + json.dumps(schema_json, indent=2)
            repair_response = llm.invoke(repair_prompt)
            try:
                return _parse_and_validate_response(repair_response)
            except ValueError as repair_err:
                raise RuntimeError(
                    "LLM failed to return valid structured JSON after two normal attempts and one repair attempt. "
                    f"First error: {first_err}; Second error: {second_err}; Repair error: {repair_err}"
                ) from repair_err
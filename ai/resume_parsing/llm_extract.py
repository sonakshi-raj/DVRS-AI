import json
from pathlib import Path
from pydantic import ValidationError
from .schema import ResumeSchema

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
    content = getattr(resp, "content", None)
    if not content or not content.strip():
        raise ValueError("LLM returned empty response")

    content = content.strip()

    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in LLM response")

    candidate = content[start:end + 1]

    try:
        data = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON returned by LLM") from exc

    try:
        return ResumeSchema.model_validate(data)
    except ValidationError as exc:
        raise ValueError("JSON does not match ResumeSchema") from exc

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

            repair_prompt = (
                "You MUST output a single valid JSON object.\n"
                "Do NOT include markdown, comments, or explanations.\n"
                "Do NOT include ``` fences.\n"
                "If a value is unknown, use null.\n\n"
                "Malformed response:\n"
                f"{response.content}\n\n"
                "Schema:\n"
                f"{json.dumps(schema_json, indent=2)}"
            )

            repair_response = llm.invoke(repair_prompt)
            try:
                return _parse_and_validate_response(repair_response)
            except ValueError as repair_err:
                raise RuntimeError(
                    "LLM failed after extraction, retry, and repair attempts"
                ) from repair_err

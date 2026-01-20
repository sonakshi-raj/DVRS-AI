from resume_parsing.llm.llm_extract import extract_structured_resume

class FakeResp:
    def __init__(self, content):
        self.content = content


class FlakyLLM:
    def __init__(self):
        self.calls = 0

    def invoke(self, prompt):
        self.calls += 1
        if self.calls == 1:
            return FakeResp("this is not json at all")
        return FakeResp("""
        {
          "skills": ["Python"],
          "experiences": [],
          "projects": [],
          "education": [],
          "extra_sections": []
        }
        """)


def test_retry_works():
    llm = FlakyLLM()
    result = extract_structured_resume(llm, "dummy resume")

    assert result.skills == ["Python"]
    assert llm.calls == 2

class BrokenThenRepairLLM:
    def __init__(self):
        self.calls = 0

    def invoke(self, prompt):
        self.calls += 1
        if self.calls <= 2:
            return FakeResp("```json { bad json")
        return FakeResp("""
        {
          "skills": [],
          "experiences": [],
          "projects": [],
          "education": [],
          "extra_sections": []
        }
        """)


def test_repair_path():
    llm = BrokenThenRepairLLM()
    result = extract_structured_resume(llm, "resume")

    assert result.skills == []
    assert llm.calls == 3
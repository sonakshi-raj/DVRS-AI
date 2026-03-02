import sys
from pathlib import Path

# Add the 'ai' folder to sys.path so we can import resume_parsing.llm modules
sys.path.append(str(Path(__file__).resolve().parents[1]))

from resume_parsing.llm.evaluate_answer import evaluate_answer
from resume_parsing.llm.hf_llm import HuggingFaceLLM  # adjust if filename is different

def main():
    llm = HuggingFaceLLM()

    examples = [
        {
            "question": "Explain the difference between a list and a tuple in Python.",
            "answer": "A list is mutable, while a tuple is immutable. Tuples can be used as dictionary keys.",
            "resume_data": {
                "name": "Alice",
                "skills": ["Python", "Data Structures"],
                "experience": [{"role": "Software Engineer"}]
            }
        },
        {
            "question": "What is a hash table and how does it work?",
            "answer": "A hash table maps keys to values using a hash function. It allows for fast lookups.",
            "resume_data": {
                "name": "Bob",
                "skills": ["Algorithms", "Python"],
                "experience": [{"role": "Backend Developer"}]
            }
        }
    ]

    for i, ex in enumerate(examples, 1):
        print(f"\n=== Example {i} ===")
        result = evaluate_answer(
            llm,
            question=ex["question"],
            answer=ex["answer"],
            state="technical",
            resume_data=ex["resume_data"]
        )
        print(result)

if __name__ == "__main__":
    main()
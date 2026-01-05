from extract_text import extract_text
from clean_text import clean_text

raw = extract_text("test_resume.pdf")
cleaned = clean_text(raw)

# print("RAW:\n", raw[:800])
print(cleaned)
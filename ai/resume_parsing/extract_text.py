from pathlib import Path
from typing import Union
from langchain_community.document_loaders import PyPDFLoader
from docx import Document
def extract_text(file_path: Union[str, Path]) -> str:
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"The file {file_path} does not exist.")
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return _extract_from_pdf(file_path)
    if suffix == ".docx":
        return _extract_from_docx(file_path)
    raise ValueError(f"Unsupported file type: {suffix}")
def _extract_from_pdf(file_path: Path) -> str:
    loader = PyPDFLoader(str(file_path))
    pages = loader.load()

    chunks = []
    for page in pages:
        if page.page_content:
            chunks.append(page.page_content.strip())

    return "\n\n".join(chunks)
def _extract_from_docx(file_path: Path) -> str:
    doc = Document(file_path)
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)
    return "\n".join(paragraphs)

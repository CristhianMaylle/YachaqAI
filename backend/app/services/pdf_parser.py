"""Extracción de texto de PDFs.

Usa LlamaParse como método principal.
Fallback a Tesseract OCR si el texto extraído < 100 caracteres.
"""
from pathlib import Path

from llama_parse import LlamaParse

from app.config import settings


async def extract_text(pdf_path: Path) -> str:
    parser = LlamaParse(
        api_key=settings.llamaparse_api_key,
        result_type="markdown",
    )
    documents = await parser.aload_data(str(pdf_path))

    text = "\n\n".join(doc.text for doc in documents)

    if len(text.strip()) < 100:
        text = _ocr_fallback(pdf_path)

    return text


def _ocr_fallback(pdf_path: Path) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_path

        images = convert_from_path(str(pdf_path))
        return "\n\n".join(pytesseract.image_to_string(img, lang="spa") for img in images)
    except Exception:
        return ""

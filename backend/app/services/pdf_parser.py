"""Extracción de texto de PDFs.

Usa LlamaParse como método principal.
Fallbacks:
1. pypdf para extracción local rápida de texto digital si LlamaParse no está configurado o falla.
2. Tesseract OCR si el texto extraído < 100 caracteres.
"""
from pathlib import Path
import logging

from llama_parse import LlamaParse
from app.config import settings

logger = logging.getLogger(__name__)


async def extract_text(pdf_path: Path) -> str:
    text = ""

    # 1. Intentar con LlamaParse si hay API Key configurada
    if settings.llamaparse_api_key.strip():
        try:
            parser = LlamaParse(
                api_key=settings.llamaparse_api_key,
                result_type="markdown",
            )
            documents = await parser.aload_data(str(pdf_path))
            text = "\n\n".join(doc.text for doc in documents)
        except Exception as e:
            logger.warning(f"LlamaParse falló o no está configurado correctamente: {e}. Usando extracción local.")

    # 2. Si no se extrajo texto (o falló LlamaParse), intentar extracción nativa local (pypdf)
    if len(text.strip()) < 100:
        text = _extract_text_pypdf(pdf_path)

    # 3. Si sigue teniendo menos de 100 caracteres (p. ej. es escaneado/imagen), usar OCR
    if len(text.strip()) < 100:
        text = _ocr_fallback(pdf_path)

    return text


def _extract_text_pypdf(pdf_path: Path) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\n\n".join(text)
    except Exception as e:
        logger.warning(f"Error al extraer texto con pypdf: {e}")
        return ""


def _ocr_fallback(pdf_path: Path) -> str:
    try:
        import pytesseract
        from pdf2image import convert_from_path

        images = convert_from_path(str(pdf_path))
        return "\n\n".join(pytesseract.image_to_string(img, lang="spa") for img in images)
    except Exception:
        return ""


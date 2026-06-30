"""Agente Evaluador — evalua respuestas de desarrollo (tipo 4).

La evaluacion ocurre en 2 llamadas separadas desde el frontend:
1. POST /evaluate/ → panel inmediato con feedback IA + calificacion sugerida
2. POST /srs/response → el usuario confirma o cambia la calificacion (soberania)

Esto permite mostrar el resultado de la IA sin comprometerlo antes de que el
usuario decida su calificacion final.
"""
from __future__ import annotations

import json
import re

from app.services.llm_gateway import gateway

EVALUADOR_SYSTEM = """\
Eres un evaluador pedagogico de respuestas de desarrollo para YachaqAI. \
Recibiras una pregunta conceptual, la respuesta esperada de referencia y \
la respuesta del estudiante. Tu tarea es evaluar si la respuesta del \
estudiante demuestra comprension real del concepto.

Responde SOLO en JSON valido con esta estructura:
{
  "ideas_cubiertas": ["idea 1 que el estudiante menciono correctamente", ...],
  "ideas_omitidas": ["idea importante que le faltó mencionar", ...],
  "errores": ["afirmacion incorrecta o confusa si la hay", ...],
  "calificacion_sugerida": "excelente|bien|dificil|olvidado",
  "justificacion": "1-2 oraciones explicando por que esta calificacion",
  "tip_de_estudio": "1 sugerencia concreta para reforzar el concepto"
}

CRITERIOS:
- excelente: cubre las ideas principales con precision, sin errores graves
- bien: cubre la mayoria de las ideas pero omite detalles relevantes
- dificil: muestra comprension parcial o tiene errores menores/imprecisiones
- olvidado: respuesta vaga, incorrecta, o insuficiente para demostrar comprension

Evalua el contenido conceptual, no el estilo de escritura. Sé justo y
constructivo. Si la respuesta es en espanol y el concepto es tecnico, acepta
terminos tecnicos en el idioma original (ingles).
"""

EVALUADOR_USER = """\
Pregunta: {question}

Respuesta esperada de referencia (no visible para el estudiante):
{expected_answer}

Respuesta del estudiante:
{user_answer}"""


def _parse_eval_json(text: str) -> dict:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {
        "ideas_cubiertas": [],
        "ideas_omitidas": [],
        "errores": [],
        "calificacion_sugerida": "dificil",
        "justificacion": "No se pudo parsear la evaluacion del modelo.",
        "tip_de_estudio": "Revisa el concepto e intenta nuevamente.",
    }


async def evaluate_answer(question: str, expected_answer: str, user_answer: str) -> dict:
    prompt = EVALUADOR_USER.format(
        question=question,
        expected_answer=expected_answer,
        user_answer=user_answer or "(sin respuesta)",
    )
    try:
        response = await gateway.generate(prompt=prompt, system=EVALUADOR_SYSTEM, response_format="json")
        return _parse_eval_json(response.text)
    except Exception as exc:
        return {
            "ideas_cubiertas": [],
            "ideas_omitidas": [],
            "errores": [str(exc)[:200]],
            "calificacion_sugerida": "dificil",
            "justificacion": "Error al contactar el modelo. Calibra tu calificacion manualmente.",
            "tip_de_estudio": "",
        }

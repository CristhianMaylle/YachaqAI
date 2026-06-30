from fastapi import APIRouter, Request

from app.agents.evaluador import evaluate_answer as _evaluate_answer

router = APIRouter()


@router.post("/")
async def evaluate(request: Request):
    """Evalua una respuesta de desarrollo (tipo 4) con IA.

    Llamado ANTES de POST /srs/response para mostrar el panel de feedback
    al usuario sin comprometer la calificacion todavia (soberania del usuario
    para confirmar o cambiar la sugerencia de la IA).
    """
    body = await request.json()
    question = body.get("question", "")
    expected = body.get("expected_answer", "")
    user_answer = body.get("user_answer", "")
    return await _evaluate_answer(question, expected, user_answer)

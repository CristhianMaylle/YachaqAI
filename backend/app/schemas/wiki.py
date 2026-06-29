from pydantic import BaseModel


class WikiQueryRequest(BaseModel):
    deck_id: str
    question: str


class WikiQueryResponse(BaseModel):
    answer: str
    sources: list[str] = []
    nodes_consulted: int = 0


class WikiArchiveRequest(BaseModel):
    deck_id: str
    content: str
    title: str

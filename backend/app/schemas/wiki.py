from pydantic import BaseModel


class WikiChatTurn(BaseModel):
    role: str
    content: str


class WikiQueryRequest(BaseModel):
    deck_id: str
    question: str
    history: list[WikiChatTurn] = []


class WikiCitation(BaseModel):
    id: str
    file: str
    title: str


class WikiQueryResponse(BaseModel):
    answer: str
    citations: list[WikiCitation] = []
    nodes_consulted: list[str] = []
    can_archive: bool = False


class WikiArchiveRequest(BaseModel):
    deck_id: str
    question: str = ""
    content: str
    title: str
    source_files: list[str] = []


class WikiArchiveResponse(BaseModel):
    success: bool
    file: str
    page_id: str

const API_URL = import.meta.env.VITE_FASTAPI_URL ?? 'http://localhost:8000';

export async function fetchNotebook(deckId: string, params?: string) {
  const url = params ? `/api/notebooks/${deckId}?${params}` : `/api/notebooks/${deckId}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchGraph(deckId: string) {
  const res = await fetch(`/api/notebooks/${deckId}/graph`);
  return res.json();
}

export async function fetchWikiPage(deckId: string, path: string) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`/api/notebooks/${deckId}/wiki/${encoded}`);
  return res.json();
}

export async function saveWikiPage(deckId: string, path: string, content: string) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return fetch(`/api/notebooks/${deckId}/wiki/${encoded}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function gradeSrs(deckId: string, conceptId: string, grade: string) {
  return fetch(`/api/notebooks/${deckId}/srs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conceptId, grade }),
  });
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchWikiPage, saveWikiPage } from "@/lib/notebook-api";

export function Editor() {
  const { deckId, "*": splat } = useParams();
  const navigate = useNavigate();
  const relPath = splat || "index.md";
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWikiPage(deckId!, relPath).then((data) => setContent(data.content || ""));
  }, [deckId, relPath]);

  async function handleSave() {
    setSaving(true);
    await saveWikiPage(deckId!, relPath, content);
    setSaving(false);
    const encoded = relPath.split("/").map(encodeURIComponent).join("/");
    navigate(`/deck/${deckId}/wiki/${encoded}`);
  }

  const encoded = relPath.split("/").map(encodeURIComponent).join("/");

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h1 className="font-heading text-lg font-semibold">Editar: {relPath}</h1>
          <p className="text-sm text-muted">Los cambios se guardan en el archivo Markdown.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/deck/${deckId}/wiki/${encoded}`}
            className="px-4 py-2 rounded-lg border border-border bg-background text-sm hover:bg-card transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-cyan text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 w-full p-6 font-mono text-sm resize-none focus:outline-none bg-background text-foreground"
        spellCheck={false}
      />
    </div>
  );
}

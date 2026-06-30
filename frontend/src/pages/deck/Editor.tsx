import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { marked } from "marked";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { Bold, Italic, Code, Link as LinkIcon, Table, Heading } from "lucide-react";
import { fetchWikiPage, saveWikiPage, fetchNotebook } from "@/lib/notebook-api";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?\n?([\s\S]*)$/;

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: "", body: raw };
  return { frontmatter: match[1], body: match[2] };
}

function joinFrontmatter(frontmatter: string, body: string): string {
  if (!frontmatter) return body;
  return `---\n${frontmatter}\n---\n\n${body}`;
}

function wrapSelection(viewRef: React.RefObject<ReactCodeMirrorRef | null>, before: string, after: string = before) {
  const view = viewRef.current?.view;
  if (!view) return;
  const { state } = view;
  const sel = state.selection.main;
  const selected = state.sliceDoc(sel.from, sel.to);
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: `${before}${selected}${after}` },
    selection: { anchor: sel.from + before.length, head: sel.from + before.length + selected.length },
  });
  view.focus();
}

function insertAtLineStart(viewRef: React.RefObject<ReactCodeMirrorRef | null>, prefix: string) {
  const view = viewRef.current?.view;
  if (!view) return;
  const { state } = view;
  const sel = state.selection.main;
  const line = state.doc.lineAt(sel.from);
  view.dispatch({
    changes: { from: line.from, insert: prefix },
    selection: { anchor: sel.from + prefix.length, head: sel.to + prefix.length },
  });
  view.focus();
}

function insertTable(viewRef: React.RefObject<ReactCodeMirrorRef | null>) {
  wrapSelection(viewRef, "\n| Columna 1 | Columna 2 |\n| --- | --- |\n| valor | valor |\n", "");
}

export function Editor() {
  const { deckId, "*": splat } = useParams();
  const navigate = useNavigate();
  const relPath = splat || "index.md";

  const [frontmatter, setFrontmatter] = useState("");
  const [body, setBody] = useState("");
  const [showFrontmatter, setShowFrontmatter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<{ file: string; title: string }[]>([]);
  const viewRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    fetchWikiPage(deckId!, relPath).then((data) => {
      const { frontmatter: fm, body: b } = splitFrontmatter(data.content || "");
      setFrontmatter(fm);
      setBody(b);
    });
  }, [deckId, relPath]);

  useEffect(() => {
    if (!deckId) return;
    fetchNotebook(deckId).then((data) => {
      if (data?.pages) {
        setPages(data.pages.map((p: any) => ({ file: p.file as string, title: p.title as string })));
      }
    });
  }, [deckId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveWikiPage(deckId!, relPath, joinFrontmatter(frontmatter, body));
      const encoded = relPath.split("/").map(encodeURIComponent).join("/");
      navigate(`/deck/${deckId}/wiki/${encoded}`);
    } finally {
      setSaving(false);
    }
  }, [deckId, relPath, frontmatter, body, navigate]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const wikilinkCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/\[\[[^\]]*/);
      if (!word) return null;
      const query = word.text.slice(2).toLowerCase();
      const options = pages
        .filter((p) => p.title.toLowerCase().includes(query))
        .slice(0, 20)
        .map((p) => ({
          label: p.title,
          detail: p.file,
          apply: `${p.file}|${p.title}]]`,
        }));
      if (options.length === 0) return null;
      return { from: word.from + 2, options };
    },
    [pages],
  );

  const extensions = useMemo(
    () => [markdown(), autocompletion({ override: [wikilinkCompletion] })],
    [wikilinkCompletion],
  );

  const previewHtml = useMemo(() => marked.parse(body) as string, [body]);

  const encoded = relPath.split("/").map(encodeURIComponent).join("/");

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h1 className="font-heading text-lg font-semibold">Editar: {relPath}</h1>
          <p className="text-sm text-muted">Ctrl+S para guardar. Los cambios se guardan en el archivo Markdown.</p>
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

      {frontmatter && (
        <div className="border-b border-border bg-card/30 px-6 py-2">
          <button
            onClick={() => setShowFrontmatter((v) => !v)}
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            {showFrontmatter ? "▼" : "▶"} Frontmatter (solo lectura)
          </button>
          {showFrontmatter && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-background p-3 text-[11px] text-muted font-mono">
              {frontmatter}
            </pre>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-border bg-card/30 px-4 py-1.5">
        <button onClick={() => wrapSelection(viewRef, "**")} title="Negrita" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <Bold size={14} />
        </button>
        <button onClick={() => wrapSelection(viewRef, "*")} title="Cursiva" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <Italic size={14} />
        </button>
        <button onClick={() => wrapSelection(viewRef, "`")} title="Codigo" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <Code size={14} />
        </button>
        <button onClick={() => wrapSelection(viewRef, "[", "](url)")} title="Link" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <LinkIcon size={14} />
        </button>
        <button onClick={() => insertAtLineStart(viewRef, "## ")} title="Encabezado" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <Heading size={14} />
        </button>
        <button onClick={() => insertTable(viewRef)} title="Tabla" className="p-1.5 rounded hover:bg-card text-muted hover:text-foreground transition-colors">
          <Table size={14} />
        </button>
        <span className="ml-2 text-[10px] text-muted">Escribe [[ para autocompletar wikilinks</span>
      </div>

      <div className="flex-1 grid grid-cols-2 min-h-0">
        <div className="overflow-auto border-r border-border">
          <CodeMirror
            ref={viewRef}
            value={body}
            onChange={setBody}
            extensions={extensions}
            theme="dark"
            height="100%"
            style={{ height: "100%", fontSize: "13px" }}
            basicSetup={{ lineNumbers: true, foldGutter: false }}
          />
        </div>
        <article
          className="prose prose-invert max-w-none overflow-auto p-6 text-xs leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}

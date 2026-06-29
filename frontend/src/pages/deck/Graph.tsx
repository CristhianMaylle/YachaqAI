import { useParams } from "react-router-dom";
import { NotebookGraph } from "@/components/graph/NotebookGraph";

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted">{label}</span>
    </div>
  );
}

export function Graph() {
  const { deckId } = useParams<{ deckId: string }>();

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h1 className="font-heading text-xl font-semibold">Grafo de conocimiento</h1>
          <p className="text-sm text-muted">Haz clic en un nodo para abrir su nota.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendItem color="#4CAF50" label="Dominado" />
          <LegendItem color="#FFC107" label="En practica" />
          <LegendItem color="#F44336" label="Critico" />
          <LegendItem color="#9E9E9E" label="Bloqueado" />
        </div>
      </div>
      <div className="flex-1 min-h-0 relative w-full h-full">
        <NotebookGraph deckId={deckId!} />
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { SRS_COLORS, type WikiNode, type WikiLink } from "@/types";
import { ForceGraph } from "./ForceGraph";
import { fetchGraph } from "@/lib/notebook-api";

const ESTADO_BAR_ITEMS = [
  { id: "dominado", label: "Dominados" },
  { id: "en_practica", label: "En practica" },
  { id: "critico", label: "Criticos" },
  { id: "bloqueado", label: "Bloqueados" },
] as const;

export function NotebookGraph({ deckId }: { deckId: string }) {
  const [graph, setGraph] = useState<{ nodes: WikiNode[]; edges: WikiLink[] } | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>("todos");
  const [selectedStates, setSelectedStates] = useState<Record<string, boolean>>({
    dominado: true,
    en_practica: true,
    critico: true,
    bloqueado: true,
    en_estudio: true,
  });

  useEffect(() => {
    fetchGraph(deckId).then(setGraph);
  }, [deckId]);

  const availableModules = useMemo(() => {
    if (!graph) return [];
    const mods = new Set<string>();
    graph.nodes.forEach((n) => { if (n.module) mods.add(n.module); });
    return Array.from(mods);
  }, [graph]);

  // Solo filtra por estado de maestria (oculta nodos). El modulo activo NO
  // oculta nodos — se le pasa a ForceGraph para que los atenue al 60% y
  // numere los del modulo activo (Modo Modulo Activo), conservando el grafo
  // completo visible para dar contexto.
  const stateFilteredGraph = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    const nodes = graph.nodes.filter((node) => selectedStates[node.estado_srs || "bloqueado"]);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((edge) => {
      const s = typeof edge.source === "object" ? (edge.source as any).id : edge.source;
      const t = typeof edge.target === "object" ? (edge.target as any).id : edge.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });
    return { nodes, edges };
  }, [graph, selectedStates]);

  const activeModuleNodes = useMemo(
    () => stateFilteredGraph.nodes.filter((n) => n.module === selectedModule),
    [stateFilteredGraph, selectedModule],
  );

  const activeModuleTitle = useMemo(() => {
    if (selectedModule === "todos" || !graph) return null;
    const moduleNode = graph.nodes.find((n) => n.id === selectedModule);
    return moduleNode?.label ?? selectedModule.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }, [graph, selectedModule]);

  const estadoCounts = useMemo(() => {
    const counts: Record<string, number> = { dominado: 0, en_practica: 0, critico: 0, bloqueado: 0 };
    stateFilteredGraph.nodes
      .filter((n) => n.type === "concepto")
      .forEach((n) => {
        const estado = n.estado_srs || "bloqueado";
        if (estado in counts) counts[estado] += 1;
      });
    return counts;
  }, [stateFilteredGraph]);

  if (!graph) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted text-sm font-medium animate-pulse">
        Cargando datos del grafo...
      </div>
    );
  }

  const toggleState = (state: string) => {
    setSelectedStates((prev) => ({ ...prev, [state]: !prev[state] }));
  };

  return (
    <div className="w-full h-full relative flex flex-col md:flex-row">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card p-5 flex flex-col gap-6 flex-shrink-0 z-10">
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Modulo Activo</h3>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full text-xs font-medium text-foreground bg-background border border-border rounded-lg p-2.5 outline-none focus:border-cyan transition-colors"
          >
            <option value="todos">Ninguno (exploracion libre)</option>
            {availableModules.map((mod) => (
              <option key={mod} value={mod}>{mod.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Estados de Maestria</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { id: "dominado", label: "Dominado", color: "bg-srs-dominado border-srs-dominado" },
              { id: "en_practica", label: "En Practica", color: "bg-srs-practica border-srs-practica" },
              { id: "critico", label: "Critico", color: "bg-srs-critico border-srs-critico" },
              { id: "en_estudio", label: "En Estudio", color: "bg-srs-estudio border-srs-estudio" },
              { id: "bloqueado", label: "Bloqueado", color: "bg-srs-bloqueado border-srs-bloqueado" },
            ].map((st) => (
              <label key={st.id} className="flex items-center gap-3 cursor-pointer group text-xs text-foreground font-medium select-none">
                <input type="checkbox" checked={selectedStates[st.id]} onChange={() => toggleState(st.id)} className="hidden" />
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                  selectedStates[st.id] ? `${st.color} text-white` : "border-border bg-background group-hover:border-muted"
                }`}>
                  {selectedStates[st.id] && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="group-hover:text-foreground transition-colors">{st.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-auto border-t border-border pt-4 text-[10px] text-muted flex flex-col gap-1">
          <span>Nodos visibles: {stateFilteredGraph.nodes.length} / {graph.nodes.length}</span>
          <span>Enlaces visibles: {stateFilteredGraph.edges.length} / {graph.edges.length}</span>
        </div>
      </div>
      <div className="flex-1 relative min-h-[400px] md:min-h-0 flex flex-col">
        {activeModuleTitle && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-card/95 backdrop-blur border border-cyan/30 px-4 py-1.5 text-xs font-semibold text-foreground shadow-lg">
            Modulo: <span className="text-cyan">{activeModuleTitle}</span>
            <span className="text-muted font-normal"> — {activeModuleNodes.length} nodos</span>
          </div>
        )}
        <div className="flex-1 relative">
          <ForceGraph
            deckId={deckId}
            nodes={stateFilteredGraph.nodes}
            edges={stateFilteredGraph.edges}
            activeModuleId={selectedModule !== "todos" ? selectedModule : undefined}
          />
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-border bg-card/80 backdrop-blur px-4 py-2 text-[11px] font-medium">
          {ESTADO_BAR_ITEMS.map((item) => (
            <span key={item.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SRS_COLORS[item.id] }} />
              <span className="text-muted">{item.label}:</span>
              <span className="text-foreground font-semibold">{estadoCounts[item.id]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

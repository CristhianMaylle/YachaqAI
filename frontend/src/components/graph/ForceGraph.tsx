import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type { WikiNode, WikiLink } from "@/types";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

interface ForceGraphProps {
  deckId: string;
  nodes: WikiNode[];
  edges: WikiLink[];
  width?: number;
  height?: number;
  readOnly?: boolean;
  centerNodeId?: string;
}

export function ForceGraph({
  deckId,
  nodes,
  edges,
  width,
  height,
  readOnly = false,
  centerNodeId,
}: ForceGraphProps) {
  const navigate = useNavigate();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<WikiNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<WikiNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (width && height) {
      setDimensions({ width, height });
      return;
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 500,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  const getMasteryColor = useCallback((node: WikiNode) => {
    const estado = node.estado_srs || "bloqueado";
    switch (estado) {
      case "dominado": return "#22c55e";
      case "en_practica": return "#f59e0b";
      case "critico": return "#ef4444";
      case "en_estudio": return "#3b82f6";
      case "bloqueado":
      default: return "#9ca3af";
    }
  }, []);

  const getNodeVal = useCallback((node: WikiNode) => {
    switch (node.type) {
      case "modulo":
      case "overview": return 14;
      case "fuente": return 10;
      case "concepto": return 7;
      case "entidad": return 5;
      default: return 6;
    }
  }, []);

  const adjList = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((n) => map.set(n.id, new Set()));
    edges.forEach((e) => {
      const s = typeof e.source === "object" ? (e.source as any).id : e.source;
      const t = typeof e.target === "object" ? (e.target as any).id : e.target;
      if (map.has(s)) map.get(s)?.add(t);
      if (map.has(t)) map.get(t)?.add(s);
    });
    return map;
  }, [nodes, edges]);

  const activeFocusId = selectedNode?.id || hoveredNode?.id;
  const activeNeighbors = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    return adjList.get(activeFocusId) || new Set<string>();
  }, [activeFocusId, adjList]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const n = node as WikiNode;
      if (readOnly) return;
      if (n.file) {
        const encoded = n.file.split("/").map(encodeURIComponent).join("/");
        navigate(`/deck/${deckId}/wiki/${encoded}`);
      }
    },
    [navigate, deckId, readOnly]
  );

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as WikiNode | null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      const isLocal = !!centerNodeId || nodes.length < 10;
      fgRef.current.d3Force("charge")?.strength(isLocal ? -60 : -250);
      fgRef.current.d3Force("link")?.distance((link: any) => {
        if (isLocal) return 50;
        return link.type === "prerrequisito" ? 120 : 90;
      });
      (fgRef.current.d3Force("x") as any)?.strength(isLocal ? 0.25 : 0.08);
      (fgRef.current.d3Force("y") as any)?.strength(isLocal ? 0.25 : 0.08);
      fgRef.current.d3ReheatSimulation();
    }
    const timer = setTimeout(() => {
      if (fgRef.current) fgRef.current.zoomToFit(200, 40);
    }, 450);
    return () => clearTimeout(timer);
  }, [nodes, centerNodeId]);

  const getLinkColor = useCallback(
    (link: any) => {
      if (!activeFocusId) return "#cbd5e1";
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      if (s === activeFocusId || t === activeFocusId) return "#3b82f6";
      return "#f1f5f9";
    },
    [activeFocusId]
  );

  const getLinkWidth = useCallback(
    (link: any) => {
      if (!activeFocusId) return 1.2;
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      return s === activeFocusId || t === activeFocusId ? 2.5 : 0.4;
    },
    [activeFocusId]
  );

  const graphData = useMemo(() => ({
    nodes: nodes.map((node) => {
      const { ...rest } = node as any;
      delete rest.fx;
      delete rest.fy;
      return rest;
    }),
    links: edges.map((edge) => {
      const s = typeof edge.source === "object" ? (edge.source as any).id : edge.source;
      const t = typeof edge.target === "object" ? (edge.target as any).id : edge.target;
      return { ...edge, source: s, target: t };
    }),
  }), [nodes, edges]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" onMouseMove={handleMouseMove}>
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted text-sm font-medium animate-pulse">Cargando visualizacion del grafo...</div>}>
        <ForceGraph2D
          ref={fgRef as any}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0D1B2A"
          nodeLabel={() => ""}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={() => setSelectedNode(null)}
          nodeVal={getNodeVal as any}
          linkWidth={getLinkWidth}
          linkColor={getLinkColor}
          linkLineDash={((link: any) => link.type === "relacionado" ? [2, 2] : null) as any}
          linkDirectionalArrowLength={(link: any) => (link.type === "prerrequisito" ? 4 : 0)}
          linkDirectionalArrowRelPos={0.95}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const n = node as any;
            const r = getNodeVal(n);
            const color = getMasteryColor(n);
            const isFocused = activeFocusId === n.id;
            const isNeighbor = activeNeighbors.has(n.id);
            const isDimmed = activeFocusId && !isFocused && !isNeighbor;

            ctx.save();
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI);
            if (isFocused) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
            ctx.fillStyle = isDimmed ? color + "22" : color;
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI);
            ctx.strokeStyle = isFocused ? "#e2e8f0" : "rgba(255,255,255,0.3)";
            ctx.lineWidth = isFocused ? 2 : 1;
            ctx.stroke();

            if (isFocused) {
              ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, r + 4, 0, 2 * Math.PI);
              ctx.strokeStyle = "rgba(0, 198, 251, 0.35)";
              ctx.lineWidth = 2;
              ctx.stroke();
            } else if (isNeighbor) {
              ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, r + 2, 0, 2 * Math.PI);
              ctx.strokeStyle = "rgba(0, 198, 251, 0.15)";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            const labelText = n.label;
            const showLabel = globalScale > 1.4 || isFocused || hoveredNode?.id === n.id;
            if (showLabel && labelText) {
              const fontSize = Math.max(6, 11 / globalScale);
              ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              const textY = (n.y ?? 0) + r + 3;
              const textWidth = ctx.measureText(labelText).width;
              ctx.fillStyle = "rgba(13,27,42,0.85)";
              ctx.fillRect((n.x ?? 0) - textWidth / 2 - 2, textY - 1, textWidth + 4, fontSize + 2);
              ctx.fillStyle = isDimmed ? "#8899A6" : "#E0E6ED";
              ctx.fillText(labelText, n.x ?? 0, textY);
            }
          }}
          cooldownTicks={100}
        />
      </Suspense>

      {hoveredNode && (
        <div
          className="absolute z-50 pointer-events-none p-3.5 bg-card/95 backdrop-blur border border-border rounded-xl shadow-lg w-56 flex flex-col gap-1.5 transition-opacity duration-150 animate-fade-in"
          style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">{hoveredNode.label}</span>
            <span className="text-[10px] text-muted uppercase font-medium tracking-wider mt-0.5">
              {hoveredNode.type} · {hoveredNode.category || hoveredNode.group}
            </span>
          </div>
          <div className="h-px bg-border my-0.5" />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted block">Dominio:</span>
              <span className="font-semibold text-foreground">{hoveredNode.maestria !== undefined ? Math.round(hoveredNode.maestria * 100) : 0}%</span>
            </div>
            <div>
              <span className="text-muted block">Estado SRS:</span>
              <span className="font-semibold capitalize" style={{ color: getMasteryColor(hoveredNode) }}>
                {(hoveredNode.estado_srs || "bloqueado").replace("_", " ")}
              </span>
            </div>
          </div>
          {hoveredNode.summary && (
            <div className="text-[10px] text-muted italic mt-1 line-clamp-2 border-t border-border border-dashed pt-1.5">
              {hoveredNode.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

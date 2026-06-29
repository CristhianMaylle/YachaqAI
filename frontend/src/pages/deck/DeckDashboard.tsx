import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchNotebook } from "@/lib/notebook-api";

export function DeckDashboard() {
  const { deckId } = useParams<{ deckId: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchNotebook(deckId!).then(setData);
  }, [deckId]);

  if (!data) {
    return <div className="p-10 animate-pulse text-muted">Cargando dashboard...</div>;
  }

  const { meta, stats } = data;
  const estado = stats?.estadoCounts || {};

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight mb-2">{meta.name}</h1>
        <p className="text-muted">{meta.description || "Cuaderno de estudio generado con YachaqAI."}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Conceptos" value={stats?.conceptCount || 0} />
        <StatCard label="Nodos totales" value={stats?.totalNodes || 0} />
        <StatCard label="Maestria" value={`${stats?.masteryAvg || 0}%`} />
        <StatCard label="Fuentes" value={stats?.sourceCount || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Distribucion de maestria</h3>
          <div className="space-y-3">
            <MasteryBar label="Dominado" count={estado.dominado || 0} total={stats?.conceptCount || 1} color="bg-srs-dominado" />
            <MasteryBar label="En practica" count={estado.en_practica || 0} total={stats?.conceptCount || 1} color="bg-srs-practica" />
            <MasteryBar label="Critico" count={estado.critico || 0} total={stats?.conceptCount || 1} color="bg-srs-critico" />
            <MasteryBar label="Bloqueado" count={estado.bloqueado || 0} total={stats?.conceptCount || 1} color="bg-srs-bloqueado" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Acciones rapidas</h3>
          <div className="space-y-2">
            <Link to={`/deck/${deckId}/documents/upload`} className="block w-full px-4 py-2 rounded-lg bg-cyan text-background text-sm font-medium text-center hover:opacity-90 transition-colors">
              Agregar fuentes
            </Link>
            <Link to={`/deck/${deckId}/graph`} className="block w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-center hover:bg-card transition-colors">
              Ver grafo
            </Link>
            <Link to={`/deck/${deckId}/wiki/index.md`} className="block w-full px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-center hover:bg-card transition-colors">
              Abrir wiki
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

function MasteryBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted">{count} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-background overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

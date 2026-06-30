export type NotebookMeta = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  domain?: string;
};

export type WikiNodeType = 'concepto' | 'entidad' | 'modulo' | 'fuente' | 'pregunta' | 'notebook' | 'overview';

export type WikiNode = {
  id: string;
  label: string;
  type: WikiNodeType;
  group?: string;
  maestria: number;
  estado_srs: string;
  file: string;
  summary?: string;
  module?: string;
  category?: string;
};

export type WikiLink = {
  source: string;
  target: string;
  type: string;
};

export type WikiPage = {
  notebookId: string;
  page_id: string;
  file: string;
  title: string;
  type: WikiNodeType;
  content: string;
  html: string;
  frontmatter: Record<string, unknown>;
  related: string[];
  maestria: number;
  estado_srs: string;
  last_updated: string;
};

export function colorForEstado(estado: string) {
  switch (estado) {
    case 'dominado':
      return '#22c55e';
    case 'en_practica':
      return '#f59e0b';
    case 'critico':
      return '#ef4444';
    case 'bloqueado':
    default:
      return '#9ca3af';
  }
}

export type SrsEstado = 'bloqueado' | 'en_estudio' | 'critico' | 'en_practica' | 'dominado';
export type SrsGrade = 'excelente' | 'bien' | 'dificil' | 'olvidado';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  level: string | null;
  exam_date: string | null;
  wiki_path: string;
  created_at: string;
}

export interface ReviewItem {
  slug: string;
  title: string;
  type: 'concepto' | 'entidad' | 'modulo';
  action: 'create' | 'update' | 'conflict';
  accepted: boolean;
  summary: string;
  prerequisites: string[];
  related: string[];
  module: string | null;
  conflict_detail: string | null;
  order?: number | null;
}

export interface IngestJob {
  id: string;
  deck_id: string;
  source_type: 'pdf' | 'url';
  source_name: string;
  storage_path: string | null;
  status: 'pending' | 'extracting' | 'analyzing' | 'analysis_done' | 'reviewed' | 'generating' | 'completed' | 'error';
  progress: number;
  stage: string | null;
  concepts_found: number;
  entities_found: number;
  modules_found: number;
  error_message: string | null;
  review_items: ReviewItem[] | null;
  review_status: 'pending' | 'analysis_done' | 'reviewed' | 'generating' | 'completed' | null;
  source_summary?: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface LLMModel {
  id: string;
  label: string;
  tier: 'fast' | 'quality';
}

export interface LLMProvider {
  id: string;
  label: string;
  available: boolean;
  models: LLMModel[];
  message: string | null;
}

export interface StudySession {
  id: string;
  deck_id: string;
  user_id: string;
  module_slug: string;
  session_type: 'nuevo' | 'repaso' | 'mixto';
  started_at: string;
  completed_at: string | null;
  results: Record<string, unknown> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  deck_id: string | null;
  read: boolean;
  created_at: string;
}

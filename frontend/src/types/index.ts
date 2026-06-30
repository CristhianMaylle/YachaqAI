export type NotebookMeta = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  domain?: string;
};

export type WikiNodeType = 'concepto' | 'entidad' | 'modulo' | 'fuente' | 'pregunta' | 'notebook' | 'overview';

export type WikiNodePrerequisite = {
  id: string;
  title: string;
};

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
  proximo_repaso?: string | null;
  n_preguntas?: number;
  prerequisites?: WikiNodePrerequisite[];
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

// Fuente unica de verdad para los colores semaforo SRS — debe coincidir
// con las variables --color-srs-* en src/styles/globals.css.
export const SRS_COLORS: Record<string, string> = {
  dominado: '#4CAF50',
  en_practica: '#FFC107',
  critico: '#F44336',
  bloqueado: '#9E9E9E',
  en_estudio: '#00C6FB',
};

export function colorForEstado(estado: string) {
  return SRS_COLORS[estado] ?? SRS_COLORS.bloqueado;
}

export type PlanModuleEstado =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'repaso_pendiente'
  | 'degradado'
  | 'bloqueado';

// Colores para los 6 estados del Plan Visual (P5.0). Reusa SRS_COLORS donde
// el significado coincide y agrega los 2 estados propios del plan.
export const PLAN_COLORS: Record<PlanModuleEstado, string> = {
  pendiente: SRS_COLORS.bloqueado,
  en_progreso: SRS_COLORS.en_estudio,
  completado: SRS_COLORS.dominado,
  repaso_pendiente: SRS_COLORS.en_practica,
  degradado: '#FF7043',
  bloqueado: '#5C6B7A',
};

export interface PlanModule {
  id: string;
  title: string;
  estado: PlanModuleEstado;
  retencion_promedio: number;
  n_conceptos: number;
}

export interface PlanEdge {
  source: string;
  target: string;
}

export interface Plan {
  modules: PlanModule[];
  edges: PlanEdge[];
  customization_applied?: boolean;
  instruction?: string;
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

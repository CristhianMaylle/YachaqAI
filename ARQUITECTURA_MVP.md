# YachaqAI -- Arquitectura MVP

> **Fecha:** 28 de junio de 2026
> **Stack:** Vite + React (frontend) | FastAPI + Python (backend) | Supabase (DB + Auth + Storage)
> **Estructura:** Monorepo con dos carpetas separadas: `frontend/` y `backend/`
> **Decision:** Se migra de Next.js a Vite. Se empieza de cero reutilizando la logica ya validada del prototipo existente.

---

## 1. Estructura del Proyecto

```
yachaqai/
├── frontend/                      # Vite + React + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── main.tsx               # Entry point
│   │   ├── App.tsx                # Router principal
│   │   ├── router.tsx             # React Router v7 con rutas protegidas
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Cliente Supabase (auth + db + storage)
│   │   │   ├── api.ts             # Cliente FastAPI (solo endpoints de IA)
│   │   │   └── utils.ts           # cn(), formatDate(), etc.
│   │   ├── stores/
│   │   │   ├── auth.store.ts      # Zustand: usuario, sesion
│   │   │   ├── deck.store.ts      # Zustand: mazo actual, paginas, grafo cacheado
│   │   │   ├── study.store.ts     # Zustand: sesion de estudio activa
│   │   │   └── llm.store.ts       # Zustand: proveedores disponibles, modelo activo
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui primitivos (Button, Card, Dialog...)
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx   # Sidebar + TopBar (wrapper autenticado)
│   │   │   │   └── AuthLayout.tsx # Layout para login/registro (sin sidebar)
│   │   │   ├── graph/
│   │   │   │   ├── KnowledgeGraph.tsx      # React Flow v12 principal
│   │   │   │   ├── NodeTooltip.tsx         # Tooltip de nodo (P4.2)
│   │   │   │   └── ModuleBadge.tsx         # Badge numerico modo modulo
│   │   │   ├── study/
│   │   │   │   ├── QuizFillBlank.tsx       # Tipo 1: completar oracion
│   │   │   │   ├── QuizMatchTerms.tsx      # Tipo 2: relacionar terminos
│   │   │   │   ├── QuizDiagram.tsx         # Tipo 3: diagrama incompleto
│   │   │   │   ├── QuizDevelopment.tsx     # Tipo 4: desarrollo + eval IA
│   │   │   │   └── FsrsGradeButtons.tsx    # 4 botones calificacion
│   │   │   ├── wiki/
│   │   │   │   ├── MarkdownRenderer.tsx    # remark/rehype con Mermaid
│   │   │   │   ├── WikiSidebar.tsx         # Arbol de archivos
│   │   │   │   └── CodeMirrorEditor.tsx    # Editor split view
│   │   │   ├── dashboard/
│   │   │   │   ├── StreakBar.tsx           # Racha diaria
│   │   │   │   ├── MasteryChart.tsx        # Torta distribucion
│   │   │   │   └── RetentionLine.tsx       # Linea temporal 30 dias
│   │   │   └── ingest/
│   │   │       ├── PdfDropZone.tsx         # Drop zone con validacion
│   │   │       └── IngestProgress.tsx      # Barra 7 etapas (Realtime)
│   │   ├── pages/
│   │   │   ├── Landing.tsx                # P1.1
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx              # P1.3
│   │   │   │   ├── Register.tsx           # P1.2
│   │   │   │   └── ResetPassword.tsx      # P1.4
│   │   │   ├── onboarding/
│   │   │   │   └── OnboardingWizard.tsx   # P2.1-P2.6 (6 pasos internos)
│   │   │   ├── deck/
│   │   │   │   ├── Documents.tsx          # P3.1
│   │   │   │   ├── Upload.tsx             # P3.2
│   │   │   │   ├── Health.tsx             # P3.3
│   │   │   │   ├── Graph.tsx              # P4.1 (+ P4.2, P4.3 como estados)
│   │   │   │   ├── Plan.tsx               # P5.0
│   │   │   │   ├── Wiki.tsx               # P5.2 lectura
│   │   │   │   ├── Editor.tsx             # P5.3 edicion
│   │   │   │   ├── Review.tsx             # P5.6 repaso SRS
│   │   │   │   └── LlmWiki.tsx            # P6.3 chat
│   │   │   ├── session/
│   │   │   │   ├── Prep.tsx               # P5.1
│   │   │   │   ├── Quiz.tsx               # P5.4
│   │   │   │   ├── Summary.tsx            # P5.5
│   │   │   │   ├── Resources.tsx          # P5.7
│   │   │   │   └── Reinforce.tsx          # P5.8
│   │   │   ├── Dashboard.tsx              # P6.1
│   │   │   ├── Stats.tsx                  # P6.2
│   │   │   └── Settings.tsx               # P6.4
│   │   ├── styles/
│   │   │   └── globals.css                # Tailwind + dark mode + design tokens
│   │   └── types/
│   │       └── index.ts                   # WikiNode, WikiLink, WikiPage, etc.
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json                    # shadcn/ui config
│   └── package.json
│
├── backend/                       # FastAPI + Python 3.12
│   ├── app/
│   │   ├── main.py                # FastAPI app, CORS, lifespan
│   │   ├── config.py              # Settings (env vars, paths)
│   │   ├── dependencies.py        # Supabase client, auth verification
│   │   ├── routers/
│   │   │   ├── llm.py             # GET /llm/providers, GET /llm/active, PUT /llm/select
│   │   │   ├── ingest.py          # POST /ingest/process, GET /ingest/status/{id}
│   │   │   ├── wiki.py            # POST /wiki/query, POST /wiki/archive
│   │   │   ├── srs.py             # POST /srs/grade
│   │   │   ├── schedule.py        # POST /schedule/parse
│   │   │   ├── plan.py            # POST /plan/customize
│   │   │   ├── lint.py            # POST /lint/analyze
│   │   │   └── evaluate.py        # POST /evaluate
│   │   ├── agents/
│   │   │   ├── ingesta.py         # Agente Ingesta 2 pasos: analisis → review → generacion
│   │   │   ├── evaluador.py       # Agente Evaluador (Gemini 2.5 Flash)
│   │   │   ├── llm_wiki.py        # Agente LLM Wiki (Gemini + 4 senales relevancia)
│   │   │   ├── scheduler.py       # Agente Scheduler (Gemini 2.5 Flash)
│   │   │   └── lint.py            # Agente LINT (+ insights Louvain)
│   │   ├── services/
│   │   │   ├── llm_gateway.py     # Capa abstraccion multi-LLM (Gemini/Groq/OpenAI/Claude)
│   │   │   ├── pdf_parser.py      # LlamaParse + Tesseract fallback
│   │   │   ├── wiki_builder.py    # Genera archivos .md con frontmatter
│   │   │   ├── graph_builder.py   # Grafo NetworkX + Louvain community detection
│   │   │   ├── fsrs_engine.py     # py-fsrs wrapper + propagacion Graph-SRS
│   │   │   └── wiki_navigator.py  # Relevancia 4 senales + expansion 2-hop
│   │   └── schemas/
│   │       ├── ingest.py          # Pydantic models para ingesta
│   │       ├── srs.py             # Pydantic models para SRS
│   │       └── wiki.py            # Pydantic models para wiki
│   ├── data/
│   │   └── notebooks/             # Wikis generadas (archivos .md)
│   │       └── {deck-slug}/
│   │           ├── YACHAQ.md
│   │           ├── index.md
│   │           ├── 1. fuentes_transformadas/
│   │           ├── 2. conceptos/
│   │           ├── 3. entidades/
│   │           ├── 4. preguntas/
│   │           └── 5. modulos/
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
├── .env.example                   # Template de variables de entorno
└── README.md                      # Como levantar ambos servicios
```

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                   USUARIO (Browser)                   │
└─────────────────────┬────────────────────────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   frontend/ (Vite + React)   │
       │   React 19 + TypeScript      │
       │   Tailwind v4 + shadcn/ui    │
       │   React Router v7            │
       │   React Flow v12 (grafo)     │
       │   Recharts (metricas)        │
       │   Zustand (estado global)    │
       │   @supabase/supabase-js      │
       └──┬──────────────┬───────────┘
          │              │
    Datos/Auth      IA (lo pesado)
          │              │
   ┌──────▼──────┐  ┌───▼──────────────────┐
   │  SUPABASE    │  │  backend/ (FastAPI)   │
   │              │  │  Python 3.12          │
   │  - Auth      │  │                       │
   │  - PostgreSQL│  │  8 endpoints de IA:   │
   │  - Storage   │  │  /ingest/process      │
   │  - Realtime  │  │  /ingest/status/{id}  │
   │              │  │  /wiki/query           │
   │              │  │  /wiki/archive         │
   │              │  │  /srs/grade            │
   │              │  │  /schedule/parse       │
   │              │  │  /plan/customize       │
   │              │  │  /evaluate             │
   │              │  │  /lint/analyze         │
   └──────────────┘  └──┬──────┬────────────┘
          ▲              │      │
          │  Lee/escribe │      │ APIs externas
          │  resultados  │      │
          └──────────────┘      │
                           ┌────▼──────────────────┐
                           │  LLM Providers         │
                           │  (segun API keys):      │
                           │   ◆ Gemini 2.5 Flash    │
                           │   ◆ Groq (Llama 3.3)    │
                           │   ◆ OpenAI (GPT-4o)     │
                           │   ◆ Anthropic (Claude)   │
                           │                         │
                           │  Extraccion:            │
                           │   ◆ LlamaParse          │
                           │   ◆ Tesseract (local)   │
                           └─────────────────────────┘
```

### Regla de oro

| El frontend llama a... | Para... |
|:---|:---|
| **Supabase directamente** | Auth, CRUD, storage, realtime (todo lo que es leer/escribir datos) |
| **FastAPI** | Cualquier operacion que necesite LLM (Gemini/Groq/OpenAI/Claude), LlamaParse, FSRS o logica de IA |

---

## 3. Stack Completo

### Frontend (`frontend/`)

| Tecnologia | Rol |
|:---|:---|
| **Vite 6** | Bundler (~300ms cold start, ~50ms HMR) |
| **React 19** | UI |
| **TypeScript** | Tipado estricto |
| **React Router v7** | Routing SPA (reemplaza App Router de Next.js) |
| **Tailwind CSS v4** | Estilos con dark mode por defecto |
| **shadcn/ui** | Componentes accesibles (Button, Card, Dialog, Select, Tabs, Progress, Tooltip, Toast) |
| **@supabase/supabase-js** | Cliente Supabase (auth + db + storage + realtime) |
| **@xyflow/react** | React Flow v12 -- grafo interactivo |
| **recharts** | Graficos del dashboard y estadisticas |
| **zustand** | Estado global (auth, deck, study session) |
| **@codemirror/view + state + lang-markdown** | Editor markdown split view |
| **remark + remark-html + remark-gfm** | Renderizado markdown |
| **rehype-raw + rehype-sanitize** | Sanitizacion HTML |
| **lucide-react** | Iconos (25+ especificados en los docs) |
| **@fontsource/inter + space-grotesk + jetbrains-mono** | Fuentes (reemplaza next/font) |
| **dompurify** | Sanitizacion contra XSS |

```bash
# Crear proyecto
npm create vite@latest frontend -- --template react-ts
cd frontend

# Core
npm i react-router-dom @supabase/supabase-js zustand

# UI
npm i tailwindcss @tailwindcss/vite lucide-react class-variance-authority clsx tailwind-merge
npm i @fontsource/inter @fontsource/space-grotesk @fontsource/jetbrains-mono

# Grafo + Graficos
npm i @xyflow/react recharts

# Editor + Markdown
npm i @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/theme-one-dark
npm i remark remark-html remark-gfm rehype-raw rehype-sanitize

# Seguridad
npm i dompurify
npm i -D @types/dompurify
```

### Backend (`backend/`)

| Tecnologia | Rol |
|:---|:---|
| **FastAPI** | Framework API (solo endpoints de IA) |
| **uvicorn** | Servidor ASGI |
| **supabase** | Cliente Python para leer/escribir en la misma DB |
| **google-generativeai** | SDK Gemini 2.5 Flash / Pro |
| **groq** | SDK Groq (Llama 3, Mixtral — inferencia ultra-rapida) |
| **openai** | SDK OpenAI (GPT-4o, GPT-4o-mini) |
| **anthropic** | SDK Anthropic (Claude Sonnet, Haiku) |
| **llama-parse** | Extraer texto estructurado de PDFs |
| **pytesseract** | OCR fallback para PDFs escaneados |
| **py-fsrs** | Algoritmo FSRS v5 real |
| **networkx** | Grafo en memoria (orden topologico, propagacion SRS) |
| **pyyaml** | Leer/escribir frontmatter YAML de archivos .md |
| **python-multipart** | Recibir archivos via multipart/form-data |

```bash
cd backend
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows

pip install fastapi uvicorn python-multipart
pip install supabase
pip install google-generativeai groq openai anthropic
pip install llama-parse pytesseract
pip install py-fsrs networkx pyyaml
```

### Supabase

| Servicio | Que reemplaza |
|:---|:---|
| **Auth** | JWT custom, bcrypt, NextAuth, Google OAuth manual, reset password, email transaccional |
| **PostgreSQL** | SQLite, SQLAlchemy, Alembic |
| **Storage** | Cloudflare R2 (bucket `pdfs` para archivos subidos) |
| **Realtime** | Polling de status de ingesta (suscripcion a cambios en `ingest_jobs`) |

---

## 4. Routing (React Router v7)

Reemplaza el App Router de Next.js. Todas las rutas especificadas en los documentos:

```tsx
// frontend/src/router.tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  // --- Publicas ---
  { path: '/', element: <Landing /> },                           // P1.1
  { path: '/auth/login', element: <Login /> },                   // P1.3
  { path: '/auth/register', element: <Register /> },             // P1.2
  { path: '/auth/reset-password', element: <ResetPassword /> },  // P1.4

  // --- Protegidas (requieren auth) ---
  {
    element: <AuthGuard />,  // Wrapper que verifica supabase.auth.getUser()
    children: [
      { path: '/onboarding/:step', element: <OnboardingWizard /> },  // P2.1-P2.6
      { path: '/dashboard', element: <Dashboard /> },                 // P6.1
      { path: '/dashboard/stats', element: <Stats /> },               // P6.2
      { path: '/settings', element: <Settings /> },                   // P6.4

      // --- Deck (mazo) ---
      { path: '/deck/:deckId/documents', element: <Documents /> },           // P3.1
      { path: '/deck/:deckId/documents/upload', element: <Upload /> },       // P3.2
      { path: '/deck/:deckId/health', element: <Health /> },                 // P3.3
      { path: '/deck/:deckId/graph', element: <Graph /> },                   // P4.1
      { path: '/deck/:deckId/plan', element: <Plan /> },                     // P5.0
      { path: '/deck/:deckId/wiki/*', element: <Wiki /> },                   // P5.2
      { path: '/deck/:deckId/editor/*', element: <Editor /> },               // P5.3
      { path: '/deck/:deckId/review', element: <Review /> },                 // P5.6
      { path: '/deck/:deckId/wiki-chat', element: <LlmWiki /> },            // P6.3

      // --- Session (sesion de estudio) ---
      { path: '/deck/:deckId/session/:sessionId/prep', element: <Prep /> },         // P5.1
      { path: '/deck/:deckId/session/:sessionId/quiz', element: <Quiz /> },         // P5.4
      { path: '/deck/:deckId/session/:sessionId/summary', element: <Summary /> },   // P5.5
      { path: '/deck/:deckId/session/:sessionId/resources', element: <Resources /> }, // P5.7
      { path: '/deck/:deckId/session/:sessionId/reinforce', element: <Reinforce /> }, // P5.8
    ]
  }
])
```

---

## 5. Quien llama a quien

### Frontend → Supabase (directo, sin FastAPI)

| Operacion | Codigo |
|:---|:---|
| Registro | `supabase.auth.signUp({ email, password })` |
| Login | `supabase.auth.signInWithPassword({ email, password })` |
| Login Google | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Reset password | `supabase.auth.resetPasswordForEmail(email)` |
| Listar mazos | `supabase.from('decks').select('*')` |
| Crear mazo | `supabase.from('decks').insert({ name, user_id })` |
| Leer SRS states | `supabase.from('srs_states').select('*').eq('deck_id', id)` |
| Leer notificaciones | `supabase.from('notifications').select('*').eq('read', false)` |
| Subir PDF | `supabase.storage.from('pdfs').upload(path, file)` |
| Progreso ingesta (realtime) | `supabase.channel('jobs').on('postgres_changes', { table: 'ingest_jobs' }, cb)` |
| Guardar preferencias | `supabase.from('profiles').update({ notification_prefs })` |

### Frontend → FastAPI (solo IA)

| Operacion | Endpoint | Cuando |
|:---|:---|:---|
| Procesar PDF subido | `POST /ingest/process` | Sprint 1 |
| Estado de ingesta | `GET /ingest/status/{jobId}` | Sprint 1 |
| Construir grafo desde .md | `GET /graph/{deckId}` | Sprint 2 |
| Leer pagina wiki (.md) | `GET /wiki/{deckId}/page/{path}` | Sprint 2 |
| Guardar edicion wiki | `PUT /wiki/{deckId}/page/{path}` | Sprint 2 |
| Personalizar plan con NL | `POST /plan/customize` | Sprint 2 |
| Calificar + calcular FSRS | `POST /srs/grade` | Sprint 3 |
| Evaluar respuesta desarrollo | `POST /evaluate` | Sprint 3 |
| Consultar LLM Wiki | `POST /wiki/query` | Sprint 4 |
| Archivar respuesta wiki | `POST /wiki/archive` | Sprint 4 |
| Ejecutar LINT | `POST /lint/analyze` | Sprint 4 |
| Parsear disponibilidad NL | `POST /schedule/parse` | Sprint 5 |
| Proveedores LLM disponibles | `GET /llm/providers` | Sprint 1 |
| Modelo activo | `GET /llm/active` | Sprint 1 |
| Cambiar modelo | `PUT /llm/select` | Sprint 1 |

### FastAPI → Supabase (leer/escribir resultados)

```python
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Actualizar progreso ingesta (frontend lo ve via Realtime)
supabase.table('ingest_jobs').update({
    'status': 'analyzing',
    'progress': 45,
    'stage': 'Identificando conceptos...',
    'concepts_found': 12
}).eq('id', job_id).execute()

# Guardar SRS despues de calcular con py-fsrs
supabase.table('srs_states').upsert({
    'deck_id': deck_id,
    'concept_slug': slug,
    'estado': 'dominado',
    'maestria': 0.95,
    'proximo_repaso': '2026-07-15'
}).execute()
```

---

## 6. Donde vive cada dato

```
frontend/ (Vite)
  Solo UI. No almacena datos. Llama a Supabase y FastAPI.

backend/ (FastAPI)
  Sin estado local. No guarda archivos. Solo procesa y delega a Supabase.

Supabase (nube) — TODO vive aqui:
  PostgreSQL:
    profiles         → datos extendidos del usuario
    decks            → mazos (nombre, objetivo)
    ingest_jobs      → estado de procesamiento de PDFs
    schedule_slots   → horarios de estudio
    study_sessions   → sesiones completadas + resultados
    srs_states       → estado FSRS por concepto
    srs_responses    → historial de respuestas
    notifications    → alertas y recordatorios
  Storage:
    bucket "wikis"   → archivos .md de la wiki (el producto de la ingesta)
      {deck-id}/
        YACHAQ.md                     ← esquema (reglas para Gemini)
        index.md                      ← catalogo raiz
        log.md                        ← registro actividad
        1. fuentes_transformadas/     ← textos extraidos de PDFs
        2. conceptos/                 ← wiki de conceptos (.md con [[wikilinks]])
        3. entidades/                 ← wiki de entidades
        4. preguntas/                 ← preguntas SRS por concepto
        5. modulos/                   ← agrupaciones topologicas
    bucket "pdfs"    → archivos PDF originales (opcional, para re-ingesta)
      {deck-id}/
        nombre-archivo.pdf
  Auth:
    auth.users       → cuentas (email, password hash, Google ID)
```

> **Nota:** El backend NO almacena nada localmente. Los .md se suben/descargan
> de Supabase Storage bajo demanda. Un cache en memoria evita descargas
> repetidas durante una misma operacion del agente LLM Wiki.

---

## 7. Migracion: que se reutiliza del prototipo actual

| Del prototipo Next.js | Se reutiliza en Vite como... |
|:---|:---|
| `ForceGraph.tsx` (logica de colores semaforo, hover, tooltip) | Base para `KnowledgeGraph.tsx` (migrar a React Flow v12) |
| `NotebookShell.tsx` (sidebar colapsable, 8 items nav) | Base para `AppShell.tsx` (misma estructura, dark mode) |
| `wiki/[...path]/page.tsx` (sidebar arbol, frontmatter card, markdown render) | Dividir en `Wiki.tsx` + `WikiSidebar.tsx` + `MarkdownRenderer.tsx` |
| `srs/page.tsx` (flujo flashcard, 4 botones FSRS) | Base para `Quiz.tsx` + `FsrsGradeButtons.tsx` |
| `chat/page.tsx` (layout 2 paneles, chips sugerencia) | Layout para `LlmWiki.tsx` (conectar a endpoint real) |
| `schedule/page.tsx` (grid calendario semanal) | Base para onboarding paso 6 (P2.6) |
| `lib/types.ts` (WikiNode, WikiLink, WikiPage) | Copiar a `frontend/src/types/index.ts` |
| `lib/fs-wiki.ts` (parseFrontmatter, buildGraph, extractWikiLinks) | Migrar a `backend/app/services/` (wiki_builder, graph_builder) |
| `lib/seed-networking.ts` (estructura de archivos .md, frontmatter YAML) | Referencia para el formato que debe generar el Agente Ingesta |
| `tailwind.config.ts` (colores FSRS, fuentes, keyframes) | Base para nuevo `tailwind.config.ts` con paleta dark mode |
| `globals.css` (prose overrides, tokens CSS) | Base para nuevo `globals.css` con `#0D1B2A` como fondo |

**Lo que NO se reutiliza:**
- `lib/data.ts` (datos hardcodeados, codigo muerto)
- `components/TopNav.tsx` (nunca se uso)
- `components/Toast.tsx` (nunca se uso)
- `seed-networking.ts` como fuente de datos (se reemplaza por ingesta real)
- API Routes de Next.js (`app/api/...`) -- se reemplazan por FastAPI + Supabase
- `next.config.mjs`, `app/layout.tsx` -- especificos de Next.js

---

## 8. Variables de Entorno

```env
# frontend/.env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_FASTAPI_URL=http://localhost:8000

# backend/.env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
LLAMAPARSE_API_KEY=

# --- LLM Providers (al menos 1 requerido) ---
GOOGLE_AI_API_KEY=           # Gemini 2.5 Flash / Pro
GROQ_API_KEY=                # Llama 3.3 70B, Mixtral, Gemma 2
OPENAI_API_KEY=              # GPT-4o, GPT-4o-mini
ANTHROPIC_API_KEY=           # Claude Sonnet 4, Haiku
```

**Total: 10 variables** (3 frontend, 7 backend).
Solo las API keys de LLM que se configuren estaran disponibles en la interfaz.
El backend valida al iniciar cuales tienen valor y expone solo esos proveedores.

---

## 9. Como levantar el proyecto

```bash
# Terminal 1: Frontend
cd frontend
npm install
npm run dev          # Vite en http://localhost:5173

# Terminal 2: Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # FastAPI en http://localhost:8000
```

---

## 10. Esquema de Base de Datos (Supabase)

```sql
-- Perfiles extendidos (auth.users lo maneja Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Lima',
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  notification_prefs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  level TEXT,
  exam_date DATE,
  wiki_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  storage_path TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  stage TEXT,
  concepts_found INTEGER DEFAULT 0,
  entities_found INTEGER DEFAULT 0,
  modules_found INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT DEFAULT 'nuevo'
);

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  module_slug TEXT NOT NULL,
  session_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  results JSONB
);

CREATE TABLE srs_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  concept_slug TEXT NOT NULL,
  estado TEXT DEFAULT 'bloqueado',
  maestria REAL DEFAULT 0,
  retentiva REAL DEFAULT 0,
  estabilidad REAL DEFAULT 0,
  dificultad REAL DEFAULT 5.0,
  ultimo_repaso DATE,
  proximo_repaso DATE,
  veces_olvidado INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deck_id, concept_slug)
);

CREATE TABLE srs_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES study_sessions(id),
  deck_id UUID REFERENCES decks(id),
  concept_slug TEXT NOT NULL,
  question_file TEXT NOT NULL,
  question_type TEXT NOT NULL,
  user_answer TEXT,
  grade TEXT NOT NULL,
  ai_evaluation JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  deck_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_decks" ON decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_srs" ON srs_states FOR ALL
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "own_sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_responses" ON srs_responses FOR ALL
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "own_notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Trigger: crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 11. Resumen Visual

```
ANTES (Next.js monolito):            AHORA (Vite + FastAPI separados):

yachaqai/                             yachaqai/
├── app/          (pages + API)       ├── frontend/     (solo UI)
├── components/                       │   ├── src/pages/
├── lib/          (logica mixta)      │   ├── src/components/
├── next.config                       │   ├── src/stores/    (Zustand)
└── package.json                      │   └── src/lib/supabase.ts
                                      │
                                      ├── backend/      (solo IA)
                                      │   ├── app/routers/   (8 endpoints)
                                      │   ├── app/agents/    (4 agentes)
                                      │   ├── app/services/  (PDF, wiki, FSRS)
                                      │   └── data/notebooks/ (.md files)
                                      │
                                      └── Supabase      (datos + auth)
                                          ├── Auth
                                          ├── PostgreSQL (8 tablas)
                                          ├── Storage (PDFs)
                                          └── Realtime
```

| Aspecto | Antes | Ahora |
|:---|:---|:---|
| Frontend framework | Next.js 15 | **Vite 6 + React Router v7** |
| HMR | ~500ms-1s | **~50ms** |
| Cold start dev | ~3-5s | **~300ms** |
| Backend | API Routes Next.js (simuladas) | **FastAPI dedicado (IA real)** |
| Auth | No existia | **Supabase Auth (0 codigo)** |
| Base de datos | Filesystem (.md) | **Supabase PostgreSQL + filesystem (.md para wiki)** |
| Storage | Local | **Supabase Storage** |
| Deploy frontend | Solo Vercel | **Cualquier CDN (build estatico)** |
| API Keys | 0 (todo simulado) | **3 (Supabase + Gemini + LlamaParse)** |

---

## 12. Mejoras Inspiradas en LLM Wiki (nashsu/llm_wiki)

> Tres patrones arquitectonicos adoptados del proyecto open-source
> [llm_wiki](https://github.com/nashsu/llm_wiki) para mejorar la calidad
> de la ingesta, navegacion y visualizacion del conocimiento en YachaqAI.

### 12.1 Pipeline de Ingesta en 2 Pasos con Review Humano

El prototipo actual planifica una pipeline lineal de 7 etapas donde Gemini genera
la wiki de golpe. LLM Wiki demostro que separar **analisis** de **generacion**
produce wikis mas precisas y permite correccion humana antes de generar contenido.

**Arquitectura de 2 pasos:**

```
PDF
 │
 ▼
┌───────────────────────────────────────────┐
│ PASO 1: ANALISIS (Gemini 2.5 Flash)       │
│                                           │
│ Entrada: texto extraido (LlamaParse)      │
│ Salida:  plan de ingesta (JSON)           │
│   - conceptos identificados               │
│   - entidades detectadas                  │
│   - relaciones y prerrequisitos           │
│   - modulos sugeridos                     │
│   - conflictos con wiki existente         │
│                                           │
│ NO genera archivos .md todavia            │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│ REVIEW HUMANO (frontend)                  │
│                                           │
│ El usuario ve el plan antes de generar:   │
│  ✓ Lista de conceptos a crear/actualizar  │
│  ✓ Relaciones propuestas                  │
│  ✓ Conflictos detectados con fuentes      │
│    anteriores (resaltados en amarillo)     │
│  ✓ Checkboxes para aceptar/rechazar       │
│    conceptos individuales                 │
│  ✓ Boton "Confirmar y generar wiki"       │
│                                           │
│ Items de review se guardan en:            │
│   Supabase → ingest_jobs.review_items     │
└─────────────────┬─────────────────────────┘
                  │ (usuario confirma)
                  ▼
┌───────────────────────────────────────────┐
│ PASO 2: GENERACION (Gemini 2.5 Flash)     │
│                                           │
│ Entrada: plan aprobado + texto original   │
│ Salida:  archivos .md reales              │
│   - frontmatter YAML completo             │
│   - [[wikilinks]] entre conceptos         │
│   - preguntas SRS (4 tipos)               │
│   - modulos con orden topologico          │
│                                           │
│ Solo genera lo que el usuario aprobo      │
└───────────────────────────────────────────┘
```

**Cambios en la base de datos:**

```sql
-- Agregar columna para items de review en ingest_jobs
ALTER TABLE ingest_jobs ADD COLUMN review_items JSONB;
-- Estructura: [{ slug, title, type, action: "create"|"update"|"conflict", accepted: bool }]

ALTER TABLE ingest_jobs ADD COLUMN review_status TEXT DEFAULT 'pending';
-- Valores: 'pending' | 'analysis_done' | 'reviewed' | 'generating' | 'completed'
```

**Cambios en el flujo de estados de ingest_jobs:**

```
pending → extracting → analyzing → analysis_done → (espera review) → reviewed → generating → completed
                                                                                     │
                                                                                     └→ error
```

**Impacto en el backend (`agents/ingesta.py`):**

```python
async def run_ingesta_pipeline(job_id, deck_id, raw_path, wiki_path):
    # Etapa 1-3: extraccion + analisis (igual que antes)
    # Etapa 4: Gemini genera PLAN, no archivos
    analysis = await gemini_analyze(text, existing_wiki)
    # Guardar plan para review humano
    update_progress("analysis_done", 50, "Esperando revision...",
                    review_items=analysis["items"])
    # --- PAUSA: el frontend muestra el review ---
    # La funcion retorna aqui. Un segundo endpoint retoma:

async def run_generation_after_review(job_id, deck_id, approved_items):
    # Solo genera .md para items con accepted=True
    for item in approved_items:
        if item["accepted"]:
            await gemini_generate_page(item, ...)
```

**Impacto en el frontend:**

- Nuevo componente `IngestReview.tsx` en la pantalla P3.2 (Upload)
- Despues de la barra de progreso, aparece una lista de items para revisar
- El usuario puede aceptar/rechazar conceptos individuales antes de generar

### 12.2 Algoritmo de Relevancia de 4 Senales (wiki_navigator.py)

El plan actual para `wiki_navigator.py` usa navegacion por wikilinks con un limite
de 3 saltos. LLM Wiki demostro que un modelo de relevancia multi-senal produce
resultados significativamente mejores al consultar la wiki.

**Implementacion en `services/wiki_navigator.py`:**

```
                    Pregunta del usuario
                           │
                           ▼
              ┌────────────────────────┐
              │   Busqueda inicial     │
              │   (keyword matching)   │
              └───────────┬────────────┘
                          │ paginas candidatas
                          ▼
              ┌────────────────────────┐
              │  Scoring de 4 senales  │
              │  por cada candidata    │
              └───────────┬────────────┘
                          │ score final
                          ▼
              ┌────────────────────────┐
              │  Top-K paginas         │
              │  ordenadas por score   │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Gemini sintetiza      │
              │  respuesta con citas   │
              └────────────────────────┘
```

**Las 4 senales y sus pesos:**

| # | Senal | Peso | Que mide |
|:---|:---|:---|:---|
| 1 | **Wikilinks directos** | ×3.0 | Paginas enlazadas directamente desde/hacia la pagina semilla. Una referencia explicita es una relacion fuerte |
| 2 | **Fuentes compartidas** | ×4.0 | Paginas generadas desde el mismo PDF fuente. Si dos conceptos vienen del mismo documento, es muy probable que esten relacionados |
| 3 | **Vecinos comunes (Adamic-Adar)** | ×1.5 | Paginas que comparten vecinos en el grafo pero no estan enlazadas directamente. Usa el indice de Adamic-Adar: `sum(1 / log(degree(z)))` para cada vecino comun `z`. Vecinos raros pesan mas que vecinos muy conectados |
| 4 | **Afinidad de tipo** | ×1.0 | Bonus si la pagina candidata es del mismo tipo que la pagina semilla (concepto-concepto, entidad-entidad). Penaliza mezclar tipos muy diferentes |

**Score final de una pagina candidata:**

```
score(p) = w1 * wikilink_signal(p)
         + w2 * shared_source_signal(p)
         + w3 * adamic_adar_signal(p)
         + w4 * type_affinity_signal(p)
```

**Expansion en 2 hops:**

El sistema no se limita a los enlaces directos. Expande la busqueda a 2 niveles
de profundidad en el grafo, pero penaliza el segundo hop con un factor de decaimiento
de 0.5 para priorizar paginas mas cercanas.

**Codigo conceptual (`services/wiki_navigator.py`):**

```python
import math
import networkx as nx

WEIGHTS = {
    "wikilink":      3.0,
    "shared_source": 4.0,
    "adamic_adar":   1.5,
    "type_affinity":  1.0,
}
HOP2_DECAY = 0.5

def relevance_score(
    graph: nx.Graph,
    seed: str,
    candidate: str,
    source_map: dict[str, list[str]],
) -> float:
    score = 0.0

    # Senal 1: wikilink directo
    if graph.has_edge(seed, candidate):
        score += WEIGHTS["wikilink"]

    # Senal 2: fuentes compartidas
    seed_sources = set(source_map.get(seed, []))
    cand_sources = set(source_map.get(candidate, []))
    if seed_sources & cand_sources:
        score += WEIGHTS["shared_source"]

    # Senal 3: Adamic-Adar (vecinos comunes)
    common = set(graph.neighbors(seed)) & set(graph.neighbors(candidate))
    aa_sum = sum(1.0 / math.log(max(graph.degree(z), 2)) for z in common)
    score += WEIGHTS["adamic_adar"] * aa_sum

    # Senal 4: afinidad de tipo
    seed_type = graph.nodes[seed].get("type", "")
    cand_type = graph.nodes[candidate].get("type", "")
    if seed_type == cand_type:
        score += WEIGHTS["type_affinity"]

    return score


def find_relevant_pages(
    graph: nx.Graph,
    query_seeds: list[str],
    source_map: dict[str, list[str]],
    top_k: int = 10,
) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}

    for seed in query_seeds:
        # Hop 1: vecinos directos
        for neighbor in graph.neighbors(seed):
            s = relevance_score(graph, seed, neighbor, source_map)
            scores[neighbor] = scores.get(neighbor, 0) + s

        # Hop 2: vecinos de vecinos (con decaimiento)
        for n1 in graph.neighbors(seed):
            for n2 in graph.neighbors(n1):
                if n2 != seed and n2 not in query_seeds:
                    s = relevance_score(graph, seed, n2, source_map) * HOP2_DECAY
                    scores[n2] = scores.get(n2, 0) + s

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]
```

**Dependencias:** ya incluido `networkx` en `requirements.txt`.

**Control de presupuesto de contexto:**

Al enviar paginas a Gemini, el sistema respeta un presupuesto de tokens:

| Componente | % del context window |
|:---|:---|
| Contenido wiki (paginas relevantes) | 60% |
| Historial de chat | 20% |
| Indice (titulos + resumenes) | 5% |
| System prompt + instrucciones | 15% |

Si las top-K paginas exceden el 60%, se truncan los cuerpos mas largos
preservando el frontmatter y primer parrafo.

### 12.3 Louvain Community Detection para el Grafo

El grafo actual agrupa nodos por modulo (asignado por Gemini durante la ingesta).
LLM Wiki demostro que aplicar deteccion de comunidades automatica revela clusters
de conocimiento que no coinciden con los modulos predefinidos — por ejemplo,
conceptos de distintos modulos que forman un "puente" tematico.

**Donde se aplica:**

```
┌─────────────────────────────────────────────────┐
│              Grafo de Conocimiento               │
│                                                  │
│  Vista actual:                                   │
│    Colores = estado SRS (semaforo)                │
│    Agrupacion = modulo asignado por Gemini        │
│                                                  │
│  Vista nueva (toggle en frontend):               │
│    Colores = comunidad Louvain                    │
│    Clusters = descubiertos automaticamente        │
│    Insights = conexiones sorprendentes            │
│                                                  │
│  Ambas vistas coexisten. El usuario alterna       │
│  entre "Vista Modulos" y "Vista Comunidades"      │
│  con un toggle en la barra superior del grafo.    │
└─────────────────────────────────────────────────┘
```

**Algoritmo Louvain:**

Louvain es un algoritmo de deteccion de comunidades que optimiza la modularidad
del grafo. Funciona en dos fases iterativas:

1. **Fase local:** cada nodo se mueve a la comunidad vecina que maximiza la ganancia
   de modularidad (`delta_Q`).
2. **Fase de agregacion:** las comunidades se colapsan en super-nodos y se repite
   desde la fase 1.

Converge cuando ningun movimiento mejora la modularidad. Complejidad: `O(n log n)`.

**Implementacion en `services/graph_builder.py`:**

```python
import networkx as nx
from networkx.algorithms.community import louvain_communities

def detect_communities(graph: nx.Graph) -> dict:
    if graph.number_of_nodes() < 3:
        return {"communities": [], "modularity": 0, "insights": []}

    communities = louvain_communities(graph, resolution=1.0, seed=42)

    community_map: dict[str, int] = {}
    community_list = []
    for idx, members in enumerate(communities):
        for node_id in members:
            community_map[node_id] = idx
        community_list.append({
            "id": idx,
            "size": len(members),
            "members": sorted(members),
            "label": _generate_community_label(graph, members),
        })

    # Detectar insights automaticos
    insights = _detect_insights(graph, communities, community_map)

    return {
        "communities": community_list,
        "community_map": community_map,
        "modularity": nx.community.modularity(graph, communities),
        "insights": insights,
    }


def _generate_community_label(graph: nx.Graph, members: set[str]) -> str:
    """Genera etiqueta descriptiva basada en los nodos mas conectados."""
    by_degree = sorted(members, key=lambda n: graph.degree(n), reverse=True)
    top = by_degree[:3]
    labels = [graph.nodes[n].get("label", n) for n in top]
    return " / ".join(labels)


def _detect_insights(
    graph: nx.Graph,
    communities: list[set[str]],
    community_map: dict[str, int],
) -> list[dict]:
    insights = []

    # 1. Nodos puente: conectan 2+ comunidades
    for node in graph.nodes():
        neighbor_communities = {
            community_map[n]
            for n in graph.neighbors(node)
            if n in community_map
        }
        if len(neighbor_communities) >= 2:
            insights.append({
                "type": "bridge_node",
                "node": node,
                "label": graph.nodes[node].get("label", node),
                "connects": sorted(neighbor_communities),
                "message": f"'{graph.nodes[node].get('label', node)}' conecta "
                           f"{len(neighbor_communities)} areas de conocimiento",
            })

    # 2. Nodos aislados: sin conexiones o en comunidad de 1
    isolated = [n for n in graph.nodes() if graph.degree(n) == 0]
    if isolated:
        insights.append({
            "type": "isolated_nodes",
            "nodes": isolated,
            "message": f"{len(isolated)} concepto(s) sin conexiones — "
                       f"considerar agregar relaciones o material adicional",
        })

    # 3. Comunidades sparse: ratio aristas/nodos bajo
    for comm in communities:
        if len(comm) >= 3:
            subgraph = graph.subgraph(comm)
            density = nx.density(subgraph)
            if density < 0.15:
                insights.append({
                    "type": "sparse_community",
                    "community_members": sorted(comm),
                    "density": round(density, 3),
                    "message": f"Grupo de {len(comm)} conceptos poco interconectados "
                               f"(densidad {density:.1%}) — posible falta de material",
                })

    return insights
```

**Endpoint nuevo (Sprint 4):**

```
GET /deck/{deckId}/graph/communities
```

Respuesta:

```json
{
  "communities": [
    { "id": 0, "size": 5, "members": ["tcp", "udp", "ip", ...], "label": "TCP / UDP / IP" },
    { "id": 1, "size": 3, "members": ["dns", "dhcp", ...], "label": "DNS / DHCP / ARP" }
  ],
  "modularity": 0.42,
  "insights": [
    {
      "type": "bridge_node",
      "node": "arp",
      "label": "Protocolo ARP",
      "connects": [0, 1],
      "message": "'Protocolo ARP' conecta 2 areas de conocimiento"
    }
  ]
}
```

**Impacto en el frontend (Graph.tsx):**

- Toggle en barra superior: `[Vista Modulos] / [Vista Comunidades]`
- En vista comunidades: nodos coloreados por comunidad (palette automatica)
- Nodos puente resaltados con borde dorado
- Panel lateral "Insights" con la lista de hallazgos automaticos
- Los insights tambien alimentan el panel Health/LINT (P3.3)

**Dependencia:** `networkx` ya incluye `louvain_communities` desde v2.8+
(no requiere `python-louvain` externo).

**Relacion con el LINT (Sprint 4):**

Los insights de Louvain se integran al agente LINT existente:

| Insight | Accion en LINT |
|:---|:---|
| Nodos aislados | Sugerir conexiones con conceptos relacionados |
| Comunidades sparse | Recomendar agregar material de refuerzo |
| Nodos puente | Marcar como conceptos criticos (si caen, desconectan areas) |
| Modularidad baja (<0.3) | Advertir que el grafo esta poco estructurado |

---

## 13. Soporte Multi-LLM: Seleccion de Proveedor desde la Interfaz

> YachaqAI no depende de un solo proveedor de IA. El usuario elige que modelo
> usar desde la interfaz, y el backend expone solo los proveedores cuya API key
> esta configurada. Si un proveedor no tiene key, se muestra como "No disponible".

### 13.1 Proveedores Soportados

| Proveedor | SDK Python | Modelos disponibles | Caso de uso principal |
|:---|:---|:---|:---|
| **Google Gemini** | `google-generativeai` | `gemini-2.5-flash`, `gemini-2.5-pro` | Default recomendado. Buena relacion calidad/precio. Context window grande (1M tokens) |
| **Groq** | `groq` | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it` | Inferencia ultra-rapida (~10x mas rapido). Ideal para evaluacion SRS y LINT |
| **OpenAI** | `openai` | `gpt-4o`, `gpt-4o-mini` | Alta calidad en generacion de contenido estructurado |
| **Anthropic** | `anthropic` | `claude-sonnet-4-6`, `claude-haiku-4-5` | Excelente en tareas de analisis, evaluacion y seguimiento de instrucciones |

### 13.2 Arquitectura: Capa de Abstraccion LLM

El backend implementa un **LLM Gateway** — una capa de abstraccion que unifica
la interfaz de los 4 proveedores. Los agentes nunca llaman a un SDK directamente;
siempre pasan por el gateway.

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Settings / Selector de modelo)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  GET /llm/providers  →  lista de disponibles     │    │
│  │  PUT /llm/select     →  elegir modelo activo     │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: services/llm_gateway.py                         │
│                                                          │
│  ┌──────────────┐                                        │
│  │  LLMGateway   │ ← interfaz unica para todos los      │
│  │               │   agentes (ingesta, evaluador,        │
│  │  .generate()  │   llm_wiki, scheduler, lint)          │
│  │  .stream()    │                                        │
│  └──────┬───────┘                                        │
│         │ despacha segun provider seleccionado            │
│         │                                                 │
│  ┌──────▼───────────────────────────────────────────┐    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │    │
│  │  │ Gemini  │ │  Groq   │ │ OpenAI  │ │ Claude │ │    │
│  │  │ Adapter │ │ Adapter │ │ Adapter │ │Adapter │ │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 13.3 Backend: Deteccion de Proveedores Disponibles

Al iniciar, el backend inspecciona las variables de entorno y construye el
registro de proveedores disponibles. **No se hace validacion de API key
contra el servicio externo al iniciar** (evita latencia y errores de red);
solo se verifica que la variable tenga valor.

**`backend/app/config.py`** (cambios):

```python
class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    llamaparse_api_key: str = ""

    # LLM Providers — al menos 1 requerido
    google_ai_api_key: str = ""
    groq_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
```

**`backend/app/services/llm_gateway.py`** (nuevo archivo):

```python
from dataclasses import dataclass

LLM_PROVIDERS = {
    "gemini": {
        "env_key": "google_ai_api_key",
        "label": "Google Gemini",
        "models": [
            {"id": "gemini-2.5-flash", "label": "Gemini 2.5 Flash", "tier": "fast"},
            {"id": "gemini-2.5-pro",   "label": "Gemini 2.5 Pro",   "tier": "quality"},
        ],
    },
    "groq": {
        "env_key": "groq_api_key",
        "label": "Groq",
        "models": [
            {"id": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B",  "tier": "fast"},
            {"id": "mixtral-8x7b-32768",      "label": "Mixtral 8x7B",   "tier": "fast"},
            {"id": "gemma2-9b-it",             "label": "Gemma 2 9B",     "tier": "fast"},
        ],
    },
    "openai": {
        "env_key": "openai_api_key",
        "label": "OpenAI",
        "models": [
            {"id": "gpt-4o",      "label": "GPT-4o",      "tier": "quality"},
            {"id": "gpt-4o-mini", "label": "GPT-4o Mini", "tier": "fast"},
        ],
    },
    "anthropic": {
        "env_key": "anthropic_api_key",
        "label": "Anthropic",
        "models": [
            {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6", "tier": "quality"},
            {"id": "claude-haiku-4-5",  "label": "Claude Haiku 4.5",  "tier": "fast"},
        ],
    },
}


@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    usage: dict  # {"input_tokens": N, "output_tokens": N}


class LLMGateway:
    def __init__(self, settings):
        self._settings = settings
        self._available = self._detect_available()
        self._active_provider: str | None = None
        self._active_model: str | None = None

        # Auto-seleccionar el primer proveedor disponible
        if self._available:
            first = next(iter(self._available))
            self._active_provider = first
            self._active_model = LLM_PROVIDERS[first]["models"][0]["id"]

    def _detect_available(self) -> dict[str, list[dict]]:
        available = {}
        for provider_id, config in LLM_PROVIDERS.items():
            api_key = getattr(self._settings, config["env_key"], "")
            if api_key:
                available[provider_id] = {
                    "label": config["label"],
                    "models": config["models"],
                }
        return available

    def get_available_providers(self) -> list[dict]:
        """Devuelve la lista para el frontend con estado de disponibilidad."""
        result = []
        for provider_id, config in LLM_PROVIDERS.items():
            is_available = provider_id in self._available
            result.append({
                "id": provider_id,
                "label": config["label"],
                "available": is_available,
                "models": config["models"] if is_available else [],
                "message": None if is_available
                    else f"API key no configurada ({config['env_key'].upper()})",
            })
        return result

    def get_active(self) -> dict:
        return {
            "provider": self._active_provider,
            "model": self._active_model,
        }

    def select(self, provider: str, model: str) -> dict:
        if provider not in self._available:
            raise ValueError(
                f"Proveedor '{provider}' no disponible. "
                f"Configura {LLM_PROVIDERS[provider]['env_key'].upper()} en .env"
            )
        valid_models = [m["id"] for m in LLM_PROVIDERS[provider]["models"]]
        if model not in valid_models:
            raise ValueError(
                f"Modelo '{model}' no existe en {provider}. "
                f"Opciones: {valid_models}"
            )
        self._active_provider = provider
        self._active_model = model
        return self.get_active()

    async def generate(self, prompt: str, system: str = "") -> LLMResponse:
        """Genera texto usando el modelo activo. Punto unico de llamada."""
        if not self._active_provider:
            raise RuntimeError("No hay proveedor LLM configurado")

        if self._active_provider == "gemini":
            return await self._call_gemini(prompt, system)
        elif self._active_provider == "groq":
            return await self._call_groq(prompt, system)
        elif self._active_provider == "openai":
            return await self._call_openai(prompt, system)
        elif self._active_provider == "anthropic":
            return await self._call_anthropic(prompt, system)

    async def _call_gemini(self, prompt, system) -> LLMResponse:
        import google.generativeai as genai
        genai.configure(api_key=self._settings.google_ai_api_key)
        model = genai.GenerativeModel(self._active_model,
                                       system_instruction=system or None)
        response = model.generate_content(prompt)
        return LLMResponse(
            text=response.text,
            model=self._active_model,
            provider="gemini",
            usage={"input_tokens": response.usage_metadata.prompt_token_count,
                   "output_tokens": response.usage_metadata.candidates_token_count},
        )

    async def _call_groq(self, prompt, system) -> LLMResponse:
        from groq import Groq
        client = Groq(api_key=self._settings.groq_api_key)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(
            model=self._active_model, messages=messages)
        choice = response.choices[0]
        return LLMResponse(
            text=choice.message.content,
            model=self._active_model,
            provider="groq",
            usage={"input_tokens": response.usage.prompt_tokens,
                   "output_tokens": response.usage.completion_tokens},
        )

    async def _call_openai(self, prompt, system) -> LLMResponse:
        from openai import OpenAI
        client = OpenAI(api_key=self._settings.openai_api_key)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(
            model=self._active_model, messages=messages)
        choice = response.choices[0]
        return LLMResponse(
            text=choice.message.content,
            model=self._active_model,
            provider="openai",
            usage={"input_tokens": response.usage.prompt_tokens,
                   "output_tokens": response.usage.completion_tokens},
        )

    async def _call_anthropic(self, prompt, system) -> LLMResponse:
        import anthropic
        client = anthropic.Anthropic(api_key=self._settings.anthropic_api_key)
        response = client.messages.create(
            model=self._active_model,
            max_tokens=8192,
            system=system or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return LLMResponse(
            text=response.content[0].text,
            model=self._active_model,
            provider="anthropic",
            usage={"input_tokens": response.usage.input_tokens,
                   "output_tokens": response.usage.output_tokens},
        )
```

### 13.4 Endpoints de Proveedores LLM

**Router: `backend/app/routers/llm.py`** (nuevo):

```
GET  /llm/providers       → lista de proveedores con estado
GET  /llm/active           → proveedor y modelo activo
PUT  /llm/select           → cambiar modelo activo
```

| Endpoint | Request | Response |
|:---|:---|:---|
| `GET /llm/providers` | — | `[{ id, label, available, models[], message? }]` |
| `GET /llm/active` | — | `{ provider, model }` |
| `PUT /llm/select` | `{ provider: "groq", model: "llama-3.3-70b-versatile" }` | `{ provider, model }` o `400` si no disponible |

**Ejemplo de respuesta `GET /llm/providers`:**

```json
[
  {
    "id": "gemini",
    "label": "Google Gemini",
    "available": true,
    "models": [
      { "id": "gemini-2.5-flash", "label": "Gemini 2.5 Flash", "tier": "fast" },
      { "id": "gemini-2.5-pro",   "label": "Gemini 2.5 Pro",   "tier": "quality" }
    ],
    "message": null
  },
  {
    "id": "groq",
    "label": "Groq",
    "available": true,
    "models": [
      { "id": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B", "tier": "fast" }
    ],
    "message": null
  },
  {
    "id": "openai",
    "label": "OpenAI",
    "available": false,
    "models": [],
    "message": "API key no configurada (OPENAI_API_KEY)"
  },
  {
    "id": "anthropic",
    "label": "Anthropic",
    "available": false,
    "models": [],
    "message": "API key no configurada (ANTHROPIC_API_KEY)"
  }
]
```

### 13.5 Frontend: Selector de Modelo

El selector de modelo aparece en **dos lugares**:

1. **Pagina Settings (P6.4)** — seccion "Modelo de IA" para elegir proveedor/modelo por defecto
2. **Sidebar del deck (AppShell.tsx)** — indicador compacto del modelo activo en el footer de la sidebar

**Componente `ModelSelector.tsx`:**

```
┌─────────────────────────────────────────────┐
│  Modelo de IA                                │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ ◉ Google Gemini                         │ │
│  │   ┌───────────────────────────────────┐ │ │
│  │   │ ▾ Gemini 2.5 Flash          ⚡    │ │ │
│  │   └───────────────────────────────────┘ │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ ○ Groq                                  │ │
│  │   ┌───────────────────────────────────┐ │ │
│  │   │ ▾ Llama 3.3 70B             ⚡    │ │ │
│  │   └───────────────────────────────────┘ │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ ○ OpenAI                        🔒      │ │
│  │   API key no configurada                │ │
│  │   (OPENAI_API_KEY)                      │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ ○ Anthropic                     🔒      │ │
│  │   API key no configurada                │ │
│  │   (ANTHROPIC_API_KEY)                   │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ⚡ = fast   ★ = quality                     │
└─────────────────────────────────────────────┘
```

**Comportamiento:**

- Al cargar, el frontend llama a `GET /llm/providers` y cachea en Zustand
- Los proveedores sin API key se muestran **deshabilitados** con fondo `#1A2E45` y opacidad 50%
- El mensaje indica cual variable `.env` falta (sin revelar valores)
- Al seleccionar un proveedor disponible, se despliega el dropdown de modelos
- Al cambiar modelo, se llama a `PUT /llm/select` y se actualiza el store
- El badge en la sidebar muestra el modelo activo: `⚡ Gemini Flash` o `⚡ Llama 3.3`
- Los tier `fast`/`quality` se muestran como badges visuales para ayudar al usuario a elegir

**Zustand store (`stores/llm.store.ts`):**

```typescript
interface LLMProvider {
  id: string
  label: string
  available: boolean
  models: { id: string; label: string; tier: 'fast' | 'quality' }[]
  message: string | null
}

interface LLMStore {
  providers: LLMProvider[]
  activeProvider: string | null
  activeModel: string | null
  loading: boolean
  fetchProviders: () => Promise<void>
  selectModel: (provider: string, model: string) => Promise<void>
}
```

### 13.6 Como los Agentes Usan el Gateway

Los agentes **nunca importan SDKs directamente**. Siempre usan `LLMGateway`:

```python
# ANTES (acoplado a Gemini):
import google.generativeai as genai
genai.configure(api_key=settings.google_ai_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")
response = model.generate_content(prompt)

# DESPUES (desacoplado via gateway):
from app.services.llm_gateway import gateway  # singleton
response = await gateway.generate(prompt=prompt, system=system_prompt)
# response.text, response.model, response.provider, response.usage
```

**Impacto en cada agente:**

| Agente | Antes | Despues |
|:---|:---|:---|
| `agents/ingesta.py` | `genai.GenerativeModel(...)` | `gateway.generate(prompt, system)` |
| `agents/evaluador.py` | `genai.GenerativeModel(...)` | `gateway.generate(prompt, system)` |
| `agents/llm_wiki.py` | (stub) | `gateway.generate(prompt, system)` |
| `agents/scheduler.py` | (stub) | `gateway.generate(prompt, system)` |
| `agents/lint.py` | (stub) | `gateway.generate(prompt, system)` |

### 13.7 Validacion y Manejo de Errores

| Escenario | Comportamiento |
|:---|:---|
| 0 API keys configuradas | Backend arranca pero `GET /llm/providers` devuelve todos con `available: false`. El frontend muestra alerta global: "Configura al menos una API key de LLM para usar YachaqAI" |
| API key invalida | El error se detecta en la primera llamada real (no al iniciar). El gateway captura la excepcion de autenticacion y devuelve HTTP 401 con `{ detail: "API key invalida para {provider}. Verifica {ENV_VAR} en .env" }` |
| Proveedor con rate limit | El gateway captura HTTP 429 y devuelve `{ detail: "Limite de uso alcanzado en {provider}. Intenta mas tarde o cambia de modelo" }` |
| Usuario selecciona modelo no disponible | `PUT /llm/select` devuelve 400 con el mensaje de cual variable falta |
| Timeout del proveedor | 30s max. Si se excede, devuelve 504 con sugerencia de usar un tier "fast" |
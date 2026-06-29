# YachaqAI

Plataforma inteligente de aprendizaje que transforma PDFs en wikis estructuradas con repeticion espaciada.

**Stack:** Vite + React 19 (frontend) | FastAPI + Python (backend) | Supabase (DB + Auth + Storage)

## Requisitos Previos

- **Node.js** >= 18
- **Python** >= 3.11
- **Cuenta en Supabase** (free tier funciona): https://supabase.com
- **Al menos 1 API key de LLM** (Gemini, Groq, OpenAI o Anthropic)
- *(Opcional)* API key de LlamaParse para extraccion avanzada de PDFs

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/YachaqAI.git
cd YachaqAI
```

## 2. Configurar Supabase

### 2.1 Crear proyecto en Supabase

1. Ve a https://supabase.com y crea un nuevo proyecto
2. Anota estos valores del dashboard:
   - **Project URL** (`Settings > API > Project URL`)
   - **anon/public key** (`Settings > API > Project API keys > anon`)
   - **service_role key** (`Settings > API > Project API keys > service_role`)
   - **Database URL** (`Settings > Database > Connection string > URI`)

### 2.2 Crear tablas y buckets

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Configura el `.env` del backend (ver paso 3) y luego ejecuta:

```bash
python -m scripts.setup_supabase
```

Esto crea automaticamente:
- **2 buckets** de Storage (`wikis`, `pdfs`)
- **10 tablas** con RLS, triggers e indices (requiere `SUPABASE_DB_URL`)

## 3. Variables de Entorno

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env`:

```env
# Supabase (requerido)
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Database URL (requerido para setup inicial)
SUPABASE_DB_URL=postgresql://postgres.TU_PROYECTO:TU_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

# LLM Providers (al menos 1 requerido)
GOOGLE_AI_API_KEY=            # https://aistudio.google.com/apikey
GROQ_API_KEY=                 # https://console.groq.com/keys
OPENAI_API_KEY=               # https://platform.openai.com/api-keys
ANTHROPIC_API_KEY=            # https://console.anthropic.com/settings/keys

# PDF parsing (opcional, mejora la extraccion)
LLAMAPARSE_API_KEY=           # https://cloud.llamaindex.ai/api-key
```

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

Edita `frontend/.env`:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_FASTAPI_URL=http://localhost:8000
```

## 4. Instalar Dependencias

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## 5. Ejecutar

Abre 2 terminales:

### Terminal 1 - Backend (FastAPI)

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend (Vite)

```bash
cd frontend
npm run dev
```

Abre http://localhost:5173 en el navegador.

## 6. Primer Uso

1. Ve a **Settings** (icono engranaje) y selecciona tu proveedor de LLM
2. Desde el **Dashboard**, haz clic en **Nuevo Mazo**
3. Sube un PDF y espera el analisis (~30s)
4. Revisa los conceptos detectados y confirma
5. La wiki se genera automaticamente (~1-3 min segun cantidad de conceptos)
6. Navega tu wiki en la seccion **Wiki** del sidebar

## Estructura del Proyecto

```
YachaqAI/
├── frontend/              # Vite + React 19 + TypeScript
│   ├── src/
│   │   ├── pages/         # Pantallas (29 definidas)
│   │   ├── components/    # Componentes reutilizables
│   │   ├── stores/        # Zustand (auth, deck, llm)
│   │   ├── lib/           # API clients, utilidades
│   │   └── types/         # TypeScript types
│   └── .env.example
│
├── backend/               # FastAPI + Python
│   ├── app/
│   │   ├── routers/       # Endpoints REST
│   │   ├── agents/        # Agentes LLM (ingesta, evaluador, etc.)
│   │   ├── services/      # LLM Gateway, wiki builder, PDF parser
│   │   └── schemas/       # Pydantic models
│   ├── scripts/           # Setup de Supabase (DB + buckets)
│   └── .env.example
│
├── ARQUITECTURA_MVP.md    # Arquitectura tecnica completa
├── PLAN_SPRINTS.md        # Roadmap de 5 sprints
└── README.md              # Este archivo
```

## Proveedores LLM Soportados

| Proveedor | Modelos | Tier | Donde obtener API key |
|---|---|---|---|
| Google Gemini | gemini-2.5-flash, gemini-2.5-pro | free/paid | https://aistudio.google.com/apikey |
| Groq | llama-3.3-70b, mixtral-8x7b, gemma2-9b | free | https://console.groq.com/keys |
| OpenAI | gpt-4o, gpt-4o-mini | paid | https://platform.openai.com/api-keys |
| Anthropic | claude-sonnet-4.6, claude-haiku-4.5 | paid | https://console.anthropic.com |

El modelo se selecciona desde **Settings** en la interfaz. Solo aparecen los proveedores cuya API key esta configurada.

## Documentacion

- [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md) — Stack, esquema DB, diagramas, decisiones tecnicas
- [PLAN_SPRINTS.md](PLAN_SPRINTS.md) — Roadmap detallado de 5 sprints con tareas y entregables
- [YachaqAI_Especificacion_Frontend_Unificada.md](YachaqAI_Especificacion_Frontend_Unificada.md) — Diseno de las 29 pantallas
- [YachaqAI_MVP_Flujo_Pantallas.md](YachaqAI_MVP_Flujo_Pantallas.md) — Flujos de navegacion y wireframes

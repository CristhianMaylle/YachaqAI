# YachaqAI -- Inventario de Herramientas y Recursos Necesarios

> **Fecha:** 27 de junio de 2026
> **Fuentes analizadas (exclusivamente):**
> - `YachaqAI_MVP_Flujo_Pantallas.md` (v1.1)
> - `YachaqAI_Especificacion_Frontend_Unificada.md` (v1.0)
> - `EVALUACION_FRONTEND.md`
>
> **Cambio critico:** El sistema LLM Wiki (patron Karpathy) **reemplaza por completo** al sistema RAG tradicional. Esto elimina la necesidad de embeddings, bases de datos vectoriales (FAISS, pgvector), y modelos de embedding.

---

## Indice

1. [LLM Wiki vs. RAG: Que cambia](#1-llm-wiki-vs-rag-que-cambia)
2. [Servicios de IA (API Keys)](#2-servicios-de-ia-api-keys)
3. [Backend -- Stack y Librerias](#3-backend----stack-y-librerias)
4. [Frontend -- Librerias Necesarias](#4-frontend----librerias-necesarias)
5. [Autenticacion y Servicios Externos](#5-autenticacion-y-servicios-externos)
6. [Infraestructura y Almacenamiento](#6-infraestructura-y-almacenamiento)
7. [Variables de Entorno Requeridas](#7-variables-de-entorno-requeridas)
8. [Herramientas Eliminadas (por adopcion de LLM Wiki)](#8-herramientas-eliminadas-por-adopcion-de-llm-wiki)
9. [Resumen Consolidado](#9-resumen-consolidado)

---

## 1. LLM Wiki vs. RAG: Que cambia

### Que es LLM Wiki (patron Karpathy)

El LLM Wiki es una arquitectura propuesta por Andrej Karpathy que **reemplaza RAG** para bases de conocimiento pequenas/medianas. En lugar de buscar en documentos crudos cada vez que el usuario pregunta, la IA:

1. **Lee las fuentes una sola vez** (al momento de ingesta)
2. **Construye una wiki estructurada** de archivos Markdown interconectados con `[[wikilinks]]`
3. **Consulta la wiki preconstruida** cuando el usuario hace preguntas -- no los documentos originales

### Las 3 capas del sistema

| Capa | Contenido | Quien la modifica |
|:---|:---|:---|
| **1. Fuentes crudas** (`1. fuentes_transformadas/`) | PDFs/URLs originales procesados | Solo lectura -- fuente de verdad |
| **2. La Wiki** (`2. conceptos/`, `3. entidades/`, `5. modulos/`) | Archivos .md con frontmatter YAML, interconectados con `[[wikilinks]]` | La IA la construye y mantiene |
| **3. El Esquema** (`YACHAQ.md`) | Reglas de estructura, formato, convenciones | El desarrollador lo define |

### Que se ELIMINA al adoptar LLM Wiki

| Componente RAG | Eliminado? | Razon |
|:---|:---|:---|
| **FAISS** (indice vectorial) | **SI** | La wiki ES el indice -- no necesita busqueda vectorial |
| **pgvector** (extension PostgreSQL) | **SI** | No hay embeddings que almacenar |
| **text-embedding-004** (Google) | **SI** | No se generan embeddings |
| **all-MiniLM-L6-v2** (Sentence-Transformers) | **SI** | No hay embeddings offline |
| **sentence-transformers** (libreria Python) | **SI** | No se usa embedding de ningun tipo |
| **Chunking de documentos** (512 tokens, overlap) | **SI** | La IA sintetiza en paginas wiki completas, no chunks |
| **Pipeline de re-indexacion** | **SI** | La wiki se actualiza directamente al agregar fuentes |

### Que se MANTIENE

| Componente | Por que se mantiene |
|:---|:---|
| **Gemini 2.5 Flash/Pro** | La IA sigue necesitando un LLM para: leer fuentes, generar wiki, responder preguntas, evaluar respuestas |
| **LlamaParse** | Se sigue necesitando extraer texto de PDFs |
| **Tesseract OCR** | Fallback para PDFs escaneados |
| **NetworkX / Grafo** | El grafo de conceptos sigue existiendo -- los nodos son las paginas wiki |
| **FSRS (py-fsrs)** | El sistema de repeticion espaciada es independiente de como se consulta la wiki |

### Como funciona la consulta LLM Wiki en YachaqAI

Segun la pantalla P6.3 de la especificacion:

```
Usuario pregunta: "Explica la diferencia entre TCP y UDP"
    |
    v
Agente LLM Wiki navega el grafo de la wiki preconstruida
    |-- Lee: 2. conceptos/protocolo-tcp.md
    |-- Lee: 2. conceptos/protocolo-udp.md
    |-- Lee: 2. conceptos/capa-de-transporte.md (via [[wikilinks]])
    |-- Profundidad: 3 saltos maximo
    |
    v
Genera respuesta con citas ancladas: [Protocolo TCP -->]
    |
    v
Latencia objetivo: <= 10 segundos
```

**No hay busqueda vectorial.** El agente navega la estructura de archivos .md y sus `[[wikilinks]]` para encontrar las paginas relevantes.

---

## 2. Servicios de IA (API Keys)

Extraidos de los documentos de especificacion:

### 2.1 Google AI (Gemini) -- CRITICO

Mencionado en: MVP Flujo seccion 3 (Agente de Ingesta: Gemini 2.5 Flash), Especificacion P6.3 (LLM Wiki).

| Modelo | Rol en YachaqAI | Donde se usa segun documentos |
|:---|:---|:---|
| **Gemini 2.5 Flash** | Agente de Ingesta | MVP Flujo paso 3: "El Agente de Ingesta (Gemini 2.5 Flash) identifica conceptos, entidades y relaciones" |
| **Gemini 2.5 Flash** | Agente Scheduler | MVP Flujo P2.5: parsea disponibilidad en lenguaje natural |
| **Gemini 2.5 Flash** | Agente Evaluador | MVP Flujo P5.4: evalua respuestas de desarrollo conceptual |
| **Gemini (Flash o Pro)** | Agente LLM Wiki | Especificacion P6.3: navega wiki preconstruida para responder preguntas |

**API Key necesaria:** `GOOGLE_AI_API_KEY`
**Donde obtenerla:** Google AI Studio (https://aistudio.google.com/)
**Plan gratuito:** 15 RPM, 1M tokens/dia -- suficiente para desarrollo.

### 2.2 LlamaParse (LlamaIndex Cloud)

Mencionado en: MVP Flujo paso 2: "LlamaParse extrae el texto estructurado del PDF"

| Servicio | Rol |
|:---|:---|
| **LlamaParse** | Extraer texto estructurado de PDFs (tablas, diagramas, formulas) |

**API Key necesaria:** `LLAMAPARSE_API_KEY`
**Donde obtenerla:** LlamaIndex Cloud (https://cloud.llamaindex.ai/)
**Plan gratuito:** 1,000 paginas/dia.

### 2.3 Tesseract OCR -- Sin API Key

Mencionado en: MVP Flujo paso 2: "Si falla, Tesseract OCR como fallback", tabla de errores: "PDF escaneado (< 100 chars texto) -> Activa pipeline OCR"

| Servicio | Rol |
|:---|:---|
| **Tesseract 5** | OCR para PDFs escaneados como fallback de LlamaParse |

**No requiere API Key** -- software local.
**Instalacion:** `apt-get install tesseract-ocr` (Linux) o instalador de Tesseract (Windows).

### 2.4 Ollama -- OPCIONAL (modo privacidad)

Mencionado en: Especificacion P6.4: "Toggle: Modo privado local -- no enviar datos al proveedor de IA" (etiqueta "Proximamente" en MVP).

| Servicio | Rol |
|:---|:---|
| **Ollama** | Runtime local de LLMs para modo privado |

**No requiere API Key.** Deshabilitado en MVP (marcado como "Proximamente" en P6.4).

---

## 3. Backend -- Stack y Librerias

Mencionado en: MVP Flujo seccion 8.5 (26 endpoints FastAPI), Especificacion seccion 9.

### 3.1 Framework y Core

| Libreria | Rol | Mencionado en |
|:---|:---|:---|
| **FastAPI** | Framework API REST (Python) | MVP Flujo 8.5: "API Endpoints del Backend (FastAPI)" |
| **Pydantic v2** | Validacion de datos | Implicito por FastAPI |
| **uvicorn** | Servidor ASGI | Implicito por FastAPI |

### 3.2 Procesamiento de Documentos

| Libreria | Rol | Mencionado en |
|:---|:---|:---|
| **llama-parse** | Parsing de PDFs | MVP Flujo paso 2 |
| **pytesseract** | Wrapper Python para Tesseract | MVP Flujo paso 2 (fallback) |

### 3.3 Grafo y SRS

| Libreria | Rol | Mencionado en |
|:---|:---|:---|
| **NetworkX** | Grafo de conceptos en memoria (nodos, aristas, orden topologico) | Implicito por la funcionalidad de grafo (M4) |
| **py-fsrs** | Algoritmo FSRS v5 de repeticion espaciada | Especificacion P5.4: "Calificacion FSRS: Excelente / Bien / Dificil / Olvidado" |

### 3.4 Autenticacion

| Libreria | Rol | Mencionado en |
|:---|:---|:---|
| **python-jose** o **PyJWT** | Generacion/validacion de JWT | MVP Flujo P1.3: "Login, retorna JWT" |
| **passlib** + **bcrypt** | Hashing de contrasenas | MVP Flujo P1.2: validacion de contrasena |

### 3.5 Wiki/Markdown

| Libreria | Rol | Mencionado en |
|:---|:---|:---|
| **PyYAML** o **python-frontmatter** | Parseo de frontmatter YAML en archivos .md | MVP Flujo paso 4: "archivos .md con frontmatter YAML" |
| **google-generativeai** | SDK de Gemini para Python | Necesario para los 4 agentes de IA |

### 3.6 Los 26 Endpoints del Backend

Documentados identicamente en MVP Flujo (8.5) y Especificacion (seccion 9):

| Modulo | Metodo | Endpoint |
|:---|:---|:---|
| Auth | POST | `/auth/register` |
| Auth | POST | `/auth/login` |
| Auth | POST | `/auth/google` |
| Auth | POST | `/auth/reset-password` |
| Onboarding | POST | `/onboarding/schedule` |
| Ingesta | POST | `/ingest/pdf` |
| Ingesta | POST | `/ingest/url` |
| Ingesta | GET | `/ingest/status/{jobId}` |
| Ingesta | POST | `/deck/{deckId}/lint` |
| Grafo | GET | `/deck/{deckId}/graph` |
| Plan | GET | `/deck/{deckId}/plan` |
| Plan | POST | `/deck/{deckId}/plan/customize` |
| Sesion | POST | `/sessions/start` |
| Sesion | GET | `/sessions/{sessionId}/questions` |
| SRS | POST | `/srs/response` |
| SRS | GET | `/srs/due` |
| Wiki | POST | `/wiki/query` |
| Wiki | POST | `/wiki/archive` |
| Dashboard | GET | `/dashboard/metrics` |
| Dashboard | GET | `/dashboard/stats` |
| Config | GET | `/user/settings` |
| Config | PUT | `/user/settings` |
| Config | POST | `/user/export` |
| Config | DELETE | `/user/account` |
| Notif | GET | `/notifications` |
| Notif | PUT | `/notifications/{id}/read` |

---

## 4. Frontend -- Librerias Necesarias

Mencionado en: MVP Flujo seccion 8.1, Especificacion seccion 0, EVALUACION_FRONTEND seccion 6.

### 4.1 Ya Instaladas (segun EVALUACION_FRONTEND)

| Libreria | Version | Estado |
|:---|:---|:---|
| `next` | ^15.5.19 | OK |
| `react` / `react-dom` | ^19.0.0 | OK |
| `lucide-react` | ^0.465.0 | OK (subutilizado) |
| `yaml` | ^2.9.0 | OK |
| `clsx` + `tailwind-merge` | latest | OK |
| `tailwindcss-animate` | ^1.0.7 | OK |
| `tailwindcss` | ^3.4.14 | **Necesita upgrade a v4** (spec dice Tailwind CSS v4) |
| `marked` | ^18.0.5 | **Sera reemplazado** por remark/rehype |
| `react-force-graph-2d` | ^1.29.1 | **Sera reemplazado** por React Flow v12 |

### 4.2 Por Instalar (especificadas en documentos)

| Libreria | Rol | Documento que lo especifica | Comando |
|:---|:---|:---|:---|
| **`@xyflow/react`** | React Flow v12 -- Grafo interactivo (P4.1) | MVP Flujo 8.1: "React Flow v12: Grafo interactivo con fisica 2D" | `npm i @xyflow/react` |
| **`zustand`** | Estado global | MVP Flujo 8.1: "Zustand: Estado global (sesion activa, grafo, usuario)" | `npm i zustand` |
| **`recharts`** | Graficos Dashboard/Estadisticas | MVP Flujo 8.1: "Recharts: Graficos del Dashboard y Estadisticas" | `npm i recharts` |
| **`@codemirror/view` + extensiones** | Editor Markdown (P5.3) | MVP Flujo 8.1: "CodeMirror 6: Editor Markdown con autocompletado" | `npm i @codemirror/view @codemirror/state @codemirror/lang-markdown` |
| **`remark` + `rehype`** | Renderizado Markdown | MVP Flujo 8.1: "Remark / Rehype: Renderizado de Markdown con soporte Mermaid" | `npm i remark remark-html remark-gfm rehype-raw` |
| **`next-auth`** | Autenticacion | Especificacion P1.2/P1.3: registro + login + OAuth Google | `npm i next-auth` |
| **`dompurify`** | Sanitizacion HTML | EVALUACION: reemplazar `dangerouslySetInnerHTML` | `npm i dompurify @types/dompurify` |

### 4.3 Tipografia (ya configurada)

Mencionado en: MVP Flujo seccion 0, Especificacion seccion 0.3.

| Fuente | Uso | Estado |
|:---|:---|:---|
| **Space Grotesk** | Titulos, Hero, flashcards (48-64px Bold) | Cargada via `next/font/google` |
| **Inter** | Cuerpo de texto (15-16px Regular) | Cargada via `next/font/google` |
| **JetBrains Mono** | Codigo, respuestas del usuario (15-16px) | Cargada via `next/font/google` |

### 4.4 Iconografia

Mencionado en: MVP Flujo seccion 0, Especificacion seccion 0.4.

**Libreria:** Lucide React -- ya instalada (`lucide-react` v0.465).
**Stroke:** 2px. **Tamano:** 20px en navegacion, 24-48px en heros.
**Los documentos especifican 25+ iconos** con colores asignados (ver tabla completa en Especificacion 0.4).

---

## 5. Autenticacion y Servicios Externos

### 5.1 Autenticacion

Mencionado en: MVP Flujo P1.2, P1.3, P1.4; Especificacion P1.2, P1.3, P1.4.

| Servicio | Rol | Documento |
|:---|:---|:---|
| **Google OAuth 2.0** | "Continuar con Google" (SVG oficial) | MVP Flujo P1.2: "OAuth: Boton 'Continuar con Google'" |
| **JWT** | Gestion de sesiones | MVP Flujo 8.5: "POST /auth/login: Login, retorna JWT" |
| **Email + Password** | Autenticacion primaria | MVP Flujo P1.2: 6 campos de registro |

**Credenciales necesarias:** `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
**Donde obtenerlas:** Google Cloud Console > APIs & Services > Credentials > OAuth 2.0

### 5.2 Email (para recuperacion de contrasena)

Mencionado en: MVP Flujo P1.4: "Enviar enlace de recuperacion", "Link caduca en 24 horas"

| Servicio | Rol |
|:---|:---|
| **Servicio de email transaccional** (ej. Resend, SendGrid) | Envio del link de recuperacion de contrasena |

**API Key necesaria:** Depende del servicio elegido.
**Nota:** Los documentos no especifican un servicio concreto, solo que se envia un email con link que caduca en 24h.

### 5.3 Notificaciones

Mencionado en: Especificacion P6.4, MVP Flujo P6.1.

| Tipo | Canal | Documento |
|:---|:---|:---|
| Recordatorio de sesion | Push / Email | Especificacion P6.4 |
| Repaso urgente | Push | Especificacion P6.4 |
| Modulo desbloqueado | Push | Especificacion P6.4 |
| Racha en peligro | Push / Email | Especificacion P6.4 |
| Resumen semanal | Email | Especificacion P6.4 |

**Nota:** Los documentos no especifican un servicio concreto para push notifications. Opciones: Firebase Cloud Messaging, OneSignal, o Web Push API nativo.

---

## 6. Infraestructura y Almacenamiento

### 6.1 Almacenamiento de PDFs

Mencionado en: MVP Flujo paso 1: "El PDF se envia al backend y se guarda en Cloudflare R2"

| Servicio | Rol |
|:---|:---|
| **Cloudflare R2** | Almacenamiento de PDFs originales antes de procesarlos |

**Credenciales:** `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`
**Plan gratuito:** 10 GB almacenamiento, 10M reads/mes.
**Alternativa MVP:** Filesystem local (como esta actualmente).

### 6.2 Base de Datos

Los documentos mencionan que los nodos y aristas se registran en "la base de datos" (MVP Flujo paso 5), pero **no especifican cual**. Las opciones son:

| Opcion | Nivel | Notas |
|:---|:---|:---|
| **Filesystem (.md + .json)** | Desarrollo/MVP | Es lo que funciona actualmente. La wiki ES la base de datos en el patron LLM Wiki |
| **SQLite** | MVP | Ligero, sin servidor, para usuarios/sesiones/cronograma |
| **PostgreSQL** | Produccion | Para multi-usuario a escala |

**Importante:** Con el patron LLM Wiki, los conceptos/entidades/relaciones viven como **archivos Markdown** en el filesystem. La base de datos relacional solo es necesaria para datos de usuario (cuentas, sesiones, cronogramas, notificaciones), no para el conocimiento.

### 6.3 Estructura de Archivos por Mazo (la "base de datos" del LLM Wiki)

Mencionado en: MVP Flujo pasos 4-8, EVALUACION P4.2.

```
data/notebooks/{mazo-id}/
  YACHAQ.md                        <-- Esquema (capa 3: reglas para la IA)
  index.md                         <-- Catalogo raiz del mazo
  log.md                           <-- Registro de actividad
  .yachaq/
    notebook.json                  <-- Metadata del mazo
  1. fuentes_transformadas/        <-- Capa 1: fuentes crudas (solo lectura)
  2. conceptos/                    <-- Capa 2: wiki de conceptos
  3. entidades/                    <-- Capa 2: wiki de entidades
  4. preguntas/                    <-- Preguntas SRS
  5. modulos/                      <-- Agrupaciones de conceptos
```

---

## 7. Variables de Entorno Requeridas

Derivadas exclusivamente de los servicios mencionados en los 3 documentos:

```env
# --- Google AI (Gemini) --- CRITICO: los 4 agentes dependen de esto
GOOGLE_AI_API_KEY=

# --- LlamaParse (PDF parsing) --- CRITICO: sin esto no se procesan PDFs
LLAMAPARSE_API_KEY=

# --- Google OAuth (login con Google) ---
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# --- JWT (sesiones de usuario) ---
JWT_SECRET_KEY=

# --- Email transaccional (recuperacion contrasena) ---
# El servicio especifico no esta definido en los docs
EMAIL_API_KEY=

# --- Cloudflare R2 (almacenamiento PDFs) --- opcional en MVP
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ENDPOINT=

# --- NextAuth (frontend auth) ---
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# --- Backend API ---
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### API Keys criticas para MVP (minimo para que funcione)

| API Key | Servicio | Gratuito? | Imprescindible? |
|:---|:---|:---|:---|
| `GOOGLE_AI_API_KEY` | Gemini Flash + Pro | Si (15 RPM, 1M tokens/dia) | **SI** -- sin esta no funcionan los 4 agentes |
| `LLAMAPARSE_API_KEY` | Parsing de PDFs | Si (1,000 pags/dia) | **SI** -- sin esta no se procesan PDFs |
| `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Login con Google | Si | **SI** -- especificado en P1.2/P1.3 |
| `JWT_SECRET_KEY` | Sesiones | N/A (se genera local) | **SI** -- para auth |
| `EMAIL_API_KEY` | Recuperar contrasena | Si (planes gratuitos) | MEDIA -- P1.4 lo requiere |
| `CLOUDFLARE_R2_*` | Almacenamiento PDFs | Si (10 GB) | BAJA -- puede usar filesystem en MVP |

---

## 8. Herramientas Eliminadas (por adopcion de LLM Wiki)

Estas herramientas aparecian en el documento original `HERRAMIENTAS_NECESARIAS.md` basandose en la propuesta tecnica, pero **se eliminan** porque el patron LLM Wiki las hace innecesarias:

| Herramienta | Rol original (RAG) | Por que se elimina |
|:---|:---|:---|
| **FAISS** | Indice vectorial local | LLM Wiki no usa busqueda vectorial -- navega archivos .md via wikilinks |
| **pgvector** | Extension vectorial PostgreSQL | No hay embeddings que almacenar |
| **text-embedding-004** (Google) | Modelo de embeddings | No se generan embeddings |
| **all-MiniLM-L6-v2** | Embeddings offline | No se generan embeddings |
| **sentence-transformers** (Python) | Libreria de embeddings | Sin uso de embeddings |
| **Redis** | Broker para Celery (cola de tareas) | No mencionado en los 3 documentos de referencia |
| **Celery** | Cola de tareas asincronas | No mencionado en los 3 documentos de referencia |
| **LangGraph** | Orquestacion de agentes | No mencionado en los 3 documentos de referencia |
| **Prometheus / Grafana / Loki** | Monitoreo | No mencionados en los 3 documentos de referencia |
| **Docker / Kubernetes** | Contenedorizacion | No mencionados en los 3 documentos de referencia |

**Nota:** Algunas de estas herramientas (Redis, Docker, monitoreo) podrian ser necesarias en produccion, pero no estan especificadas en los 3 documentos de referencia utilizados para este analisis.

---

## 9. Resumen Consolidado

### Herramientas necesarias por categoria

| Categoria | Herramientas | Cantidad |
|:---|:---|:---|
| **API Keys de IA** | Gemini API, LlamaParse API | 2 |
| **Software local IA** | Tesseract OCR, (Ollama futuro) | 1 (+1 futuro) |
| **Backend Python** | FastAPI, Pydantic, uvicorn, llama-parse, pytesseract, NetworkX, py-fsrs, PyJWT, passlib, google-generativeai, PyYAML | 11 |
| **Frontend JS (por instalar)** | @xyflow/react, zustand, recharts, @codemirror/*, remark+rehype, next-auth, dompurify | 7 |
| **Frontend JS (ya instalado)** | next, react, lucide-react, yaml, tailwind, clsx, marked (a reemplazar) | 7 |
| **Autenticacion** | Google OAuth, JWT | 2 |
| **Email** | Servicio transaccional (a elegir) | 1 |
| **Almacenamiento** | Cloudflare R2 (o filesystem local) | 1 |
| **Base de datos** | SQLite (MVP) o PostgreSQL (produccion) | 1 |
| **Total** | | **~33** |

### Lo minimo absoluto para empezar a desarrollar

Para que un desarrollador pueda comenzar a trabajar en el MVP real (no simulado):

1. **Obtener `GOOGLE_AI_API_KEY`** en https://aistudio.google.com/ (gratis)
2. **Obtener `LLAMAPARSE_API_KEY`** en https://cloud.llamaindex.ai/ (gratis)
3. **Instalar Tesseract** localmente (gratis)
4. **Configurar Google OAuth** en Google Cloud Console (gratis)
5. **Instalar las 7 librerias frontend faltantes** (ver seccion 4.2)
6. **Crear el backend FastAPI** con las 11 librerias de seccion 3

### Mapa visual de dependencias

```
                    ┌──────────────────────┐
                    │   Usuario (Browser)   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Next.js 15 Frontend │
                    │  React 19 + shadcn/ui │
                    │  React Flow v12       │
                    │  Zustand + Recharts   │
                    │  CodeMirror 6         │
                    │  NextAuth (Google)    │
                    └──────────┬───────────┘
                               │ API calls
                    ┌──────────▼───────────┐
                    │   FastAPI Backend     │
                    │  26 endpoints         │
                    │  JWT auth             │
                    └──┬───┬───┬───┬───────┘
                       │   │   │   │
          ┌────────────┘   │   │   └────────────┐
          │                │   │                 │
   ┌──────▼──────┐  ┌─────▼───▼─────┐  ┌───────▼───────┐
   │  Gemini API  │  │  LLM Wiki     │  │  SQLite/PG    │
   │  (4 agentes) │  │  (archivos    │  │  (usuarios,   │
   │  Flash + Pro │  │   .md en      │  │   sesiones,   │
   │              │  │   filesystem) │  │   cronograma) │
   └──────────────┘  └───────────────┘  └───────────────┘
          │
   ┌──────▼──────┐
   │ LlamaParse   │
   │ + Tesseract  │
   │ (PDF → texto)│
   └──────────────┘
```

---

**Fuentes consultadas sobre LLM Wiki:**
- [Karpathy's LLM Wiki GitHub Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [LLM Wiki: Karpathy's 3-Layer Pattern vs RAG (2026)](https://decodethefuture.org/en/llm-wiki-karpathy-pattern/)
- [Karpathy's LLM Wiki: 95% Less Token Use Than RAG](https://www.mindstudio.ai/blog/llm-wiki-vs-rag-markdown-knowledge-base-comparison)
- [Where RAG Breaks Down: The Karpathy LLM Wiki Alternative](https://www.mindstudio.ai/blog/karpathy-llm-wiki-pattern-knowledge-base-without-rag)
- [Beyond RAG: How Karpathy's LLM Wiki Pattern Builds Knowledge That Compounds](https://levelup.gitconnected.com/beyond-rag-how-andrej-karpathys-llm-wiki-pattern-builds-knowledge-that-actually-compounds-31a08528665e)
- [Andrej Karpathy's LLM Wiki: Bye Bye RAG](https://medium.com/data-science-in-your-pocket/andrej-karpathys-llm-wiki-bye-bye-rag-ee27730251f7)

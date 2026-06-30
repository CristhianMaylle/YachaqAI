# YachaqAI -- Plan de Implementacion en 5 Sprints

> **Fecha:** 27 de junio de 2026
> **Base:** `EVALUACION_FRONTEND.md`, `YachaqAI_Especificacion_Frontend_Unificada.md`, `YachaqAI_MVP_Flujo_Pantallas.md`
> **Principio:** Nucleo primero -- el valor diferencial de YachaqAI es el patron LLM Wiki (PDF → wiki estructurada → estudio inteligente). Todo lo demas se construye alrededor.

---

## Orden de prioridad

```
Sprint 1: INGESTA + WIKI        -> El corazon: un PDF entra, una wiki real sale
Sprint 2: GRAFO + LECTURA       -> El usuario ve y navega su conocimiento
Sprint 3: ESTUDIO + SRS         -> El usuario aprende y el sistema recuerda
Sprint 4: LLM WIKI + DASHBOARD  -> Inteligencia: consultar, medir, diagnosticar
Sprint 5: AUTH + CONFIG + CIERRE -> Seguridad, cuentas, pulido final
```

**Por que este orden:**
- Sin ingesta no hay contenido. Sin contenido no hay grafo. Sin grafo no hay estudio. Sin estudio no hay metricas.
- La autenticacion es una capa de acceso, no nucleo pedagogico. Se puede desarrollar y probar todo el sistema sin login (como funciona actualmente).
- Cada sprint agrega valor incremental sobre el anterior.

```
Sprint 1 (Ingesta)
    |
    v
Sprint 2 (Grafo + Lectura) ──> Sprint 3 (Estudio + SRS)
                                       |
                                       v
                                Sprint 4 (LLM Wiki + Dashboard)
                                       |
                                       v
                                Sprint 5 (Auth + Config)
```

---

## Sprint 1 -- NUCLEO: Ingesta Real + Generacion de Wiki

**Objetivo:** Un usuario sube un PDF y obtiene una wiki real de archivos Markdown interconectados, generada por Gemini. Este es el diferenciador completo de YachaqAI.

**Lo que reemplaza:** El seed hardcodeado (`seed-networking.ts` que ignora el archivo subido).

**Pantallas:** P2.4 (subida PDF), P3.1 (gestion documentos), P3.2 (upload/procesamiento)
**Endpoints nuevos:** 4

### Backend (FastAPI)

| # | Tarea | Detalle | Endpoint |
|:---|:---|:---|:---|
| 1 | **Inicializar FastAPI** | Python 3.12, estructura de proyecto, CORS para Next.js, modelo de Mazo (id, name, created_at) | -- |
| 2 | **Upload PDF** | Recibir archivo via multipart, guardar en filesystem (`data/notebooks/{id}/raw/`), validar tipo y tamano (max 100MB) | `POST /ingest/pdf` |
| 3 | ~~**Upload URL**~~ | **Despriorizado para el MVP actual.** Recibir URL, extraer contenido web (texto plano), guardar como fuente. El pipeline de analisis/generacion ya es agnostico a la fuente (recibe `raw_text`), por lo que se puede agregar despues sin tocarlo — solo falta el endpoint y la extraccion web | `POST /ingest/url` (no implementado) |
| 4 | **Pipeline de ingesta completo** | El corazon del sistema. Secuencia: | -- |
| | 4a. Extraccion de texto | LlamaParse extrae texto estructurado del PDF. Fallback: Tesseract OCR si < 100 chars | -- |
| | 4b. Agente de Ingesta (Gemini 2.5 Flash) | Prompt al LLM con el texto extraido + esquema YACHAQ.md. El agente identifica: conceptos, entidades, relaciones, prerrequisitos. Genera archivos .md con frontmatter YAML | -- |
| | 4c. Generacion de estructura wiki | Crear carpetas: `1. fuentes_transformadas/`, `2. conceptos/`, `3. entidades/`, `5. modulos/`. Escribir cada archivo .md con `[[wikilinks]]` entre conceptos relacionados | -- |
| | 4d. Agrupacion en modulos | Gemini agrupa conceptos en modulos ordenados topologicamente segun prerrequisitos | -- |
| | ~~4e. Generacion de preguntas SRS~~ | **Movido a Sprint 3.** Las preguntas se generan bajo demanda al iniciar sesion de estudio (`POST /sessions/start`), no durante la ingesta. Razon: con PDFs grandes (50+ conceptos), generar preguntas en ingesta consume demasiados tokens y tiempo. Generarlas bajo demanda reduce ~40% de llamadas LLM en ingesta | -- |
| 5 | **Estado del procesamiento** | Endpoint de polling: etapa actual (1-7), porcentaje, concepto siendo procesado | `GET /ingest/status/{jobId}` |
| 6 | **Re-ingesta incremental** | Si el mazo ya tiene contenido: comparar contra wiki existente, actualizar conceptos ya presentes, crear nuevos, detectar contradicciones entre fuentes | `POST /ingest/pdf` (mazo existente) |
| 7 | **Esquema YACHAQ.md** | Definir el template de reglas que controla como Gemini estructura la wiki: formato de frontmatter, tipos de nodo, convenciones de nombrado, formato de wikilinks | -- |

**Librerias backend:**
```
pip install fastapi uvicorn pydantic sqlalchemy alembic
pip install llama-parse google-generativeai pytesseract pyyaml
```

**API Keys necesarias (las unicas 2 criticas del proyecto):**
- `GOOGLE_AI_API_KEY` -- para Gemini 2.5 Flash (agente de ingesta)
- `LLAMAPARSE_API_KEY` -- para extraer texto de PDFs

### Frontend (Next.js)

| # | Tarea | Detalle | Pantalla |
|:---|:---|:---|:---|
| 1 | **Dark mode global** | Cambiar CSS variables: fondo `#0D1B2A`, cards `#1A2E45`, primario `#1E3A5F`, cyan `#00C6FB`, violeta `#534AB7`. Clase `dark` por defecto | Toda la app |
| 2 | **Paleta semaforo** | Configurar colores exactos: verde `#4CAF50`, amarillo `#FFC107`, rojo `#F44336`, gris `#9E9E9E` | Toda la app |
| 3 | **Instalar Zustand** | Store global: `useNotebookStore` (mazo actual, estado de ingesta) | -- |
| 4 | **P3.2 Upload real** | Drop zone con validacion (solo PDF, max 100MB, rechazo con shake). ~~Campo URL~~ (ver nota de despriorizacion arriba). Conectar a `POST /ingest/process` real. Barra progreso 7 etapas con polling a `/ingest/status/{jobId}`. Resultado: banner verde + estadisticas reales (N conceptos, N entidades, N modulos) | P3.2 |
| 5 | **P3.1 Gestion Documentos** | Lista de cards por documento: icono tipo (FileText naranja PDF, Link cyan URL), nombre, fecha, estado (Loader2/CheckCircle2/AlertCircle), estadisticas. Boton "+ Agregar material" | P3.1 |
| 6 | **Eliminar seed hardcodeado** | Reemplazar `seedRedesNotebook()` por llamada real al backend FastAPI. Eliminar `lib/seed-networking.ts` como fuente de datos | -- |
| 7 | **Eliminar codigo muerto** | Borrar `lib/data.ts`, `components/TopNav.tsx`, `components/Toast.tsx` (identificados en EVALUACION como dead code) | -- |

**Librerias frontend:**
```
npm i zustand
```

### Entregable Sprint 1

- [ ] Subir un PDF real y obtener una wiki generada por LLM (no hardcodeada)
- [ ] Los archivos .md tienen frontmatter YAML valido con prerrequisitos, relacionados, estado_srs
- [ ] Se generan conceptos, entidades y modulos reales desde el PDF
- [ ] La carpeta `4. preguntas/` queda vacia (se llena bajo demanda en Sprint 3)
- [ ] La barra de progreso refleja el estado real del procesamiento
- [ ] Se puede agregar mas material a un mazo existente (re-ingesta incremental)
- [ ] La app esta en dark mode con la paleta correcta
- [ ] No queda codigo muerto ni datos simulados de ingesta

---

## Sprint 2 -- GRAFO + LECTURA: Visualizacion y Navegacion del Conocimiento

**Objetivo:** El usuario ve su grafo de conocimiento interactivo, navega conceptos, lee contenido y edita notas.

**Pantallas:** P4.1, P4.2, P4.3, P5.0, P5.2, P5.3
**Endpoints nuevos:** 3

### Backend (FastAPI)

| # | Tarea | Endpoint |
|:---|:---|:---|
| 1 | **Grafo de conocimiento** | Leer archivos .md del mazo, construir nodos + aristas desde frontmatter (prerrequisitos, relacionados, wikilinks). Devolver con estados SRS | `GET /deck/{deckId}/graph` |
| 2 | **Plan de estudio** | Modulos ordenados topologicamente con estado (pendiente/en_progreso/completado/bloqueado), retencion promedio por modulo, N conceptos cada uno | `GET /deck/{deckId}/plan` |
| 3 | **Personalizar plan con prompt** | Gemini reordena modulos segun instruccion NL ("enfocarme en lo mas dificil primero") | `POST /deck/{deckId}/plan/customize` |

### Frontend (Next.js)

| # | Tarea | Pantalla |
|:---|:---|:---|
| 1 | **Migrar a React Flow v12** | Reemplazar `react-force-graph-2d` por `@xyflow/react`. Nodos como rectangulos redondeados con color semaforo. Aristas solidas = prerrequisito, punteadas = relacionado, rojas = dependencia en riesgo. Nodos mas conectados gravitan al centro | P4.1 |
| 2 | **Modo Exploracion Libre** | Click nodo -> tooltip (P4.2). Hover -> scale 1.1 + texto completo. Drag canvas -> pan. Scroll -> zoom. Nodos degradados muestran Clock ambar. Barra inferior: dominados N / en practica N / criticos N / bloqueados N. Maestria general XX% | P4.1 |
| 3 | **Modo Modulo Activo** | Badges numericos cyan (1,2,3...). Nodos fuera del modulo: gris oscuro `#2A3A4A`, 60% opacidad. Flechas direccionales entre nodos. Banner "Modulo N: [Nombre] -- Nodo X de Y". Boton "Salir del modo modulo" con animacion 400ms | P4.1 |
| 4 | **P4.2 Tooltip de Nodo** | Posicionado junto al nodo: titulo (bold), modulo, estado semaforo + icono, maestria XX% (barra), proximo repaso ("En 3 dias" / "HOY" en rojo), N preguntas, prerrequisitos (1-3 nodos). Botones: "Leer concepto" (BookOpen) y "Repasar ahora" (RotateCcw) | P4.2 |
| 5 | **P4.3 Vista Filtrada Modulo** | Sidebar izquierda: lista modulos con badge estado (Lock/En Progreso/CheckCircle2). Click filtra grafo. Buscador filtra nodos en tiempo real. Barra superior: filtros Todos/Solo rojos/Solo dominados. Boton "+ Agregar material" | P4.3 |
| 6 | **P5.0 Plan Visual Duolingo** | Ruta vertical con modulos como nodos conectados por lineas. 6 estados: Circle outline (pendiente), CircleHalf cyan (en progreso), CheckCircle2 verde (completado), Clock ambar (repaso pendiente), TrendingDown naranja (degradado), Lock gris (bloqueado). Expandir con ChevronDown: chips de nodos, retencion desglosada. Boton "Personalizar con prompt" (Wand2) | P5.0 |
| 7 | **P5.2 Lectura Concepto** | Nav superior: breadcrumb Mazo > Modulo > Concepto, contador "Concepto 2 de 6", botones Anterior/Siguiente, boton "Modo edicion" (Pencil). Sidebar derecha: conceptos del modulo con check verde en leidos. Contenido: titulo + badge semaforo, barra maestria, markdown renderizado (remark/rehype + Mermaid), links `[[Concepto]]` clickeables, seccion "Mis Notas". Barra inferior: tiempo lectura, boton "Ir al Cuestionario" | P5.2 |
| 8 | **P5.3 Editor CodeMirror** | Split view: editor izquierda / preview derecha. Toolbar: negrita/cursiva/codigo/link/tabla/encabezado. Autocompletado `[[`: dropdown de conceptos del mazo. YAML frontmatter colapsado y solo lectura. Guardado: Ctrl+S, toast confirmacion, re-indexacion en background | P5.3 |
| 9 | **Migrar rutas** | `/notebooks/[notebookId]/...` -> `/deck/[deckId]/...` segun especificacion | Todas |

**Librerias frontend:**
```
npm i @xyflow/react
npm i @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/theme-one-dark
npm i remark remark-html remark-gfm rehype-raw rehype-sanitize mermaid dompurify @types/dompurify
npm uninstall react-force-graph-2d marked
```

### Entregable Sprint 2

- [ ] Grafo interactivo con React Flow v12 y colores semaforo exactos de la especificacion
- [ ] Dos modos funcionando: exploracion libre + modulo activo con badges y atenuacion
- [ ] Tooltip completo con maestria, proximo repaso y botones de accion
- [ ] Plan visual tipo Duolingo con 6 estados y personalizacion NL
- [ ] Lectura de conceptos con markdown completo (tablas, codigo, Mermaid, wikilinks)
- [ ] Editor CodeMirror con split view, autocompletado `[[` y YAML protegido
- [ ] Rutas migradas a `/deck/[deckId]/...`

---

## Sprint 3 -- ESTUDIO + SRS: Cuestionarios, Evaluacion IA y Repeticion Espaciada

> **Nota de esquema (ver ARQUITECTURA_MVP.md seccion 10.1):** `deck_id` en
> `study_sessions`, `srs_states` y `srs_responses` es TEXT (slug), no UUID.
> Usar el valor de la URL `/deck/{deckId}/...` tal cual, sin conversion.

**Objetivo:** El usuario completa sesiones de estudio con cuestionarios de 4 tipos, evaluacion por IA, y repaso SRS con el algoritmo FSRS real.

**Pantallas:** P5.1, P5.4, P5.5, P5.6, P5.7, P5.8
**Endpoints nuevos:** 5

### Backend (FastAPI)

| # | Tarea | Endpoint |
|:---|:---|:---|
| 1 | **Modelo de sesion** | SQLAlchemy: id, deck_id, module_id, type (nuevo/repaso/mixto), started_at, completed_at, results_json | -- |
| 2 | **Iniciar sesion** | Crea sesion, calcula conceptos a estudiar, verifica repasos SRS pendientes. **Genera preguntas bajo demanda** con LLM si `4. preguntas/` no tiene archivo para los conceptos del modulo (movido desde Sprint 1 para optimizar tokens). Devuelve: tipo, modulo, N conceptos, duracion estimada, N preguntas | `POST /sessions/start` |
| 3 | **Preguntas del modulo** | Devuelve preguntas .md del mazo para ese modulo. Si no existen, las genera con LLM en el momento (4 tipos: completar, relacionar, diagrama, desarrollo). Las preguntas generadas se cachean en `4. preguntas/` para reutilizar | `GET /sessions/{sessionId}/questions` |
| 4 | **Registrar calificacion + Agente Evaluador** | Para tipos 1-3: auto-calificacion (100%=Excelente, 70-99%=Bien, 1-69%=Dificil, 0%=Olvidado). Para tipo 4: Gemini 2.5 Flash evalua respuesta -> ideas cubiertas, omitidas, errores, calificacion sugerida, justificacion, tip de estudio. Actualizar FSRS real con py-fsrs: retentiva, estabilidad, dificultad, proximo_repaso | `POST /srs/response` |
| 5 | **Conceptos vencidos hoy** | Nodos cuyo proximo_repaso <= hoy, priorizados por criticidad. Max 20 si ausencia > 30 dias ("sesion de rehabilitacion") | `GET /srs/due` |
| 6 | **Propagacion Graph-SRS** | Si "Olvidado": propagar incertidumbre a nodos dependientes via grafo de prerrequisitos (NetworkX) | Interno |

**Librerias backend:**
```
pip install py-fsrs networkx
```

### Frontend (Next.js)

| # | Tarea | Pantalla |
|:---|:---|:---|
| 1 | **P5.1 Preparacion Sesion** | Card central: tipo (nuevo/repaso/mixto), modulo, N conceptos, duracion estimada, N preguntas. Banner amarillo si repasos pendientes: "Tienes N conceptos para repasar primero (X min)" con opciones "Hacer repaso primero" / "Saltar repaso". Boton "Comenzar sesion". Boton "Recordarme mas tarde" | P5.1 |
| 2 | **P5.4 Cuestionario -- Tipo 1: Completar oracion** | Enunciado con `[___]`, campo texto, boton "Comprobar respuesta", banner verde/rojo con respuesta correcta | P5.4 |
| 3 | **P5.4 Cuestionario -- Tipo 2: Relacionar terminos** | Dos columnas (terminos ↔ definiciones), drag-and-drop o lineas de conexion, lineas verdes/rojas post-respuesta | P5.4 |
| 4 | **P5.4 Cuestionario -- Tipo 3: Diagrama incompleto** | Diagrama con etiquetas faltantes, inputs en posiciones, correccion automatica | P5.4 |
| 5 | **P5.4 Cuestionario -- Tipo 4: Desarrollo conceptual** | Textarea grande, boton "Enviar para evaluacion de IA", spinner 3-5s, panel estructurado: ideas cubiertas/omitidas/errores, calificacion sugerida, justificacion, tip. Botones "Confirmar [Sugerencia]" / "Cambiar calificacion" (soberania del usuario) | P5.4 |
| 6 | **Header cuestionario** | Nombre modulo, "Pregunta 2 de 8", barra progreso lineal | P5.4 |
| 7 | **P5.5 Resumen Post-Sesion** | Animacion entrada: confetti (>=70%) o particulas suaves (<70%). Metricas: tiempo total, N conceptos, distribucion calificaciones, retentiva promedio. Mini-grafo: nodos que cambiaron de color (animacion transicion). Proximos repasos: lista "Protocolo TCP -- en 3 dias". Proxima sesion segun cronograma | P5.5 |
| 8 | **Bifurcacion** | Si retentiva >=70%: boton "Ver recursos adicionales" -> P5.7. Si <70%: boton "Ver mini repaso detallado" -> P5.8. Botones siempre presentes: "Ver grafo completo", "Volver al plan", "Consultar LLM Wiki" | P5.5 |
| 9 | **P5.6 Repaso SRS** | Pantalla entrada: "Tienes N conceptos para repasar hoy", tiempo estimado, boton "Comenzar repaso". Misma interfaz de cuestionario. Badge "Repaso SRS -- Fortaleciendo retencion". Resumen: grafico barras retencion antes vs despues | P5.6 |
| 10 | **P5.7 Ruta SI: Recursos** | Grid cards recursos externos (BookOpen articulos, GraduationCap papers). Filtros: Todo/Articulos/Papers. Boton "Continuar con siguiente modulo" | P5.7 |
| 11 | **P5.8 Ruta NO: Refuerzo** | Lista nodos deficientes (AlertCircle coral): pregunta, respuesta usuario, feedback IA, fragmento fuente. Selector hora para sesion refuerzo (intervalos 30 min). Boton "Continuar con siguiente modulo" | P5.8 |

**Librerias frontend:**
```
npm i recharts canvas-confetti
```

### Entregable Sprint 3

- [ ] Sesion completa: preparacion -> lectura -> cuestionario -> resumen
- [ ] Generacion de preguntas bajo demanda al iniciar sesion (no en ingesta)
- [ ] 4 tipos de pregunta con correccion real (no simulada)
- [ ] Evaluacion IA de respuestas de desarrollo (ideas cubiertas, errores, tip)
- [ ] FSRS real con py-fsrs (intervalos calculados, no hardcodeados)
- [ ] Bifurcacion post-evaluacion: ruta >=70% (recursos) vs <70% (refuerzo)
- [ ] Repaso SRS con cola diaria, max 20 si ausencia prolongada
- [ ] Propagacion de incertidumbre al calificar "Olvidado"

---

## Sprint 4 -- LLM WIKI + DASHBOARD: Inteligencia y Metricas

> **Nota de esquema (ver ARQUITECTURA_MVP.md seccion 10.1):** `GET /dashboard/metrics`
> debe agregar via `decks.user_id = auth.uid()` y luego filtrar otras tablas con
> `deck_id IN (SELECT id FROM decks WHERE ...)`. `decks.id` es TEXT, no UUID —
> cualquier tabla nueva (ej. para `graph/communities` o `lint_reports`) debe
> declarar `deck_id TEXT`.

> **Nota patron LLM Wiki (Karpathy):** las tareas #2 (Archivar respuesta) y #5
> (Agente LINT) de este sprint ya cubren las operaciones "Query -> archivado" y
> "Lint" del patron LLM Wiki — huerfanos, contradicciones, conceptos sin pagina
> y referencias rotas. No requieren alcance adicional al ya especificado aqui.

**Objetivo:** El usuario puede consultar su wiki con lenguaje natural (LLM Wiki real con Gemini), ver metricas detalladas de progreso, y diagnosticar la salud de su mazo.

**Pantallas:** P6.1, P6.2, P6.3, P3.3
**Endpoints nuevos:** 7

### Backend (FastAPI)

| # | Tarea | Endpoint |
|:---|:---|:---|
| 1 | **Agente LLM Wiki** | Gemini navega la wiki preconstruida: recibe pregunta, identifica paginas relevantes via wikilinks (3 saltos max), lee archivos .md, sintetiza respuesta con citas ancladas `[Concepto ->]`. Latencia objetivo <=10s | `POST /wiki/query` |
| 2 | **Archivar respuesta** | Si respuesta > 300 palabras o sintetiza 3+ fuentes: guardar como nuevo concepto .md con wikilinks a las fuentes | `POST /wiki/archive` |
| 3 | **Metricas de progreso** | Maestria general, distribucion nodos por estado, tiempo estudiado esta semana, retencion promedio 30 dias, proxima sesion, racha diaria | `GET /dashboard/metrics` |
| 4 | **Estadisticas detalladas** | Curva retencion real vs Ebbinghaus teorica, tabla conceptos por dificultad D desc, heatmap actividad (tipo GitHub), patrones ("Estudias mejor los Martes"), eficacia cronograma (planificadas vs completadas) | `GET /dashboard/stats` |
| 5 | **Agente LINT** | Analizar wiki real: nodos huerfanos (sin enlaces entrantes), contradicciones entre fuentes, conceptos mencionados 5+ veces sin pagina, referencias rotas (wikilinks a archivos inexistentes), modulos sin cuestionario | `POST /deck/{deckId}/lint` |
| 6 | **Notificaciones** | Listar notificaciones del usuario (repasos, sesiones, rachas, modulos desbloqueados) | `GET /notifications` |
| 7 | **Marcar leida** | Marcar notificacion como leida | `PUT /notifications/{id}/read` |

### Frontend (Next.js)

| # | Tarea | Pantalla |
|:---|:---|:---|
| 1 | **P6.1 Dashboard** | Sidebar colapsable (8 items con iconos Lucide). Barra superior: saludo contextual, Flame + N dias racha (naranja `#FF6D00`), Bell notificaciones (badge numerico), User perfil | P6.1 |
| 2 | **Racha diaria** | Cadena circulos por dia (verde=sesion, gris=no). Si no estudio hoy despues mediodia: Flame parpadea + "Estudia hoy para no perder tu racha" naranja. Hover: "Tu racha se resetea a medianoche" | P6.1 |
| 3 | **Sesion de hoy** | Card prominente: "Sesion programada hoy -- 7:00 PM", modulo, duracion, boton "Iniciar sesion ahora". Si repasos urgentes: banner rojo "N conceptos criticos requieren repaso" | P6.1 |
| 4 | **Metricas** | Maestria general (% + barra semaforo). Distribucion nodos (grafico torta Recharts). Tiempo esta semana (barras L-D). Retencion (linea temporal 30 dias). Carga repaso (barras: conceptos a repasar hoy + 7 dias) | P6.1 |
| 5 | **Estados Dashboard** | Vacio: "Crea tu primer grafo" + PlusCircle. Sin repasos: "Todo al dia" CheckCircle2 verde. Urgentes: banner ambar. Notificaciones: dropdown con Clock/Trophy/TrendingDown | P6.1 |
| 6 | **P6.2 Estadisticas** | Selector periodo (semana/mes/todo). Curva retencion vs Ebbinghaus (Recharts LineChart). Tabla conceptos (sortable por dificultad). Heatmap actividad tipo GitHub. Patrones de estudio. Eficacia cronograma (barras agrupadas) | P6.2 |
| 7 | **P6.3 LLM Wiki Chat** | Historial scrolleable. Mensajes usuario (derecha). Respuestas agente (izquierda, fondo `#1A2E45`): markdown renderizado con citas ancladas clickeables. Campo pregunta + "Enviar". Spinner "El agente esta navegando tu grafo...". Indicador nodos consultados. Oferta archivar si >300 palabras. Chips sugerencias basadas en conceptos con R baja | P6.3 |
| 8 | **P3.3 Panel LINT** | Score radial SVG. Secciones: huerfanos (sugerir conexiones), contradicciones (ver detalle panel dividido), sin pagina (crear borrador auto), refs rotas (corregir auto), sin quiz (generar preguntas). Boton "Ejecutar analisis ahora". Exportar reporte | P3.3 |

### Entregable Sprint 4

- [ ] LLM Wiki funcional: preguntas en lenguaje natural con respuestas reales de Gemini
- [ ] Respuestas con citas ancladas que navegan a los conceptos del mazo
- [ ] Dashboard con todas las metricas: maestria, distribucion, tiempo, retencion, racha
- [ ] Estadisticas detalladas con curva Ebbinghaus y heatmap
- [ ] LINT real que analiza la wiki y detecta problemas reales
- [ ] Sistema de notificaciones funcional

---

## Sprint 5 -- AUTH + CONFIG + CIERRE: Seguridad, Onboarding y Pulido

> **Nota de esquema (ver ARQUITECTURA_MVP.md seccion 10.1):** los mazos creados
> en Sprints 1-4 (desarrollo sin auth) tienen `decks.user_id = NULL`. Al activar
> el middleware JWT, decidir: (a) asignarlos a un usuario admin/seed, o (b)
> requerir que el usuario los re-cree. Las policies RLS abiertas (`*_open`,
> `USING(true)`) en `decks`, `ingest_jobs`, `srs_states`, `srs_responses`,
> `study_sessions`, `schedule_slots`, `wiki_chat_messages`, `lint_reports`
> deben eliminarse explicitamente — quedan activas por defecto desde Sprint 1.

**Objetivo:** El sistema esta completo para multiples usuarios. Autenticacion, onboarding guiado de 6 pasos, configuracion de cuenta y exportacion.

**Pantallas:** P1.1, P1.2, P1.3, P1.4, P2.1-P2.6, P6.4
**Endpoints nuevos:** 7

### Backend (FastAPI)

| # | Tarea | Endpoint |
|:---|:---|:---|
| 1 | **Modelo de usuario completo** | id, nombre, email, password_hash, timezone, google_id, onboarding_completed, streak_days, last_study_date, created_at | -- |
| 2 | **Registro** | Hash bcrypt, email unico, devolver JWT | `POST /auth/register` |
| 3 | **Login** | Verificar credenciales, JWT (access + refresh). "Recordarme" = token 30 dias | `POST /auth/login` |
| 4 | **Google OAuth** | Verificar token Google, crear/vincular usuario, JWT | `POST /auth/google` |
| 5 | **Reset password** | Token reset (24h), enviar email con link | `POST /auth/reset-password` |
| 6 | **Middleware JWT** | Proteger TODOS los endpoints de sprints 1-4 con autenticacion. Asociar mazos al user_id del token | -- |
| 7 | **Parseo disponibilidad NL** | Gemini parsea texto libre de disponibilidad semanal y genera slots de cronograma | `POST /onboarding/schedule` |
| 8 | **Preferencias usuario** | CRUD configuracion: notificaciones (5 tipos + canales), umbrales SRS, zona horaria | `GET/PUT /user/settings` |
| 9 | **Exportar mazo** | Generar ZIP con todos los .md del mazo para descarga | `POST /user/export` |
| 10 | **Eliminar cuenta** | Borrar usuario + todos sus mazos. Confirmacion doble, 30 dias gracia | `DELETE /user/account` |

**Librerias backend:**
```
pip install passlib[bcrypt] python-jose[cryptography]
```

**Servicio externo nuevo:** Servicio de email transaccional (para reset password).

### Frontend (Next.js)

| # | Tarea | Pantalla |
|:---|:---|:---|
| 1 | **Instalar NextAuth** | Providers: Credentials (email/password) + Google OAuth | -- |
| 2 | **P1.1 Landing** | Fondo `#0D1B2A` con particulas flotantes. Hero: "Transforma tus PDFs en conocimiento que nunca olvidas". CTA "Empezar Gratis" (cyan `#00C6FB`, glow hover). "Ya tengo cuenta". Seccion valor (3 cards fade-in). Demo GIF. Footer | P1.1 |
| 3 | **P1.2 Registro** | 6 campos: nombre, email (validacion real-time), contrasena (indicador fortaleza), confirmar, timezone (auto-detect), checkbox TOS. Boton "Crear mi cuenta" (disabled hasta valido, spinner al enviar). Google OAuth (SVG oficial). Link "Ya tienes cuenta?" | P1.2 |
| 4 | **P1.3 Login** | Email + password + "Recordarme" + Google OAuth. Banner rojo AlertCircle si error. Exito: dashboard si onboarding completo, onboarding si no | P1.3 |
| 5 | **P1.4 Reset password** | Paso 1: email + "Enviar enlace". Paso 2 (desde link): nueva contrasena + confirmar. Link caduca 24h | P1.4 |
| 6 | **P2.1-P2.6 Onboarding completo** | Wizard 6 pasos con barra progreso. P2.1: bienvenida + bullets. P2.2: nombre mazo (max 60, chips sugerencia). P2.3: objetivo (4 tarjetas + nivel). P2.4: subida PDF (conectar a pipeline Sprint 1). P2.5: disponibilidad NL (conectar a `/onboarding/schedule`). P2.6: confirmar cronograma (calendario semanal editable) | P2.1-P2.6 |
| 7 | **P6.4 Configuracion** | Mi Cuenta: nombre, email, timezone, cambiar password. Notificaciones: 5 tipos con toggle + canal (push/email/ambos), horario silencio. Mi Mazo: nombre, umbrales SRS (sliders), exportar ZIP. Privacidad: modo Ollama "Proximamente". Peligro: eliminar cuenta (confirmacion doble) | P6.4 |
| 8 | **Proteger rutas** | Middleware que redirige a `/auth/login` si no autenticado. Redirige a `/onboarding/1` si no completo onboarding | -- |
| 9 | **Instalar componentes shadcn/ui** | Select, Dialog, Dropdown, Tabs, Progress, Tooltip, Toast (usados en onboarding, config, modales) | -- |

**Librerias frontend:**
```
npm i next-auth
npx shadcn-ui@latest add select dialog dropdown-menu tabs progress tooltip toast
```

### Entregable Sprint 5

- [ ] Registro con email y Google OAuth
- [ ] Login con JWT y "Recordarme"
- [ ] Recuperacion de contrasena via email
- [ ] Onboarding completo de 6 pasos (conectado a ingesta y schedule reales)
- [ ] Configuracion: notificaciones, umbrales SRS, exportar ZIP, eliminar cuenta
- [ ] Todas las rutas protegidas por autenticacion
- [ ] Las 29 pantallas implementadas
- [ ] Flujo completo primera vez: Landing -> Registro -> Onboarding -> Grafo -> Estudio -> Dashboard

---

## Resumen Consolidado

| Sprint | Nucleo | Pantallas | Endpoints | API Keys |
|:---|:---|:---|:---|:---|
| **1. Ingesta + Wiki** | PDF → wiki real con Gemini | 3 | 4 | `GOOGLE_AI_API_KEY`, `LLAMAPARSE_API_KEY` |
| **2. Grafo + Lectura** | React Flow v12 + CodeMirror + plan Duolingo | 6 | 3 | -- |
| **3. Estudio + SRS** | 4 tipos pregunta + evaluacion IA + FSRS real | 6 | 5 | -- |
| **4. LLM Wiki + Dashboard** | Consulta inteligente + metricas + LINT | 4 | 7 | -- |
| **5. Auth + Config** | Registro/login + onboarding + settings | 10 | 7 | Email service |
| **Total** | | **29** | **26** | **2 criticas + 1 email** |

### Hitos clave

```
Fin Sprint 1 → "Puedo subir un PDF y se genera una wiki real"
Fin Sprint 2 → "Puedo ver mi grafo y leer/editar conceptos"
Fin Sprint 3 → "Puedo estudiar, responder quizzes y el sistema recuerda"
Fin Sprint 4 → "Puedo preguntar a mi wiki y ver mi progreso"
Fin Sprint 5 → "Multiples usuarios pueden usar el sistema completo"
```
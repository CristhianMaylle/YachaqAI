# YachaqAI — Especificación Frontend Unificada

> **Versión:** 1.0 — Junio 2026  
> **Estado:** Listo para implementación  
> **Jerarquía de resolución de conflictos:** Artículo > Propuesta técnica > MVP Flujo  
> **Stack:** React 19, Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui  

---

## 0. Sistema de Diseño

### 0.1 Paleta de Colores

| HEX | Nombre | Uso |
|:---|:---|:---|
| `#0D1B2A` | Navy profundo | Fondo principal |
| `#1A2E45` | Navy medio | Cards, sidebar, modales |
| `#1E3A5F` | Navy primario | Color primario de marca |
| `#534AB7` | Violeta | CTA secundario, títulos, acciones de usuario |
| `#EEEDFE` | Violeta claro | Fondos de cajas informativas |
| `#00C6FB` | Cyan eléctrico | CTA principal, highlights, badges |
| `#00E676` | Verde fosforescente | Nodos dominados (R ≥ 90%), éxito |
| `#FFC107` | Amarillo | Nodos en práctica (70% ≤ R < 90%) |
| `#F44336` | Rojo | Nodos críticos (R < 70%) |
| `#9E9E9E` | Gris | Nodos bloqueados, texto secundario |
| `#FF6D00` | Naranja fuego | Racha, alertas de degradación |
| `#993C1D` | Coral oscuro | Errores fatales |
| `#854F0B` | Ámbar oscuro | Advertencias, repasos pendientes |

### 0.2 Sistema Semáforo de Maestría

> **Fuente autoritativa: Artículo + Propuesta (FSRS v5, R_objetivo = 0.90)**

| Estado | Color | Hex | Criterio de Retentiva | Criterio de Activación |
|:---|:---|:---|:---|:---|
| **Bloqueado** | Gris | `#9E9E9E` | No aplica | Prerrequisitos no completados |
| **En Estudio** | Blanco borde azul | `#FFFFFF` / `#00C6FB` | No aplica | Módulo activado, cuestionario pendiente |
| **Crítico** | Rojo | `#F44336` | R < 70% | Calificación "Olvidado" o repaso vencido > 48h |
| **En Práctica** | Amarillo | `#FFC107` | 70% ≤ R < 90% | Aprobado con dificultad, en consolidación |
| **Dominado** | Verde | `#4CAF50` | R ≥ 90% | Respuestas consecutivas correctas y estables |

### 0.3 Tipografía

| Elemento | Fuente / Tamaño | Peso |
|:---|:---|:---|
| Hero / Tagline | Space Grotesk, 48–64px | Bold |
| Título de pantalla (H1) | Space Grotesk, 32–40px | Bold |
| Subtítulo (H2) | Inter, 22–26px | SemiBold |
| Etiqueta de sección | Inter, 14–16px | SemiBold, uppercase |
| Cuerpo de texto | Inter, 15–16px | Regular, line-height 1.6 |
| Pregunta de flashcard | Space Grotesk, 20–24px | SemiBold |
| Respuesta del usuario | JetBrains Mono, 15–16px | Regular |
| Tooltips / Labels | Inter, 12–13px | Regular, `#888888` |

### 0.4 Librería de Íconos — Lucide React

Todos los íconos provienen de **Lucide React** (https://lucide.dev). Stroke: 2px. Tamaño estándar: 20px en navegación, 24–48px en heros.

**Navegación y Layout:**

| Ícono | Lucide Name | Uso | Color | Tamaño |
|:---|:---|:---|:---|:---|
| 🏠 | `House` | Dashboard / Inicio | `#00C6FB` | 20px |
| ◀ | `ChevronLeft` | Volver | `#888888` | 20px |
| ▶ | `ChevronRight` | Siguiente | `#888888` | 20px |
| ☰ | `Menu` | Sidebar toggle | `#FFFFFF` | 22px |
| ✕ | `X` | Cerrar modal | `#888888` | 18px |
| ⚙ | `Settings` | Configuración | `#888888` | 20px |
| 🔔 | `Bell` | Notificaciones | `#FFFFFF` | 20px |
| 👤 | `User` | Perfil | `#888888` | 20px |

**Archivos y Material:**

| Ícono | Lucide Name | Uso | Color | Tamaño |
|:---|:---|:---|:---|:---|
| 📄 | `FileText` | PDF | `#FF6D00` | 20px |
| 🔗 | `Link` | URL | `#00C6FB` | 20px |
| ☁↑ | `Upload` | Subir archivo | `#00C6FB` | 48px (drop zone) |
| 📂 | `FolderOpen` | Explorador SO | `#854F0B` | 20px |
| 🗑 | `Trash2` | Eliminar | `#993C1D` | 18px |
| ✓ | `CheckCircle2` | Listo / Correcto | `#00E676` | 18px |
| ⚠ | `AlertCircle` | Error | `#993C1D` | 18px |
| ⏳ | `Loader2` | Cargando (spin) | `#00C6FB` | 18px |

**Grafo y Nodos:**

| Ícono | Lucide Name | Uso | Color |
|:---|:---|:---|:---|
| ◉ | `Circle` | Nodo base | Por estado semáforo |
| ⏱ | `Clock` | Nodo degradado / repaso pendiente | `#854F0B` |
| ✓ | `Check` | Nodo completado | `#00E676` |
| 🔍 | `Search` | Buscador del grafo | `#888888` |
| 🔒 | `Lock` | Módulo bloqueado | `#888888` |
| ✦ | `Sparkles` | Procesamiento IA | `#00C6FB` |

**Estudio y Aprendizaje:**

| Ícono | Lucide Name | Uso | Color |
|:---|:---|:---|:---|
| 📖 | `BookOpen` | Lectura / Fase lectura | `#534AB7` |
| 🃏 | `CreditCard` | Flashcard | `#00C6FB` |
| 📝 | `PenLine` | Área de escritura | `#FFFFFF` |
| 📤 | `Send` | Enviar respuesta | `#00C6FB` |
| 🎯 | `Target` | Retención / Puntaje | `#00C6FB` |
| ↩ | `RotateCcw` | Reintentar / Repasar | `#534AB7` |
| ▶ | `PlayCircle` | Iniciar módulo | `#00C6FB` |
| ✏ | `Pencil` | Editar | `#888888` |
| 🔥 | `Flame` | Racha diaria | `#FF6D00` |
| 📈 | `TrendingUp` | Tendencia positiva | `#00E676` |
| 📉 | `TrendingDown` | Degradación | `#FF6D00` |
| 📅 | `Calendar` | Repaso programado | `#534AB7` |
| 📊 | `BarChart2` | Estadísticas | `#00C6FB` |
| 🏆 | `Trophy` | Logro (futuro) | `#854F0B` |

### 0.5 Animaciones y Transiciones

- Transición entre pantallas: `fade + slide`, 250–350ms, `ease-in-out`
- Entrada de elementos: `fade-in + translateY(10px→0)`, 200ms, escalonado
- Degradación de nodos: CSS transition gradual sobre fill/background
- Modo módulo — activación: nodos irrelevantes se atenúan (400ms)
- Glow effect: `box-shadow: 0 0 15px rgba(0,198,251,0.5)` en CTAs y nodos dominados
- Loader2: `animate-spin` de Tailwind
- Dark mode por defecto

### 0.6 Principios de UI

1. El sistema semáforo (5 estados, umbrales 70/90) es invariable en toda la app.
2. El YAML frontmatter nunca es editable por el usuario desde la UI.
3. Los flujos de onboarding y cuestionario son lineales sin saltos hacia adelante.
4. Toda pantalla de error ofrece una acción correctiva, no solo un mensaje.
5. La IA es visible pero no bloquea la UI (spinners + mensajes de estado).
6. La calificación del Agente Evaluador es siempre una **sugerencia**; el usuario tiene la última palabra.
7. Feedback inmediato: toda acción del usuario tiene respuesta visual en < 300ms.

---

## 1. Inventario de Pantallas

**Total: 28 pantallas / estados de UI**

| # | ID | Nombre | Módulo | Ruta Next.js |
|:---|:---|:---|:---|:---|
| 1 | P1.1 | Landing / Bienvenida | M1 Auth | `/` |
| 2 | P1.2 | Registro de Cuenta | M1 Auth | `/auth/register` |
| 3 | P1.3 | Inicio de Sesión | M1 Auth | `/auth/login` |
| 4 | P1.4 | Recuperación de Contraseña | M1 Auth | `/auth/reset-password` |
| 5 | P2.1 | Onboarding — Bienvenida | M2 Onboarding | `/onboarding/1` |
| 6 | P2.2 | Onboarding — Nombre del Mazo | M2 Onboarding | `/onboarding/2` |
| 7 | P2.3 | Onboarding — Objetivo de Estudio | M2 Onboarding | `/onboarding/3` |
| 8 | P2.4 | Onboarding — Subida del PDF | M2 Onboarding | `/onboarding/4` |
| 9 | P2.5 | Onboarding — Disponibilidad NL | M2 Onboarding | `/onboarding/5` |
| 10 | P2.6 | Onboarding — Confirmación Cronograma | M2 Onboarding | `/onboarding/6` |
| 11 | P3.1 | Centro de Gestión de Documentos | M3 Ingesta | `/deck/[deckId]/documents` |
| 12 | P3.2 | Upload y Procesamiento | M3 Ingesta | `/deck/[deckId]/documents/upload` |
| 13 | P3.3 | Panel de Salud del Mazo (LINT) | M3 Ingesta | `/deck/[deckId]/health` |
| 14 | P4.1 | Vista Principal del Grafo | M4 Grafo | `/deck/[deckId]/graph` |
| 15 | P4.2 | Tooltip / Panel de Concepto | M4 Grafo | (overlay en P4.1) |
| 16 | P4.3 | Vista Filtrada por Módulo | M4 Grafo | (estado de P4.1) |
| 17 | P5.0 | Plan de Estudio Visual | M5 Sesión | `/deck/[deckId]/plan` |
| 18 | P5.1 | Preparación de Sesión | M5 Sesión | `/deck/[deckId]/session/[id]/prep` |
| 19 | P5.2 | Lectura del Concepto (Modo Lectura) | M5 Sesión | `/deck/[deckId]/session/[id]/read` |
| 20 | P5.3 | Editor Markdown (Modo Edición) | M5 Sesión | `/deck/[deckId]/session/[id]/edit` |
| 21 | P5.4 | Cuestionario del Módulo | M5 Sesión | `/deck/[deckId]/session/[id]/quiz` |
| 22 | P5.5 | Resumen Post-Sesión | M5 Sesión | `/deck/[deckId]/session/[id]/summary` |
| 23 | P5.6 | Sesión de Repaso SRS | M5 Sesión | `/deck/[deckId]/review` |
| 24 | P5.7 | Ruta SI — Recursos Adicionales | M5 Sesión | `/deck/[deckId]/session/[id]/resources` |
| 25 | P5.8 | Ruta NO — Mini Repaso Programado | M5 Sesión | `/deck/[deckId]/session/[id]/reinforce` |
| 26 | P6.1 | Dashboard Principal | M6 Dashboard | `/dashboard` |
| 27 | P6.2 | Estadísticas Detalladas | M6 Dashboard | `/dashboard/stats` |
| 28 | P6.3 | LLM Wiki — Consulta Inteligente | M6 Wiki | `/deck/[deckId]/wiki` |
| 29 | P6.4 | Configuración y Preferencias | M6 Config | `/settings` |

---

## 2. Módulo 1 — Autenticación

### P1.1 — Landing / Bienvenida

**Ruta:** `/`  
**Propósito:** Convertir visitantes en usuarios registrados.

**Layout:**
- Fondo oscuro `#0D1B2A` con partículas flotantes (nodos que se conectan sutilmente).
- Logo YachaqAI: superior izquierda — isotipo (`Network`) + "YachaqAI" en Space Grotesk Bold.

**Elementos:**

| Zona | Contenido |
|:---|:---|
| **Hero** | Headline: "Transforma tus PDFs en conocimiento que nunca olvidas". Subtítulo: propuesta de valor en 2 líneas (grafo + IA + SRS). |
| **CTA principal** | Botón "Empezar Gratis" (`PlayCircle` izq.) — `#00C6FB`, grande, centrado. |
| **CTA secundario** | "Ya tengo cuenta" (`LogIn` izq.) — texto sin relleno. |
| **Sección valor** | 3 cards: (`Upload`) "Sube tu material" · (`Sparkles`) "La IA genera tu grafo" · (`Brain`) "Aprende y recuerda". Fade-in con translateY al scroll. |
| **Sección demo** | GIF/screenshot del grafo semáforo en acción. |
| **Footer** | Links: Términos, Privacidad, Contacto. |

**Estados:**

| Estado | Comportamiento |
|:---|:---|
| **Base** (visitante nuevo) | CTA "Empezar Gratis" + "Ya tengo cuenta" visibles. |
| **Sesión activa** | "Empezar Gratis" se sustituye por "Ir a mi Dashboard" (`LayoutDashboard`). Redirige a P6.1. |
| **Scroll activo** | CTA "Empezar Gratis" aparece fijo en top-bar. |

**Interacciones:**
- Click "Empezar Gratis" → P1.2. Hover: scale 1.05 + glow `#00C6FB`.
- Click "Ya tengo cuenta" → P1.3.

---

### P1.2 — Registro de Cuenta

**Ruta:** `/auth/register`

**Elementos:**

| Elemento | Especificación |
|:---|:---|
| Nombre completo | Texto, requerido |
| Email | Email, requerido, validación en tiempo real |
| Contraseña | Password, mín. 8 caracteres, 1 mayúscula, 1 número. Indicador: Débil / Media / Fuerte |
| Confirmar contraseña | Password, coincidencia exacta en tiempo real |
| Zona horaria | Select, auto-detectada por navegador, editable |
| Checkbox | "Acepto los Términos de Servicio y Política de Privacidad" (requerido) |
| Botón | "Crear mi cuenta" — deshabilitado hasta validación completa. Spinner + "Creando..." al enviar |
| OAuth | "Continuar con Google" (SVG oficial, no Lucide) |
| Link | "¿Ya tienes cuenta? Inicia sesión" → P1.3 |

**Éxito:** Redirige a P2.1 (Onboarding).

---

### P1.3 — Inicio de Sesión

**Ruta:** `/auth/login`

**Elementos:**

| Elemento | Especificación |
|:---|:---|
| Email | Requerido |
| Contraseña | Requerido |
| Checkbox | "Recordarme" (sesión 30 días) |
| Botón | "Iniciar sesión" |
| Link | "¿Olvidaste tu contraseña?" → P1.4 |
| OAuth | "Continuar con Google" |
| Link | "¿No tienes cuenta? Regístrate gratis" → P1.2 |

**Error:** Banner rojo `AlertCircle`: "Email o contraseña incorrectos".  
**Éxito:** Si ya completó onboarding → P6.1. Si no → P2.1.

---

### P1.4 — Recuperación de Contraseña

**Ruta:** `/auth/reset-password`

**Paso 1:** Campo email + "Enviar enlace de recuperación". Éxito: banner verde "Si ese email existe, recibirás el enlace."  
**Paso 2** (desde email): Nueva contraseña + confirmar. Link caduca en 24h. Éxito → P1.3 con mensaje "Contraseña actualizada."

---

## 3. Módulo 2 — Onboarding Conversacional

Wizard lineal de 6 pasos con barra de progreso visual. No se pueden saltar pasos; sí se puede retroceder.

### P2.1 — Bienvenida

**Ruta:** `/onboarding/1`

| Elemento | Contenido |
|:---|:---|
| Barra de progreso | ●○○○○○ (1/6) |
| Titular | "¡Hola, [nombre]! Configuremos tu primer mazo de conocimiento" |
| Párrafo | Qué es un mazo, qué pasará en los siguientes pasos, duración (~3 min) |
| Bullets | "✓ Tu PDF se convertirá en un mapa visual de conceptos" · "✓ La IA generará tu cronograma personalizado" · "✓ Nunca más olvidarás lo que aprendiste" |
| Botón | "Empezar configuración →" |

---

### P2.2 — Nombre y Tema del Mazo

**Ruta:** `/onboarding/2`

| Elemento | Contenido |
|:---|:---|
| Barra | ●●○○○○ |
| Pregunta | "¿Sobre qué tema vas a estudiar?" |
| Campo nombre | Texto grande, placeholder: "ej. CCNA Redes, Anatomía I". Máx. 60 chars. |
| Campo descripción | Opcional, breve. |
| Chips sugerencia | Aparecen si campo vacío 3s. |
| Botones | "← Anterior" · "Siguiente →" (habilitado con ≥ 3 chars) |

---

### P2.3 — Contexto y Objetivo

**Ruta:** `/onboarding/3`

| Elemento | Contenido |
|:---|:---|
| Barra | ●●●○○○ |
| Pregunta | "¿Cuál es tu objetivo?" |
| Opciones (tarjetas) | Examen (+ date picker) · Profesional · Interés personal · Certificación |
| Pregunta nivel | Principiante / Intermedio / Avanzado (radio visual) |

---

### P2.4 — Subida del Primer PDF

**Ruta:** `/onboarding/4`

| Elemento | Contenido |
|:---|:---|
| Barra | ●●●●○○ |
| Drop zone | Área grande borde punteado: "Arrastra tu PDF aquí o haz clic para seleccionar". Acepta: PDF, máx. 100MB. |
| Al seleccionar | Nombre + tamaño. Botón "Subir y procesar PDF". |
| Procesando | Barra de progreso + mensajes rotantes: "Extrayendo contenido..." → "Identificando conceptos..." → "Construyendo grafo..." → "Generando preguntas..." |
| Nota | "El procesamiento puede tomar 2-5 minutos. Puedes avanzar al siguiente paso mientras procesa." |
| El usuario puede avanzar a P2.5 sin esperar. |

---

### P2.5 — Disponibilidad en Lenguaje Natural

**Ruta:** `/onboarding/5`

| Elemento | Contenido |
|:---|:---|
| Barra | ●●●●●○ |
| Instrucción | "Cuéntame en tus palabras cuándo puedes dedicarle tiempo a este tema" |
| Ejemplos (gris) | "Lunes y miércoles de 7pm a 8pm, sábados de 9am a 12pm" · "Tengo 1 hora de lunes a viernes en las noches" · "Solo los fines de semana, mañanas" |
| Textarea | Grande, autofocus, placeholder con ejemplo. |
| Botón | "Generar mi cronograma →" (`Sparkles`) |
| Procesando | "El agente está analizando tu disponibilidad..." con `Loader2` |
| Aclaración | Si texto ambiguo, el agente muestra pregunta de aclaración en bloque especial + segundo campo de texto. |

---

### P2.6 — Confirmación del Cronograma

**Ruta:** `/onboarding/6`

| Elemento | Contenido |
|:---|:---|
| Barra | ●●●●●● |
| Titular | "Tu plan de estudio está listo" |
| Resumen | Card: horas semanales, N módulos, duración estimada, próxima sesión. |
| Calendario semanal | Grid 7 columnas (L-D) con slots resaltados en `#00C6FB`. Cada slot: día, hora inicio/fin, duración. Slots editables: clic para eliminar, arrastrar para mover. |
| Ajuste manual | "Agregar otro horario" → mini selector día/hora. |
| Módulos | Lista de módulos con fechas asignadas. |
| Botón primario | "Confirmar y comenzar a estudiar →" → P4.1 |
| Botón secundario | "← Ajustar disponibilidad" → P2.5 |

---

## 4. Módulo 3 — Ingesta de PDF

### P3.1 — Centro de Gestión de Documentos

**Ruta:** `/deck/[deckId]/documents`

| Elemento | Contenido |
|:---|:---|
| Header | Nombre del mazo |
| Botón | "+ Agregar documento al mazo" → P3.2 |
| Lista docs | Cards por documento: nombre, fecha, estado (`Procesando...` / `Procesado ✓` / `Error ✗`), estadísticas (N conceptos, N entidades, N módulos), tiempo de procesamiento. Acciones: Ver grafo · Ver log · Eliminar. |
| Estado vacío | Ilustración + "Sube tu primer documento para comenzar" |
| Log actividad | Últimas entradas del `log.md` |

---

### P3.2 — Upload y Procesamiento

**Ruta:** `/deck/[deckId]/documents/upload`

| Elemento | Contenido |
|:---|:---|
| Drop zone | Área drag & drop. Acepta: PDF, máx. 100MB. |
| Campo URL | Input + botón "Agregar URL" (`Link` cyan). Valida accesibilidad. |
| Lista material | Ítems con íconos: `FileText` naranja (PDF) · `Link` cyan (URL). Estados: `Loader2` cargando → `CheckCircle2` listo → `AlertCircle` error. `Trash2` para eliminar. |
| Opciones avanzadas | (Colapsable) Toggle OCR para escaneados · Idioma principal del documento. |
| Botón procesar | "Procesar con IA" (`Sparkles` cyan). Aparece cuando hay ≥ 1 ítem con estado "Listo". |
| Progreso | Barra 0–100% con etapa actual (6 etapas: Subiendo → Extrayendo texto → Analizando conceptos → Creando Markdown → Generando preguntas → Indexando para Wiki). Estimación de tiempo. |
| Resultado | Banner verde + estadísticas. Botón "Ver el grafo actualizado →" · "Subir otro documento". |
| Re-ingesta | Si el mazo ya tiene material: botón dice "Actualizar grafo con nuevo material". El sistema compara contra `index.md` existente, actualiza conceptos ya presentes y marca contradicciones. |

**Estados de error:**

| Caso | Comportamiento |
|:---|:---|
| Archivo no PDF arrastrado | Drop zone rechaza: borde coral + shake + "Solo se aceptan archivos PDF." |
| Tamaño excedido | `AlertCircle` coral: "El archivo supera el límite de 100 MB." + `RotateCcw` reintentar. |
| URL inaccesible | `AlertCircle` coral: "No se pudo acceder al enlace." + `RotateCcw` reintentar. |
| PDF corrupto/protegido | Notificación: "No pudimos leer este PDF. ¿Está protegido con contraseña?" |
| PDF escaneado (< 100 chars texto) | Activa pipeline OCR automáticamente. Notificación: "Detectamos un PDF escaneado. Usando OCR, esto tardará más." |
| Fallo del LLM | Persiste Markdown crudo; agenda re-procesamiento. Botón "Reintentar". |

---

### P3.3 — Panel de Salud del Mazo (LINT)

**Ruta:** `/deck/[deckId]/health`

| Elemento | Contenido |
|:---|:---|
| Header | "Salud del Mazo" + fecha último análisis |
| Botón | "Ejecutar análisis ahora" |
| Semáforo general | Badge grande: Verde / Amarillo / Rojo según N problemas |
| Sección: Nodos huérfanos | Conceptos sin enlaces entrantes. Acción: "Sugerir conexiones". |
| Sección: Contradicciones | Afirmaciones contradictorias entre fuentes. Acción: "Ver detalle" (panel dividido con ambas fuentes). |
| Sección: Conceptos sin página | Términos mencionados 5+ veces sin archivo. Acción: "Crear página ahora" (borrador automático). |
| Sección: Referencias rotas | Links a archivos inexistentes. Acción: "Corregir automáticamente". |
| Sección: Módulos sin cuestionario | Módulos con conceptos pero sin preguntas. Acción: "Generar preguntas". |
| Exportar | "Exportar reporte completo" (descarga `log.md` en PDF). |

---

## 5. Módulo 4 — Grafo de Conocimiento

### P4.1 — Vista Principal del Grafo

**Ruta:** `/deck/[deckId]/graph`  
**Tecnología:** React Flow v12 con simulación de física 2D.

**Layout:**

| Zona | Contenido |
|:---|:---|
| **Canvas** (80%) | Grafo interactivo: nodos como rectángulos redondeados con color semáforo. Aristas sólidas = prerrequisito, punteadas = relacionado, rojas = dependencia en riesgo. Los nodos más conectados gravitan al centro. |
| **Sidebar izquierda** | Lista de módulos con badge de estado (Bloqueado `Lock` / En Progreso / Completado `CheckCircle2`). Click en módulo: filtra grafo. Buscador (`Search`): filtra nodos en tiempo real, click centra cámara con animación. |
| **Barra superior** | Filtros: Todos / Solo rojos / Solo mi módulo / Solo dominados. Búsqueda de concepto. Controles: Centrar todo · Zoom + / - / 100%. Botón "+ Agregar material" (`Plus`) → P3.2. |
| **Barra inferior** | Estadísticas: Dominados N (verde) · En práctica N (amarillo) · Críticos N (rojo) · Bloqueados N (gris). Maestría general: XX%. |

**Dos modos de visualización:**

**Modo Exploración Libre:**
- Todos los nodos visibles con sus colores de retención.
- Click en nodo: abre P4.2 (tooltip/panel).
- Hover: nodo scale 1.1, texto completo si truncado.
- Drag canvas: pan. Scroll: zoom.
- Nodos degradados muestran `Clock` ámbar encima.

**Modo Módulo Activo:**
- Nodos del módulo: badges numéricos circulares cyan (1, 2, 3...). Nodos completados: `CheckCircle2` verde sobre badge.
- Nodos fuera del módulo: gris oscuro `#2A3A4A`, 60% opacidad.
- Flechas direccionales entre nodos del módulo.
- Banner superior canvas: "Módulo N: [Nombre] — Nodo X de Y" (`Layers`). Botón "Salir del modo módulo" (`XCircle`).
- Click nodo del módulo: popover con nombre, posición, retención, "Estudiar ahora" (`PlayCircle`).
- Click nodo gris: tooltip "Este nodo pertenece a otro módulo" (`Lock`).
- Salir del modo: animación 400ms — nodos recuperan brillo, badges pop-out, flechas fade-out.

---

### P4.2 — Tooltip / Panel de Concepto

**(Overlay en P4.1, posicionado junto al nodo)**

| Elemento | Contenido |
|:---|:---|
| Título | Nombre del concepto (bold) |
| Módulo | Módulo al que pertenece |
| Estado | Ícono semáforo + nombre del estado |
| Maestría | XX% (barra de progreso coloreada) |
| Próximo repaso | "En 3 días" / "HOY" (rojo si urgente) |
| Preguntas | N preguntas asociadas |
| Prerrequisitos | Lista de 1–3 nodos enlazados |
| Acciones | "Leer concepto" (`BookOpen`) → P5.2. "Repasar ahora" (`RotateCcw`) → P5.6 para ese nodo. |

Click fuera: cierra tooltip.

---

### P4.3 — Vista Filtrada por Módulo

**(Estado de P4.1)**

Solo nodos del módulo seleccionado; resto atenuado o desaparece. Panel izquierdo resalta módulo activo. Lista ordenada de conceptos (orden topológico). Banner con % de progreso. Si disponible: "▶ Iniciar sesión de este módulo". Si bloqueado: "🔒 Completa el Módulo N para desbloquear".

---

## 6. Módulo 5 — Sesión de Estudio

### P5.0 — Plan de Estudio Visual

**Ruta:** `/deck/[deckId]/plan`  
**Inspiración:** Ruta visual secuencial tipo Duolingo, no lista plana.

| Elemento | Contenido |
|:---|:---|
| Header | `Route` + "Plan de Estudio" |
| Ruta visual | Camino vertical con módulos como nodos. Líneas de conexión entre módulos. |
| Cada módulo | Nombre, N conceptos, barra retención promedio, duración estimada. |
| Estados módulo | `Circle` outline = Pendiente · `CircleHalf` custom cyan = En Progreso · `CheckCircle2` verde = Completado · `Clock` ámbar = Repaso pendiente hoy · `TrendingDown` naranja = Degradado · `Lock` gris = Bloqueado. |
| Botones módulo | Disponible: "Estudiar" (`PlayCircle` cyan) → P5.1. Repaso pendiente: "Repasar" (`RotateCcw` + `Clock`) → P5.6 directo. Degradado: "Repaso urgente" (`Zap` naranja) → P5.6. Bloqueado: tooltip "Completa el módulo anterior." |
| Expandir módulo | `ChevronDown`: lista de chips de nodos, duración, retención desglosada. |
| Personalización | Botón "Personalizar con prompt" (`Wand2`): textarea para instrucciones NL ("Enfocarme en los más difíciles"). Regenera plan con `Sparkles`. |
| Plan completado | Todos `CheckCircle2`. Barra "N de N completados". Botón "Ver mis estadísticas" (`BarChart2`). |

---

### P5.1 — Preparación de Sesión

**Ruta:** `/deck/[deckId]/session/[id]/prep`

| Elemento | Contenido |
|:---|:---|
| Card central | Tipo: Contenido nuevo / Repaso / Mixto. Módulo. Conceptos a estudiar: N. Duración estimada. Preguntas: N. |
| Repasos pendientes | Banner amarillo: "⚠ Tienes N conceptos para repasar primero (X min)". Opciones: "Hacer repaso primero" (recomendado) / "Saltar repaso". |
| Botón primario | "▶ Comenzar sesión" |
| Botón secundario | "Recordarme más tarde" → agenda notificación en 2h. |

---

### P5.2 — Lectura del Concepto (Modo Lectura)

**Ruta:** `/deck/[deckId]/session/[id]/read`

| Zona | Contenido |
|:---|:---|
| **Nav superior** | Breadcrumb: Mazo → Módulo → Concepto. Contador: "Concepto 2 de 6". Botones ← Anterior / Siguiente →. Botón "Modo edición" (`Pencil`) → P5.3. |
| **Sidebar derecha** | Lista de conceptos del módulo. Check verde en leídos (rastreo de scroll). Indicador de lectura actual (punto `#00C6FB`). |
| **Contenido principal** | Título + badge semáforo. Barra maestría: "45% — En Práctica 🟡". Markdown renderizado: headings, tablas, código resaltado, diagramas Mermaid. Links internos `[[Concepto]]` clickeables → navegan al nodo del grafo. Sección "Mis Notas" con fondo diferenciado (área de anotaciones del usuario, editor simple). |
| **Barra inferior fija** | Tiempo de lectura: "Leyendo hace 3 min". Si todos los conceptos leídos: botón "✓ Ir al Cuestionario" activo. |

**Interacciones:**
- Scroll: el nodo correspondiente se resalta en sidebar con glow cyan.
- Click nodo en sidebar: scroll smooth al fragmento.
- Click botón Atrás (`ArrowLeft`): modal confirmación "¿Salir del módulo? Tu progreso se guardará."

---

### P5.3 — Editor Markdown (Modo Edición)

**Ruta:** `/deck/[deckId]/session/[id]/edit`  
**Tecnología:** CodeMirror 6 + remark/rehype.

| Zona | Contenido |
|:---|:---|
| Layout | Split view opcional: Editor izquierda / Preview derecha. |
| Barra herramientas | Negrita / Cursiva / Código / Link / Tabla / Encabezado. |
| Editor CodeMirror | Sintaxis Markdown resaltada. Autocompletado `[[`: al escribir `[[` aparece dropdown de conceptos del mazo. YAML frontmatter colapsado y **solo lectura** (protegido). Sección `## Notas del Usuario` es el espacio principal de edición. |
| Panel frontmatter | Solo lectura. Muestra metadatos SRS en formato legible. Tooltip: "Estos valores son gestionados automáticamente por el sistema SRS." |
| Guardado | "Guardar cambios" (Ctrl+S). "Guardar y volver a lectura". "Descartar cambios". Toast de confirmación + re-indexación incremental en background. |

---

### P5.4 — Cuestionario del Módulo

**Ruta:** `/deck/[deckId]/session/[id]/quiz`

> **Fuente autoritativa: Propuesta.** 4 tipos de pregunta. Calificación FSRS: Excelente / Bien / Difícil / Olvidado. Soberanía del usuario.

**Header:**
- Nombre del módulo. Progreso: "Pregunta 2 de 8". Barra de progreso lineal.

**Tipo 1 — Completar oración:**

| Elemento | Contenido |
|:---|:---|
| Enunciado | Texto con `[___]` a rellenar |
| Input | Campo de texto |
| Botón | "Comprobar respuesta" |
| Post-respuesta | Banner verde/rojo. Respuesta correcta revelada. Auto-calificación FSRS según % acierto: 100% → Excelente, 70–99% → Bien, 1–69% → Difícil, 0% → Olvidado. |
| Calificador | **Sistema automático** (`CheckCircle2`) |

**Tipo 2 — Relacionar términos:**

| Elemento | Contenido |
|:---|:---|
| Layout | Dos columnas: Términos (izq) ↔ Definiciones (der) |
| Interacción | Drag-and-drop o líneas de conexión |
| Post-respuesta | Líneas verdes (correcto) / rojas (incorrecto). Auto-calificación FSRS. |
| Calificador | **Sistema automático** |

**Tipo 3 — Diagrama incompleto:**

| Elemento | Contenido |
|:---|:---|
| Layout | Diagrama con etiquetas faltantes |
| Interacción | Inputs en posiciones del diagrama |
| Post-respuesta | Etiquetas correctas reveladas. Auto-calificación FSRS. |
| Calificador | **Sistema automático** |

**Tipo 4 — Desarrollo conceptual:**

| Elemento | Contenido |
|:---|:---|
| Pregunta | Pregunta abierta |
| Textarea | Grande, para respuesta extensa |
| Botón | "Enviar para evaluación de IA" (`Send`) |
| Procesando | "El agente IA está analizando tu respuesta..." (`Loader2` + `Sparkles`, 3–5 seg) |
| **Retroalimentación IA** | Panel estructurado: |
| | ✓ **Ideas cubiertas:** lista de conceptos mencionados correctamente |
| | ✗ **Ideas omitidas:** conceptos que faltaron |
| | ⚠ **Errores conceptuales:** si los hay |
| | 🎯 **Calificación sugerida:** [Excelente / Bien / Difícil / Olvidado] |
| | 💬 **Justificación:** texto del agente |
| | 📖 **Tip de estudio:** "Revisa la sección X en el concepto Y" |
| **Botones finales** | "Confirmar [Sugerencia]" / "Cambiar calificación" (dropdown con las 4 opciones FSRS) |
| Calificador | **IA sugiere → Usuario confirma** |

**Regla de conversión (preguntas objetivas):**
| Acierto | Calificación FSRS |
|:---|:---|
| 100% | Excelente |
| 70–99% | Bien |
| 1–69% | Difícil |
| 0% | Olvidado |

Umbrales configurables por el usuario en P6.4.

---

### P5.5 — Resumen Post-Sesión

**Ruta:** `/deck/[deckId]/session/[id]/summary`

| Elemento | Contenido |
|:---|:---|
| Celebración | Animación (confetti si buen resultado, partículas suaves si regular) |
| Métricas | Tiempo total. Conceptos evaluados: N. Distribución: X Excelente, X Bien, X Difícil, X Olvidado. Puntos de maestría ganados. |
| Mini-grafo | Nodos que cambiaron de color (animación de transición). |
| Próximos repasos | Lista: "Protocolo TCP — en 3 días". |
| Próxima sesión | Fecha/hora según cronograma + módulo. |
| **Bifurcación** | Si promedio ≥ 70% retentiva → mostrar botón "Ver recursos adicionales" → P5.7. Si promedio < 70% → mostrar botón "Ver mini repaso detallado" → P5.8. |
| Botones siempre | "Ver el grafo completo →" · "Volver al Dashboard" · "Consultar el LLM Wiki" |

---

### P5.6 — Sesión de Repaso SRS

**Ruta:** `/deck/[deckId]/review`

| Elemento | Contenido |
|:---|:---|
| Entrada | "Tienes N conceptos para repasar hoy". Tiempo estimado. "▶ Comenzar repaso". |
| Flashcards | Mismo flujo que P5.4 por tipo de pregunta. Badge: "Repaso SRS — Fortaleciendo retención". |
| Diferencias | La calificación actualiza FSRS directamente (no primera vez). Si "Olvidado": propaga incertidumbre a dependientes (Graph-SRS). |
| Resumen | Igual que P5.5 enfocado en retención. Gráfico de barras: retentiva antes vs. después. "Tu retención promedio: 76% → 84%". |

**Edge case — ausencia prolongada (30+ días):**
- No sobrecarga con todos los vencidos. "Sesión de rehabilitación": máx. 20 conceptos, priorizando los más críticos.

**Edge case — "Olvidado" 5+ veces consecutivas:**
- Sugiere revisar material fuente. Propone dividir el concepto en sub-conceptos.

---

### P5.7 — Ruta SI: Recursos Adicionales

**Ruta:** `/deck/[deckId]/session/[id]/resources`

| Elemento | Contenido |
|:---|:---|
| Header | "Recursos para profundizar" |
| Grid | Cards de recursos externos (artículos, papers) con `BookOpen` / `GraduationCap`. |
| Filtros | Todo / Artículos / Papers (`Filter`). |
| Cada card | Título, fuente, tipo, botón "Ver" (`ExternalLink` → nueva pestaña). |
| Botón | "Volver al plan de estudio" (`ArrowLeft`) → P5.0. |

---

### P5.8 — Ruta NO: Mini Repaso Programado

**Ruta:** `/deck/[deckId]/session/[id]/reinforce`

| Elemento | Contenido |
|:---|:---|
| Header | "Conceptos que necesitan refuerzo" |
| Lista nodos deficientes | `AlertCircle` coral. Por cada uno: pregunta, respuesta del usuario, feedback IA, fragmento del material fuente. |
| Sesión programada | `Calendar`: "Sesión de refuerzo programada". Selector de hora (`Clock`, intervalos 30 min). Al seleccionar: `CheckCircle2` + "Sesión programada a las [hora]". |
| Botón | "Continuar con el siguiente módulo" (`ArrowRight`) → P5.0. |

---

## 7. Módulo 6 — Dashboard, Wiki y Configuración

### P6.1 — Dashboard Principal

**Ruta:** `/dashboard`

**Layout:**

| Zona | Contenido |
|:---|:---|
| **Sidebar izquierda** (colapsable `Menu`) | Logo YachaqAI. Navegación: `House` Inicio · `Network` Mis Grafos · `BookOpen` Plan de estudio · `BarChart2` Estadísticas · `Settings` Configuración · `LogOut` Cerrar sesión. |
| **Barra superior** | Saludo contextual: "Buenos días, [nombre]". Racha: `Flame` + N días. `Bell` notificaciones (badge si hay pendientes). `User` perfil. |

**Contenido principal:**

| Sección | Contenido |
|:---|:---|
| **Racha** | Cadena de círculos por día (verde = sesión, gris = no). Si no ha estudiado hoy después de mediodía: `Flame` parpadea, "¡Estudia hoy para no perder tu racha!" naranja. |
| **Sesión de hoy** | Card: "📅 Sesión programada hoy — 7:00 PM". Módulo. Duración. Botón "▶ Iniciar sesión ahora" → P5.1. Si repasos urgentes: banner rojo "⚠ N conceptos críticos requieren repaso" → P5.6. |
| **Métricas** | Maestría general: % + barra semáforo. Distribución nodos: gráfico torta. Tiempo esta semana: barras (L–D). Retención: línea temporal (30 días). |
| **Carga repaso** | Barras: conceptos a repasar por día (hoy + 7 días). |
| **Módulos** | Lista con estado y %. Acción: "Iniciar" / "Continuar" / "Bloqueado". |
| **Accesos rápidos** | "Ver grafo" · "Consultar LLM Wiki" · "Subir nuevo documento". |

**Estados:**

| Estado | Comportamiento |
|:---|:---|
| **Vacío** (sin grafos) | "¡Crea tu primer grafo para empezar!" + botón "Crear mi primer grafo" (`PlusCircle`). |
| **Sin repasos** | "¡Todo al día!" `CheckCircle2` verde. |
| **Repasos urgentes** | Banner ámbar al tope. Nodos/módulos degradados por urgencia. |
| **Notificaciones** | `Bell` con badge numérico rojo. Dropdown: repasos (`Clock`), logros (`Trophy`), degradaciones (`TrendingDown`). |

---

### P6.2 — Estadísticas Detalladas

**Ruta:** `/dashboard/stats`

| Sección | Contenido |
|:---|:---|
| Selector periodo | Última semana / Último mes / Todo el tiempo |
| **Curva retención personalizada** | Gráfico líneas: Mi retención real vs. Curva Ebbinghaus teórica. |
| **Análisis por concepto** | Tabla: Concepto / Módulo / Retentiva R / Estabilidad S / Próximo repaso. Orden: dificultad D desc. Filtro: solo críticos (R < 70%). |
| **Heatmap actividad** | Tipo GitHub: cada día del año, color según minutos. |
| **Patrones** | "Estudias mejor los: Martes (87% retención)." · "Los conceptos tipo X tienen mayor olvido." · "Tasa completación: 78%." |
| **Eficacia cronograma** | Sesiones planificadas vs. completadas (barras agrupadas). |

---

### P6.3 — LLM Wiki: Consulta Inteligente

**Ruta:** `/deck/[deckId]/wiki`

> **Fuente autoritativa: Propuesta Sección 5.** LLM Wiki con navegación de grafo preconstruido. Profundidad: 3 saltos. Latencia objetivo: ≤ 10s.

| Zona | Contenido |
|:---|:---|
| **Historial chat** | Scrolleable. Mensajes usuario: derecha, fondo gris claro. Respuestas agente: izquierda, fondo `#1A2E45`. Respuestas incluyen citas ancladas: `[Protocolo TCP →]` que abren el concepto en P5.2. |
| **Campo pregunta** | Textarea: "¿Qué quieres consultar de tu mazo?" Placeholder con ejemplos. Botón "→ Enviar" (o Enter). |
| **Procesando** | "El agente está navegando tu grafo de conocimiento..." (`Loader2` + `Sparkles`). Indicador: "Revisando: protocolo\_tcp.md, modelo\_osi.md..." |
| **Respuesta** | Markdown renderizado. Citas inline: texto subrayado, hover muestra extracto. Panel fuentes (colapsable): lista archivos `.md` usados. |
| **Archivar** | Si respuesta > 300 palabras o sintetiza 3+ fuentes: banner "¿Guardar esta respuesta como nuevo concepto en tu mazo?" Botón "Sí, guardar como concepto síntesis" / "No, solo para esta sesión". |
| **Sugerencias** | Chips de preguntas sugeridas basadas en conceptos con R baja. |

**Límites:**

| Condición | Comportamiento |
|:---|:---|
| Pregunta fuera del dominio | "Esta pregunta está fuera del contenido de tu mazo. ¿Deseas buscar en internet?" |
| Grafo > 500 nodos | Búsqueda vectorial previa limita subgrafo a 50 candidatos. |
| Respuesta > 4000 tokens | Resumen ejecutivo + expansión por sección. |
| Sin internet | "La consulta requiere conexión. En modo offline puedes buscar en tus archivos localmente." Activa búsqueda por keywords en MD locales. |

---

### P6.4 — Configuración y Preferencias

**Ruta:** `/settings`

| Sección | Contenido |
|:---|:---|
| **Mi Cuenta** | Nombre (editable). Email (editable, requiere verificación). Zona horaria (select con búsqueda). Cambiar contraseña. |
| **Notificaciones** | Por tipo (toggle ON/OFF + canal: Push / Email / Ambos): Recordatorio sesión · Repaso urgente · Módulo desbloqueado · Racha en peligro · Resumen semanal. Horario silencio: slider horas (ej. 22:00–08:00). |
| **Mi Mazo** | Nombre y descripción (editables). Umbrales SRS: sliders para ajustar umbrales Excelente/Bien/Difícil en preguntas objetivas. Exportar: botón "Exportar mazo como ZIP de Markdown" (descarga directorio completo de .md). |
| **Privacidad** | Toggle: "Modo privado local — no enviar datos al proveedor de IA" (deshabilitado en MVP, etiqueta "Próximamente"). Link: "Ver qué datos se envían a APIs externas". |
| **Peligro** | "Eliminar mi cuenta y todos mis datos" — confirmación doble. 30 días para descargar datos antes de eliminación irreversible. |

---

## 8. Navegación Global

### 8.1 Flujo Primera Vez (New User)

```
P1.1 Landing
  └→ P1.2 Registro (o P1.3 Login)
       └→ P2.1 Onboarding Bienvenida
            └→ P2.2 Nombre del Mazo
                 └→ P2.3 Objetivo
                      └→ P2.4 Subida PDF
                           └→ P2.5 Disponibilidad NL
                                └→ P2.6 Confirmar Cronograma
                                     └→ P4.1 Grafo Principal
                                          └→ P5.0 Plan de Estudio
                                               └→ P5.1 Preparación Sesión
                                                    └→ P5.2 Lectura
                                                         └→ P5.4 Cuestionario
                                                              └→ P5.5 Resumen
                                                                   └→ P4.1 (colores actualizados)
```

### 8.2 Flujo Usuario Recurrente

| Punto de Entrada | Origen | Destino |
|:---|:---|:---|
| Notificación repaso | Push/email | P5.6 Repaso SRS |
| Notificación sesión | Push/email | P5.1 Preparación |
| Login directo | P1.3 | P6.1 Dashboard |
| Dashboard | "Iniciar sesión" | P5.1 Preparación |
| Dashboard | "Ver grafo" | P4.1 Grafo |
| Dashboard | "Consultar Wiki" | P6.3 LLM Wiki |
| Grafo | Click nodo | P5.2 Lectura (standalone) |
| Grafo | "Repasar nodo" | P5.6 Repaso (nodo específico) |
| Plan | "Estudiar" módulo | P5.1 Preparación |
| Plan | "Repasar" módulo | P5.6 Repaso (módulo) |
| LLM Wiki | Click cita | P5.2 Concepto citado |

### 8.3 Sidebar Global (presente en toda la app autenticada)

| Ícono | Label | Destino |
|:---|:---|:---|
| `House` | Inicio | P6.1 Dashboard |
| `Network` | Mis Grafos | P4.1 Grafo |
| `Route` | Plan de Estudio | P5.0 Plan |
| `FileText` | Documentos | P3.1 Gestión Docs |
| `MessageSquare` | LLM Wiki | P6.3 Wiki |
| `BarChart2` | Estadísticas | P6.2 Stats |
| `Settings` | Configuración | P6.4 Settings |
| `LogOut` | Cerrar sesión | P1.1 Landing |

---

## 9. API Endpoints del Backend (FastAPI)

| Módulo | Endpoint | Método | Descripción |
|:---|:---|:---|:---|
| Auth | `POST /auth/register` | POST | Registro |
| Auth | `POST /auth/login` | POST | Login, retorna JWT |
| Auth | `POST /auth/reset-password` | POST | Solicitud de reset |
| Auth | `POST /auth/google` | POST | OAuth Google |
| Onboarding | `POST /onboarding/schedule` | POST | Parsea NL, genera cronograma |
| Ingesta | `POST /ingest/pdf` | POST | Upload PDF |
| Ingesta | `POST /ingest/url` | POST | Procesa URL |
| Ingesta | `GET /ingest/status/{jobId}` | GET | Estado procesamiento |
| Ingesta | `POST /deck/{deckId}/lint` | POST | Ejecuta LINT |
| Grafo | `GET /deck/{deckId}/graph` | GET | Nodos, aristas, estados SRS |
| Plan | `GET /deck/{deckId}/plan` | GET | Módulos ordenados |
| Plan | `POST /deck/{deckId}/plan/customize` | POST | Personalizar con prompt NL |
| Sesión | `POST /sessions/start` | POST | Inicia sesión |
| Sesión | `GET /sessions/{sessionId}/questions` | GET | Preguntas del módulo |
| SRS | `POST /srs/response` | POST | Registra calificación |
| SRS | `GET /srs/due` | GET | Nodos vencidos hoy |
| Wiki | `POST /wiki/query` | POST | Consulta LLM Wiki |
| Wiki | `POST /wiki/archive` | POST | Archiva respuesta como nodo |
| Dashboard | `GET /dashboard/metrics` | GET | Métricas progreso |
| Dashboard | `GET /dashboard/stats` | GET | Estadísticas detalladas |
| Config | `GET /user/settings` | GET | Preferencias |
| Config | `PUT /user/settings` | PUT | Actualizar preferencias |
| Config | `POST /user/export` | POST | Genera ZIP exportación |
| Config | `DELETE /user/account` | DELETE | Eliminar cuenta |
| Notif | `GET /notifications` | GET | Lista notificaciones |
| Notif | `PUT /notifications/{id}/read` | PUT | Marcar como leída |

---

## 10. Decisiones de Resolución de Conflictos

Esta sección documenta cada conflicto detectado entre los documentos fuente y la decisión tomada, para referencia del equipo.

| # | Conflicto | Artículo dice | Propuesta dice | MVP Flujo dice | Guía v3 dice | Decisión (este doc) |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | **Umbrales semáforo** | R_objetivo = 0.90 | Crítico < 70%, Dominado ≥ 90% | Igual que Propuesta | < 40% coral, ≥ 80% verde | **70/90** (Artículo + Propuesta) |
| 2 | **Vocabulario FSRS** | Excelente/Bien/Difícil/Olvidado implícito | 4 calificaciones explícitas | 4 calificaciones | Porcentaje 0–100% | **4 calificaciones FSRS** (Propuesta) |
| 3 | **Tipos de pregunta** | No especifica | 4 tipos (completar, relacionar, diagrama, desarrollo) | 4 tipos | Solo texto libre | **4 tipos** (Propuesta) |
| 4 | **Soberanía del usuario** | No especifica | "Calificación del agente es sugerencia" | Usuario confirma | IA asigna automático | **Usuario confirma** (Propuesta) |
| 5 | **Autenticación** | No especifica | No especifica | Email + Google OAuth | Solo OAuth | **Email + Google OAuth** (MVP Flujo, más accesible) |
| 6 | **Onboarding** | No especifica | Conversacional con NL | 6 pasos con NL | Tutorial 4 pasos sin NL | **6 pasos con NL** (Propuesta + MVP) |
| 7 | **LLM Wiki** | Sí, capacidad nuclear | Sección 5 completa | P6.3 completo | Ausente | **Incluido** (Artículo + Propuesta) |
| 8 | **Editor Markdown** | No especifica | Sección 11, CodeMirror | P5.3 completo | Solo lectura | **Dual mode con CodeMirror** (Propuesta) |
| 9 | **LINT** | No especifica | Sección 5.4 | P3.3 | Ausente | **Incluido** (Propuesta) |
| 10 | **Ingesta URLs** | Menciona URLs | Menciona URLs | Solo PDF | PDF + URL | **PDF + URL** (Artículo + v3) |
| 11 | **Grafo modos** | No especifica | No especifica | Un solo modo | Exploración + Lineal | **Ambos modos** (v3, no contradice) |
| 12 | **Plan visual** | No especifica | No especifica | Integrado en onboarding | Estilo Duolingo (P12) | **Estilo Duolingo** (v3, no contradice) |
| 13 | **Post-evaluación** | No especifica | No especifica | Resumen único | Bifurcación SI/NO | **Bifurcación** (v3, más pedagógica) |
| 14 | **Gamificación** | No menciona | No menciona | Mínima (racha) | Completa (XP, niveles, mascota) | **Solo racha** (sin sustento en evidencia del artículo) |
| 15 | **Paleta colores** | No especifica | No especifica | Colores primarios genéricos | Paleta dark mode completa | **Paleta v3** (más definida, no contradice) |
| 16 | **Exportación** | Markdown abierto, portabilidad total | ZIP de .md | ZIP Obsidian | Ausente | **ZIP de Markdown** (Propuesta) |
| 17 | **Umbral bifurcación post-quiz** | No especifica | No especifica | No aplica (un solo flujo) | 40% | **70%** (alineado con umbral semáforo del Artículo) |

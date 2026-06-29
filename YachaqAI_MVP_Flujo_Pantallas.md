**YachaqAI — Documento de Flujo MVP**   |   Módulos, Pantallas y Especificaciones de UI

**YachaqAI**

Plataforma Inteligente de Aprendizaje

**DOCUMENTO DE FLUJO MVP**

Módulos · Pantallas · Especificaciones de UI

Versión 1.1 — Junio 2026

*Del quechua Yachaq: "el que sabe" o "el sabio"*

> **Cambios v1.1:** Ingesta de URLs · Modos de grafo (exploración + lineal) · Plan de estudio visual · Bifurcación post-evaluación · Sistema de diseño visual · Racha diaria · Edge cases SRS · Detección de contradicciones en ingesta incremental.


# **0. Resumen Ejecutivo del MVP**
YachaqAI es una plataforma de gestión del aprendizaje (LMS) potenciada por IA que transforma documentos estáticos —PDFs, URLs, apuntes— en un grafo dinámico de conocimiento estructurado. El MVP (Producto Mínimo Viable) abarca el flujo completo desde el registro del usuario hasta la primera sesión de estudio con cuestionario inteligente.

## **Objetivo del MVP**
Un usuario puede subir un PDF o URL, obtener un grafo de conceptos interconectados, configurar un cronograma de estudio expresado en lenguaje natural, y completar su primera sesión de aprendizaje con cuestionario — todo en menos de 15 minutos desde el registro.

## **Los 6 Módulos del MVP**

|**M1**|<p>**AUTENTICACIÓN**</p><p>Registro, inicio de sesión y onboarding inicial de la cuenta</p>|
| :-: | :- |

|**M2**|<p>**ONBOARDING CONVERSACIONAL**</p><p>Configuración guiada del primer mazo y disponibilidad semanal</p>|
| :-: | :- |

|**M3**|<p>**INGESTA DE MATERIAL**</p><p>Subida de PDFs y URLs, procesamiento y generación del grafo de conocimiento</p>|
| :-: | :- |

|**M4**|<p>**GRAFO DE CONOCIMIENTO**</p><p>Visualización interactiva del grafo semáforo con modos exploración y lineal</p>|
| :-: | :- |

|**M5**|<p>**SESIÓN DE ESTUDIO**</p><p>Plan visual, lectura, cuestionario, evaluación por IA y rutas post-evaluación</p>|
| :-: | :- |

|**M6**|<p>**DASHBOARD & LLM WIKI**</p><p>Panel de progreso, estadísticas, racha diaria y consulta inteligente al mazo</p>|
| :-: | :- |

## **Flujo Macro del MVP**
El siguiente es el flujo de alto nivel que conecta todos los módulos en orden:

|**Paso**|**Módulo**|**Resultado para el Usuario**|
| :- | :- | :- |
|1|Autenticación|Cuenta creada o sesión iniciada|
|2|Onboarding|Primer mazo nombrado y disponibilidad configurada|
|3|Ingesta Material|PDF/URL procesado → grafo generado con nodos y aristas|
|4|Grafo|Vista visual del mapa de conocimiento en colores semáforo|
|5|Sesión de Estudio|Plan visual → Lectura → Cuestionario → Rutas post-evaluación|
|6|Dashboard|Progreso, racha diaria, próxima sesión, LLM Wiki disponible|

## **Sistema de Diseño Visual**

### **Paleta de colores — Dark Mode**

|**HEX**|**Nombre**|**Uso principal**|
| :- | :- | :- |
|#0D1B2A|Navy profundo|Fondo principal de toda la app|
|#1A2E45|Navy medio|Cards, sidebar, modales|
|#1E3A5F|Navy primario|Color primario de marca|
|#534AB7|Violeta YachaqAI|CTA secundario, títulos, acciones de usuario|
|#EEEDFE|Violeta claro|Fondos de cajas informativas|
|#00C6FB|Cyan eléctrico|CTA principal, highlights, badges de módulo|
|#4CAF50|Verde semáforo|Nodos dominados (R ≥ 90%)|
|#FFC107|Amarillo semáforo|Nodos en práctica (70% ≤ R < 90%)|
|#F44336|Rojo semáforo|Nodos críticos (R < 70%)|
|#9E9E9E|Gris|Nodos bloqueados, texto secundario|
|#FF6D00|Naranja fuego|Racha diaria, alertas de degradación|
|#993C1D|Coral oscuro|Errores fatales|
|#854F0B|Ámbar oscuro|Advertencias, repasos pendientes|

### **Librería de íconos — Lucide React**
Todos los íconos de la app provienen de Lucide React (https://lucide.dev). Stroke: 2px. Tamaño estándar: 20px en navegación, 24–48px en heros. Cada concepto usa siempre el mismo ícono en toda la app.

|**Concepto**|**Ícono Lucide**|**Color**|
| :- | :- | :- |
|Dashboard / Inicio|House|#00C6FB|
|Grafo / Mis Grafos|Network|#00C6FB|
|PDF / Documento|FileText|#FF6D00|
|URL / Enlace|Link|#00C6FB|
|Subir archivo|Upload|#00C6FB|
|Racha diaria|Flame|#FF6D00|
|Procesamiento IA|Sparkles|#00C6FB|
|Lectura|BookOpen|#534AB7|
|Flashcard|CreditCard|#00C6FB|
|Iniciar / Estudiar|PlayCircle|#00C6FB|
|Repaso|RotateCcw|#534AB7|
|Buscar|Search|#888888|
|Bloqueado|Lock|#888888|
|Listo / Correcto|CheckCircle2|#00E676|
|Error / Alerta|AlertCircle|#993C1D|
|Cargando (spin)|Loader2|#00C6FB|
|Configuración|Settings|#888888|
|Notificaciones|Bell|#FFFFFF|
|Degradación|TrendingDown|#FF6D00|
|Repaso urgente|Zap|#FF6D00|
|Estadísticas|BarChart2|#00C6FB|
|Calendario|Calendar|#534AB7|
|Plan de estudio|Route|#00C6FB|
|Eliminar|Trash2|#993C1D|

### **Tipografía**

|**Elemento**|**Fuente / Tamaño**|**Peso**|
| :- | :- | :- |
|Hero / Tagline|Space Grotesk, 48–64px|Bold|
|Título de pantalla (H1)|Space Grotesk, 32–40px|Bold|
|Subtítulo (H2)|Inter, 22–26px|SemiBold|
|Cuerpo de texto|Inter, 15–16px|Regular, line-height 1.6|
|Pregunta de flashcard|Space Grotesk, 20–24px|SemiBold|
|Respuesta del usuario|JetBrains Mono, 15–16px|Regular|
|Tooltips / Labels|Inter, 12–13px|Regular, #888888|

### **Animaciones y transiciones**
- Transición entre pantallas: fade + slide, 250–350ms, ease-in-out.
- Entrada de elementos: fade-in + translateY(10px→0), 200ms, escalonado.
- Degradación de nodos: CSS transition gradual sobre fill/background, sin saltos.
- Modo módulo — activación: nodos irrelevantes se atenúan con fade de 400ms.
- Glow effect: box-shadow 0 0 15px rgba(0,198,251,0.5) en CTAs y nodos dominados.
- Loader2 de Lucide: siempre con animate-spin (Tailwind).
- Feedback inmediato: toda acción del usuario tiene respuesta visual en < 300ms.



**MÓDULO 1 — AUTENTICACIÓN**
# **1. Módulo de Autenticación**
Punto de entrada al sistema. Gestiona el registro de nuevos usuarios, el inicio de sesión de usuarios existentes y la recuperación de contraseña. Es el único módulo sin requerir autenticación previa.

## **Pantalla 1.1 — Landing / Bienvenida**
*Pantalla pública. Primera impresión del producto. Objetivo: convertir visitantes en usuarios registrados.*

|**📱  LANDING — YachaqAI Bienvenida**|
| :- |
|*Pantalla principal de presentación del producto antes del registro*|
|HERO SECTION: Headline grande — 'Transforma tus PDFs en conocimiento que nunca olvidas'|
|Subtítulo: descripción en 2 líneas del valor principal (grafo + IA + SRS)|
|CTA Principal: Botón 'Empezar Gratis' → redirige a Registro|
|CTA Secundario: Botón 'Ya tengo cuenta' → redirige a Login|
|SECCIÓN DE VALOR: 3 bloques con ícono — Grafo / Cronograma IA / Repetición Espaciada|
|SECCIÓN DEMO: GIF animado o screenshot del grafo semáforo en acción|
|FOOTER: Links a Términos, Privacidad, Contacto|

## **Pantalla 1.2 — Registro de Cuenta**
*Formulario de creación de cuenta. Mínimo de campos para reducir fricción. El onboarding profundo ocurre después.*

|**📱  REGISTRO — Crear tu cuenta YachaqAI**|
| :- |
|*Formulario de registro minimalista para máxima conversión*|
|Campo: Nombre completo (texto, requerido)|
|Campo: Email (email, requerido, validación en tiempo real)|
|Campo: Contraseña (password, requerido, mínimo 8 caracteres, indicador de fortaleza visual)|
|Campo: Confirmar contraseña (password, requerido, validación en tiempo real)|
|Campo: Zona horaria (select, auto-detectada por navegador, editable)|
|Checkbox: Acepto los Términos de Servicio y Política de Privacidad (requerido)|
|Botón: 'Crear mi cuenta' (deshabilitado hasta que todos los campos sean válidos)|
|Separador: 'O regístrate con'|
|OAuth: Botón 'Continuar con Google'|
|Link: '¿Ya tienes cuenta? Inicia sesión'|
|ESTADO CARGANDO: El botón muestra spinner y texto 'Creando tu cuenta...'|
|ÉXITO: Redirige automáticamente al Onboarding Conversacional (Módulo 2)|

### **Validaciones en tiempo real**

|**Campo**|**Regla de validación**|
| :- | :- |
|**Email**|Formato válido + verificación de dominio básica. Error: 'Ingresa un email válido'|
|**Contraseña**|Mínimo 8 caracteres, 1 mayúscula, 1 número. Indicador: Débil / Media / Fuerte|
|**Confirmar contraseña**|Debe coincidir exactamente. Error en tiempo real al desenfocarse|
|**Zona horaria**|Detectada automáticamente. Si el usuario la cambia, se muestra la hora local actual|

## **Pantalla 1.3 — Inicio de Sesión**
*Pantalla para usuarios existentes. Debe ser rápida y sin fricción adicional.*

|**📱  LOGIN — Iniciar Sesión**|
| :- |
|*Acceso para usuarios con cuenta existente*|
|Campo: Email (email, requerido)|
|Campo: Contraseña (password, requerido)|
|Checkbox: Recordarme (mantiene sesión por 30 días)|
|Botón: 'Iniciar sesión' → valida credenciales|
|Link: '¿Olvidaste tu contraseña?' → flujo de recuperación|
|Separador: 'O inicia sesión con'|
|OAuth: Botón 'Continuar con Google'|
|Link: '¿No tienes cuenta? Regístrate gratis'|
|ERROR: Si credenciales incorrectas, muestra banner rojo 'Email o contraseña incorrectos'|
|ÉXITO: Redirige al Dashboard (Módulo 6) si ya completó onboarding, o al Onboarding (Módulo 2) si no|

## **Pantalla 1.4 — Recuperación de Contraseña**
*Flujo de 2 pasos: solicitar email → recibir link → establecer nueva contraseña.*

|**📱  RECUPERAR CONTRASEÑA — Paso 1 de 2**|
| :- |
|*El usuario ingresa su email para recibir el enlace de recuperación*|
|Texto instructivo: 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña'|
|Campo: Email (email, requerido)|
|Botón: 'Enviar enlace de recuperación'|
|ÉXITO: Banner verde 'Si ese email existe en nuestro sistema, recibirás el enlace en minutos'|
|Link: 'Volver al inicio de sesión'|

|**📱  RECUPERAR CONTRASEÑA — Paso 2 de 2 (desde email)**|
| :- |
|*Pantalla accedida desde el link recibido por email*|
|Texto: 'Establece tu nueva contraseña'|
|Campo: Nueva contraseña (password, con indicador de fortaleza)|
|Campo: Confirmar nueva contraseña|
|Botón: 'Actualizar contraseña'|
|Link caduca en: 24 horas. Si expiró, muestra error con opción de re-solicitar|
|ÉXITO: Redirige automáticamente al Login con mensaje 'Contraseña actualizada. Ya puedes iniciar sesión'|



**MÓDULO 2 — ONBOARDING CONVERSACIONAL**
# **2. Módulo de Onboarding Conversacional**
Flujo guiado de 6 pasos donde el usuario configura su primer mazo de conocimiento y expresa su disponibilidad semanal en lenguaje natural. El agente de IA parsea la disponibilidad y genera el cronograma inicial. Este módulo se ejecuta solo una vez por mazo.

## **Flujo General del Onboarding**
El onboarding es un wizard lineal de 6 pasos con barra de progreso visual. El usuario no puede saltar pasos, pero sí regresar al paso anterior.

|**Paso**|**Nombre**|**Pregunta Principal al Usuario**|
| :- | :- | :- |
|1/6|Bienvenida|Presentación del sistema y qué esperar|
|2/6|Nombre del Mazo|'¿Sobre qué tema vas a estudiar?'|
|3/6|Contexto del Estudio|'¿Cuál es tu objetivo con este estudio?'|
|4/6|Subida del PDF|'Sube el documento principal de tu mazo'|
|5/6|Disponibilidad|'¿Cuándo puedes estudiar? Cuéntame en tus palabras'|
|6/6|Confirmación|Resumen del cronograma generado para aprobar o ajustar|

## **Pantalla 2.1 — Bienvenida al Onboarding**

|**📱  ONBOARDING — Paso 1/6: Bienvenida**|
| :- |
|*Primera pantalla del onboarding. Establece expectativas y motiva al usuario*|
|Barra de progreso: ●○○○○○ (Paso 1 de 6)|
|Ícono/ilustración: Robot amigable o logo YachaqAI animado|
|Titular: '¡Hola, [nombre]! Configuremos tu primer mazo de conocimiento'|
|Párrafo explicativo corto: Qué es un mazo, qué va a pasar en los siguientes pasos y cuánto tarda (~3 minutos)|
|Bullet de beneficios: '✓ Tu PDF se convertirá en un mapa visual de conceptos'|
|Bullet de beneficios: '✓ La IA generará tu cronograma de estudio personalizado'|
|Bullet de beneficios: '✓ Nunca más olvidarás lo que aprendiste'|
|Botón: 'Empezar configuración →'|

## **Pantalla 2.2 — Nombre y Tema del Mazo**

|**📱  ONBOARDING — Paso 2/6: Nombre del Mazo**|
| :- |
|*El usuario da identidad a su colección de conocimiento*|
|Barra de progreso: ●●○○○○|
|Pregunta principal: '¿Sobre qué tema vas a estudiar?'|
|Campo texto grande: Nombre del mazo (placeholder: ej. 'CCNA Redes', 'Anatomía I', 'Python para Data Science')|
|Campo texto opcional: Descripción breve (placeholder: 'Breve descripción de lo que cubre este mazo')|
|Sugerencias automáticas: Si el usuario deja el campo vacío 3 segundos, aparecen chips de sugerencia|
|Contador de caracteres: Máximo 60 caracteres para el nombre|
|Botón: '← Anterior' y 'Siguiente →' (habilitado cuando el nombre tiene al menos 3 caracteres)|

## **Pantalla 2.3 — Contexto y Objetivo de Estudio**

|**📱  ONBOARDING — Paso 3/6: Tu Objetivo**|
| :- |
|*Personaliza la experiencia según el propósito del estudio*|
|Barra de progreso: ●●●○○○|
|Pregunta: '¿Cuál es tu objetivo con este estudio?'|
|Opciones de selección (tarjetas visuales con ícono + texto):|
|`   `▸ Preparar un examen (fecha objetivo opcional)|
|`   `▸ Aprendizaje profesional / trabajo|
|`   `▸ Interés personal / hobby|
|`   `▸ Certificación específica|
|Si elige 'Examen': aparece campo de fecha objetivo (date picker)|
|Pregunta secundaria: '¿Cuál es tu nivel actual en el tema?'|
|Opciones nivel: Principiante / Intermedio / Avanzado (radio buttons visuales)|
|Botón: '← Anterior' y 'Siguiente →'|

## **Pantalla 2.4 — Subida del Primer PDF**
*Este paso integra con el Módulo de Ingesta (Módulo 3). El procesamiento ocurre en background; el usuario puede continuar el onboarding mientras espera.*

|**📱  ONBOARDING — Paso 4/6: Sube tu Documento**|
| :- |
|*Zona de subida del PDF principal que dará origen al mazo*|
|Barra de progreso: ●●●●○○|
|Zona de drop: área grande con borde punteado — 'Arrastra tu PDF aquí o haz clic para seleccionar'|
|Restricciones visibles: 'Formatos aceptados: PDF. Tamaño máximo: 100 MB'|
|Al seleccionar archivo: Se muestra nombre del archivo, tamaño y preview del nombre|
|Botón de confirmación: 'Subir y procesar PDF'|
|ESTADO SUBIENDO: Barra de progreso de upload con porcentaje (0% → 100%)|
|ESTADO PROCESANDO: Spinner con mensajes de estado rotantes:|
|`   `→ 'Extrayendo contenido del PDF...'|
|`   `→ 'Identificando conceptos clave...'|
|`   `→ 'Construyendo el grafo de conocimiento...'|
|`   `→ 'Generando preguntas de estudio...'|
|El usuario puede avanzar al Paso 5 mientras procesa (continúa en background)|
|Nota informativa: 'El procesamiento puede tomar 2-5 minutos según el tamaño del PDF'|

## **Pantalla 2.5 — Disponibilidad en Lenguaje Natural**
*Paso clave del onboarding. El usuario escribe su disponibilidad en texto libre y el agente LLM la parsea y convierte a slots estructurados. Es la interacción conversacional más importante del MVP.*

|**📱  ONBOARDING — Paso 5/6: ¿Cuándo puedes estudiar?**|
| :- |
|*El usuario expresa su disponibilidad semanal en lenguaje natural*|
|Barra de progreso: ●●●●●○|
|Instrucción amigable: 'Cuéntame en tus palabras cuándo puedes dedicarle tiempo a este tema'|
|Ejemplos de formato (en texto pequeño gris):|
|`   `→ 'Lunes y miércoles de 7pm a 8pm, sábados de 9am a 12pm'|
|`   `→ 'Tengo 1 hora de lunes a viernes en las noches'|
|`   `→ 'Solo los fines de semana, mañanas'|
|Área de texto grande: textarea con autofocus, placeholder con ejemplo|
|Botón: 'Generar mi cronograma →' (envía el texto al agente)|
|ESTADO PROCESANDO: Animación de 'El agente está analizando tu disponibilidad...'|
|Si el texto es ambiguo: el agente muestra una pregunta de aclaración en un bloque especial|
|`   `→ 'Entiendo que estudiarás los fines de semana. ¿Cuántas horas en total por fin de semana?'|
|Respuesta del usuario: segundo campo de texto para aclaración|

## **Pantalla 2.6 — Confirmación del Cronograma Generado**
*El agente muestra el cronograma resultante en formato visual. El usuario lo aprueba o ajusta manualmente antes de proceder.*

|**📱  ONBOARDING — Paso 6/6: Tu Cronograma Personalizado**|
| :- |
|*Vista de confirmación del plan de estudio generado por IA*|
|Barra de progreso: ●●●●●●|
|Titular: 'Tu plan de estudio está listo 🎉'|
|RESUMEN GENERADO: Card con datos clave:|
|`   `▸ Horas semanales disponibles: X horas|
|`   `▸ Módulos del mazo: N módulos detectados|
|`   `▸ Duración estimada del curso completo: X semanas|
|`   `▸ Próxima sesión programada: [Día y hora]|
|VISTA DE CALENDARIO SEMANAL: Grid 7 columnas (L-D) con slots resaltados en azul|
|`   `→ Cada slot muestra: día, hora inicio, hora fin, duración|
|`   `→ Los slots son editables: clic para eliminar, arrastrar para mover|
|BOTÓN DE AJUSTE MANUAL: 'Agregar otro horario' → abre mini selector de día/hora|
|Sección: 'Módulos en tu cronograma' — lista de módulos con fechas asignadas|
|Botón primario: 'Confirmar y comenzar a estudiar →'|
|Botón secundario: '← Ajustar disponibilidad' (regresa al Paso 5)|
|Al confirmar: Redirige al Módulo de Grafo (Módulo 4) para ver el mapa generado|



**MÓDULO 3 — INGESTA DE MATERIAL**
# **3. Módulo de Ingesta de Material**
Responsable del procesamiento de documentos PDF y URLs para convertirlos en la estructura de conocimiento de YachaqAI. Funciona en background. El usuario puede subir material adicional a mazos existentes en cualquier momento desde esta interfaz.

## **Flujo de Procesamiento Interno**
Cuando el usuario sube un PDF o agrega una URL, el sistema ejecuta la siguiente cadena de procesamiento de forma asíncrona:

`  `**①**    Upload: El PDF se envía al backend y se guarda en Cloudflare R2. Para URLs, se extrae el contenido de la página.

`  `**②**    Extracción: LlamaParse extrae el texto estructurado del PDF. Si falla, Tesseract OCR como fallback. Para URLs, se usa extracción de contenido web.

`  `**③**    Análisis IA: El Agente de Ingesta (Gemini 2.5 Flash) identifica conceptos, entidades y relaciones.

`  `**③b**   Comparación incremental: Si el mazo ya tiene contenido, el agente compara contra el index.md existente. Los conceptos ya presentes se actualizan; los nuevos se crean. Las contradicciones entre fuentes se señalizan.

`  `**④**    Generación MD: Se crean archivos .md en la estructura de carpetas del mazo con frontmatter YAML.

`  `**⑤**    Grafo: Los nodos (conceptos) y aristas (relaciones) se registran en la base de datos.

`  `**⑥**    Módulos: El Scheduler Agent agrupa conceptos en módulos ordenados topológicamente.

`  `**⑦**    Preguntas: Se generan flashcards y cuestionarios en la carpeta de preguntas del mazo.

`  `**⑧**    Índice: Se construye el índice vectorial FAISS para el LLM Wiki.

## **Pantalla 3.1 — Centro de Gestión de Documentos**
*Accesible desde el menú principal. Permite gestionar todos los PDFs y URLs de un mazo. Solo disponible después del onboarding.*

|**📱  DOCUMENTOS — Mis Fuentes del Mazo**|
| :- |
|*Vista de todos los documentos que componen el mazo actual*|
|Header: Nombre del mazo + selector de mazo (si hay múltiples en versiones futuras)|
|Botón destacado: '+ Agregar material al mazo' (esquina superior derecha)|
|LISTA DE DOCUMENTOS: Cards por documento con:|
|`   `▸ Ícono de tipo: FileText naranja (PDF) o Link cyan (URL)|
|`   `▸ Nombre del archivo PDF o dominio de la URL|
|`   `▸ Fecha de procesamiento|
|`   `▸ Estado: Loader2 'Procesando...' / CheckCircle2 'Procesado ✓' / AlertCircle 'Error ✗'|
|`   `▸ Estadísticas: N conceptos extraídos, N entidades, N módulos generados|
|`   `▸ Tiempo de procesamiento|
|`   `▸ Acciones: Ver grafo de ese documento / Ver log / Eliminar (Trash2)|
|ESTADO VACÍO (primer uso): Ilustración + 'Sube tu primer documento para comenzar'|
|Log de actividad: Sección inferior con últimas entradas del log.md del mazo|

## **Pantalla 3.2 — Upload y Procesamiento**
*Modal o pantalla de subida que se activa al hacer clic en '+ Agregar material'. Soporta PDFs y URLs. Soporta re-ingesta de nuevas fuentes a mazos existentes con detección de contradicciones.*

|**📱  UPLOAD — Agregar Material al Mazo**|
| :- |
|*Interfaz de subida de PDFs y URLs con seguimiento en tiempo real del procesamiento*|
|Modal o pantalla: 'Agregar material a [Nombre del Mazo]'|
|─── ZONA DE SUBIDA DE PDF ───|
|Zona de drop: Área de drag & drop con ícono Upload grande (48px, cyan)|
|Indicador de formato y límite: 'Formatos aceptados: PDF. Tamaño máximo: 100 MB'|
|Botón alternativo: 'Seleccionar PDF' (FolderOpen) → abre explorador del SO|
|Al arrastrar archivo no PDF: borde coral + shake + mensaje 'Solo se aceptan archivos PDF'|
|─── ZONA DE URL ───|
|Campo de texto: placeholder 'https://...' + botón 'Agregar URL' (Link, cyan)|
|URL válida: ítem en lista con Link cyan + dominio visible + Loader2 → CheckCircle2 'Listo'|
|URL inválida: AlertCircle coral 'No se pudo acceder al enlace' + RotateCcw reintentar|
|─── LISTA DE MATERIAL ───|
|Ítems con íconos diferenciados: FileText naranja (PDF) / Link cyan (URL)|
|Estados por ítem: Loader2 cargando → CheckCircle2 'Listo' → AlertCircle error|
|Trash2 junto a cada ítem para eliminar (sin confirmación, slide-out)|
|─── OPCIONES AVANZADAS (colapsable) ───|
|`   `▸ Toggle: Usar OCR (para PDFs escaneados)|
|`   `▸ Idioma principal del documento (para mejores embeddings)|
|Botón: 'Procesar con IA' (Sparkles, cyan) — aparece cuando hay ≥ 1 ítem con estado 'Listo'|
|Si el mazo ya tiene material: botón dice 'Actualizar grafo con nuevo material'|
|─── PANTALLA DE PROGRESO (reemplaza la zona de subida al enviar) ───|
|Barra de progreso general (0-100%) con etapa actual|
|Etapa 1/7 — Subiendo archivo: [barra progreso] XX%|
|Etapa 2/7 — Extrayendo texto: [spinner animado]|
|Etapa 3/7 — Comparando con contenido existente: [spinner + 'Detectando duplicados...']|
|Etapa 4/7 — Analizando conceptos con IA: [spinner + 'Identificando X conceptos...']|
|Etapa 5/7 — Construyendo archivos Markdown: [spinner]|
|Etapa 6/7 — Generando preguntas SRS: [spinner]|
|Etapa 7/7 — Indexando para LLM Wiki: [spinner]|
|Estimación de tiempo restante: 'Tiempo estimado: ~3 minutos'|
|Botón: 'Procesar en background y continuar' (el usuario puede navegar libremente)|
|─── PANTALLA DE RESULTADO ───|
|Banner verde: 'Material procesado exitosamente ✓'|
|Estadísticas del resultado: Conceptos creados, actualizados, entidades, módulos, tiempo total|
|Si hubo contradicciones detectadas: banner amarillo con AlertCircle ámbar:|
|`   `▸ 'Se detectaron N contradicciones entre fuentes'|
|`   `▸ Lista resumida: 'Concepto X: la fuente A dice Y, la fuente B dice Z'|
|`   `▸ Botón: 'Revisar en el Panel de Salud →' (navega a P3.3)|
|Botón primario: 'Ver el grafo actualizado →'|
|Botón secundario: 'Agregar más material'|

### **Casos de error de la ingesta**

|**Caso**|**Detección**|**Comportamiento**|
| :- | :- | :- |
|PDF corrupto o ilegible|Parser retorna error|Notificación: 'No pudimos leer este PDF. ¿Está protegido con contraseña?'|
|PDF protegido|Error de encriptación|Solicita contraseña al usuario; reintenta|
|PDF escaneado (< 100 chars texto)|Detección automática|Activa pipeline OCR. Notifica: 'Detectamos un PDF escaneado. Usando OCR, esto tardará más.'|
|PDF muy largo (> 500 páginas)|Conteo de páginas|Advertencia: 'Este PDF tomará 3-5 min.' Procesa en background|
|Tablas complejas o fórmulas|Validación de calidad|Marca secciones dudosas con '<!-- REVISAR: calidad baja -->' en el .md|
|Fallo de red durante subida|Timeout HTTP|Upload con reintento automático (3 intentos, backoff exponencial)|
|Fallo del LLM|Exception en API|Persiste Markdown crudo sin estructurar; agenda re-procesamiento. Botón 'Reintentar'|

## **Pantalla 3.3 — Panel de Salud del Mazo (LINT)**
*El agente LINT ejecuta semanalmente de forma automática. Esta pantalla muestra los resultados y permite ejecutarlo manualmente.*

|**📱  SALUD DEL MAZO — Diagnóstico Inteligente**|
| :- |
|*Reporte del agente LINT sobre la calidad y consistencia del mazo*|
|Header: 'Salud del Mazo' + fecha del último análisis|
|Botón: 'Ejecutar análisis ahora' (ejecuta LINT manualmente)|
|SEMÁFORO GENERAL: Badge grande — Verde / Amarillo / Rojo según número de problemas|
|SECCIÓN: Nodos huérfanos|
|`   `▸ Lista de conceptos que ningún archivo enlaza|
|`   `▸ Acción: 'Sugerir conexiones' para cada uno|
|SECCIÓN: Contradicciones detectadas|
|`   `▸ Lista de afirmaciones contradictorias entre fuentes|
|`   `▸ Acción: 'Ver detalle' abre ambas fuentes en panel dividido|
|SECCIÓN: Conceptos sin página propia|
|`   `▸ Lista de términos mencionados 5+ veces sin archivo dedicado|
|`   `▸ Acción: 'Crear página ahora' genera borrador automático|
|SECCIÓN: Referencias rotas|
|`   `▸ Links internos que apuntan a archivos inexistentes|
|`   `▸ Acción: 'Corregir automáticamente'|
|Botón: 'Exportar reporte completo' — descarga el log.md en PDF|



**MÓDULO 4 — GRAFO DE CONOCIMIENTO**
# **4. Módulo del Grafo de Conocimiento**
Panel central y más icónico de YachaqAI. Visualiza el mapa completo de conceptos del mazo como un grafo interactivo en tiempo real. Cada nodo representa un concepto y su color indica el estado de dominio del usuario según el algoritmo FSRS.

## **El Sistema Semáforo de Maestría**

|**Estado**|**Color**|**Criterio**|
| :- | :- | :- |
|Bloqueado|⬤ Gris (#9E9E9E)|No iniciado. Prerrequisitos no completados.|
|En Estudio|⬤ Blanco borde azul|Módulo activado. Cuestionario pendiente.|
|Crítico|⬤ Rojo (#F44336)|Retentiva < 70%. Repaso urgente requerido.|
|En Práctica|⬤ Amarillo (#FFC107)|Retentiva 70-89%. En proceso de consolidación.|
|Dominado|⬤ Verde (#4CAF50)|Retentiva ≥ 90%. Concepto firmemente aprendido.|

## **Pantalla 4.1 — Vista Principal del Grafo**
*Vista de pantalla completa del grafo interactivo. Es la pantalla 'home' del mazo para el usuario activo. Usa React Flow v12 con simulación de física 2D. Soporta dos modos de visualización: exploración libre y modo módulo lineal.*

|**📱  GRAFO — Mapa de Conocimiento del Mazo**|
| :- |
|*Vista principal del grafo de conceptos interactivo con semáforo de maestría*|
|ÁREA DE CANVAS (80% de la pantalla): Grafo interactivo con:|
|`   `▸ Nodos como círculos/rectángulos redondeados con color según estado semáforo|
|`   `▸ Etiqueta con nombre del concepto dentro o debajo del nodo|
|`   `▸ Aristas sólidas = prerrequisito, punteadas = relacionado, rojas = dependencia en riesgo|
|`   `▸ Los nodos con más conexiones gravitinan al centro (física 2D)|
|`   `▸ Nodos degradados muestran ícono Clock ámbar (14px) encima del nodo|
|BARRA LATERAL IZQUIERDA — Módulos + Buscador:|
|`   `▸ Campo Search: filtra nodos en tiempo real. Click en resultado: canvas centra con animación|
|`   `▸ Lista de módulos con badge de estado (Lock Bloqueado / En Progreso / CheckCircle2 Completado)|
|`   `▸ Click en módulo: resalta solo los nodos de ese módulo|
|`   `▸ Botón 'Iniciar sesión' (PlayCircle) para módulos disponibles|
|`   `▸ Botón '+ Agregar material' (Plus) → navega a P3.2|
|BARRA SUPERIOR — Controles del Grafo:|
|`   `▸ Filtros de vista: Todos / Solo rojos / Solo mi módulo / Solo dominados|
|`   `▸ Búsqueda de concepto: al escribir, resalta nodo y centra cámara en él|
|`   `▸ Botón 'Centrar todo' (refit del grafo)|
|`   `▸ Controles de zoom: ZoomIn / ZoomOut / 100% / Maximize2 pantalla completa|
|BARRA INFERIOR — Estadísticas Rápidas:|
|`   `▸ Dominados: N (verde) | En práctica: N (amarillo) | Críticos: N (rojo) | Bloqueados: N (gris)|
|`   `▸ Maestría general: XX%|
|`   `▸ Botón: 'Ver plan de estudio' (Route, cyan) → navega a P5.0|

### **Modo Exploración Libre (estado por defecto)**

|**Interacción**|**Comportamiento**|
| :- | :- |
|Click en nodo|Abre P4.2 (tooltip/panel del concepto)|
|Hover sobre nodo|Nodo crece scale 1.1. Texto completo si truncado. Cursor pointer|
|Hover sobre nodo degradado (Clock)|Tooltip especial: 'Este concepto lleva X días sin repasarse. Tu retención ha bajado a Y%.' TrendingDown ámbar|
|Arrastrar canvas|Pan. Cursor grab/grabbing|
|Scroll en canvas|Zoom in/out|
|Click 'Estudiar este nodo' (desde P4.2)|Activa modo módulo para el módulo de ese nodo, o navega a P5.2 si ya tiene módulo|

### **Modo Módulo Activo (se activa al iniciar sesión de un módulo)**

|**Elemento**|**Comportamiento**|
| :- | :- |
|Nodos del módulo|Badges numéricos circulares cyan (1, 2, 3...). Nodos completados: CheckCircle2 verde sobre badge|
|Nodos fuera del módulo|Gris oscuro (#2A3A4A), 60% opacidad. Click: tooltip 'Este nodo pertenece a otro módulo' (Lock)|
|Flechas de secuencia|Flechas direccionales entre nodos del módulo (→)|
|Banner superior canvas|'Módulo N: [Nombre] — Estudiando nodo X de Y' (Layers). Botón 'Salir del modo módulo' (XCircle)|
|Click en nodo del módulo|Popover: nombre, posición 'Concepto 2 de 4' (badge cyan), retención, botón 'Estudiar ahora' (PlayCircle)|
|Salir del modo módulo (XCircle)|Animación 400ms: nodos recuperan brillo, badges pop-out (scale 1.3→0), flechas fade-out|

## **Pantalla 4.2 — Tooltip / Panel de Concepto al Hover**
*Al hacer hover sobre un nodo, aparece un tooltip con información clave. Al hacer clic, se abre el panel completo del concepto.*

|**📱  GRAFO — Tooltip de Nodo (al hover)**|
| :- |
|*Panel emergente con información clave del concepto seleccionado*|
|Tooltip posicionado dinámicamente cerca del nodo:|
|`   `▸ Título del concepto (bold, grande)|
|`   `▸ Módulo al que pertenece|
|`   `▸ Estado semáforo con ícono de color|
|`   `▸ Maestría: XX% (barra de progreso visual)|
|`   `▸ Próximo repaso: 'En 3 días' / 'HOY' (en rojo si urgente)|
|`   `▸ Preguntas asociadas: N preguntas|
|`   `▸ Prerrequisitos: lista de 1-3 nodos enlazados|
|Botones de acción:|
|`   `▸ 'Leer concepto' → abre Editor Modo Lectura (Módulo 5)|
|`   `▸ 'Repasar ahora' → inicia sesión SRS para este nodo específico|
|Clic fuera del tooltip: cierra el panel|

## **Pantalla 4.3 — Vista de Módulo Específico**
*Al seleccionar un módulo en la barra lateral, el grafo filtra y resalta solo los conceptos de ese módulo, facilitando el enfoque.*

|**📱  GRAFO — Vista Filtrada por Módulo**|
| :- |
|*Vista del grafo filtrada para mostrar solo un módulo y sus conexiones*|
|El canvas muestra solo los nodos del módulo seleccionado (el resto se atenúa o desaparece)|
|Panel izquierdo resalta el módulo activo con fondo azul|
|Barra superior actualiza: 'Viendo Módulo 2: Capa de Transporte — 6 conceptos'|
|Lista ordenada de conceptos del módulo (orden topológico de estudio)|
|Estado del módulo: banner con % de progreso del módulo|
|Si el módulo está disponible: botón grande '▶ Iniciar sesión de este módulo'|
|Si el módulo está bloqueado: mensaje '🔒 Completa el Módulo 1 para desbloquear'|
|Botón: 'Ver grafo completo' → vuelve a la vista sin filtros|



**MÓDULO 5 — SESIÓN DE ESTUDIO**
# **5. Módulo de Sesión de Estudio**
Núcleo pedagógico de YachaqAI. Gestiona la experiencia completa de aprendizaje activo: plan de estudio visual, lectura del contenido, cuestionario híbrido (objetivo + desarrollo evaluado por IA), rutas post-evaluación diferenciadas y registro en el algoritmo FSRS. Hay dos sub-flujos: Sesión de Contenido Nuevo y Sesión de Repaso SRS.

## **Pantalla 5.0 — Plan de Estudio Visual**
*Ruta visual secuencial tipo Duolingo. Cada módulo es un nodo del camino. Accesible desde el grafo (botón 'Ver plan de estudio') y desde el sidebar global.*

|**📱  PLAN DE ESTUDIO — Tu Ruta de Aprendizaje**|
| :- |
|*Ruta visual secuencial con módulos como nodos de un camino*|
|Header: Route + 'Plan de Estudio' del mazo|
|Barra de progreso global: 'N de M módulos completados'|
|─── RUTA VISUAL VERTICAL ───|
|Camino vertical con módulos como nodos conectados por líneas.|
|Cada nodo de módulo muestra:|
|`   `▸ Nombre del módulo|
|`   `▸ N conceptos incluidos|
|`   `▸ Barra de retención promedio (color según estado)|
|`   `▸ Duración estimada|
|─── ESTADOS DE MÓDULO EN LA RUTA ───|
|`   `▸ ○ Circle (outline, gris): Pendiente — no iniciado|
|`   `▸ ◑ CircleHalf (cyan): En Progreso|
|`   `▸ ● CheckCircle2 (verde): Completado|
|`   `▸ ⏱ Clock (ámbar): Repaso pendiente hoy|
|`   `▸ 📉 TrendingDown (naranja): Degradado — repasa pronto|
|`   `▸ 🔒 Lock (gris): Bloqueado — prerrequisitos incompletos|
|─── ACCIONES POR MÓDULO ───|
|Módulo disponible: botón 'Estudiar' (PlayCircle, cyan) → navega a P5.1|
|Módulo con repaso pendiente: botón 'Repasar' (RotateCcw + Clock) → navega directo a P5.6|
|Módulo degradado: botón 'Repaso urgente' (Zap, naranja) → navega a P5.6|
|Módulo bloqueado: tooltip 'Completa el módulo anterior primero.' Lock. Botón desactivado, shake suave|
|─── DETALLE EXPANDIBLE ───|
|ChevronDown en módulo: se expande lista de chips de nodos incluidos, duración estimada, retención desglosada por nodo|
|─── PERSONALIZACIÓN CON PROMPT (Wand2) ───|
|Botón 'Personalizar con prompt' (Wand2, violeta): despliega campo de texto|
|Placeholder: 'Ej: Quiero enfocarme en los conceptos más difíciles primero'|
|Al aplicar: módulos se reordenan con Sparkles girando + 'Actualizando tu plan...' + skeleton loaders|
|─── PLAN COMPLETADO ───|
|Todos los módulos con CheckCircle2. Barra 'M de M completados'. Botón 'Ver mis estadísticas' (BarChart2)|

## **Sub-flujo 5A — Sesión de Contenido Nuevo**
Se activa cuando el usuario inicia un módulo por primera vez. Tiene 3 fases: Repaso SRS previo (si hay nodos vencidos) → Lectura del contenido → Cuestionario del módulo.

## **Pantalla 5.1 — Pantalla de Inicio de Sesión**
*Pantalla de preparación antes de comenzar. Muestra qué se va a estudiar y cuánto tiempo tomará.*

|**📱  SESIÓN — Preparación para Estudiar**|
| :- |
|*Resumen de la sesión próxima antes de comenzar*|
|Card central con detalles de la sesión:|
|`   `▸ Tipo: 'Contenido nuevo' / 'Repaso' / 'Mixto'|
|`   `▸ Módulo: 'Módulo 2: Capa de Transporte'|
|`   `▸ Conceptos a estudiar hoy: N|
|`   `▸ Duración estimada: ~XX minutos|
|`   `▸ Preguntas del cuestionario: N preguntas|
|Si hay repasos SRS pendientes: banner amarillo '⚠ Tienes 3 conceptos para repasar primero (5 min)'|
|Opción: 'Hacer el repaso primero' (recomendado) o 'Saltar repaso e ir al contenido nuevo'|
|Botón primario grande: '▶ Comenzar sesión'|
|Botón secundario: 'Recordarme más tarde' → agenda notificación en 2 horas|

## **Pantalla 5.2 — Editor Modo Lectura (Contenido del Concepto)**
*Pantalla principal de lectura. Muestra el contenido Markdown del concepto renderizado. El usuario puede navegar entre conceptos del módulo y tomar notas.*

|**📱  LECTURA — Contenido del Concepto**|
| :- |
|*Vista renderizada del archivo Markdown del concepto activo*|
|NAVEGACIÓN SUPERIOR:|
|`   `▸ Breadcrumb: Mazo → Módulo → Concepto actual|
|`   `▸ Contador: 'Concepto 2 de 6 en el módulo'|
|`   `▸ Botones: '← Anterior' / 'Siguiente →'|
|`   `▸ Botón: 'Modo edición' (icono lápiz) → cambia al editor CodeMirror|
|BARRA LATERAL DERECHA — Conceptos del módulo:|
|`   `▸ Lista de todos los conceptos del módulo actual|
|`   `▸ Check verde en los ya leídos (el sistema rastrea el scroll)|
|`   `▸ Indicador de lectura actual (punto azul)|
|CONTENIDO PRINCIPAL (área central):|
|`   `▸ Título del concepto con badge de estado semáforo|
|`   `▸ Barra de maestría: '45% — En Práctica 🟡'|
|`   `▸ Contenido Markdown renderizado: headings, tablas, código resaltado, diagramas Mermaid|
|`   `▸ Links internos [[Concepto]] clickeables → navegan al nodo del grafo|
|`   `▸ Sección especial con fondo diferente: 'Mis Notas' (área de anotaciones del usuario)|
|`   `▸ Área 'Mis Notas': editor de texto simple para que el usuario escriba anotaciones personales|
|BARRA INFERIOR FIJA:|
|`   `▸ Tiempo de lectura: 'Leyendo hace 3 min' (el sistema lo registra para analytics)|
|`   `▸ Si todos los conceptos leídos: botón '✓ Ir al Cuestionario' se activa|

## **Pantalla 5.3 — Editor Modo Edición**
*Modo de edición activo al hacer clic en el ícono de lápiz. Permite al usuario enriquecer el contenido generado por IA con sus propias palabras.*

|**📱  EDITOR — Modo Edición del Concepto**|
| :- |
|*Editor CodeMirror para enriquecer el contenido del concepto*|
|Layout dividido (split view opcional): Editor izquierda / Preview derecha|
|Barra de herramientas del editor: Negrita / Cursiva / Código / Link / Tabla / Encabezado|
|EDITOR CODEMIRROR:|
|`   `▸ Sintaxis Markdown resaltada|
|`   `▸ Autocompletado de links [[: al escribir [[ aparece dropdown de conceptos del mazo|
|`   `▸ El YAML frontmatter está colapsado y en modo solo-lectura (protegido)|
|`   `▸ La sección '## Notas del Usuario' es el espacio principal de edición|
|PANEL DE FRONTMATTER (solo lectura):|
|`   `▸ Muestra los metadatos SRS en formato legible pero no editable|
|`   `▸ Tooltip explicativo: 'Estos valores son gestionados automáticamente por el sistema SRS'|
|Botones de guardado:|
|`   `▸ 'Guardar cambios' (Ctrl+S / Cmd+S)|
|`   `▸ 'Guardar y volver a lectura'|
|`   `▸ 'Descartar cambios'|
|Al guardar: Toast de confirmación + re-indexación incremental en background|

## **Pantalla 5.4 — Cuestionario del Módulo**
*Pantalla de evaluación. Presenta las preguntas del módulo de forma secuencial. Mezcla preguntas objetivas (autocorregidas) y de desarrollo (evaluadas por IA).*

|**📱  CUESTIONARIO — Evaluación del Módulo**|
| :- |
|*Interfaz de preguntas secuenciales con evaluación híbrida IA + automática*|
|HEADER DEL CUESTIONARIO:|
|`   `▸ Nombre del módulo evaluado|
|`   `▸ Progreso: 'Pregunta 2 de 8'|
|`   `▸ Barra de progreso lineal|
|`   `▸ Temporizador (opcional, si el usuario lo activa)|
|─── TIPO 1: Pregunta de Completar Oración ───|
|`   `▸ Enunciado con espacio en blanco: 'El establecimiento TCP se denomina [\_\_\_]'|
|`   `▸ Campo de texto para la respuesta|
|`   `▸ Botón: 'Comprobar respuesta'|
|`   `▸ POST-RESPUESTA: Banner verde/rojo con la respuesta correcta revelada|
|`   `▸ Auto-calificación: Excelente / Bien / Difícil / Olvidado (según % de acierto)|
|─── TIPO 2: Pregunta de Relacionar Términos ───|
|`   `▸ Dos columnas: Términos (izquierda) y Definiciones (derecha)|
|`   `▸ El usuario conecta con líneas o drag-and-drop|
|`   `▸ POST-RESPUESTA: Líneas verdes (correcto) y rojas (incorrecto) con corrección|
|─── TIPO 3: Pregunta de Desarrollo Conceptual ───|
|`   `▸ Pregunta abierta con textarea grande|
|`   `▸ Botón: 'Enviar para evaluación de IA'|
|`   `▸ ESTADO: 'El agente IA está analizando tu respuesta...' (spinner 3-5 seg)|
|─── RESULTADO DE EVALUACIÓN IA ───|
|`   `▸ Panel estructurado con:|
|`   `▸ ✓ Ideas cubiertas: lista de conceptos mencionados correctamente|
|`   `▸ ✗ Ideas omitidas: conceptos que faltaron mencionar|
|`   `▸ ⚠ Errores conceptuales: si los hay|
|`   `▸ Calificación sugerida por IA: [Excelente / Bien / Difícil / Olvidado]|
|`   `▸ Justificación: texto explicativo del agente|
|`   `▸ Tip de estudio: 'Revisa la sección X en el concepto Y'|
|`   `▸ Botones finales: 'Confirmar [Sugerencia]' / 'Cambiar calificación'|

## **Pantalla 5.5 — Resumen Post-Sesión (con bifurcación)**
*Pantalla de cierre que muestra los resultados de la sesión, actualiza el grafo visualmente y bifurca según el resultado: Ruta SI (≥ 70% retentiva promedio) o Ruta NO (< 70%).*

|**📱  RESUMEN — Sesión Completada ✓**|
| :- |
|*Resumen de resultados y actualización del grafo tras completar el cuestionario*|
|─── ANIMACIÓN DE ENTRADA (según resultado global) ───|
|Resultado bueno (≥ 70%): confetti + banner verde Trophy 'Módulo completado'|
|Resultado insuficiente (< 70%): partículas suaves + banner ámbar AlertCircle 'Hay conceptos que reforzar'|
|─── MÉTRICAS DE LA SESIÓN ───|
|`   `▸ Tiempo total de estudio: XX minutos|
|`   `▸ Conceptos evaluados: N|
|`   `▸ Distribución de calificaciones: X Excelente, X Bien, X Difícil, X Olvidado|
|`   `▸ Retentiva promedio del módulo: XX%|
|─── DESGLOSE POR CONCEPTO ───|
|Lista de nodos evaluados con su color semáforo actualizado|
|Click en un nodo: popover con la pregunta, respuesta del usuario, feedback IA, porcentaje|
|─── ACTUALIZACIÓN DEL GRAFO (mini-grafo animado) ───|
|`   `▸ Nodos que cambiaron de color (con animación de transición de color)|
|`   `▸ Leyenda: 'Estos conceptos se movieron a Dominado'|
|─── PRÓXIMOS REPASOS ───|
|`   `▸ Lista de conceptos con su próximo repaso programado: 'Protocolo TCP — en 3 días'|
|─── PRÓXIMA SESIÓN ───|
|`   `▸ Fecha y hora de la próxima sesión según cronograma: 'Martes 10 Jun — 7:00 PM'|
|`   `▸ Módulo que verá: 'Módulo 3: Capa de Red'|
|─── BIFURCACIÓN POST-EVALUACIÓN ───|
|Si retentiva promedio ≥ 70%: botón 'Ver recursos adicionales →' → navega a P5.7|
|Si retentiva promedio < 70%: botón 'Ver mini repaso detallado →' → navega a P5.8|
|─── BOTONES SIEMPRE PRESENTES ───|
|`   `▸ 'Ver el grafo completo →' → P4.1|
|`   `▸ 'Volver al plan de estudio' → P5.0|
|`   `▸ 'Consultar el LLM Wiki' → P6.3|

## **Pantalla 5.7 — Ruta SI: Recursos Adicionales**
*Se muestra cuando la retentiva promedio del módulo es ≥ 70%. Ofrece recursos externos para profundizar en los conceptos dominados.*

|**📱  RECURSOS — Profundiza en lo que aprendiste**|
| :- |
|*Recursos externos recomendados para expandir el conocimiento del módulo completado*|
|Header: 'Recursos para profundizar' + nombre del módulo|
|─── GRID DE RECURSOS ───|
|Cards de recursos externos con:|
|`   `▸ Ícono de tipo: BookOpen (artículos) / GraduationCap (papers académicos)|
|`   `▸ Título del recurso|
|`   `▸ Fuente / dominio|
|`   `▸ Botón: 'Ver' (ExternalLink) → abre en nueva pestaña|
|─── FILTROS ───|
|Chips: Todo / Artículos / Papers (Filter). Grid se filtra en tiempo real con fade|
|─── NAVEGACIÓN ───|
|Botón: 'Continuar con el siguiente módulo' (ArrowRight, cyan) → P5.0|
|Botón: 'Volver al plan de estudio' (ArrowLeft) → P5.0|

## **Pantalla 5.8 — Ruta NO: Mini Repaso y Sesión Programada**
*Se muestra cuando la retentiva promedio del módulo es < 70%. Presenta los conceptos deficientes con su feedback y programa una sesión de refuerzo.*

|**📱  REFUERZO — Conceptos que necesitan más tiempo**|
| :- |
|*Mini repaso de conceptos deficientes y programación de sesión de refuerzo*|
|Header: 'Conceptos que necesitan refuerzo' + nombre del módulo|
|─── LISTA DE NODOS DEFICIENTES ───|
|Por cada concepto con retentiva < 70%:|
|`   `▸ AlertCircle coral + nombre del nodo|
|`   `▸ Pregunta que se hizo (cursiva)|
|`   `▸ Respuesta del usuario (mono, gris)|
|`   `▸ Feedback semántico de la IA: 'Te faltó mencionar X. La clave era Y.'|
|`   `▸ Fragmento del material fuente relevante (borde izquierdo cyan)|
|─── SESIÓN DE REFUERZO PROGRAMADA ───|
|Calendar: 'Sesión de refuerzo programada'|
|Selector de hora preferida (Clock, intervalos 30 min)|
|Al seleccionar: CheckCircle2 + 'Sesión programada a las [hora]'|
|─── NAVEGACIÓN ───|
|Botón primario: 'Continuar con el siguiente módulo' (ArrowRight, cyan) → P5.0|
|Nota: El módulo actual queda marcado y el siguiente se desbloquea normalmente|

## **Pantalla 5.6 — Sesión de Repaso SRS**
*Sub-flujo dedicado al repaso. Se activa desde una notificación o desde el dashboard cuando hay conceptos vencidos. Flujo de flashcards sin lectura previa de contenido nuevo.*

|**📱  REPASO SRS — Cola de Flashcards Diaria**|
| :- |
|*Sesión de repaso espaciado con conceptos vencidos según FSRS*|
|ENTRADA AL REPASO:|
|`   `▸ Pantalla de preparación: 'Tienes N conceptos para repasar hoy'|
|`   `▸ Tiempo estimado: ~X minutos|
|`   `▸ Botón: '▶ Comenzar repaso'|
|FLASHCARD (misma interfaz que cuestionario):|
|`   `▸ Mismo flujo que Pantalla 5.4 por tipo de pregunta|
|`   `▸ Cada flashcard muestra el concepto a repasar|
|DIFERENCIAS respecto al cuestionario nuevo:|
|`   `▸ La calificación actualiza directamente el FSRS (no es primera vez)|
|`   `▸ Si califica 'Olvidado': el sistema propaga incertidumbre a conceptos dependientes|
|`   `▸ Badge especial: 'Repaso SRS — Fortaleciendo retención'|
|RESUMEN DEL REPASO:|
|`   `▸ Igual que Pantalla 5.5 pero enfocado en retención|
|`   `▸ Gráfico de barras: comparación de retentiva antes vs después del repaso|
|`   `▸ 'Tu retención promedio: 76% → 84%'|

### **Edge Cases de la Lógica SRS**

|**Caso**|**Comportamiento**|
| :- | :- |
|Usuario no estudia por 30+ días|No sobrecarga con todos los repasos vencidos. 'Sesión de rehabilitación': máx. 20 conceptos por sesión, priorizando los más críticos|
|Concepto 'Olvidado' 5+ veces consecutivas|Sugiere revisar el material fuente y añadir anotaciones. Puede proponer dividir el concepto en sub-conceptos más pequeños|
|Módulo completado con 100% Excelente a la primera|Alerta sobre posible 'ilusión de competencia'; sugiere revisión en 7 días con preguntas de variación|
|El usuario edita el contenido de un concepto|Las puntuaciones SRS se preservan pero el próximo repaso se adelanta 1 día para validar la versión actualizada|



**MÓDULO 6 — DASHBOARD & LLM WIKI**
# **6. Módulo de Dashboard y LLM Wiki**
El Dashboard es la pantalla principal post-login: muestra el estado global del progreso del usuario, las sesiones programadas y el acceso rápido a las funciones del sistema. El LLM Wiki es el motor de consulta inteligente que permite hacer preguntas en lenguaje natural sobre el contenido del mazo.

## **Pantalla 6.1 — Dashboard Principal**
*Pantalla de inicio post-login. Centro de control del progreso del usuario. Muestra una vista 360° del estado del mazo.*

|**📱  DASHBOARD — Centro de Control del Aprendizaje**|
| :- |
|*Vista principal de progreso, métricas y acceso rápido a funciones*|
|─── SIDEBAR IZQUIERDA (colapsable con Menu) ───|
|`   `▸ Logo YachaqAI|
|`   `▸ House — Inicio / Dashboard|
|`   `▸ Network — Mis Grafos → P4.1|
|`   `▸ Route — Plan de Estudio → P5.0|
|`   `▸ FileText — Documentos → P3.1|
|`   `▸ MessageSquare — LLM Wiki → P6.3|
|`   `▸ BarChart2 — Estadísticas → P6.2|
|`   `▸ Settings — Configuración → P6.4|
|`   `▸ LogOut — Cerrar sesión → P1.1|
|─── BARRA SUPERIOR ───|
|`   `▸ Saludo contextual: 'Buenos días, [nombre]'|
|`   `▸ Flame + N días de racha (naranja #FF6D00)|
|`   `▸ Bell — notificaciones (badge numérico rojo si hay pendientes)|
|`   `▸ User — avatar + menú desplegable|
|─── PANEL DE RACHA Y BIENVENIDA ───|
|`   `▸ Racha visual: cadena de círculos por día (verde = hizo sesión, gris = no)|
|`   `▸ Si no ha estudiado hoy después de mediodía: Flame parpadea, texto 'Estudia hoy para no perder tu racha' naranja|
|`   `▸ Hover sobre racha: tooltip 'Tu racha se resetea si no estudias antes de medianoche'|
|─── SESIÓN DE HOY ───|
|`   `▸ Card prominente: '📅 Sesión programada hoy — 7:00 PM'|
|`   `▸ Módulo a estudiar hoy: Módulo 3 — Capa de Red|
|`   `▸ Tiempo estimado: ~45 minutos|
|`   `▸ Botón grande: '▶ Iniciar sesión ahora'|
|`   `▸ Si hay repasos urgentes: banner rojo '⚠ 3 conceptos críticos requieren repaso'|
|─── MÉTRICAS DE PROGRESO ───|
|`   `▸ Maestría general del mazo: porcentaje + barra de color semáforo|
|`   `▸ Distribución de nodos: gráfico de torta (gris/azul/rojo/amarillo/verde)|
|`   `▸ Tiempo estudiado esta semana: gráfico de barras (L-D, últimos 7 días)|
|`   `▸ Retención promedio: línea temporal (últimos 30 días)|
|─── CARGA DE REPASO (HEATMAP) ───|
|`   `▸ Gráfico de barras: conceptos a repasar por día (hoy + próximos 7 días)|
|`   `▸ Identifica días con alta carga vs. días ligeros|
|─── MÓDULOS ───|
|`   `▸ Lista de módulos con su estado y % de progreso|
|`   `▸ Botón de acción por módulo: 'Iniciar' / 'Continuar' / 'Bloqueado'|
|─── ACCESOS RÁPIDOS ───|
|`   `▸ 'Ver grafo' (Network) → P4.1 / 'Plan de estudio' (Route) → P5.0 / 'Consultar LLM Wiki' (MessageSquare) → P6.3 / 'Subir material' (Upload) → P3.2|

### **Estados del Dashboard**

|**Estado**|**Comportamiento**|
| :- | :- |
|Dashboard vacío (sin grafos)|Ilustración + 'Crea tu primer grafo para empezar' + botón grande 'Crear mi primer mazo' (PlusCircle)|
|Sin repasos pendientes|Sección repasos muestra 'Todo al día. No tienes repasos pendientes.' CheckCircle2 verde|
|Repasos urgentes|Banner rojo al tope del contenido. Lista de nodos/módulos degradados por urgencia|
|Notificaciones activas (Bell)|Badge numérico rojo. Click: dropdown con repasos (Clock), logros, degradaciones (TrendingDown)|
|Racha en riesgo (Flame parpadea)|Flame parpadea, texto naranja. Si racha = 0: texto 'Racha rota. ¡Vuelve hoy!'|

## **Pantalla 6.2 — Panel de Estadísticas Detalladas**
*Versión expandida del dashboard con gráficos detallados de retención, curva de olvido personalizada vs. Ebbinghaus, y análisis de patrones de estudio.*

|**📱  ESTADÍSTICAS — Análisis Detallado de Progreso**|
| :- |
|*Métricas avanzadas de aprendizaje y retención para el usuario*|
|Selector de periodo: Última semana / Último mes / Todo el tiempo|
|─── CURVA DE RETENCIÓN PERSONALIZADA ───|
|`   `▸ Gráfico de líneas: Mi retención real vs. Curva de Ebbinghaus teórica|
|`   `▸ Anotaciones en el gráfico: 'Aquí comenzaste a usar el sistema'|
|─── ANÁLISIS POR CONCEPTO ───|
|`   `▸ Tabla: Conceptos ordenados por dificultad (D) descendente|
|`   `▸ Columnas: Concepto / Módulo / Retentiva R / Estabilidad S / Próximo repaso|
|`   `▸ Filtro: Ver solo conceptos críticos (R < 70%)|
|─── HEATMAP DE ACTIVIDAD ───|
|`   `▸ Mapa de calor tipo GitHub: cada día del año, color según minutos estudiados|
|─── ANÁLISIS DE PATRONES ───|
|`   `▸ 'Estudias mejor los: Martes (promedio: 87% de retención en esas sesiones)'|
|`   `▸ 'Los conceptos de tipo X tienen mayor tasa de olvido para ti'|
|`   `▸ 'Tu tasa de completación de sesiones es: 78%'|
|─── EFICACIA DEL CRONOGRAMA ───|
|`   `▸ Sesiones planificadas vs. completadas (gráfico de barras agrupadas)|

## **Pantalla 6.3 — LLM Wiki: Consulta Inteligente**
*Panel de chat inteligente donde el usuario hace preguntas en lenguaje natural. El agente LLM Wiki navega el grafo de conocimiento preconstruido para construir respuestas con citas precisas.*

|**📱  LLM WIKI — Consulta tu Base de Conocimiento**|
| :- |
|*Motor de consulta IA basado en LLM Wiki — navega el grafo de conocimiento preconstruido del mazo del usuario*|
|─── ÁREA DE CHAT ───|
|`   `▸ Panel de historial de conversación (arriba, scrolleable)|
|`   `▸ Mensajes del usuario: alineados a la derecha, fondo gris claro|
|`   `▸ Respuestas del agente: alineadas a la izquierda, fondo azul muy claro|
|`   `▸ Las respuestas incluyen CITAS ANCLADAS: [Protocolo TCP →] que abren el concepto|
|─── CAMPO DE PREGUNTA (abajo) ───|
|`   `▸ Textarea: '¿Qué quieres consultar de tu mazo?'|
|`   `▸ Placeholder con ejemplos: 'Explícame la diferencia entre TCP y UDP...'|
|`   `▸ Botón: '→ Enviar' (o Enter)|
|─── ESTADO DE PROCESAMIENTO ───|
|`   `▸ Animación de 'El agente está navegando tu grafo de conocimiento...'|
|`   `▸ Indicador de nodos consultados: 'Revisando: protocolo\_tcp.md, modelo\_osi.md...'|
|─── RESPUESTA DEL AGENTE ───|
|`   `▸ Respuesta en markdown renderizado|
|`   `▸ Citas inline: texto subrayado que al hacer hover muestra extracto del concepto|
|`   `▸ Panel de fuentes consultadas (colapsable): lista de archivos .md usados|
|─── OFERTA DE ARCHIVAR RESPUESTA ───|
|`   `▸ Si la respuesta supera 300 palabras o sintetiza 3+ fuentes, aparece:|
|`   `▸ Banner: '¿Guardar esta respuesta como nuevo concepto en tu mazo?'|
|`   `▸ Botón: 'Sí, guardar como concepto síntesis' / 'No, solo para esta sesión'|
|─── SUGERENCIAS CONTEXTUALES ───|
|`   `▸ Chips de preguntas sugeridas basadas en conceptos con R baja:|
|`   `▸ '¿Qué es el Three-Way Handshake?' / 'Explica el control de congestión en TCP'|

## **Pantalla 6.4 — Configuración y Preferencias**
*Pantalla de ajuste de las preferencias del usuario: notificaciones, tema visual, exportación de datos, zona horaria y configuración del mazo.*

|**📱  CONFIGURACIÓN — Preferencias del Usuario**|
| :- |
|*Gestión de cuenta, notificaciones, mazo y privacidad*|
|─── SECCIÓN: Mi Cuenta ───|
|`   `▸ Nombre completo (editable)|
|`   `▸ Email (editable, requiere verificación)|
|`   `▸ Zona horaria (select con búsqueda)|
|`   `▸ Cambiar contraseña|
|─── SECCIÓN: Notificaciones ───|
|`   `▸ Por tipo (toggle ON/OFF + canal: Push / Email / Ambos):|
|`   `▸   Recordatorio de sesión programada|
|`   `▸   Repaso urgente (conceptos críticos)|
|`   `▸   Módulo desbloqueado|
|`   `▸   Racha en peligro|
|`   `▸   Resumen semanal|
|`   `▸ Horario de silencio: slider de horas (ej. 22:00 — 08:00)|
|─── SECCIÓN: Mi Mazo ───|
|`   `▸ Nombre y descripción del mazo (editables)|
|`   `▸ Umbrales SRS personalizados: slider para ajustar umbrales de Excelente/Bien/Difícil|
|`   `▸ Exportar mazo: botón 'Exportar como ZIP de Obsidian'|
|─── SECCIÓN: Privacidad ───|
|`   `▸ Toggle: Modo privado local (Ollama) — no envía datos al proveedor de IA|
|`   `▸ Link: Ver política de datos y qué se envía a APIs externas|
|`   `▸ Botón peligroso: 'Eliminar mi cuenta y todos mis datos' (requiere confirmación doble)|



**FLUJO COMPLETO — DIAGRAMA DE NAVEGACIÓN**
# **7. Flujo Completo de Navegación del MVP**
Esta sección describe el flujo de navegación unificado que conecta todos los módulos. Es la referencia maestra para entender cómo el usuario transita entre pantallas.

## **7.1 Flujo de Primera Vez (New User Journey)**

|**Pantalla**|**Acción del Usuario**|**Destino**|
| :- | :- | :- |
|1\.1 Landing|Clic 'Empezar Gratis'|1\.2 Registro|
|1\.2 Registro|Formulario válido → enviar|2\.1 Onboarding Bienvenida|
|2\.1 Onboarding Bienvenida|Clic 'Empezar configuración'|2\.2 Nombre del Mazo|
|2\.2 Nombre del Mazo|Nombre ingresado → Siguiente|2\.3 Objetivo de Estudio|
|2\.3 Objetivo|Selección + Siguiente|2\.4 Subida de PDF|
|2\.4 Upload PDF|PDF subido → Procesar|2\.5 Disponibilidad (procesamiento en BG)|
|2\.5 Disponibilidad|Texto escrito → Generar cronograma|2\.6 Confirmación Cronograma|
|2\.6 Confirmar Cronograma|Aprobación del plan|4\.1 Grafo Principal|
|4\.1 Grafo|Clic 'Ver plan de estudio'|5\.0 Plan de Estudio Visual|
|5\.0 Plan|Clic 'Estudiar' en Módulo 1|5\.1 Preparación Sesión|
|5\.1 Preparación|Clic 'Comenzar'|5\.2 Lectura Concepto 1|
|5\.2 Lectura (todos los conceptos)|Clic 'Ir al Cuestionario'|5\.4 Cuestionario|
|5\.4 Cuestionario|Completar todas las preguntas|5\.5 Resumen Post-Sesión|
|5\.5 Resumen (≥ 70%)|Clic 'Ver recursos adicionales'|5\.7 Ruta SI: Recursos|
|5\.5 Resumen (< 70%)|Clic 'Ver mini repaso'|5\.8 Ruta NO: Refuerzo|
|5\.7 o 5\.8|Clic 'Continuar con siguiente módulo'|5\.0 Plan (módulo siguiente desbloqueado)|

## **7.2 Flujo de Usuario Recurrente (Returning User)**

|**Punto de Entrada**|**Origen**|**Destino Principal**|
| :- | :- | :- |
|Notificación de repaso|Push/email → clic|5\.6 Sesión de Repaso SRS|
|Notificación de sesión|Push/email → clic|5\.1 Preparación Sesión|
|Login directo|1\.3 Login → submit|6\.1 Dashboard|
|Dashboard|Clic 'Iniciar sesión'|5\.1 Preparación Sesión|
|Dashboard|Clic 'Ver grafo'|4\.1 Grafo Principal|
|Dashboard|Clic 'Plan de estudio'|5\.0 Plan Visual|
|Dashboard|Clic 'Consultar Wiki'|6\.3 LLM Wiki|
|Grafo|Click en nodo|5\.2 Lectura Concepto (modo standalone)|
|Grafo|Clic 'Repasar nodo'|5\.6 Repaso SRS (para ese nodo)|
|Grafo|Clic 'Ver plan de estudio'|5\.0 Plan Visual|
|Plan Visual|Clic 'Estudiar' módulo|5\.1 Preparación Sesión|
|Plan Visual|Clic 'Repasar' módulo|5\.6 Repaso SRS (módulo)|
|Plan Visual|Clic 'Repaso urgente' módulo|5\.6 Repaso SRS (urgente)|
|LLM Wiki|Clic en cita de respuesta|5\.2 Lectura Concepto citado|

## **7.3 Resumen de Pantallas del MVP**

|**Módulo**|**Pantallas**|**Total**|
| :- | :- | :- |
|M1 — Autenticación|Landing · Registro · Login · Recuperar contraseña|4|
|M2 — Onboarding|Bienvenida · Nombre Mazo · Objetivo · Upload PDF · Disponibilidad · Confirmar Cronograma|6|
|M3 — Ingesta Material|Gestión de documentos · Upload/Procesamiento · Panel LINT|3|
|M4 — Grafo|Vista principal (2 modos) · Tooltip/Panel de nodo · Vista filtrada por módulo|3|
|M5 — Sesión Estudio|Plan Visual · Preparación · Lectura · Editor · Cuestionario · Resumen · Ruta SI · Ruta NO · Repaso SRS|9|
|M6 — Dashboard & Wiki|Dashboard · Estadísticas · LLM Wiki · Configuración|4|
|TOTAL MVP|29 pantallas / estados de UI|29|



**GUÍA PARA IMPLEMENTAR CON IA**
# **8. Guía de Implementación con IA**
Esta sección provee las instrucciones, patrones y contexto necesarios para que un asistente de IA pueda implementar cada pantalla correctamente, con fidelidad al diseño del sistema.

## **8.1 Stack Tecnológico del Frontend**

|**Tecnología**|**Rol en YachaqAI**|
| :- | :- |
|**React 19 + Next.js 15**|Framework principal con App Router y SSR|
|**TypeScript**|Tipado estático en todo el frontend|
|**Tailwind CSS v4 + shadcn/ui**|Diseño y componentes accesibles|
|**React Flow v12**|Grafo interactivo con física 2D (Módulo 4)|
|**CodeMirror 6**|Editor Markdown con autocompletado (Pantalla 5.3)|
|**Recharts**|Gráficos del Dashboard y Estadísticas (Módulo 6)|
|**Zustand**|Estado global (sesión activa, grafo, usuario)|
|**Remark / Rehype**|Renderizado de Markdown con soporte Mermaid|

## **8.2 Principios de Diseño de UI**

- Sistema semáforo: Los 5 colores de nodo (gris #9E9E9E, blanco-azul, rojo #F44336, amarillo #FFC107, verde #4CAF50) con umbrales 70/90 son invariables en toda la app.
- Dark mode por defecto: fondo #0D1B2A, cards #1A2E45. Todos los componentes usan la paleta definida en Sección 0.
- Iconografía unificada: todos los íconos provienen de Lucide React (2px stroke). Un concepto = un ícono en toda la app. Ver tabla en Sección 0.
- El grafo es el centro: en cualquier pantalla donde haya un mini-grafo de referencia, debe respetar el sistema semáforo.
- La IA es visible pero no intrusiva: las operaciones del agente se indican con Loader2 + Sparkles y mensajes de estado, pero no bloquean la UI.
- El YAML frontmatter nunca es editable por el usuario directamente desde la UI web.
- Los flujos de onboarding y cuestionario son lineales y sin saltos permitidos hacia adelante.
- Toda pantalla de error debe ofrecer una acción correctiva clara, no solo un mensaje.
- Soberanía del usuario: la calificación del Agente Evaluador es siempre una sugerencia. El usuario tiene la última palabra con el botón 'Cambiar calificación'.
- Feedback inmediato: toda acción del usuario tiene respuesta visual en menos de 300ms.

## **8.3 Prompt Base para Implementar una Pantalla**
*Usa el siguiente template como prompt base cuando pidas a una IA implementar una pantalla específica de YachaqAI:*

**PROMPT TEMPLATE**

Implementa la pantalla [NOMBRE] del MVP de YachaqAI.

**Contexto del sistema:**
- Stack: React 19, Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui
- Dark mode: fondo #0D1B2A, cards #1A2E45
- Sistema semáforo: gris #9E9E9E (bloqueado), blanco/azul (en estudio), rojo #F44336 (crítico R<70%), amarillo #FFC107 (en práctica 70-89%), verde #4CAF50 (dominado R≥90%)
- Color primario: #1E3A5F | Color acento: #00C6FB (cyan) | CTA secundario: #534AB7 (violeta)
- Íconos: Lucide React, 2px stroke, 20px nav / 24-48px hero
- Tipografía: Space Grotesk (títulos), Inter (cuerpo), JetBrains Mono (código/respuestas)

**Esta pantalla debe incluir:**
*[LISTA DE ELEMENTOS DE LA PANTALLA SEGÚN ESTE DOCUMENTO]*

**Estados a manejar:**
*[ESTADO INICIAL / CARGANDO / ERROR / ÉXITO según corresponda]*

**Navegación:**
*[DESTINOS DE NAVEGACIÓN SEGÚN LA TABLA 7.1 O 7.2]*

## **8.4 Convenciones de Nombrado de Rutas Next.js**

|**Pantalla**|**Ruta Next.js**|
| :- | :- |
|**1.1 Landing**|/|
|**1.2 Registro**|/auth/register|
|**1.3 Login**|/auth/login|
|**1.4 Recuperar contraseña**|/auth/reset-password|
|**2.x Onboarding**|/onboarding/[step]|
|**3.1 Documentos**|/deck/[deckId]/documents|
|**3.2 Upload**|/deck/[deckId]/documents/upload|
|**3.3 Salud LINT**|/deck/[deckId]/health|
|**4.1 Grafo**|/deck/[deckId]/graph|
|**5.0 Plan de Estudio**|/deck/[deckId]/plan|
|**5.1 Preparación**|/deck/[deckId]/session/[sessionId]/prep|
|**5.2 Lectura**|/deck/[deckId]/session/[sessionId]/read|
|**5.3 Editor**|/deck/[deckId]/session/[sessionId]/edit|
|**5.4 Cuestionario**|/deck/[deckId]/session/[sessionId]/quiz|
|**5.5 Resumen**|/deck/[deckId]/session/[sessionId]/summary|
|**5.6 Repaso SRS**|/deck/[deckId]/review|
|**5.7 Ruta SI**|/deck/[deckId]/session/[sessionId]/resources|
|**5.8 Ruta NO**|/deck/[deckId]/session/[sessionId]/reinforce|
|**6.1 Dashboard**|/dashboard|
|**6.2 Estadísticas**|/dashboard/stats|
|**6.3 LLM Wiki**|/deck/[deckId]/wiki|
|**6.4 Configuración**|/settings|

## **8.5 API Endpoints del Backend (FastAPI)**
Referencia de los endpoints que el frontend debe consumir para cada módulo:

|**Módulo**|**Endpoint**|**Descripción**|
| :- | :- | :- |
|Auth|POST /auth/register|Registro de usuario|
|Auth|POST /auth/login|Login, retorna JWT|
|Auth|POST /auth/google|OAuth con Google|
|Auth|POST /auth/reset-password|Solicitud de reset|
|Onboarding|POST /onboarding/schedule|Parsea disponibilidad NL y genera cronograma|
|Ingesta|POST /ingest/pdf|Upload y procesamiento de PDF|
|Ingesta|POST /ingest/url|Procesa URL por extracción de contenido|
|Ingesta|GET /ingest/status/{jobId}|Estado del procesamiento en background|
|Ingesta|POST /deck/{deckId}/lint|Ejecuta análisis LINT del mazo|
|Grafo|GET /deck/{deckId}/graph|Nodos, aristas y estados SRS del grafo|
|Plan|GET /deck/{deckId}/plan|Módulos ordenados con estado|
|Plan|POST /deck/{deckId}/plan/customize|Personaliza plan con prompt NL|
|Sesión|POST /sessions/start|Inicia una sesión de estudio|
|Sesión|GET /sessions/{sessionId}/questions|Preguntas del módulo|
|SRS|POST /srs/response|Registra calificación de flashcard|
|SRS|GET /srs/due|Nodos con repaso vencido hoy|
|Wiki|POST /wiki/query|Consulta al LLM Wiki (navegacion de grafo preconstruido)|
|Wiki|POST /wiki/archive|Archiva respuesta como nuevo nodo concepto|
|Dashboard|GET /dashboard/metrics|Métricas de progreso del usuario|
|Dashboard|GET /dashboard/stats|Estadísticas detalladas|
|Config|GET /user/settings|Preferencias del usuario|
|Config|PUT /user/settings|Actualizar preferencias|
|Config|POST /user/export|Genera ZIP de exportación Markdown|
|Config|DELETE /user/account|Eliminar cuenta y datos|
|Notif|GET /notifications|Lista de notificaciones|
|Notif|PUT /notifications/{id}/read|Marcar como leída|

**YachaqAI MVP — Documento de Flujo y Pantallas v1.1**

*Junio 2026 · Preparado para implementación*










































![ref1]





![ref2]
Versión 1.0 — Junio 2026Pág.

[ref1]: Aspose.Words.f4cebc9f-d460-45a1-87b3-65fd656c11c9.001.png
[ref2]: Aspose.Words.f4cebc9f-d460-45a1-87b3-65fd656c11c9.002.png

---
version: 1
nombre: "{DECK_NAME}"
creado: "{CREATED_AT}"
---

# YACHAQ.md — Esquema de la Wiki

Este archivo define las reglas que el Agente Ingesta (Gemini) sigue para construir la wiki.

## Estructura de carpetas

```
1. fuentes_transformadas/   ← texto extraído de PDFs, 1 archivo por fuente
2. conceptos/               ← un .md por concepto con frontmatter + [[wikilinks]]
3. entidades/               ← un .md por entidad (personas, organizaciones, herramientas)
4. preguntas/               ← preguntas SRS agrupadas por concepto
5. modulos/                 ← agrupaciones topológicas de conceptos
```

## Formato de frontmatter (conceptos)

```yaml
---
titulo: "Nombre del Concepto"
tipo: concepto
modulo: "nombre_modulo"
prerrequisitos:
  - concepto_a
  - concepto_b
relacionados:
  - concepto_c
estado_srs: bloqueado
tags:
  - tag1
  - tag2
fuentes:
  - "nombre_fuente.pdf"
---
```

## Convenciones

- Nombres de archivo: snake_case, sin tildes, sin espacios
- Wikilinks: `[[nombre_concepto]]` o `[[nombre_concepto|texto visible]]`
- Cada concepto debe tener al menos 1 prerrequisito (excepto conceptos raíz)
- Cada concepto debe generar al menos 2 preguntas SRS de tipos diferentes
- Los módulos se ordenan topológicamente según prerrequisitos

## Tipos de pregunta SRS

1. **Completar oración**: Enunciado con `[___]` para rellenar
2. **Relacionar términos**: Dos columnas de términos ↔ definiciones
3. **Diagrama incompleto**: Diagrama con etiquetas faltantes
4. **Desarrollo conceptual**: Pregunta abierta para respuesta larga

## Estados SRS (semáforo)

| Estado | Color | Condición |
|--------|-------|-----------|
| Bloqueado | Gris #9E9E9E | Prerrequisitos no completados |
| En Estudio | Cyan #00C6FB | Desbloqueado, aún no evaluado |
| Crítico | Rojo #F44336 | R < 70% |
| En Práctica | Amarillo #FFC107 | 70% ≤ R < 90% |
| Dominado | Verde #4CAF50 | R ≥ 90% |

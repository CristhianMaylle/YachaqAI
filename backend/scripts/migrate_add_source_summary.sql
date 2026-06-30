-- ============================================================
-- Migracion: agregar columna source_summary a ingest_jobs
-- Guarda el resumen de 2-3 oraciones que el LLM genera en el
-- analisis (Paso 1), para mostrarlo en la pantalla de revision.
-- ============================================================

ALTER TABLE ingest_jobs ADD COLUMN IF NOT EXISTS source_summary TEXT;

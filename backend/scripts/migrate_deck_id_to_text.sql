-- ============================================================
-- Migracion: decks.id de UUID a TEXT
--
-- Razon: el sistema usa slugs (ej. "redes-de-computadoras") como
-- deck_id en Supabase Storage (wikis/{deck_id}/) e ingest_jobs.deck_id
-- (ya es TEXT), pero la tabla decks tenia id como UUID generado
-- automaticamente. Esto impedia insertar filas en decks usando el
-- mismo slug, por lo que el Dashboard nunca mostraba los mazos creados.
--
-- Ejecutar via: python -m scripts.run_migration migrate_deck_id_to_text.sql
-- ============================================================

-- 1. Quitar FKs que apuntan a decks(id)
ALTER TABLE schedule_slots DROP CONSTRAINT IF EXISTS schedule_slots_deck_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_deck_id_fkey;
ALTER TABLE srs_states DROP CONSTRAINT IF EXISTS srs_states_deck_id_fkey;
ALTER TABLE srs_responses DROP CONSTRAINT IF EXISTS srs_responses_deck_id_fkey;

-- 2. Cambiar tipo de columna deck_id en tablas relacionadas (TEXT, sin FK estricta)
ALTER TABLE schedule_slots ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;
ALTER TABLE study_sessions ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;
ALTER TABLE srs_states ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;
ALTER TABLE srs_responses ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;

-- 3. Cambiar decks.id de UUID a TEXT (sin default, se asigna explicitamente)
ALTER TABLE decks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE decks ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 4. Recrear indices unicos en srs_states (deck_id, concept_slug)
DROP INDEX IF EXISTS srs_states_deck_id_concept_slug_key;
ALTER TABLE srs_states DROP CONSTRAINT IF EXISTS srs_states_deck_id_concept_slug_key;
ALTER TABLE srs_states ADD CONSTRAINT srs_states_deck_id_concept_slug_key UNIQUE (deck_id, concept_slug);

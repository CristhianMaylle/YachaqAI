-- ============================================================
-- Migracion: agregar columna fsrs_card_json a srs_states (Sprint 3)
-- Guarda el objeto Card de py-fsrs serializado completo (state, step,
-- card_id) para poder reconstruirlo sin perdida en cada repaso. Las
-- columnas existentes (estabilidad, dificultad, etc.) siguen siendo
-- una vista denormalizada/queryable derivada de este JSON.
-- ============================================================

ALTER TABLE srs_states ADD COLUMN IF NOT EXISTS fsrs_card_json JSONB;

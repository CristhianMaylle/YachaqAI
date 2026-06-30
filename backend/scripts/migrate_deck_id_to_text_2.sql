-- ============================================================
-- Migracion 2: completar cambio de tipo deck_id/id a TEXT
-- Las policies RLS bloqueaban el ALTER COLUMN; se quitan,
-- se altera el tipo, y se recrean.
-- ============================================================

-- 1. Quitar policies que referencian las columnas a alterar
DROP POLICY IF EXISTS "srs_own" ON srs_states;
DROP POLICY IF EXISTS "srs_open" ON srs_states;
DROP POLICY IF EXISTS "responses_own" ON srs_responses;
DROP POLICY IF EXISTS "responses_open" ON srs_responses;
DROP POLICY IF EXISTS "decks_own" ON decks;
DROP POLICY IF EXISTS "decks_open" ON decks;

-- 2. Alterar tipos de columna
ALTER TABLE srs_states ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;
ALTER TABLE srs_responses ALTER COLUMN deck_id TYPE TEXT USING deck_id::TEXT;
ALTER TABLE decks ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 3. Recrear policies
CREATE POLICY "decks_own" ON decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "decks_open" ON decks FOR ALL USING (true);

CREATE POLICY "srs_own" ON srs_states FOR ALL
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "srs_open" ON srs_states FOR ALL USING (true);

CREATE POLICY "responses_own" ON srs_responses FOR ALL
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "responses_open" ON srs_responses FOR ALL USING (true);

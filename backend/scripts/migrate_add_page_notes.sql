-- ============================================================
-- Migracion: crear tabla page_notes (Sprint 2)
-- Anotaciones libres del usuario por nota de wiki ("Mis Notas"),
-- separadas del .md generado por el LLM para que una re-ingesta
-- de la misma fuente no las pise.
-- ============================================================

CREATE TABLE IF NOT EXISTS page_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id TEXT REFERENCES decks(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deck_id, page_id, user_id)
);

ALTER TABLE page_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_own" ON page_notes;
CREATE POLICY "notes_own" ON page_notes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notes_open" ON page_notes;
CREATE POLICY "notes_open" ON page_notes FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_notes_deck_page ON page_notes(deck_id, page_id);

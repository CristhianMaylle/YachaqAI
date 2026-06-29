-- ============================================================
-- YachaqAI — Script completo de base de datos (Supabase)
--
-- Ejecutar via: python -m scripts.setup_supabase
-- O pegar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  timezone TEXT DEFAULT 'America/Lima',
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  notification_prefs JSONB DEFAULT '{"session_reminder":true,"urgent_review":true,"module_unlocked":true,"streak_warning":true,"weekly_summary":true,"channels":"push","quiet_start":"22:00","quiet_end":"08:00"}',
  srs_thresholds JSONB DEFAULT '{"excelente":100,"bien":70,"dificil":1,"olvidado":0}',
  preferred_llm_provider TEXT,
  preferred_llm_model TEXT,
  deletion_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DECKS
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  level TEXT,
  exam_date DATE,
  wiki_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INGEST_JOBS
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  storage_path TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  stage TEXT,
  concepts_found INTEGER DEFAULT 0,
  entities_found INTEGER DEFAULT 0,
  modules_found INTEGER DEFAULT 0,
  error_message TEXT,
  review_items JSONB,
  review_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. SCHEDULE_SLOTS
CREATE TABLE IF NOT EXISTS schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  scheduled_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT DEFAULT 'nuevo',
  is_recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. STUDY_SESSIONS
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  module_slug TEXT NOT NULL,
  session_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  retentiva_avg REAL,
  concepts_evaluated INTEGER DEFAULT 0,
  results JSONB
);

-- 6. SRS_STATES
CREATE TABLE IF NOT EXISTS srs_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  concept_slug TEXT NOT NULL,
  estado TEXT DEFAULT 'bloqueado',
  maestria REAL DEFAULT 0,
  retentiva REAL DEFAULT 0,
  estabilidad REAL DEFAULT 0,
  dificultad REAL DEFAULT 5.0,
  ultimo_repaso DATE,
  proximo_repaso DATE,
  veces_olvidado INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deck_id, concept_slug)
);

-- 7. SRS_RESPONSES
CREATE TABLE IF NOT EXISTS srs_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  concept_slug TEXT NOT NULL,
  question_file TEXT NOT NULL,
  question_type TEXT NOT NULL,
  user_answer TEXT,
  grade TEXT NOT NULL,
  ai_evaluation JSONB,
  ai_suggested_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  deck_id UUID,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. WIKI_CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS wiki_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources_consulted JSONB,
  nodes_visited INTEGER DEFAULT 0,
  archived_as TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. LINT_REPORTS
CREATE TABLE IF NOT EXISTS lint_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'healthy',
  issues JSONB DEFAULT '[]',
  orphan_count INTEGER DEFAULT 0,
  contradiction_count INTEGER DEFAULT 0,
  missing_page_count INTEGER DEFAULT 0,
  broken_ref_count INTEGER DEFAULT 0,
  missing_quiz_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lint_reports ENABLE ROW LEVEL SECURITY;

-- Politicas: DROP + CREATE (PostgreSQL no soporta IF NOT EXISTS en policies)

DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "decks_own" ON decks;
CREATE POLICY "decks_own" ON decks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule_own" ON schedule_slots;
CREATE POLICY "schedule_own" ON schedule_slots FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "srs_own" ON srs_states;
CREATE POLICY "srs_own" ON srs_states FOR ALL USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "sessions_own" ON study_sessions;
CREATE POLICY "sessions_own" ON study_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "responses_own" ON srs_responses;
CREATE POLICY "responses_own" ON srs_responses FOR ALL USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_own" ON wiki_chat_messages;
CREATE POLICY "chat_own" ON wiki_chat_messages FOR ALL USING (auth.uid() = user_id);

-- Politicas abiertas temporales (Sprints 1-4 sin auth)
DROP POLICY IF EXISTS "ingest_open" ON ingest_jobs;
CREATE POLICY "ingest_open" ON ingest_jobs FOR ALL USING (true);

DROP POLICY IF EXISTS "lint_open" ON lint_reports;
CREATE POLICY "lint_open" ON lint_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "decks_open" ON decks;
CREATE POLICY "decks_open" ON decks FOR ALL USING (true);

DROP POLICY IF EXISTS "chat_open" ON wiki_chat_messages;
CREATE POLICY "chat_open" ON wiki_chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "sessions_open" ON study_sessions;
CREATE POLICY "sessions_open" ON study_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "srs_open" ON srs_states;
CREATE POLICY "srs_open" ON srs_states FOR ALL USING (true);

DROP POLICY IF EXISTS "responses_open" ON srs_responses;
CREATE POLICY "responses_open" ON srs_responses FOR ALL USING (true);

DROP POLICY IF EXISTS "schedule_open" ON schedule_slots;
CREATE POLICY "schedule_open" ON schedule_slots FOR ALL USING (true);


-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_deck_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deck_updated_at ON decks;
CREATE TRIGGER deck_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_deck_timestamp();


-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_updated ON decks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_deck ON ingest_jobs(deck_id);
CREATE INDEX IF NOT EXISTS idx_ingest_status ON ingest_jobs(status);
CREATE INDEX IF NOT EXISTS idx_srs_deck ON srs_states(deck_id);
CREATE INDEX IF NOT EXISTS idx_srs_proximo ON srs_states(proximo_repaso);
CREATE INDEX IF NOT EXISTS idx_srs_estado ON srs_states(deck_id, estado);
CREATE INDEX IF NOT EXISTS idx_sessions_deck ON study_sessions(deck_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_session ON srs_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_deck ON srs_responses(deck_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_deck ON schedule_slots(deck_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule_slots(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_chat_deck ON wiki_chat_messages(deck_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lint_deck ON lint_reports(deck_id, created_at DESC);

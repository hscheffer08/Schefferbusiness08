/*
# Add full product tables: onboarding, favorites, feedback, admin, analytics, progress

1. New Tables
- saved_universities, user_feedback, admin_settings, analytics_events, questionnaire_progress
2. Modified Tables
- user_profiles: added school_year, city, state, age_range, onboarding_completed
3. Security: RLS on all new tables, owner-scoped or admin-scoped policies
*/

-- 1. Add onboarding columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='school_year') THEN
    ALTER TABLE user_profiles ADD COLUMN school_year text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='city') THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='state') THEN
    ALTER TABLE user_profiles ADD COLUMN state text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='age_range') THEN
    ALTER TABLE user_profiles ADD COLUMN age_range text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. saved_universities
CREATE TABLE IF NOT EXISTS saved_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id text NOT NULL REFERENCES universities(university_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, university_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_universities_user ON saved_universities(user_id);
ALTER TABLE saved_universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_saved" ON saved_universities;
CREATE POLICY "select_own_saved" ON saved_universities FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_saved" ON saved_universities;
CREATE POLICY "insert_own_saved" ON saved_universities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_saved" ON saved_universities;
CREATE POLICY "delete_own_saved" ON saved_universities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. user_feedback
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES student_sessions(id) ON DELETE SET NULL,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_feedback" ON user_feedback;
CREATE POLICY "select_own_feedback" ON user_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_feedback" ON user_feedback;
CREATE POLICY "insert_own_feedback" ON user_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_feedback" ON user_feedback;
CREATE POLICY "delete_own_feedback" ON user_feedback FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. admin_settings (single-row config table)
CREATE TABLE IF NOT EXISTS admin_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payments_enabled boolean NOT NULL DEFAULT false,
  price_brl numeric NOT NULL DEFAULT 8,
  free_period_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_admin_settings" ON admin_settings;
CREATE POLICY "read_admin_settings" ON admin_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_settings" ON admin_settings;
CREATE POLICY "admin_update_settings" ON admin_settings FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
DROP POLICY IF EXISTS "admin_insert_settings" ON admin_settings;
CREATE POLICY "admin_insert_settings" ON admin_settings FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 5. analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert_analytics" ON analytics_events;
CREATE POLICY "insert_analytics" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_read_analytics" ON analytics_events;
CREATE POLICY "admin_read_analytics" ON analytics_events FOR SELECT TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 6. questionnaire_progress
CREATE TABLE IF NOT EXISTS questionnaire_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  current_step integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE questionnaire_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_progress" ON questionnaire_progress;
CREATE POLICY "select_own_progress" ON questionnaire_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "upsert_own_progress" ON questionnaire_progress;
CREATE POLICY "upsert_own_progress" ON questionnaire_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_progress" ON questionnaire_progress;
CREATE POLICY "update_own_progress" ON questionnaire_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_progress" ON questionnaire_progress;
CREATE POLICY "delete_own_progress" ON questionnaire_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

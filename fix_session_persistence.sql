-- ═══════════════════════════════════════════════════════
-- Fix: Interview Session Persistence on Reload
-- ═══════════════════════════════════════════════════════
-- Adds the missing UPDATE / SELECT policies on interview_sessions
-- so memory_json, transcripts, status, and end_time can be saved
-- between turns and restored after a page reload.
--
-- Run this script ONCE in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════

-- 1. Make sure RLS is on
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy (so the user can re-fetch their own session on reload)
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can view their own interview sessions"
ON interview_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. INSERT policy (device-check page creates new session rows)
DROP POLICY IF EXISTS "Users can create their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can create their own interview sessions"
ON interview_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. UPDATE policy  ← the missing piece that caused data loss on reload
DROP POLICY IF EXISTS "Users can update their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can update their own interview sessions"
ON interview_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. (Optional) DELETE policy — only enable if you want users to delete sessions
-- DROP POLICY IF EXISTS "Users can delete their own interview sessions" ON interview_sessions;
-- CREATE POLICY "Users can delete their own interview sessions"
-- ON interview_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. Defensive: ensure required columns exist (idempotent)
ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS memory_json     JSONB,
    ADD COLUMN IF NOT EXISTS config_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS end_time        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duration        NUMERIC,
    ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS track_id        UUID;

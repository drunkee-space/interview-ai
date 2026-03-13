-- =====================================================
-- Phase 5: Interview Data Collection - SQL Migrations
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. ALTER interview_sessions to add timing columns
ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration INTEGER; -- duration in seconds

-- 2. Create interview_transcripts table
CREATE TABLE IF NOT EXISTS interview_transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL CHECK (speaker IN ('ai', 'candidate')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transcripts" ON interview_transcripts;
CREATE POLICY "Users can view their own transcripts"
ON interview_transcripts FOR SELECT
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert their own transcripts" ON interview_transcripts;
CREATE POLICY "Users can insert their own transcripts"
ON interview_transcripts FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

-- 3. Create code_attempts table
CREATE TABLE IF NOT EXISTS code_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    code TEXT,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    execution_output TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE code_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own code attempts" ON code_attempts;
CREATE POLICY "Users can view their own code attempts"
ON code_attempts FOR SELECT
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert their own code attempts" ON code_attempts;
CREATE POLICY "Users can insert their own code attempts"
ON code_attempts FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

-- 4. Create interview_activity_logs table
CREATE TABLE IF NOT EXISTS interview_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activity logs" ON interview_activity_logs;
CREATE POLICY "Users can view their own activity logs"
ON interview_activity_logs FOR SELECT
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert their own activity logs" ON interview_activity_logs;
CREATE POLICY "Users can insert their own activity logs"
ON interview_activity_logs FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

-- 5. Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('conceptual', 'coding', 'behavioral')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own questions" ON interview_questions;
CREATE POLICY "Users can view their own questions"
ON interview_questions FOR SELECT
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert their own questions" ON interview_questions;
CREATE POLICY "Users can insert their own questions"
ON interview_questions FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- Phase 6: Interview Evaluation Engine - SQL Migrations
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create interview_evaluations table
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    technical_score INTEGER DEFAULT 0,
    coding_score INTEGER DEFAULT 0,
    communication_score INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,

    weak_topics TEXT[] DEFAULT '{}',
    strong_topics TEXT[] DEFAULT '{}',

    feedback_summary TEXT DEFAULT '',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations"
ON interview_evaluations FOR SELECT
USING (candidate_id = auth.uid());

CREATE POLICY "Users can insert their own evaluations"
ON interview_evaluations FOR INSERT
WITH CHECK (candidate_id = auth.uid());

-- 2. Create candidate_topic_progress table
CREATE TABLE IF NOT EXISTS candidate_topic_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    topic_score INTEGER DEFAULT 0,
    interview_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidate_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic progress"
ON candidate_topic_progress FOR SELECT
USING (candidate_id = auth.uid());

CREATE POLICY "Users can insert their own topic progress"
ON candidate_topic_progress FOR INSERT
WITH CHECK (candidate_id = auth.uid());

-- 3. Create training_dataset table
CREATE TABLE IF NOT EXISTS training_dataset (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question TEXT,
    candidate_answer TEXT,
    predicted_score INTEGER DEFAULT 0,
    weak_topics TEXT[] DEFAULT '{}',
    coding_attempts INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_dataset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training data"
ON training_dataset FOR SELECT
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own training data"
ON training_dataset FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

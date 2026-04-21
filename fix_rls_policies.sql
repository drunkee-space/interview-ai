-- ═══════════════════════════════════════════════════════
-- Fix RLS Policy for interview_question_analysis table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS interview_question_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe if they don't exist)
DROP POLICY IF EXISTS "Users can insert question analysis for their sessions" ON interview_question_analysis;
DROP POLICY IF EXISTS "Users can view question analysis for their sessions" ON interview_question_analysis;

-- Allow authenticated users to INSERT their own session data
CREATE POLICY "Users can insert question analysis for their sessions"
ON interview_question_analysis
FOR INSERT
TO authenticated
WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to SELECT their own session data
CREATE POLICY "Users can view question analysis for their sessions"
ON interview_question_analysis
FOR SELECT
TO authenticated
USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
);

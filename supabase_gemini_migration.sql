-- ═══════════════════════════════════════════════════════
-- Database Migration for Phase 7 (Gemini AI Interviewer)
-- ═══════════════════════════════════════════════════════

-- ─── 1. Evaluation Results Table ────────────────────
CREATE TABLE IF NOT EXISTS public.evaluation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    candidate_answer TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    feedback TEXT,
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    next_question_topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own evaluation results" ON public.evaluation_results;
CREATE POLICY "Users can view their own evaluation results"
    ON public.evaluation_results FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own evaluation results" ON public.evaluation_results;
CREATE POLICY "Users can insert their own evaluation results"
    ON public.evaluation_results FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- ─── 2. Coding Behavior Metrics ─────────────────────
CREATE TABLE IF NOT EXISTS public.coding_behavior (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    successful_attempts INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    average_time_per_attempt FLOAT DEFAULT 0.0,
    language TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.coding_behavior ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coding behavior" ON public.coding_behavior;
CREATE POLICY "Users can view their own coding behavior"
    ON public.coding_behavior FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own coding behavior" ON public.coding_behavior;
CREATE POLICY "Users can insert their own coding behavior"
    ON public.coding_behavior FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Note: Existing tables (interview_transcripts, interview_questions, 
-- interview_activity_logs, code_attempts) are reused as-is.
-- The interview_evaluations table is also reused.

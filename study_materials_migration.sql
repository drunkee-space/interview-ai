-- ═══════════════════════════════════════════════════════════════════
-- Study Materials Migration
-- Stores AI-generated study guides for weak topics from interview sessions
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,                       -- e.g. "JS_CLOSURES" or "React Hooks"
    primary_topic TEXT,                        -- e.g. "JavaScript", "React"
    title TEXT NOT NULL,
    summary TEXT NOT NULL,                     -- Short overview (~1 paragraph)
    key_concepts JSONB DEFAULT '[]'::jsonb,    -- Array of {concept, explanation}
    examples JSONB DEFAULT '[]'::jsonb,        -- Array of {title, code, explanation}
    practice_questions JSONB DEFAULT '[]'::jsonb,  -- Array of strings
    resources JSONB DEFAULT '[]'::jsonb,       -- Array of {title, url, type}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_session_id ON public.study_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic ON public.study_materials(topic);

-- Enable Row Level Security
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see / manage their own study materials
DROP POLICY IF EXISTS "Users can view own study materials" ON public.study_materials;
CREATE POLICY "Users can view own study materials"
    ON public.study_materials FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own study materials" ON public.study_materials;
CREATE POLICY "Users can insert own study materials"
    ON public.study_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own study materials" ON public.study_materials;
CREATE POLICY "Users can delete own study materials"
    ON public.study_materials FOR DELETE
    USING (auth.uid() = user_id);

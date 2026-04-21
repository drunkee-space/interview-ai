-- 1. Create the detailed question analysis table if it does not exist
CREATE TABLE IF NOT EXISTS interview_question_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL, 
    question TEXT NOT NULL,
    topic TEXT NOT NULL,
    user_answer TEXT,
    score NUMERIC NOT NULL,
    clarity NUMERIC DEFAULT 5,
    depth NUMERIC DEFAULT 5,
    weakness_tag TEXT DEFAULT 'GENERAL_WEAKNESS',
    improvement_tip TEXT DEFAULT '',
    explanation TEXT DEFAULT '',
    concepts_detected JSONB DEFAULT '[]'::jsonb,
    difficulty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add new evaluation columns to interview_evaluations
ALTER TABLE interview_evaluations 
ADD COLUMN IF NOT EXISTS depth_score NUMERIC DEFAULT 50,
ADD COLUMN IF NOT EXISTS overall_score NUMERIC DEFAULT 50,
ADD COLUMN IF NOT EXISTS improvement_plan JSONB DEFAULT '[]'::jsonb;

-- 3. Ensure 'interview_sessions' has all required temporal and state tracking columns
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration NUMERIC,
ADD COLUMN IF NOT EXISTS interview_type TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS config_snapshot JSONB,
ADD COLUMN IF NOT EXISTS track_id UUID,
ADD COLUMN IF NOT EXISTS memory_json JSONB;

-- 3.b Fix missing role column in transcripts
ALTER TABLE interview_transcripts
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 4. Structured Question Roadmap per Track (v2 — mastery-based)
CREATE TABLE IF NOT EXISTS track_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL,
    user_id UUID NOT NULL,
    level TEXT NOT NULL DEFAULT 'easy',
    question_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    topic TEXT NOT NULL,
    concept TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
    score NUMERIC DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_answer TEXT,
    first_attempted_at TIMESTAMP WITH TIME ZONE,
    last_attempted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add level progression columns to interview_tracks
ALTER TABLE interview_tracks
ADD COLUMN IF NOT EXISTS easy_progress NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS medium_progress NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS hard_progress NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS easy_unlocked BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS medium_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hard_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'easy',
ADD COLUMN IF NOT EXISTS strong_concepts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weak_concepts TEXT[] DEFAULT '{}';

-- 6. Add new columns to track_questions if they don't exist
ALTER TABLE track_questions 
ADD COLUMN IF NOT EXISTS concept TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS first_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMP WITH TIME ZONE;

-- 7. Migrate old boolean state to the new status enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'track_questions' AND column_name = 'completed') THEN
        -- Migrate completed=true to MASTERED, completed=false to NOT_ATTEMPTED
        UPDATE track_questions SET status = 'MASTERED' WHERE completed = true;
        UPDATE track_questions SET status = 'NOT_ATTEMPTED' WHERE completed = false AND attempts = 0;
        UPDATE track_questions SET status = 'ATTEMPTED' WHERE completed = false AND attempts > 0;
        ALTER TABLE track_questions DROP COLUMN IF EXISTS completed;
    END IF;
END $$;

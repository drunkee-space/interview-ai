import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInterviewConfig } from "@/lib/ai/configGenerator";
import { generateRoadmap } from "@/lib/ai/roadmapGenerator";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userPrompt } = body;

        if (!userPrompt || typeof userPrompt !== "string") {
            return NextResponse.json(
                { error: "Valid userPrompt requested" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Strict Input Validation (Gibberish & Length Check)
        const promptLower = userPrompt.toLowerCase().trim();
        const meaningfulChars = promptLower.replace(/[^a-z0-9]/g, "");

        if (meaningfulChars.length < 3 || /^([a-z])\1{4,}$/.test(meaningfulChars)) {
            // Rejects tiny strings or repeated gibberish like 'aaaaaa'
            return NextResponse.json({ success: false, error: "INVALID_PROMPT" }, { status: 400 });
        }

        // 2. Pre-AI Topic Detection & Enforcement
        let detectedTopic: string | null = null;
        let suggestion: string | null = null;

        if (promptLower.match(/\bhtml\b/)) detectedTopic = "HTML";
        else if (promptLower.match(/\bcss\b/)) detectedTopic = "CSS";
        else if (promptLower.match(/\b(?:js|javascript)\b/)) detectedTopic = "JavaScript";
        else if (promptLower.match(/\breact\b/)) detectedTopic = "React";
        else if (promptLower.match(/\bpython\b/)) detectedTopic = "Python";
        else if (promptLower.match(/\b(?:sql|database|db)\b/)) detectedTopic = "SQL";
        else if (promptLower.match(/\b(?:dsa|data structure|algorithm)\b/)) detectedTopic = "DSA";
        else {
            // Attempt smart typo detection
            if (promptLower.includes("javscript") || promptLower.includes("jvascript")) suggestion = "JavaScript";
            if (promptLower.includes("pthon") || promptLower.includes("pyton")) suggestion = "Python";
            if (promptLower.includes("sqll")) suggestion = "SQL";

            return NextResponse.json({ 
                success: false, 
                error: "INVALID_PROMPT", 
                suggestion: suggestion 
            }, { status: 400 });
        }

        // 2. Pre-AI Deduplication Check
        if (detectedTopic) {
            const { data: existingTrack, error: findError } = await supabase
                .from("interview_tracks")
                .select("id, generated_interviews(config_json)")
                .eq("user_id", user.id)
                .eq("primary_topic", detectedTopic)
                .maybeSingle();

            if (!findError && existingTrack && existingTrack.generated_interviews) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const reusedConfig = (existingTrack.generated_interviews as any).config_json;
                
                // Integrity Check: Prevent reusing corrupted configs (e.g. SQL track with HTML config)
                if (reusedConfig.primary_topic && reusedConfig.primary_topic === detectedTopic) {
                    console.log(`[Generate API] Reusing clean track for ${detectedTopic}`);
                    return NextResponse.json({ trackId: existingTrack.id, config: reusedConfig, reused: true });
                } else {
                    console.warn(`[Generate API] Corrupted track detected (Track Topic: ${detectedTopic}, Config Topic: ${reusedConfig.primary_topic}). Deleting corrupted track.`);
                    // Severely corrupted. Purge it so we can create a fresh one.
                    await supabase.from("interview_tracks").delete().eq("id", existingTrack.id);
                }
            }
        }

        // 3. Generate Config using AI Engine (DeepSeek)
        const config = await generateInterviewConfig(userPrompt, detectedTopic || undefined);

        // Debug Visibility Point
        console.log(`[Generate API] Generated topic: ${config.primary_topic} (Enforced: ${detectedTopic || 'None'})`);

        // 4. Post-AI Deduplication Check (in case AI normalized a topic we couldn't parse via regex)
        const { data: postAITrack, error: postFindError } = await supabase
            .from("interview_tracks")
            .select("id, generated_interview_id")
            .eq("user_id", user.id)
            .eq("primary_topic", config.primary_topic)
            .maybeSingle();

        if (postAITrack) {
            console.log(`[Generate API] Found existing track after AI prep (${postAITrack.id}). Overwriting corrupted config with fresh AI config.`);
            
            // Force overwrite the old corrupted config in the DB with the new clean one (And check for RLS silent failure)
            const { error: updateError } = await supabase
                .from("generated_interviews")
                .update({ config_json: config })
                .eq("id", postAITrack.generated_interview_id);

            if (updateError) {
                console.error("[Generate API] RLS Update Error on generated_interviews:", updateError);
                // If RLS blocks update, let's just delete the track entirely to force a clean slate next time
                await supabase.from("interview_tracks").delete().eq("id", postAITrack.id);
                // We'll proceed with creating a completely new track below instead of returning postAITrack
            } else {
                return NextResponse.json({ trackId: postAITrack.id, config, reused: false });
            }
        }

        // 3. New Topic: Create generalized interview layout in DB
        const { data: newGenerated, error: insertGenError } = await supabase
            .from("generated_interviews")
            .insert([{
                user_id: user.id,
                config_json: config
            }])
            .select()
            .single();

        if (insertGenError) {
            console.error("Failed to insert generated interview:", insertGenError);
            throw insertGenError;
        }

         // 6. Initialize Progressive Learning Track
        const { data: newTrack, error: insertTrackError } = await supabase
            .from("interview_tracks")
            .insert([{
                user_id: user.id,
                generated_interview_id: newGenerated.id,
                title: config.title,
                primary_topic: config.primary_topic,
                difficulty: "easy",
                progress_level: 1,
                attempts: 0,
                last_score: 0,
                easy_unlocked: true,
                medium_unlocked: false,
                hard_unlocked: false,
                current_level: "easy",
                current_question_index: 0,
            }])
            .select()
            .single();

        if (insertTrackError) {
            if (insertTrackError.code === "23505") { // Unique Constraint Violation Race Condition
                console.warn("[API] Race condition deduplication caught. Fetching new duplicate track.");
                const { data: duplicateTrack } = await supabase
                    .from("interview_tracks")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("primary_topic", config.primary_topic)
                    .single();
                    
                if (duplicateTrack) {
                    return NextResponse.json({ trackId: duplicateTrack.id, config, reused: true });
                }
            }
            console.error("Failed to create unified track:", insertTrackError);
            throw insertTrackError;
        }

        // 7. Generate Structured Question Roadmap (5-10 questions per level)
        try {
            console.log(`[Generate API] Generating roadmap for ${config.primary_topic}...`);
            const roadmap = await generateRoadmap(config.primary_topic, config.subtopics);
            
            const questionRows = roadmap.flatMap(level =>
                level.questions.map((q, index) => ({
                    track_id: newTrack.id,
                    user_id: user.id,
                    level: level.level,
                    question_index: index,
                    question: q.question,
                    topic: q.topic,
                    concept: q.concept,
                    status: "NOT_ATTEMPTED",
                    score: 0,
                    attempts: 0,
                    max_attempts: 3,
                }))
            );

            const { error: questionsError } = await supabase
                .from("track_questions")
                .insert(questionRows);

            if (questionsError) {
                console.error("[Generate API] Failed to insert roadmap questions:", questionsError);
            } else {
                console.log(`[Generate API] Inserted ${questionRows.length} roadmap questions.`);
            }
        } catch (roadmapErr) {
            console.warn("[Generate API] Non-fatal: Roadmap generation failed. Track created without questions.", roadmapErr);
        }

        return NextResponse.json({ trackId: newTrack.id, config, reused: false });
    } catch (error: any) {
        console.error("Failed POST /api/interview/generate:", error);
        
        if (error.message === "INVALID_PROMPT") {
            return NextResponse.json(
                { error: "INVALID_PROMPT" },
                { status: 400 }
            );
        }

        // Fallback safety to prevent client crash
        return NextResponse.json(
            { error: "Internal Server Error during generation: " + (error instanceof Error ? error.message : JSON.stringify(error)) },
            { status: 500 }
        );
    }
}

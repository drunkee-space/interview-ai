import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJson } from "@/lib/ai/client";

// ─── GET: list study materials (optionally filter by session) ──────────
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const sessionId = request.nextUrl.searchParams.get("sessionId");

        let query = supabase
            .from("study_materials")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (sessionId) query = query.eq("session_id", sessionId);

        const { data, error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ materials: data || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
    }
}

// ─── POST: generate study material for a weak topic from a session ────
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const { sessionId, topic, primaryTopic } = body;

        if (!topic || typeof topic !== "string") {
            return NextResponse.json({ error: "Missing 'topic'" }, { status: 400 });
        }

        // Reuse existing material if it already exists for this session+topic
        if (sessionId) {
            const { data: existing } = await supabase
                .from("study_materials")
                .select("*")
                .eq("user_id", user.id)
                .eq("session_id", sessionId)
                .eq("topic", topic)
                .limit(1);
            if (existing && existing.length > 0) {
                return NextResponse.json({ material: existing[0], cached: true });
            }
        }

        const cleanTopic = topic.replace(/_/g, " ").toLowerCase();
        const ctx = primaryTopic ? `within the broader subject of ${primaryTopic}` : "";

        const prompt = `You are an expert technical educator creating a focused study guide.

The candidate struggled with: "${cleanTopic}" ${ctx}.

Create a concise, practical study guide that helps them master this exact weak area.

OUTPUT STRICT JSON (no markdown wrapping):
{
  "title": "<short title, e.g. 'Understanding ${cleanTopic}'>",
  "summary": "<2-3 sentence overview of what this topic is and why it matters>",
  "key_concepts": [
    { "concept": "<name>", "explanation": "<1-2 sentence plain-language explanation>" }
  ],
  "examples": [
    { "title": "<example title>", "code": "<short code snippet OR pseudocode>", "explanation": "<what it does and why>" }
  ],
  "practice_questions": [
    "<short practice question 1>",
    "<short practice question 2>",
    "<short practice question 3>"
  ],
  "resources": [
    { "title": "<resource title>", "url": "<official docs or MDN-style URL>", "type": "docs|article|video" }
  ]
}

REQUIREMENTS:
- 3 to 5 key_concepts
- 2 to 3 examples (with realistic code)
- 3 to 5 practice_questions
- 2 to 4 resources (use real, well-known URLs like MDN, official docs, freeCodeCamp)
- Keep tone friendly and beginner-clear
- All strings; no nested markdown formatting in fields`;

        const parsed = await generateJson(prompt);

        const material = {
            user_id: user.id,
            session_id: sessionId || null,
            topic,
            primary_topic: primaryTopic || null,
            title: parsed.title || `Study Guide: ${cleanTopic}`,
            summary: parsed.summary || "",
            key_concepts: Array.isArray(parsed.key_concepts) ? parsed.key_concepts : [],
            examples: Array.isArray(parsed.examples) ? parsed.examples : [],
            practice_questions: Array.isArray(parsed.practice_questions) ? parsed.practice_questions : [],
            resources: Array.isArray(parsed.resources) ? parsed.resources : [],
        };

        const { data: inserted, error } = await supabase
            .from("study_materials")
            .insert(material)
            .select()
            .single();

        if (error) {
            console.error("[study-materials] insert error:", error.message);
            // Return the generated content even if persistence failed
            return NextResponse.json({ material, persisted: false, warning: error.message });
        }

        return NextResponse.json({ material: inserted, persisted: true });
    } catch (e: any) {
        console.error("[study-materials] POST error:", e);
        return NextResponse.json({ error: e.message || "Failed to generate study material" }, { status: 500 });
    }
}

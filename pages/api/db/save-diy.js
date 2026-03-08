import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

export const config = {
  api: { bodyParser: { sizeLimit: "100kb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const { video, steps, authorId } = req.body;

  if (!video?.id || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Missing video or steps data" });
  }

  if (steps.length > 100) {
    return res
      .status(400)
      .json({ error: "Too many steps in one request (max 100)" });
  }

  let userId = null;
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (user) userId = user.id;
  }

  try {
    // Upsert video record
    const { error: videoError } = await supabase.from("videos").upsert(
      {
        id: video.id,
        title: video.title || "",
        author: video.author || "",
      },
      { onConflict: "id" },
    );

    if (videoError) throw videoError;

    // Insert DIY steps
    const rows = steps.map((step) => ({
      video_id: video.id,
      start_time: step.startTime,
      end_time: step.endTime,
      text: step.text || "",
      voice: step.voice || null,
      rate: step.rate || 1.0,
      author_id: authorId || "anonymous",
      ...(userId && { user_id: userId }),
    }));

    const { data, error: stepsError } = await supabase
      .from("diy_steps")
      .upsert(rows, { onConflict: "id" })
      .select();

    if (stepsError) throw stepsError;

    res.status(200).json({ saved: data.length });
  } catch (error) {
    console.error("Save DIY error:", error);
    res.status(500).json({ error: error.message || "Failed to save" });
  }
}

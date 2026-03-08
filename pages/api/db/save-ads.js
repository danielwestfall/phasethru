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

  const { video, ads, authorId } = req.body;

  if (!video?.id || !Array.isArray(ads)) {
    return res.status(400).json({ error: "Missing video or ads data" });
  }

  if (ads.length > 200) {
    return res
      .status(400)
      .json({ error: "Too many ADs in one request (max 200)" });
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
    // Upsert the video record
    const { error: videoError } = await supabase.from("videos").upsert(
      {
        id: video.id,
        title: video.title || "",
        author: video.author || "",
      },
      { onConflict: "id" },
    );

    if (videoError) throw videoError;

    // Insert audio descriptions
    const rows = ads.map((ad) => ({
      video_id: video.id,
      time: ad.time,
      text: ad.text,
      mode: ad.mode || "pause",
      voice: ad.voice || null,
      rate: ad.rate || 1.0,
      votes: ad.votes || 0,
      author_id: authorId || "anonymous",
      ...(userId && { user_id: userId }),
    }));

    const { data, error: adsError } = await supabase
      .from("audio_descriptions")
      .upsert(rows, { onConflict: "id" })
      .select();

    if (adsError) throw adsError;

    res.status(200).json({ saved: data.length, ads: data });
  } catch (error) {
    console.error("Save ADs error:", error);
    res.status(500).json({ error: error.message || "Failed to save" });
  }
}

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  const { video, blocks, authorId } = req.body;

  if (!video?.id || !Array.isArray(blocks)) {
    return res.status(400).json({ error: "Missing video or blocks data" });
  }

  if (blocks.length > 500) {
    return res
      .status(400)
      .json({ error: "Too many blocks in one request (max 500)" });
  }

  let userId = null;
  const token = req.headers.authorization?.split(" ")[1];

  // Create a request-specific supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  if (token) {
    const { data: { user } } = await supabase.auth.getUser();
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

    // Generate a set_id to group this TBMA script
    const setId = crypto.randomUUID();

    // Insert all blocks for this set
    const rows = blocks.map((block, index) => ({
      id: block.id,
      video_id: video.id,
      set_id: setId,
      block_type: block.type, // 'dialog' or 'action'
      time: block.time,
      text: block.text,
      voice: block.voice || null,
      rate: block.rate || 1.0,
      mode: block.mode || "pause",
      sort_order: index,
      author_id: authorId || "anonymous",
      ...(userId && { user_id: userId }),
    }));

    const { data, error: blocksError } = await supabase
      .from("tbma_blocks")
      .upsert(rows, { onConflict: "id" })
      .select();

    if (blocksError) throw blocksError;

    res.status(200).json({ saved: data.length, setId });
  } catch (error) {
    console.error("Save TBMA error:", error);
    res.status(500).json({ error: error.message || "Failed to save" });
  }
}

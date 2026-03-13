import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const config = {
  api: { bodyParser: { sizeLimit: "10kb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const { adId, voterId, direction } = req.body;

  if (!adId || !voterId || (direction !== 1 && direction !== -1)) {
    return res.status(400).json({ error: "Invalid vote data" });
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
    // Upsert the vote (voterId is the anonymous session id)
    // The UNIQUE constraint is on (ad_id, voter_id)
    const { error: voteError } = await supabase.from("votes").upsert(
      {
        ad_id: adId,
        voter_id: voterId,
        direction: direction,
        ...(userId && { user_id: userId }),
      },
      { onConflict: "ad_id, voter_id" },
    );

    if (voteError) throw voteError;

    // Recalculate the total votes for this AD
    const { data: voteRows, error: countError } = await supabase
      .from("votes")
      .select("direction")
      .eq("ad_id", adId);

    if (countError) throw countError;

    const totalVotes = (voteRows || []).reduce(
      (sum, v) => sum + v.direction,
      0,
    );

    // Update the cached vote count on the AD
    const { error: updateError } = await supabase
      .from("audio_descriptions")
      .update({ votes: totalVotes })
      .eq("id", adId);

    if (updateError) throw updateError;

    res.status(200).json({ votes: totalVotes });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ error: error.message || "Failed to vote" });
  }
}

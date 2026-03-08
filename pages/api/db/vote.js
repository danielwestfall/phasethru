import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { adId, voterId, direction } = req.body;

  if (!adId || !voterId || ![1, -1].includes(direction)) {
    return res.status(400).json({ error: 'adId, voterId, and direction (1 or -1) are required' });
  }

  try {
    // Upsert the vote (one per user per AD)
    const { error: voteError } = await supabase
      .from('votes')
      .upsert(
        {
          ad_id: adId,
          voter_id: voterId,
          direction: direction,
        },
        { onConflict: 'ad_id,voter_id' }
      );

    if (voteError) throw voteError;

    // Recalculate the total votes for this AD
    const { data: voteRows, error: countError } = await supabase
      .from('votes')
      .select('direction')
      .eq('ad_id', adId);

    if (countError) throw countError;

    const totalVotes = (voteRows || []).reduce((sum, v) => sum + v.direction, 0);

    // Update the cached vote count on the AD
    const { error: updateError } = await supabase
      .from('audio_descriptions')
      .update({ votes: totalVotes })
      .eq('id', adId);

    if (updateError) throw updateError;

    res.status(200).json({ votes: totalVotes });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: error.message || 'Failed to vote' });
  }
}

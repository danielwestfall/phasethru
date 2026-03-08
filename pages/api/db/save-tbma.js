import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { video, blocks, authorId } = req.body;

  if (!video?.id || !Array.isArray(blocks)) {
    return res.status(400).json({ error: 'Missing video or blocks data' });
  }

  try {
    // Upsert video record
    const { error: videoError } = await supabase
      .from('videos')
      .upsert({
        id: video.id,
        title: video.title || '',
        author: video.author || '',
      }, { onConflict: 'id' });

    if (videoError) throw videoError;

    // Generate a set_id to group this TBMA script
    const setId = crypto.randomUUID();

    // Insert TBMA blocks
    const rows = blocks.map((block, index) => ({
      video_id: video.id,
      set_id: setId,
      block_type: block.type || 'dialog',
      time: block.time,
      text: block.text || '',
      voice: block.voice || null,
      rate: block.rate || 1.0,
      mode: block.mode || 'pause',
      sort_order: index,
      author_id: authorId || 'anonymous',
    }));

    const { data, error: blocksError } = await supabase
      .from('tbma_blocks')
      .insert(rows)
      .select();

    if (blocksError) throw blocksError;

    res.status(200).json({ saved: data.length, setId });
  } catch (error) {
    console.error('Save TBMA error:', error);
    res.status(500).json({ error: error.message || 'Failed to save' });
  }
}

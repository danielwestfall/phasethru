import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  try {
    const { data, error } = await supabase
      .from('tbma_blocks')
      .select('*')
      .eq('video_id', videoId)
      .order('set_id', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Group blocks by set_id for the frontend
    const scripts = {};
    (data || []).forEach((block) => {
      if (!scripts[block.set_id]) {
        scripts[block.set_id] = {
          setId: block.set_id,
          authorId: block.author_id,
          createdAt: block.created_at,
          blocks: [],
        };
      }
      scripts[block.set_id].blocks.push(block);
    });

    res.status(200).json(Object.values(scripts));
  } catch (error) {
    console.error('Get TBMA error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch' });
  }
}

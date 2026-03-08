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
      .from('audio_descriptions')
      .select('*')
      .eq('video_id', videoId)
      .order('time', { ascending: true });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (error) {
    console.error('Get ADs error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch' });
  }
}

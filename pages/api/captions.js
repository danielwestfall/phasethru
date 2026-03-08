import { YoutubeTranscript } from '@playzone/youtube-transcript';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.status(200).json({ transcript });
  } catch (error) {
    console.error('YouTube transcript fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript automatically. YouTube may have blocked this IP. Please use the manual CC import fallback.' });
  }
}

import YouTube from 'youtube-sr';

export default async function handler(req, res) {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const results = await YouTube.search(q, { limit: 10, type: 'video' });
    
    const formattedResults = results.map(video => ({
      id: video.id,
      title: video.title,
      channel: video.channel.name,
      views: video.views,
      duration: video.durationFormatted,
      thumbnail: video.thumbnail?.url || ''
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
}

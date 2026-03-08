-- PhaseThru Database Schema
-- Run this in the Supabase SQL Editor to set up all tables and RLS policies.

-- =============================================================================
-- TABLES
-- =============================================================================

-- Videos: canonical record for each YouTube video
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,                -- YouTube video ID (e.g. "dQw4w9WgXcQ")
  title TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audio Descriptions
CREATE TABLE IF NOT EXISTS audio_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  time REAL NOT NULL,                 -- trigger timestamp in seconds
  text TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pause', -- 'pause' or 'duck'
  voice TEXT,
  rate REAL DEFAULT 1.0,
  votes INTEGER NOT NULL DEFAULT 0,
  author_id TEXT NOT NULL,            -- anonymous session UUID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DIY Steps
CREATE TABLE IF NOT EXISTS diy_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  text TEXT DEFAULT '',
  voice TEXT,
  rate REAL DEFAULT 1.0,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TBMA Blocks (dialog + action blocks forming a script)
CREATE TABLE IF NOT EXISTS tbma_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  set_id UUID NOT NULL,               -- groups blocks into one TBMA "script"
  block_type TEXT NOT NULL,            -- 'dialog' or 'action'
  time REAL NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  voice TEXT,
  rate REAL DEFAULT 1.0,
  mode TEXT DEFAULT 'pause',
  sort_order INTEGER NOT NULL DEFAULT 0,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (one vote per user per AD)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES audio_descriptions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  direction SMALLINT NOT NULL CHECK (direction IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ad_id, voter_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ads_video ON audio_descriptions(video_id);
CREATE INDEX IF NOT EXISTS idx_diy_video ON diy_steps(video_id);
CREATE INDEX IF NOT EXISTS idx_tbma_video ON tbma_blocks(video_id);
CREATE INDEX IF NOT EXISTS idx_tbma_set ON tbma_blocks(set_id);
CREATE INDEX IF NOT EXISTS idx_votes_ad ON votes(ad_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diy_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbma_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Videos: anyone can read and insert
CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert" ON videos FOR INSERT WITH CHECK (true);

-- Audio descriptions: anyone can read/insert, only author can delete
CREATE POLICY "ads_select" ON audio_descriptions FOR SELECT USING (true);
CREATE POLICY "ads_insert" ON audio_descriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "ads_delete" ON audio_descriptions FOR DELETE USING (true);

-- DIY steps: anyone can read/insert, only author can delete
CREATE POLICY "diy_select" ON diy_steps FOR SELECT USING (true);
CREATE POLICY "diy_insert" ON diy_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "diy_delete" ON diy_steps FOR DELETE USING (true);

-- TBMA blocks: anyone can read/insert, only author can delete
CREATE POLICY "tbma_select" ON tbma_blocks FOR SELECT USING (true);
CREATE POLICY "tbma_insert" ON tbma_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "tbma_delete" ON tbma_blocks FOR DELETE USING (true);

-- Votes: anyone can read/insert/update
CREATE POLICY "votes_select" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_update" ON votes FOR UPDATE USING (true);

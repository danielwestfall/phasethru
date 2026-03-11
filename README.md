**[View on GitHub](https://github.com/danielwestfall/equiviewer)** | **[Launch App](https://equiviewer.app)**

> **⚖️ Licensing Notice**: EquiViewer is released under the [PolyForm Noncommercial License 1.0.0](LICENSE).
> You are free to copy, modify, distribute, and use this software for **personal, educational, and non-commercial purposes**.
> You **may not** use this software for commercial purposes (including selling it or incorporating it into a paid product) without explicit, separate written permission from the creator.

An accessible web-based Video Player built for adding programmatic Audio Descriptions (AD), transcript-based Audio Descriptions (TBMA), filling in the gaps in existing captions, or structuring interactive DIY Guides, or providing a streamlined hands-free voice-controlled Player experience.

Built on **React 18**, **Next.js 14**, **Supabase**, and the **YouTube IFrame API**.

## 🎯 Project Philosophy

EquiViewer aims to bridge the gap in 3rd party hosted media accessibility by empowering creators and users to inject custom audio contexts into existing YouTube videos without needing complex video editing software. Whether you are generating WCAG-compliant Audio Descriptions for users who are visually impaired, filling in the gaps in auto generated captions, or breaking down complex DIY videos into loopable, voice-controllable segments for a hands-free experience, EquiViewer provides the tools in one unified interface.

Through its **community-driven database**, users can permanently save, share, discover, and vote on accessibility layers created by others for most YouTube videos. Due to owner permissions, some videos may not be available for use with EquiViewer. If you encounter a video that is not available, please contact the video owner and request that they enable embedding for their videos.

---

## ✨ Core Features

EquiViewer operates in several distinct Application Modes, toggleable via the main interface:

### 1. 🎙️ Audio Description (AD) Editor Mode

- **Author Descriptions**: Pause the video at any timestamp and author a custom string of text.
- **Text-To-Speech Integration**: Utilizing the native Web Speech API, EquiViewer will automatically read your descriptions at the designated timestamps.
- **Customizable Voices & Speed**: Select from diverse system voices and adjust the reading rate per AD.
- **Standard or Extended AD**: Choose whether the video should **Pause** entirely while the TTS reads the AD, or **Duck** (lower volume) to let the audio mix in real-time.
- **Community Voting**: Upvote or downvote ADs to surface the best community descriptions.

### 2. 📜 TBMA Script Editor

- **Time-Based Media Alternative**: Experimental feature. Import a video's Closed Captions as a dialog script, then inject "Action" blocks in between to describe unseen events.
- **Auto-Fetch Captions**: Automatically retrieves YouTube's transcript via a backend API route.
- **Manual VTT Import**: Paste raw `.vtt` caption data as a fallback when auto-fetch is blocked.

### 3. 🛠️ DIY Mode Map

- **Segment Looping**: Define explicit "Steps" for a project (e.g., Step 1: 00:30 - 01:15).
- **Auto-Looping**: The video will naturally loop within this timeframe until you are ready to move on.
- **Contextual Aids**: Add optional ADs that play continuously during the loop to clarify visual instructions that the creator missed or to add your own context.

### 4. ▶️ Player Mode

- **Immersive Viewing**: A clean, full-width UI focused entirely on the content.
- **Closed Caption Overlay**: While TTS is speaking an AD, the text is displayed over the video in a high-contrast CC format.
- **Hands-Free Voice Control**: Designed for users who have their hands tied (e.g., during woodworking or cooking). Simply utilize Voice Commands:
  - `"Play"` / `"Start"`
  - `"Pause"` / `"Stop"`
  - `"Next Step"` / `"Continue"`: Automatically breaks the current DIY Loop and advances the playback.

### 5. 🔍 YouTube Search Integration & Fallbacks

- Easily load videos via URL or Video ID.
- Advanced Error Handling catches videos that restrict embedding (Error 150/101) and automatically searches YouTube via an API backend to provide clickable, alternative variations of that exact video.

---

## 🚀 Quickstart Guide

To run EquiViewer locally in your development environment:

### 1. Clone the repository

```bash
git clone https://github.com/danielwestfall/equiviewer.git
cd equiviewer
```

### 2. Install Dependencies

Requires Node.js 18+.

```bash
npm install
```

### 3. Configure Supabase (Database & Auth)

EquiViewer uses Supabase for storing community data and managing user profiles.

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Create a free project at [Supabase](https://supabase.com/).
3. Run the SQL schema found in `supabase/migration.sql` in your Supabase SQL Editor.
4. Add your **Project URL** and **anon public key** to `.env.local`.
5. **Set Up Authentication:**
   - In Supabase, go to **Authentication** -> **Providers** -> **Email**.
   - Ensure **"Enable Email provider"** is toggled ON to allow Magic Links.
   - Go to **Authentication** -> **URL Configuration**.
   - Under **Redirect URLs**, add `http://localhost:3000/*` (or your specific local port) and your production Vercel URL.

### 4. Start the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` (or `3001` if requested) — you will be redirected automatically to `/video`.

---

## 🏗️ Architecture & Contributing

This project uses **Next.js** within the `/pages` directory structure. Open-source contributions are highly welcome!

### Core Technologies

- `next` 14, `react` 18: Core framework and UI library.
- `@supabase/supabase-js`: Backend database client for saving and discovering community accessibility metadata.
- `react-youtube`: Manages the YouTube IFrame API.
- `@mui/material` & `@mui/icons-material`: Provides the accessible, responsive MUI v5 UI framework.
- `youtube-sr`: Server-side YouTube search (bypasses CORS).
- `@playzone/youtube-transcript`: Fetches YouTube closed captions server-side.
- `window.speechSynthesis` / `window.SpeechRecognition`: Core native APIs powering TTS and Voice Control.

### File Structure

```
pages/
  video.js          — Central app container: state, playback engine, modes
  index.js          — Redirects to /video
  api/
    search.js       — YouTube search proxy (bypasses CORS)
    captions.js     — YouTube transcript fetcher
    db/             — Supabase API routes for saving/fetching ADs, DIY rules, and TBMA scripts
components/
  AdTimeline.js     — Renders the saved audio description list
  DiyTimeline.js    — Renders the map of DIY loop steps
  SearchDialog.js   — YouTube search dialog UI
  TbmaEditor.js     — TBMA script editor (captions + action blocks)
  LoginDialog.js    — Email Magic Link login Modal
lib/
  supabase.js       — Supabase singleton client and anonymous session tracking
supabase/
  migration.sql     — Database structure, indexes, and Row-Level Security (RLS) policies
styles/
  globals.css       — Global styles and YouTube player sizing
```

### Accessibility (WCAG 2.2 AA)

We strive to maintain high accessibility standards. The application includes strict ARIA labels for screen readers and adheres to AA contrast ratios (4.5:1) for warnings/unsaved state indicators.

---

_Created by [danielwestfall]_

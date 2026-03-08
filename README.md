# PhaseThru ✨

A revolutionary, accessible web-based Video Player built for Authoring Audio Descriptions (AD), structuring interactive DIY Guides, and providing a streamlined hands-free voice-controlled Player experience.

Built on React 18, Next.js 14, and the YouTube IFrame API.

## 🎯 Project Philosophy

PhaseThru aims to bridge the gap in media accessibility and interactive learning by empowering creators and users to inject custom audio contexts into existing YouTube videos without needing complex video editing software. Whether you are generating WCAG-compliant Audio Descriptions for the visually impaired or breaking down complex DIY videos into loopable, voice-controllable segments, PhaseThru provides the tools in one unified interface.

## ✨ Core Features

PhaseThru operates in several distinct Application Modes, toggleable via the main interface:

### 1. 🎙️ Audio Description (AD) Editor Mode

- **Author Descriptions**: Pause the video at any timestamp and author a custom string of text.
- **Text-To-Speech Integration**: Utilizing the native Web Speech API, PhaseThru will automatically read your descriptions at the designated timestamps.
- **Customizable Voices & Speed**: Select from diverse system voices and adjust the reading rate per AD.
- **Playback Sync Engine**: Choose whether the video should **Pause** entirely while the TTS reads the AD, or **Duck** (lower volume) to let the audio mix in real-time.
- **Voting**: Upvote or downvote ADs to surface the best descriptions.

### 2. 🛠️ DIY Mode Map

- **Segment Looping**: Define explicit "Steps" for a project (e.g., Step 1: 00:30 - 01:15).
- **Auto-Looping**: The video will naturally loop within this timeframe until you are ready to move on.
- **Contextual Aids**: Add optional ADs that play continuously during the loop to clarify visual instructions that the creator missed.

### 3. 📜 TBMA Script Editor

- **Time-Based Media Alternative**: Import a video's Closed Captions as a dialog script, then inject "Action" blocks in between to describe unseen events.
- **Auto-Fetch Captions**: Automatically retrieves YouTube's transcript via a backend API route.
- **Manual VTT Import**: Paste raw `.vtt` caption data as a fallback when auto-fetch is blocked.

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

## 🚀 Quickstart Guide

To run PhaseThru locally in your development environment:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/danielwestfall/phasethru.git
   cd phasethru
   ```

2. **Install Dependencies:**
   Requires Node.js 18+.

   ```bash
   npm install
   ```

3. **Start the Development Server:**

   ```bash
   npm run dev
   ```

4. **Open Application:**
   Navigate to `http://localhost:3000` — you will be redirected automatically to `/video`.

## 🏗️ Architecture & Contributing

This project uses **Next.js** within the `/pages` directory structure. Open-source contributions are highly welcome!

### Core Technologies

- `next` 14, `react` 18: Core framework and UI library.
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
components/
  AdTimeline.js     — Renders the saved audio description list
  DiyTimeline.js    — Renders the map of DIY loop steps
  SearchDialog.js   — YouTube search dialog UI
  TbmaEditor.js     — TBMA script editor (captions + action blocks)
scripts/
  test-sr.js        — Dev utility for testing speech recognition
  test_transcript.js — Dev utility for testing transcript fetch
styles/
  globals.css       — Global styles and YouTube player sizing
```

### Accessibility (WCAG 2.2 AA)

We strive to maintain high accessibility standards. The application includes strict ARIA labels for screen readers and adheres to AA contrast ratios (4.5:1) for warnings/unsaved state indicators.

---

_Created by [danielwestfall]_

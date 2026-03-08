# PhaseThru ✨
A revolutionary, accessible web-based Video Player built for Authoring Audio Descriptions (AD), structuring interactive DIY Guides, and providing a streamlined hands-free voice-controlled Player experience.

Built on React, Next.js, and the YouTube IFrame API. 

## 🎯 Project Philosophy
PhaseThru aims to bridge the gap in media accessibility and interactive learning by empowering creators and users to inject custom audio contexts into existing YouTube videos without needing complex video editing software. Whether you are generating WCAG-compliant Audio Descriptions for the visually impaired or breaking down complex DIY videos into loopable, voice-controllable segments, PhaseThru provides the tools in one unified interface.

## ✨ Core Features
PhaseThru operates in several distinct Application Modes, toggleable via the main interface:

### 1. 🎙️ Audio Description (AD) Editor Mode
- **Author Descriptions**: Pause the video at any timestamp and author a custom string of text.
- **Text-To-Speech Integration**: Utilizing the native Web Speech API, PhaseThru will automatically read your descriptions at the designated timestamps.
- **Customizable Voices & Speed**: Select from diverse system voices and adjust the reading rate per AD.
- **Playback Sync Engine**: Choose whether the video should **Pause** entirely while the TTS reads the AD, or **Duck** (lower volume) to let the audio mix in real-time.

### 2. 🛠️ DIY Mode Map
- **Segment Looping**: Define explicit "Steps" for a project (e.g., Step 1: 00:30 - 01:15). 
- **Auto-Looping**: The video will naturally loop within this timeframe until you are ready to move on.
- **Contextual Aids**: Add optional ADs that play continuously during the loop to clarify visual instructions that the creator missed.

### 3. ▶️ Player Mode
- **Immersive Viewing**: A clean, full-width UI focused entirely on the content.
- **Closed Caption Overlay**: While TTS is speaking an AD, the text is displayed over the video in a high-contrast CC format.
- **Hands-Free Voice Control**: Designed for users who have their hands tied (e.g., during woodworking or cooking). Simply utilize Voice Commands:
  - `"Play"` / `"Start"`
  - `"Pause"` / `"Stop"`
  - `"Next Step"` / `"Continue"`: Automatically breaks the current DIY Loop and advances the playback.

### 4. 🔍 YouTube Search Integration & Fallbacks
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
   Ensure you have Node.js installed.
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Note: If traversing a local environment with proxy errors, try running `$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run dev`.*

4. **Open Application**: 
   Navigate to `http://localhost:3000` or `http://localhost:3000/video`.

## 🏗️ Architecture & Contributing
This project uses **Next.js** within the `/pages` directory structure. Open-source contributions are highly welcome!

### Core Technologies
- `react-youtube`: Manages the YouTube IFrame API.
- `@material-ui/core` & `@material-ui/icons`: Provides the accessible, responsive UI framework.
- `window.speechSynthesis` / `window.SpeechRecognition`: Core native APIs powering TTS and Voice Control.

### File Structure
- `pages/video.js`: The central container orchestrating state across the entire application (App Mode selection, Video Player state, Sync Engine).
- `components/`: Modular, extracted UI components for maintainability limit technical debt.
  - `AdTimeline.js`: Manages the local persistence rendering of Saved ADs.
  - `DiyTimeline.js`: Manages the map of DIY steps.
  - `SearchDialog.js`: Handles YouTube proxy querying.
- `pages/api/search.js`: A backend Express-style route hooking into `youtube-sr` to bypass CORS for client-side queries.

### Accessibility (WCAG 2.2 AA)
We strive to maintain high accessibility standards. The application includes strict ARIA labels for screen readers and adheres to AA contrast ratios (4.5:1) for warnings/unsaved state indicators.

---
*Created by [danielwestfall]*

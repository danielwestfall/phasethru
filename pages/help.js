import React from "react";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const HelpPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 10, flex: 1 }}>
      <Head>
        <title>Help & Guide - EquiViewer</title>
      </Head>

      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        User Guide & Help
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        EquiViewer provides several distinct modes for authoring and viewing accessible video content. Read the guide below to learn how to use the core features of the platform.
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            1. 🎙️ Audio Description (AD) Editor
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            <strong>Author Descriptions:</strong> Pause the video at any timestamp and author a custom string of text to describe unseen visual events.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Text-To-Speech:</strong> EquiViewer utilizes the native Web Speech API to automatically read your descriptions at the designated timestamps. You can select from diverse system voices and adjust the reading rate per AD.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Standard or Extended AD:</strong> You can choose whether the video should <strong>Pause</strong> entirely while the voice reads the description (Extended), or simply <strong>Duck</strong> to let the audio mix in real-time without stopping the video (Standard).
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            2. 📜 TBMA Script Editor
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            <strong>Time-Based Media Alternative (Experimental):</strong> Import a video&apos;s Closed Captions directly as a dialogue script, then inject &quot;Action&quot; blocks in between dialogue to describe unseen events.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Auto-Fetch Captions:</strong> Click the &quot;Auto-Fetch&quot; button to automatically interpret YouTube&apos;s transcript into manageable dialogue blocks.
          </Typography>
          <Typography variant="body1" paragraph>
            If auto-fetch is blocked by region restrictions, you can paste raw `.vtt` caption data directly into the importer as a fallback.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            3. 🛠️ DIY Mode Map
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            <strong>Segment Looping:</strong> Define explicit &quot;Steps&quot; for a project (e.g., Step 1: 00:30 - 01:15). The video will naturally loop within this timeframe infinitely until you are ready to move on.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Contextual Aids:</strong> Add optional audio descriptions that play continuously during the loop to clarify visual instructions that the creator missed, or simply to add your own personal context/reminders to the step.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            4. ▶️ Player Mode & Voice Control
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            <strong>Immersive Viewing:</strong> Provides a clean, full-width UI focused entirely on the content. Standalone text-to-speech AD blocks are rendered as high-contrast CC overlays directly on the video player.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Hands-Free Voice Control:</strong> Designed for users who have their hands tied (e.g., during woodworking or cooking). Ensure your microphone is enabled and utilize the following Voice Commands:
          </Typography>
          <ul>
            <li><Typography variant="body1"><code>&quot;Play&quot;</code> or <code>&quot;Start&quot;</code></Typography></li>
            <li><Typography variant="body1"><code>&quot;Pause&quot;</code> or <code>&quot;Stop&quot;</code></Typography></li>
            <li><Typography variant="body1"><code>&quot;Next Step&quot;</code> or <code>&quot;Continue&quot;</code> (Automatically breaks the current DIY Loop and advances playback to the next step).</Typography></li>
          </ul>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            5. 🔍 Loading Videos
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            You can easily load videos into EquiViewer by pasting a YouTube URL or standard Video ID into the search bar.
          </Typography>
          <Typography variant="body1" paragraph>
            If the video publisher has disabled external embedding, EquiViewer will securely intercept the error and automatically suggest alternative variations/re-uploads of that exact video for you to load instead.
          </Typography>
          <Typography variant="body1" paragraph>
            Additionally, you can instantly turn any standard YouTube link into an accessible EquiViewer link by changing <code>www.youtube.com</code> to <code>phasethru.vercel.app</code> in your address bar.
          </Typography>
        </AccordionDetails>
      </Accordion>

    </Container>
  );
};

export default HelpPage;

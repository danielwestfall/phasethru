import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import YouTube from "react-youtube";
import { supabase } from "../lib/supabase";
import {
  Button,
  Typography,
  Grid,
  Paper,
  Box,
  Switch,
  FormControlLabel,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const COOKING_VIDEO_IDS = [
  "PUP7U5vTMM0", // Gordon Ramsay Scrambled Eggs
  "8a3Omai9HZ8", // Jamie Oliver Roast Potatoes
  "UI1M90vA2N4", // Binging with Babish
  "smIOeJRexWI", // Gordon Ramsay Beef Wellington
  "FeWVA2tpup4", // Tasty recipes
];

const WatchPlayer = () => {
  const router = useRouter();
  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    if (router.isReady) {
      if (router.query.v) {
        setVideoId(router.query.v);
      } else if (!videoId) {
        const randomId =
          COOKING_VIDEO_IDS[
            Math.floor(Math.random() * COOKING_VIDEO_IDS.length)
          ];
        setVideoId(randomId);
      }
    }
  }, [router.isReady, router.query.v, videoId]);

  // Video State
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [ads, setAds] = useState([]);
  const [diySteps, setDiySteps] = useState([]);
  const [tbmaBlocks, setTbmaBlocks] = useState([]);

  // Feature Toggles
  const [enableAD, setEnableAD] = useState(true);
  const [enableDIY, setEnableDIY] = useState(true);
  const [enableTBMA, setEnableTBMA] = useState(true);

  // Playback State
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // TTS State
  const [voices, setVoices] = useState([]);
  const [activeCaption, setActiveCaption] = useState("");
  const [closedCaption, setClosedCaption] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const synthRef = useRef(null);
  if (typeof window !== "undefined" && !synthRef.current) {
    synthRef.current = window.speechSynthesis || null;
  }
  const synth = synthRef.current;

  const intervalRef = useRef(null);
  const activeAdRef = useRef(null);
  const playedAdsRef = useRef(new Set());
  const closedCaptionRef = useRef("");
  const manualLoopBreakRef = useRef(null);

  // Refs for sync engine
  const diyStepsRef = useRef(diySteps);
  const tbmaBlocksRef = useRef(tbmaBlocks);
  const adsRef = useRef(ads);
  const enableADRef = useRef(enableAD);
  const enableDIYRef = useRef(enableDIY);
  const enableTBMARef = useRef(enableTBMA);

  useEffect(() => {
    diyStepsRef.current = diySteps;
  }, [diySteps]);
  useEffect(() => {
    tbmaBlocksRef.current = tbmaBlocks;
  }, [tbmaBlocks]);
  useEffect(() => {
    adsRef.current = ads;
  }, [ads]);
  useEffect(() => {
    enableADRef.current = enableAD;
  }, [enableAD]);
  useEffect(() => {
    enableDIYRef.current = enableDIY;
  }, [enableDIY]);
  useEffect(() => {
    enableTBMARef.current = enableTBMA;
  }, [enableTBMA]);

  // Load Voices
  useEffect(() => {
    if (typeof window !== "undefined" && synth) {
      const loadVoices = () => {
        setVoices(synth.getVoices());
      };
      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    }
  }, [synth]);

  // Fetch Data when Video ID is ready
  useEffect(() => {
    if (!videoId) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch Metadata via oEmbed
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (res.ok) {
          const data = await res.json();
          setVideoMetadata(data);
        } else {
          setVideoMetadata({ title: "Custom Video" });
        }

        if (!supabase) {
          console.warn(
            "Supabase client is not configured. Missing environment variables.",
          );
          setIsLoading(false);
          return;
        }

        // Fetch ADs
        const { data: adData, error: adError } = await supabase
          .from("audio_descriptions")
          .select("*")
          .eq("video_id", videoId)
          .order("time", { ascending: true });
        if (!adError && adData) setAds(adData);

        // Fetch DIY Steps
        const { data: diyData, error: diyError } = await supabase
          .from("diy_steps")
          .select("*")
          .eq("video_id", videoId)
          .order("start_time", { ascending: true });
        if (!diyError && diyData)
          setDiySteps(
            diyData.map((d) => ({
              ...d,
              startTime: d.start_time,
              endTime: d.end_time,
            })),
          );

        // Fetch TBMA Blocks
        const { data: tbmaData, error: tbmaError } = await supabase
          .from("tbma_blocks")
          .select("*")
          .eq("video_id", videoId)
          .order("time", { ascending: true });
        if (!tbmaError && tbmaData) setTbmaBlocks(tbmaData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, [videoId]);

  const playAd = useCallback(
    (ad) => {
      if (!synth) return;

      activeAdRef.current = ad.id;
      playedAdsRef.current.add(ad.id);

      const utterance = new SpeechSynthesisUtterance(ad.text);
      // Find best system voice or fallback to default
      if (voices.length > 0) utterance.voice = voices[0];
      utterance.rate = ad.rate || 1.0;

      setActiveCaption(ad.text);

      if (player) {
        if (ad.mode === "pause" || ad.type === "action") {
          player.pauseVideo();
        } else if (ad.mode === "duck") {
          player.setVolume(50);
        } else {
          // default tbma action behavior is pause if unassigned, or if tbma blocks don't have a mode field.
          player.pauseVideo();
        }
      }

      utterance.onend = () => {
        if (player) {
          if (ad.mode === "pause" || ad.type === "action" || !ad.mode) {
            player.playVideo();
          } else if (ad.mode === "duck") {
            player.setVolume(100);
          }
        }
        setActiveCaption("");
        activeAdRef.current = null;
      };

      window.speechUtteranceBugWorkaround = utterance;
      synth.speak(utterance);
    },
    [synth, voices, player],
  );

  // Playback Sync Engine
  useEffect(() => {
    if (isPlaying && player && synth) {
      intervalRef.current = setInterval(() => {
        const time = player.getCurrentTime();
        setCurrentTime(time);

        const currentAds = enableADRef.current ? adsRef.current : [];
        const currentDiySteps = enableDIYRef.current ? diyStepsRef.current : [];
        const currentTbmaBlocks = enableTBMARef.current
          ? tbmaBlocksRef.current
          : [];

        // DIY Looping Logic
        if (enableDIYRef.current && currentDiySteps.length > 0) {
          const activeStep = currentDiySteps.find(
            (step) => time >= step.startTime && time < step.endTime + 0.5,
          );
          if (activeStep) {
            // If we hit the end bound, loop back
            if (time >= activeStep.endTime) {
              if (manualLoopBreakRef.current === activeStep.id) {
                // Allowed to pass
                if (time > activeStep.endTime + 0.5)
                  manualLoopBreakRef.current = null;
              } else {
                player.seekTo(activeStep.startTime);
                return;
              }
            }
          }
        }

        // ADs and TBMA Actions
        const activeTbmaActions = currentTbmaBlocks.filter(
          (b) => b.type === "action" && b.text.trim() !== "",
        );
        const playableAds = [...currentAds, ...activeTbmaActions];

        const adToPlay = playableAds.find((ad) => {
          const isTimeMatch = time >= ad.time && time < ad.time + 0.25;
          const isPlayingSomethingElse =
            activeAdRef.current !== null && activeAdRef.current !== ad.id;
          const alreadyPlayed = playedAdsRef.current.has(ad.id);
          return isTimeMatch && !isPlayingSomethingElse && !alreadyPlayed;
        });

        if (adToPlay && !synth.speaking) {
          playAd(adToPlay);
        }

        // Custom TBMA Closed Captions
        let activeDialogText = "";
        if (enableTBMARef.current && currentTbmaBlocks.length > 0) {
          const dialogBlocks = currentTbmaBlocks.filter(
            (b) => b.type === "dialog",
          );
          for (let i = 0; i < dialogBlocks.length; i++) {
            const block = dialogBlocks[i];
            const nextBlock = dialogBlocks[i + 1];

            if (time >= block.time) {
              if (
                (!nextBlock || time < nextBlock.time) &&
                time < block.time + 7
              ) {
                activeDialogText = block.text;
              }
            }
          }
        }

        if (closedCaptionRef.current !== activeDialogText) {
          closedCaptionRef.current = activeDialogText;
          setClosedCaption(activeDialogText);
        }
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, player, synth, playAd]);

  const onReady = (event) => {
    setPlayer(event.target);
  };

  const onStateChange = (event) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (
        event.data === YouTube.PlayerState.PAUSED &&
        activeAdRef.current === null
      ) {
        synth.cancel();
      }
    }
  };

  if (!router.isReady || !videoId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h6">Loading Video ID...</Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Head>
        <title>
          {videoMetadata?.title
            ? `${videoMetadata.title} - PhaseThru Viewer`
            : "PhaseThru Viewer"}
        </title>
      </Head>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">PhaseThru Viewer</Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/video?videoId=${videoId}`)}
        >
          Edit / Contribute
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" m={10}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <div
              style={{
                position: "relative",
                paddingTop: "56.25%",
                width: "100%",
                backgroundColor: "#000",
                marginBottom: "15px",
              }}
            >
              <YouTube
                key={videoId}
                videoId={videoId}
                onReady={onReady}
                onStateChange={onStateChange}
                opts={{ playerVars: { controls: 1 } }}
                className="youtube-container"
              />

              {/* Custom Closed Captions Overlay */}
              {(closedCaption || activeCaption) && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "10%",
                    width: "100%",
                    textAlign: "center",
                    pointerEvents: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    zIndex: 10,
                  }}
                >
                  {activeCaption && (
                    <span
                      style={{
                        backgroundColor: "rgba(0,0,0,0.75)",
                        color: "#ff80ab",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                      }}
                    >
                      [AD]: {activeCaption}
                    </span>
                  )}

                  {closedCaption && (
                    <span
                      style={{
                        backgroundColor: "rgba(0,0,0,0.75)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                      }}
                    >
                      {closedCaption}
                    </span>
                  )}
                </div>
              )}
            </div>

            <Typography variant="h5" gutterBottom>
              {videoMetadata?.title || "Unknown Video"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper style={{ padding: "20px" }}>
              <Typography variant="h6" gutterBottom>
                Accessibility Features
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                This video has community-contributed accessibility layers.
                Toggle them below.
              </Typography>

              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <Paper variant="outlined" style={{ padding: "10px" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableAD}
                        onChange={(e) => setEnableAD(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={<strong>Audio Descriptions ({ads.length})</strong>}
                  />
                  <Typography variant="body2" color="textSecondary" ml={4}>
                    TTS narration of visual events.
                  </Typography>
                </Paper>

                <Paper variant="outlined" style={{ padding: "10px" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableTBMA}
                        onChange={(e) => setEnableTBMA(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <strong>
                        TBMA Annotations (
                        {tbmaBlocks.filter((b) => b.type === "action").length}{" "}
                        Actions,{" "}
                        {tbmaBlocks.filter((b) => b.type === "dialog").length}{" "}
                        Captions)
                      </strong>
                    }
                  />
                  <Typography variant="body2" color="textSecondary" ml={4}>
                    Time-based media alternative standard captions and actions.
                  </Typography>
                </Paper>

                <Paper variant="outlined" style={{ padding: "10px" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableDIY}
                        onChange={(e) => setEnableDIY(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <strong>DIY Loop Map ({diySteps.length} Steps)</strong>
                    }
                  />
                  <Typography variant="body2" color="textSecondary" ml={4}>
                    Automatically loops distinct steps of the tutorial.
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage("")}
        message={toastMessage}
      />
    </div>
  );
};

export default WatchPlayer;

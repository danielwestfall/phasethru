import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import YouTube from "react-youtube";
import { supabase, getSessionId } from "../lib/supabase";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Typography,
  Grid,
  Paper,
  IconButton,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import StorageIcon from "@mui/icons-material/Storage";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchDialog from "../components/SearchDialog";
import LoginDialog from "../components/LoginDialog";
import AdTimeline from "../components/AdTimeline";
import DiyTimeline from "../components/DiyTimeline";
import TbmaEditor from "../components/TbmaEditor";

const DEFAULT_VIDEO_ID = "mTz0GXj8NN0"; // Legacy fallback

const COOKING_VIDEO_IDS = [
  "PUP7U5vTMM0", // Gordon Ramsay Scrambled Eggs
  "8a3Omai9HZ8", // Jamie Oliver Roast Potatoes
  "UI1M90vA2N4", // Binging with Babish
  "smIOeJRexWI", // Gordon Ramsay Beef Wellington
  "FeWVA2tpup4", // Tasty recipes
];

const VideoPlayer = () => {
  const router = useRouter();
  const isEmbedded = router.isReady ? router.query.embed === "true" : false;
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);

  // Video Selection State
  const [videoId, setVideoId] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [videoMetadata, setVideoMetadata] = useState(null);

  // Initialize random cooking video if no specific video is requested
  useEffect(() => {
    if (router.isReady) {
      if (router.query.videoId) {
        setVideoId(router.query.videoId);
      } else if (!videoId) {
        const randomId =
          COOKING_VIDEO_IDS[
            Math.floor(Math.random() * COOKING_VIDEO_IDS.length)
          ];
        setVideoId(randomId);
      }
    }
  }, [router.isReady, router.query.videoId, videoId]);

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // App Mode
  const [appMode, setAppMode] = useState("ad_editor"); // 'ad_editor', 'diy_editor', 'player'

  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [ads, setAds] = useState([]);

  // DIY Editor State
  const [diySteps, setDiySteps] = useState([]);
  const [newStepStart, setNewStepStart] = useState(0);
  const [newStepEnd, setNewStepEnd] = useState(0);
  const [newStepAd, setNewStepAd] = useState("");

  // TBMA State
  const [tbmaBlocks, setTbmaBlocks] = useState([]);

  // Global/Default TTS State
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speechRate, setSpeechRate] = useState(1);

  // Authoring State
  const [newAdText, setNewAdText] = useState("");
  const [newAdTime, setNewAdTime] = useState(0);
  const [newAdMode, setNewAdMode] = useState("pause"); // 'pause' or 'duck'
  const [newAdVoice, setNewAdVoice] = useState("");
  const [newAdRate, setNewAdRate] = useState(1);

  // Save & DB State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fileUploadRef = useRef(null);

  // Playback Engine state
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(null);
  if (typeof window !== "undefined" && !synthRef.current) {
    synthRef.current = window.speechSynthesis || null;
  }
  const synth = synthRef.current;
  const intervalRef = useRef(null);
  const activeAdRef = useRef(null); // Track if an AD is currently playing
  const playedAdsRef = useRef(new Set()); // Track which ADs have already played during this playback session

  // Voice Command & Caption State
  const [isListening, setIsListening] = useState(false);
  const [activeCaption, setActiveCaption] = useState("");
  const [closedCaption, setClosedCaption] = useState("");
  const closedCaptionRef = useRef("");
  const recognitionRef = useRef(null);
  const manualLoopBreakRef = useRef(null);

  // Refs to avoid stale closures in the setInterval-based sync engine
  const appModeRef = useRef(appMode);
  const diyStepsRef = useRef(diySteps);
  const tbmaBlocksRef = useRef(tbmaBlocks);
  useEffect(() => {
    appModeRef.current = appMode;
  }, [appMode]);
  useEffect(() => {
    diyStepsRef.current = diySteps;
  }, [diySteps]);
  useEffect(() => {
    tbmaBlocksRef.current = tbmaBlocks;
  }, [tbmaBlocks]);

  // Force player mode if embedded
  useEffect(() => {
    if (isEmbedded && appMode !== "player") {
      setAppMode("player");
    }
  }, [isEmbedded, appMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      // Only mount recognition if in player or DIY mode
      if (
        SpeechRecognition &&
        (appMode === "player" || appMode === "diy_editor")
      ) {
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          // Interim results are disabled to prevent spamming the commands
          recognition.interimResults = false;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            const latestResult = event.results[
              event.results.length - 1
            ][0].transcript
              .toLowerCase()
              .trim();
            console.log("Voice Command Recognized:", latestResult);

            if (
              latestResult.includes("next step") ||
              latestResult.includes("continue") ||
              latestResult.includes("skip")
            ) {
              // Find the active DIY step we are currently trapped in
              if (player) {
                const time = player.getCurrentTime();
                const activeStep = diyStepsRef.current.find(
                  (step) =>
                    step.videoId === videoId &&
                    time >= step.startTime &&
                    time <= step.endTime + 0.5,
                );
                if (activeStep) {
                  manualLoopBreakRef.current = activeStep.id; // Tell the sync engine to ignore this step's end loop
                  setToastMessage(
                    `Voice Command Accepted: Breaking loop for step.`,
                  );
                } else {
                  player.playVideo(); // Maybe they just wanted to unpause
                }
              }
            } else if (
              latestResult.includes("pause") ||
              latestResult.includes("stop")
            ) {
              player?.pauseVideo();
            } else if (
              latestResult.includes("play") ||
              latestResult.includes("start")
            ) {
              player?.playVideo();
            }
          };

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => {
            setIsListening(false);
            // Try to autorestart if we are still actively in a compatible mode to keep it always listening
            if (
              recognitionRef.current &&
              (appMode === "player" || appMode === "diy_editor")
            ) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          };

          recognitionRef.current = recognition;
          try {
            recognition.start();
          } catch (e) {}
        }
      } else if (
        (appMode === "ad_editor" || appMode === "tbma_editor") &&
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
        setIsListening(false);
      }
    }
  }, [appMode, diySteps, videoId, player]);

  useEffect(() => {
    // Load existing ADs from local storage
    try {
      const savedAds = localStorage.getItem("audioDescriptions");
      if (savedAds) {
        const parsedAds = JSON.parse(savedAds);
        // Backwards compat: associate older ADs without videoId to the default video
        const migratedAds = parsedAds.map((ad) => ({
          ...ad,
          videoId: ad.videoId || DEFAULT_VIDEO_ID,
          votes: ad.votes || 0,
        }));
        setAds(migratedAds);
      }
    } catch (e) {
      console.warn("Failed to load saved ADs from storage", e);
    }

    try {
      const savedDiy = localStorage.getItem("diySteps");
      if (savedDiy) setDiySteps(JSON.parse(savedDiy));
    } catch (e) {
      console.warn("Failed to load DIY steps from storage", e);
    }

    try {
      const savedTbma = localStorage.getItem("tbmaBlocks");
      if (savedTbma) setTbmaBlocks(JSON.parse(savedTbma));
    } catch (e) {
      console.warn("Failed to load TBMA blocks from storage", e);
    }

    // Initialize Voices
    const loadVoices = () => {
      if (synth) {
        const availableVoices = synth.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          // Default to first English voice if available, else first voice
          const defaultVoice =
            availableVoices.find((v) => v.lang.startsWith("en")) ||
            availableVoices[0];
          setSelectedVoice(defaultVoice.name);
          setNewAdVoice(defaultVoice.name);
        }
      }
    };

    if (synth) {
      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (synth) synth.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synth]); // selectedVoice intentionally omitted to avoid resetting voice on every selection

  // Fetch community data when a new video is loaded
  useEffect(() => {
    if (!videoId) return;

    const fetchCommunityData = async () => {
      try {
        const [adsRes, diyRes, tbmaRes] = await Promise.all([
          fetch(`/api/db/get-ads?videoId=${videoId}`),
          fetch(`/api/db/get-diy?videoId=${videoId}`),
          fetch(`/api/db/get-tbma?videoId=${videoId}`),
        ]);

        if (adsRes.ok) {
          const dbAds = await adsRes.json();
          setAds((prev) => {
            const existingIds = new Set(prev.map((ad) => ad.id));
            const newAds = dbAds.filter((dbAd) => !existingIds.has(dbAd.id));
            return [...prev, ...newAds].sort((a, b) => a.time - b.time);
          });
        }

        if (diyRes.ok) {
          const dbDiy = await diyRes.json();
          setDiySteps((prev) => {
            const existingIds = new Set(prev.map((step) => step.id));
            const newSteps = dbDiy.filter((dbS) => !existingIds.has(dbS.id));
            return [...prev, ...newSteps].sort(
              (a, b) => a.startTime - b.startTime,
            );
          });
        }

        if (tbmaRes.ok) {
          const dbTbmaSets = await tbmaRes.json();
          setTbmaBlocks((prev) => {
            const flatDbBlocks = dbTbmaSets.flatMap((script) => script.blocks);
            const existingIds = new Set(prev.map((block) => block.id));
            const newBlocks = flatDbBlocks.filter(
              (dbB) => !existingIds.has(dbB.id),
            );
            return [...prev, ...newBlocks];
          });
        }
      } catch (err) {
        console.error("Failed to fetch community data", err);
      }
    };

    fetchCommunityData();
  }, [videoId]);

  // Handle Auth State
  useEffect(() => {
    // Get initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => subscription.unsubscribe();
  }, []);

  // Prevent accidental navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Playback Sync Engine
  useEffect(() => {
    if (isPlaying && player && synth) {
      intervalRef.current = setInterval(() => {
        const time = player.getCurrentTime();
        setCurrentTime(time);

        const currentAppMode = appModeRef.current;
        const currentDiySteps = diyStepsRef.current;
        const currentTbmaBlocks = tbmaBlocksRef.current;

        // DIY Looping Logic: If we hit the End Time of a step, loop back to the Start Time
        // Note: Only enforce DIY loops if we aren't in AD Editor specifically
        if (currentAppMode !== "ad_editor") {
          const activeStep = currentDiySteps.find(
            (step) =>
              step.videoId === videoId &&
              time >= step.endTime &&
              time < step.endTime + 0.5,
          );
          if (activeStep) {
            if (manualLoopBreakRef.current === activeStep.id) {
              // User commanded "next step". Let it play past.
              if (time > activeStep.endTime + 0.5)
                manualLoopBreakRef.current = null;
            } else {
              player.seekTo(activeStep.startTime);
              return; // skip AD checking this tick since we just jumped
            }
          } else if (manualLoopBreakRef.current) {
            // Reset if we somehow left the time bounds (scrubbing)
            manualLoopBreakRef.current = null;
          }
        }

        // Merge standard ADs with TBMA action blocks if they exist for this video
        const activeTbmaActions =
          currentAppMode === "tbma_editor" || currentAppMode === "player"
            ? currentTbmaBlocks.filter(
                (b) => b.type === "action" && b.text.trim() !== "",
              )
            : [];

        // Add a dummy videoId to tbma blocks so the filter passes
        const normalizedTbma = activeTbmaActions.map((b) => ({
          ...b,
          videoId,
        }));
        const playableAds = [...ads, ...normalizedTbma];

        // We use a tightened margin of error (0.25s) and check if we've already played this AD
        const adToPlay = playableAds.find((ad) => {
          // Check if this AD belongs to the current video
          if (ad.videoId && ad.videoId !== videoId) return false;

          // Only trigger if we are PAST the exact timestamp, but no more than 0.25s past
          const isTimeMatch = time >= ad.time && time < ad.time + 0.25;
          const isPlayingSomethingElse =
            activeAdRef.current !== null && activeAdRef.current !== ad.id;
          const alreadyPlayed = playedAdsRef.current.has(ad.id);

          return isTimeMatch && !isPlayingSomethingElse && !alreadyPlayed;
        });

        if (adToPlay && !synth.speaking) {
          playAd(adToPlay);
        }

        // Custom TBMA Closed Caption Logic (Player Mode only)
        let activeDialogText = "";
        if (currentAppMode === "player" && currentTbmaBlocks.length > 0) {
          const dialogBlocks = currentTbmaBlocks.filter(
            (b) => b.type === "dialog",
          );
          for (let i = 0; i < dialogBlocks.length; i++) {
            const block = dialogBlocks[i];
            const nextBlock = dialogBlocks[i + 1];

            if (time >= block.time) {
              // Hide caption if it's past the next block's start time OR if 7 seconds have elapsed (prevent stuck captions)
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
      }, 100); // Poll every 100ms for tighter accuracy
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, player, ads, synth, videoId]); // appMode, diySteps, tbmaBlocks accessed via refs to avoid engine restart

  const playAd = useCallback(
    (ad) => {
      if (!synth) return;

      activeAdRef.current = ad.id; // Mark as playing to prevent re-triggering
      playedAdsRef.current.add(ad.id); // Mark as finalized for this playback pass

      // Fallback to global setting if the AD doesn't have a specific voice/rate saved (legacy data)
      const adVoiceName = ad.voice || selectedVoice;
      const adRate = ad.rate || speechRate;

      const utterance = new SpeechSynthesisUtterance(ad.text);
      const voiceObj = voices.find((v) => v.name === adVoiceName);
      if (voiceObj) utterance.voice = voiceObj;
      utterance.rate = adRate;

      setActiveCaption(ad.text); // Display subtitle in Player Mode

      // Apply AD Mode
      if (player) {
        if (ad.mode === "pause") {
          player.pauseVideo();
        } else if (ad.mode === "duck") {
          player.setVolume(50); // Drop volume to 50%
        }
      }

      utterance.onend = () => {
        // Restore when done
        if (player) {
          if (ad.mode === "pause") {
            player.playVideo();
          } else if (ad.mode === "duck") {
            player.setVolume(100);
          }
        }
        setActiveCaption(""); // Clear subtitle
        activeAdRef.current = null; // Clear active AD allowing next one to trigger
      };

      // Chrome GC bug workaround: keeps a reference to the utterance to prevent
      // premature garbage collection which silently kills speech mid-sentence.
      window.speechUtteranceBugWorkaround = utterance;
      synth.speak(utterance);
    },
    [synth, voices, selectedVoice, speechRate, player],
  );

  const testSpeech = () => {
    if (!synth) return;

    synth.cancel();

    const textToRead =
      newAdText ||
      "This is a sample sentence to test the text to speech settings.";
    const utterance = new SpeechSynthesisUtterance(textToRead);

    const currentVoiceName = newAdVoice || selectedVoice;
    const currentRate = newAdRate || speechRate;

    const voiceObj = voices.find((v) => v.name === currentVoiceName);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = currentRate;

    // Chrome GC bug workaround (see playAd for full explanation)
    window.speechUtteranceBugWorkaround = utterance;
    synth.speak(utterance);
  };

  const extractVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleLoadVideo = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved AD changes for this video! Loading a new video will retain them in memory but you haven't explicitly saved them to the Local Browser or Database. Continue?",
      );
      if (!confirmLeave) return;
    }

    const extractedId = extractVideoId(videoInput);
    if (extractedId) {
      setVideoId(extractedId);
    } else if (videoInput.length === 11) {
      setVideoId(videoInput); // Assume it's already an ID
    } else {
      setToastMessage(
        "Invalid YouTube URL or ID. Please paste a valid link or 11-character video ID.",
      );
      return;
    }
    setVideoInput("");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      setToastMessage(
        "Search failed. Please check your connection and try again.",
      );
    }
    setIsSearching(false);
  };

  const handleSelectSearchResult = (video) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved AD changes for this video! Loading a new video will retain them in memory but you haven't explicitly saved them to the Local Browser or Database. Continue?",
      );
      if (!confirmLeave) return;
    }
    setVideoId(video.id);
    setVideoMetadata({
      videoId: video.id,
      title: video.title,
      author: video.channel,
    });
    setSearchOpen(false);
  };

  // Save & Load Functionality
  const handleSaveLocally = () => {
    localStorage.setItem("audioDescriptions", JSON.stringify(ads));
    localStorage.setItem("diySteps", JSON.stringify(diySteps));
    localStorage.setItem("tbmaBlocks", JSON.stringify(tbmaBlocks));
    setHasUnsavedChanges(false);
    setToastMessage("Successfully Saved Data to Local Browser Storage!");
  };

  const handleSaveToDB = async () => {
    if (!videoMetadata) {
      setToastMessage("Load a video first before saving to database.");
      return;
    }

    const sessionId = user?.id || getSessionId();
    const video = {
      id: videoId,
      title: videoMetadata.title || "",
      author: videoMetadata.author || "",
    };

    try {
      const promises = [];
      const sessionData = await supabase?.auth.getSession();
      const token = sessionData?.data?.session?.access_token;

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Save ADs for this video
      const currentVideoAds = ads.filter((ad) => ad.videoId === videoId);
      if (currentVideoAds.length > 0) {
        promises.push(
          fetch("/api/db/save-ads", {
            method: "POST",
            headers,
            body: JSON.stringify({
              video,
              ads: currentVideoAds,
              authorId: sessionId,
            }),
          }),
        );
      }

      // Save DIY steps for this video
      const currentDiySteps = diySteps.filter((s) => s.videoId === videoId);
      if (currentDiySteps.length > 0) {
        promises.push(
          fetch("/api/db/save-diy", {
            method: "POST",
            headers,
            body: JSON.stringify({
              video,
              steps: currentDiySteps,
              authorId: sessionId,
            }),
          }),
        );
      }

      // Save TBMA blocks if any exist
      if (tbmaBlocks.length > 0) {
        promises.push(
          fetch("/api/db/save-tbma", {
            method: "POST",
            headers,
            body: JSON.stringify({
              video,
              blocks: tbmaBlocks,
              authorId: sessionId,
            }),
          }),
        );
      }

      if (promises.length === 0) {
        setToastMessage("No data to save for this video.");
        return;
      }

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (!allOk) {
        throw new Error("One or more saves failed");
      }

      setHasUnsavedChanges(false);
      setToastMessage("✅ Successfully saved to database!");
    } catch (error) {
      console.error("DB save error:", error);
      // Graceful fallback: save locally instead
      handleSaveLocally();
      setToastMessage(
        "⚠️ Database unavailable — saved to local browser storage instead.",
      );
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedAds = JSON.parse(event.target.result);
        if (Array.isArray(importedAds)) {
          // Validate imported ADs have the minimum required fields
          const validAds = importedAds.filter(
            (ad) => ad.time != null && ad.text && ad.mode,
          );
          if (validAds.length === 0) {
            setToastMessage("No valid audio descriptions found in the file.");
            return;
          }
          const mergedAds = [...ads, ...validAds].sort(
            (a, b) => a.time - b.time,
          );
          setAds(mergedAds);
          setHasUnsavedChanges(true);
          setToastMessage(
            `Successfully imported ${validAds.length} descriptions! Please review and save.`,
          );
        }
      } catch (err) {
        setToastMessage("Invalid JSON file uploaded.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const onReady = (event) => {
    setPlayer(event.target);

    // Extract metadata
    const data = event.target.getVideoData();
    if (data && data.video_id) {
      setVideoMetadata((prev) => {
        // Prevent overwriting rich metadata injected from the Search UI with empty onReady data
        if (
          prev &&
          prev.videoId === data.video_id &&
          prev.author !== "Unknown Author"
        ) {
          return prev;
        }
        return {
          videoId: data.video_id,
          title: data.title || "Unknown Title",
          author: data.author ? data.author : "Unknown Author",
        };
      });
    }
  };

  const onError = (event) => {
    // Error 150/101 means "Playback on other websites has been disabled by the video owner."
    if (event.data === 150 || event.data === 101) {
      setToastMessage(
        "The video owner has disabled embedding for this video. Searching for alternatives...",
      );
      if (videoMetadata?.title || videoInput) {
        setSearchQuery(videoMetadata?.title || videoInput);
        setSearchOpen(true);
        setTimeout(() => handleSearch(), 500); // Auto-trigger search
      }
    }
  };

  const onStateChange = (event) => {
    setIsPlaying(event.data === 1);

    if (event.data === 1 && player) {
      const time = player.getCurrentTime();
      // Prune already-played ads that are in the future (seek backwards case)
      // Checks both regular ADs and TBMA blocks
      playedAdsRef.current = new Set(
        [...playedAdsRef.current].filter((id) => {
          const ad = [...ads, ...tbmaBlocks].find((a) => a.id === id);
          return ad && ad.time < time;
        }),
      );
    }
  };

  const handleCaptureTime = (setter) => {
    if (player) {
      const time = player.getCurrentTime();
      if (setter) setter(parseFloat(time.toFixed(2)));
      else setNewAdTime(parseFloat(time.toFixed(2))); // fallback for ad editor
    }
  };

  const handleAddAd = () => {
    if (!newAdText) return;

    const newAd = {
      id: crypto.randomUUID(),
      videoId: videoId,
      videoTitle: videoMetadata?.title || "Unknown Title",
      videoAuthor: videoMetadata?.author || "Unknown Author",
      time: parseFloat(newAdTime),
      text: newAdText,
      mode: newAdMode,
      voice: newAdVoice || selectedVoice,
      rate: newAdRate || speechRate,
      votes: 0, // Default to 0 votes for new ADs
    };

    const updatedAds = [...ads, newAd].sort((a, b) => a.time - b.time);
    setAds(updatedAds);
    setHasUnsavedChanges(true); // Flag that user has added a new AD that isn't saved yet

    setNewAdText("");
  };

  const handleDeleteAd = (id) => {
    const updatedAds = ads.filter((ad) => ad.id !== id);
    setAds(updatedAds);
    setHasUnsavedChanges(true);
  };

  const handleAddDiyStep = () => {
    if (newStepStart >= newStepEnd) {
      setToastMessage("End time must be greater than start time.");
      return;
    }

    const newStep = {
      id: crypto.randomUUID(),
      videoId: videoId,
      startTime: parseFloat(newStepStart),
      endTime: parseFloat(newStepEnd),
      text: newStepAd,
      voice: newAdVoice || selectedVoice,
      rate: newAdRate || speechRate,
    };

    const updatedSteps = [...diySteps, newStep].sort(
      (a, b) => a.startTime - b.startTime,
    );
    setDiySteps(updatedSteps);
    setHasUnsavedChanges(true);
    setNewStepAd("");
  };

  const handleDeleteDiyStep = (id) => {
    const updatedSteps = diySteps.filter((s) => s.id !== id);
    setDiySteps(updatedSteps);
    setHasUnsavedChanges(true);
  };

  const handleVoteProcess = async (id, direction) => {
    // Optimistic local update
    const updatedAds = ads.map((ad) => {
      if (ad.id === id) {
        return {
          ...ad,
          votes: (ad.votes || 0) + (direction === "up" ? 1 : -1),
        };
      }
      return ad;
    });
    setAds(updatedAds);
    setHasUnsavedChanges(true);

    // Persist vote to database (fire-and-forget with error handling)
    try {
      const sessionId = user?.id || getSessionId();
      const sessionData = await supabase?.auth.getSession();
      const token = sessionData?.data?.session?.access_token;

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/db/vote", {
        method: "POST",
        headers,
        body: JSON.stringify({
          adId: id,
          voterId: sessionId,
          direction: direction === "up" ? 1 : -1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Sync the server-authoritative vote count back
        setAds((prev) =>
          prev.map((ad) => (ad.id === id ? { ...ad, votes: data.votes } : ad)),
        );
      }
    } catch (err) {
      // Vote already applied optimistically, silent fail is fine
      console.warn("Vote sync failed:", err);
    }
  };

  const formatTime = (totalSeconds) => {
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds / 60) % 60)
      .toString()
      .padStart(2, "0");
    const h = Math.floor(totalSeconds / 3600);
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const playVideoWithAds = () => {
    if (player) {
      synth.cancel();
      playedAdsRef.current = new Set();
      player.seekTo(0);
      player.playVideo();
    }
  };

  // Filter ADs strictly for the currently loaded video
  const currentVideoAds = ads.filter((ad) => ad.videoId === videoId);

  const embedCode = `<iframe src="https://phasethru.vercel.app/video?videoId=${videoId}&embed=true" width="100%" height="600" frameborder="0" allow="autoplay; encrypted-media; clipboard-write; speech" allowfullscreen></iframe>`;

  return (
    <div
      style={{
        padding: isEmbedded ? "0px" : "20px",
        maxWidth: isEmbedded ? "100%" : "1200px",
        margin: "0 auto",
        height: isEmbedded ? "100vh" : "auto",
        display: isEmbedded ? "flex" : "block",
        flexDirection: isEmbedded ? "column" : "unset",
      }}
    >
      <Head>
        <title>PhaseThru — Audio Description Player</title>
        <meta
          name="description"
          content="Author, share, and playback audio descriptions for YouTube videos. Includes DIY looping, TBMA scripting, and voice control."
        />
      </Head>

      {!isEmbedded && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4">Audio Description Player</Typography>

          {user ? (
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              onClick={() => setIsLoginOpen(true)}
            >
              Sign In
            </Button>
          )}
        </Box>
      )}

      {!isEmbedded && (
        <Paper
          style={{
            padding: "15px",
            marginBottom: "25px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "10px",
            }}
          >
            <ToggleButtonGroup
              color="primary"
              value={appMode}
              exclusive
              onChange={(e, newMode) => {
                if (newMode !== null) setAppMode(newMode);
              }}
              aria-label="Application Mode Selection"
            >
              <ToggleButton value="ad_editor">AD Editor</ToggleButton>
              <ToggleButton value="diy_editor">DIY Mode Map</ToggleButton>
              <ToggleButton value="tbma_editor">TBMA Editor</ToggleButton>
              <ToggleButton value="player">Player</ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h6"
              style={{ marginRight: "15px", minWidth: "150px" }}
            >
              Load Video:
            </Typography>
            <TextField
              placeholder="Paste YouTube URL or Video ID..."
              variant="outlined"
              size="small"
              fullWidth
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              style={{ marginRight: "15px" }}
              inputProps={{ "aria-label": "YouTube URL or Video ID" }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleLoadVideo}
              style={{ marginRight: "10px" }}
            >
              Load
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={() => setSearchOpen(true)}
              style={{ marginRight: "10px" }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CodeIcon />}
              onClick={() => setEmbedDialogOpen(true)}
            >
              Embed
            </Button>
          </div>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* Video Column */}
        <Grid
          item
          xs={12}
          md={appMode === "player" ? 12 : 7}
          style={{ height: isEmbedded ? "100%" : "auto" }}
        >
          <div
            style={{
              position: "relative",
              paddingTop: isEmbedded
                ? "0"
                : appMode === "player"
                  ? "45%"
                  : "56.25%",
              height: isEmbedded ? "100%" : "auto",
              width: "100%",
              flexGrow: 1,
              backgroundColor: "#000",
              marginBottom: "15px",
            }}
          >
            <YouTube
              key={videoId}
              videoId={videoId}
              onReady={onReady}
              onError={onError}
              onStateChange={onStateChange}
              opts={{ playerVars: { controls: 1 } }}
              className="youtube-container"
            />

            {/* Custom Closed Captions Overlay */}
            {appMode === "player" && (closedCaption || activeCaption) && (
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
                {/* Audio Description Caption (if active) */}
                {activeCaption && (
                  <span
                    style={{
                      backgroundColor: "rgba(0,0,0,0.75)",
                      color: "#ff80ab", // Pink/magenta to heavily distinguish ADs from standard dialog
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                    }}
                  >
                    [AD]: {activeCaption}
                  </span>
                )}

                {/* Standard TBMA Dialog Caption */}
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

          {/* PLAYER MODE OVERLAY / SYSTEM STATUS */}
          {appMode === "player" && (
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
                minHeight: "40px",
              }}
            >
              <div style={{ marginTop: "10px" }}>
                <Typography
                  variant="caption"
                  style={{
                    color: isListening ? "#4caf50" : "#9e9e9e",
                    fontWeight: "bold",
                  }}
                >
                  {isListening
                    ? "🎙️ Voice Control Active (Try: 'Next Step', 'Pause', 'Play')"
                    : "🎙️ Voice Control disabled or not supported"}
                </Typography>
              </div>
            </div>
          )}

          {appMode !== "player" && videoMetadata && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Typography variant="subtitle1">
                  <strong>Title:</strong> {videoMetadata.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Author:</strong> {videoMetadata.author} •{" "}
                  <strong>ID:</strong> {videoMetadata.videoId}
                </Typography>
              </div>

              {/* Mock DB Interaction & External Importing Tools */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  ref={fileUploadRef}
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileUploadRef.current.click()}
                >
                  Import Saved ADs from File
                </Button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="contained"
                    size="small"
                    style={{
                      backgroundColor: hasUnsavedChanges
                        ? "#e65100"
                        : "#4caf50",
                      color: "#fff",
                      flex: 1,
                    }}
                    startIcon={<SaveIcon />}
                    onClick={handleSaveLocally}
                  >
                    Save Locally
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    style={{ flex: 1 }}
                    startIcon={<StorageIcon />}
                    onClick={handleSaveToDB}
                  >
                    Save to DB
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Grid>

        {/* Authoring & Controls Column */}
        {appMode !== "player" && (
          <Grid item xs={12} md={5}>
            {appMode === "ad_editor" && (
              <Paper style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Add Description
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={testSpeech}
                    disabled={!synth}
                  >
                    Test TTS Setting
                  </Button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <TextField
                    label="Timestamp (s)"
                    type="number"
                    step="0.1"
                    value={newAdTime}
                    onChange={(e) => setNewAdTime(parseFloat(e.target.value))}
                    style={{ marginRight: "10px", width: "120px" }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleCaptureTime(setNewAdTime)}
                  >
                    Capture Time
                  </Button>
                </div>

                <FormControl fullWidth style={{ marginBottom: "15px" }}>
                  <InputLabel>Action Mode</InputLabel>
                  <Select
                    value={newAdMode}
                    onChange={(e) => setNewAdMode(e.target.value)}
                  >
                    <MenuItem value="pause">Pause Video</MenuItem>
                    <MenuItem value="duck">Duck Audio (50%)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Description Text"
                  multiline
                  rows={3}
                  variant="outlined"
                  fullWidth
                  value={newAdText}
                  onChange={(e) => setNewAdText(e.target.value)}
                  style={{ marginBottom: "15px" }}
                />

                {/* Per AD TTS Controls inside Authoring Block */}
                <div
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Description Voice Settings
                  </Typography>
                  <FormControl fullWidth style={{ marginBottom: "15px" }}>
                    <Select
                      value={newAdVoice || selectedVoice}
                      onChange={(e) => setNewAdVoice(e.target.value)}
                    >
                      {voices.map((voice, idx) => (
                        <MenuItem key={idx} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography variant="caption">
                    Speech Rate: {newAdRate || speechRate}
                  </Typography>
                  <Slider
                    value={newAdRate || speechRate}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onChange={(e, val) => setNewAdRate(val)}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddAd}
                    disabled={!newAdText || !videoMetadata}
                    fullWidth
                  >
                    Add AD to Timeline
                  </Button>
                </div>
              </Paper>
            )}

            {appMode === "diy_editor" && (
              <Paper style={{ padding: "20px" }}>
                <Typography variant="h6" gutterBottom>
                  Add DIY Step
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ marginBottom: "15px" }}
                >
                  Define a section of the video to loop during hands-free DIY
                  playback.
                </Typography>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <TextField
                    label="Start Time (s)"
                    type="number"
                    step="0.1"
                    value={newStepStart}
                    onChange={(e) =>
                      setNewStepStart(parseFloat(e.target.value))
                    }
                    style={{ marginRight: "10px", flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleCaptureTime(setNewStepStart)}
                  >
                    Current
                  </Button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <TextField
                    label="End Time (s)"
                    type="number"
                    step="0.1"
                    value={newStepEnd}
                    onChange={(e) => setNewStepEnd(parseFloat(e.target.value))}
                    style={{ marginRight: "10px", flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleCaptureTime(setNewStepEnd)}
                  >
                    Current
                  </Button>
                </div>

                <TextField
                  label="Optional Step Description/Context"
                  multiline
                  rows={2}
                  variant="outlined"
                  fullWidth
                  value={newStepAd}
                  onChange={(e) => setNewStepAd(e.target.value)}
                  style={{ marginBottom: "15px" }}
                />

                <div
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Voice Settings
                  </Typography>
                  <FormControl fullWidth style={{ marginBottom: "10px" }}>
                    <Select
                      value={newAdVoice || selectedVoice}
                      onChange={(e) => setNewAdVoice(e.target.value)}
                    >
                      {voices.map((voice, idx) => (
                        <MenuItem key={idx} value={voice.name}>
                          {voice.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddDiyStep}
                  disabled={!videoMetadata}
                  fullWidth
                >
                  Save DIY Step
                </Button>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>

      {/* Timelines / AD List */}
      {appMode === "ad_editor" && (
        <AdTimeline
          currentVideoAds={currentVideoAds}
          hasUnsavedChanges={hasUnsavedChanges}
          onPlayVideoWithAds={playVideoWithAds}
          onVote={handleVoteProcess}
          formatTime={formatTime}
          onPlayAd={playAd}
          onDeleteAd={handleDeleteAd}
        />
      )}

      {/* DIY Timeline List */}
      {appMode === "diy_editor" && (
        <DiyTimeline
          diySteps={diySteps}
          videoId={videoId}
          formatTime={formatTime}
          onDeleteDiyStep={handleDeleteDiyStep}
        />
      )}

      {/* TBMA Editor */}
      {appMode === "tbma_editor" && (
        <TbmaEditor
          videoId={videoId}
          tbmaBlocks={tbmaBlocks}
          setTbmaBlocks={setTbmaBlocks}
          voices={voices}
          selectedVoice={selectedVoice}
          setHasUnsavedChanges={setHasUnsavedChanges}
          formatTime={formatTime}
          onPlayAd={playAd}
          videoTitle={videoMetadata?.title || videoTitle}
        />
      )}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage("")}
        message={toastMessage}
      />

      {/* YouTube Search Dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        searchResults={searchResults}
        onSearch={handleSearch}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Login Dialog */}
      <LoginDialog open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Embed Code Dialog */}
      <Dialog
        open={embedDialogOpen}
        onClose={() => setEmbedDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Embed PhaseThru Player</DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            gutterBottom
            style={{ marginTop: "10px" }}
          >
            Copy the HTML code below to embed this accessible audio description
            player on your own website.
          </Typography>
          <Paper
            variant="outlined"
            style={{
              padding: "15px",
              backgroundColor: "#2d2d2d",
              color: "#fff",
              fontFamily: "monospace",
              wordBreak: "break-all",
              marginTop: "10px",
            }}
          >
            {embedCode}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmbedDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
              setToastMessage("Embed code copied to clipboard!");
              setEmbedDialogOpen(false);
            }}
          >
            Copy Code
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VideoPlayer;

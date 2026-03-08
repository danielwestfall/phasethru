import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Slider, Typography, Grid, Paper, IconButton, Snackbar, Divider, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress, InputAdornment } from "@material-ui/core";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DeleteIcon from '@material-ui/icons/Delete';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import SaveIcon from '@material-ui/icons/Save';
import StorageIcon from '@material-ui/icons/Storage';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import SearchIcon from '@material-ui/icons/Search';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import SearchDialog from '../components/SearchDialog';
import AdTimeline from '../components/AdTimeline';
import DiyTimeline from '../components/DiyTimeline';
import TbmaEditor from '../components/TbmaEditor';

const VideoPlayer = () => {
    // Video Selection State
    const [videoId, setVideoId] = useState('mTz0GXj8NN0'); // Default Video
    const [videoInput, setVideoInput] = useState('');
    const [videoMetadata, setVideoMetadata] = useState(null);

    // Search State
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // App Mode
    const [appMode, setAppMode] = useState('ad_editor'); // 'ad_editor', 'diy_editor', 'player'

    const [player, setPlayer] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [ads, setAds] = useState([]);
    
    // DIY Editor State
    const [diySteps, setDiySteps] = useState([]);
    const [newStepStart, setNewStepStart] = useState(0);
    const [newStepEnd, setNewStepEnd] = useState(0);
    const [newStepAd, setNewStepAd] = useState('');
    
    // TBMA State
    const [tbmaBlocks, setTbmaBlocks] = useState([]);
    
    // Global/Default TTS State
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [speechRate, setSpeechRate] = useState(1);
    
    // Authoring State
    const [newAdText, setNewAdText] = useState('');
    const [newAdTime, setNewAdTime] = useState(0);
    const [newAdMode, setNewAdMode] = useState('pause'); // 'pause' or 'duck'
    const [newAdVoice, setNewAdVoice] = useState('');
    const [newAdRate, setNewAdRate] = useState(1);

    // Save & DB State
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const fileUploadRef = useRef(null);
    
    // Playback Engine state
    const [isPlaying, setIsPlaying] = useState(false);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const intervalRef = useRef(null);
    const activeAdRef = useRef(null); // Track if an AD is currently playing
    const playedAdsRef = useRef(new Set()); // Track which ADs have already played during this playback session

    // Voice Command & Caption State
    const [isListening, setIsListening] = useState(false);
    const [activeCaption, setActiveCaption] = useState('');
    const recognitionRef = useRef(null);
    const manualLoopBreakRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // Only mount recognition if in player or DIY mode
            if (SpeechRecognition && (appMode === 'player' || appMode === 'diy_editor')) {
                if (!recognitionRef.current) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    // Interim results are disabled to prevent spamming the commands
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    
                    recognition.onresult = (event) => {
                        const latestResult = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                        console.log("Voice Command Recognized:", latestResult);
                        
                        if (latestResult.includes('next step') || latestResult.includes('continue') || latestResult.includes('skip')) {
                             // Find the active DIY step we are currently trapped in
                             if (player) {
                                  const time = player.getCurrentTime();
                                  const activeStep = diySteps.find(step => step.videoId === videoId && time >= step.startTime && time <= step.endTime + 0.5);
                                  if (activeStep) {
                                       manualLoopBreakRef.current = activeStep.id; // Tell the sync engine to ignore this step's end loop
                                       setToastMessage(`Voice Command Accepted: Breaking loop for step.`);
                                  } else {
                                       player.playVideo(); // Maybe they just wanted to unpause
                                  }
                             }
                        } else if (latestResult.includes('pause') || latestResult.includes('stop')) {
                             player?.pauseVideo();
                        } else if (latestResult.includes('play') || latestResult.includes('start')) {
                             player?.playVideo();
                        }
                    };
                    
                    recognition.onstart = () => setIsListening(true);
                    recognition.onend = () => {
                        setIsListening(false);
                        // Try to autorestart if we are still actively in a compatible mode to keep it always listening
                        if (recognitionRef.current && (appMode === 'player' || appMode === 'diy_editor')) {
                            try { recognitionRef.current.start(); } catch(e){}
                        } 
                    };
    
                    recognitionRef.current = recognition;
                    try { recognition.start(); } catch(e){}
                }
            } else if (appMode === 'ad_editor' && recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e){}
                recognitionRef.current = null;
                setIsListening(false);
            }
        }
    }, [appMode, diySteps, videoId, player]);

    useEffect(() => {
        // Load existing ADs from local storage
        const savedAds = localStorage.getItem('audioDescriptions');
        if (savedAds) {
            const parsedAds = JSON.parse(savedAds);
            // Backwards compatibility: if older ADs don't have a videoId, associate them with the original default video
            const migratedAds = parsedAds.map(ad => ({
                ...ad,
                videoId: ad.videoId || 'mTz0GXj8NN0',
                votes: ad.votes || 0 // Init votes backwards compat
            }));
            setAds(migratedAds);
        }

        const savedDiy = localStorage.getItem('diySteps');
        if (savedDiy) setDiySteps(JSON.parse(savedDiy));

        const savedTbma = localStorage.getItem('tbmaBlocks');
        if (savedTbma) setTbmaBlocks(JSON.parse(savedTbma));

        // Initialize Voices
        const loadVoices = () => {
            if (synth) {
                const availableVoices = synth.getVoices();
                setVoices(availableVoices);
                if (availableVoices.length > 0 && !selectedVoice) {
                    // Default to first English voice if available, else first voice
                    const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
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
        }
    }, [synth]); // Removed selectedVoice from dependency array to avoid reset


    // Prevent accidental navigation if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);


    // Playback Sync Engine
    useEffect(() => {
        if (isPlaying && player && synth) {
            intervalRef.current = setInterval(() => {
                const time = player.getCurrentTime();
                setCurrentTime(time);
                
                // DIY Looping Logic: If we hit the End Time of a step, loop back to the Start Time
                // Note: Only enforce DIY loops if we aren't in AD Editor specifically
                if (appMode !== 'ad_editor') {
                    const activeStep = diySteps.find(step => step.videoId === videoId && time >= step.endTime && time < step.endTime + 0.5);
                    if (activeStep) {
                        if (manualLoopBreakRef.current === activeStep.id) {
                            // User commanded "next step". Let it play past.
                            if (time > activeStep.endTime + 0.5) manualLoopBreakRef.current = null;
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
                const activeTbmaActions = appMode === 'tbma_editor' || appMode === 'player' 
                     ? tbmaBlocks.filter(b => b.type === 'action' && b.text.trim() !== '') 
                     : [];
                
                // Add a dummy videoId to tbma blocks so the filter passes
                const normalizedTbma = activeTbmaActions.map(b => ({...b, videoId }));
                const playableAds = [...ads, ...normalizedTbma];

                // We use a tightened margin of error (0.25s) and check if we've already played this AD
                const adToPlay = playableAds.find(ad => {
                     // Check if this AD belongs to the current video
                     if (ad.videoId && ad.videoId !== videoId) return false;

                     // Only trigger if we are PAST the exact timestamp, but no more than 0.25s past
                     const isTimeMatch = time >= ad.time && time < (ad.time + 0.25);
                     const isPlayingSomethingElse = activeAdRef.current !== null && activeAdRef.current !== ad.id;
                     const alreadyPlayed = playedAdsRef.current.has(ad.id);
                     
                     return isTimeMatch && !isPlayingSomethingElse && !alreadyPlayed;
                });
                
                if (adToPlay && !synth.speaking) {
                    playAd(adToPlay);
                }

            }, 100); // Poll every 100ms for tighter accuracy
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, player, ads, synth, videoId]);


    const playAd = (ad) => {
        if (!synth) return;
        
        activeAdRef.current = ad.id; // Mark as playing to prevent re-triggering
        playedAdsRef.current.add(ad.id); // Mark as finalized for this playback pass

        // Fallback to global setting if the AD doesn't have a specific voice/rate saved (legacy data)
        const adVoiceName = ad.voice || selectedVoice;
        const adRate = ad.rate || speechRate;

        const utterance = new SpeechSynthesisUtterance(ad.text);
        const voiceObj = voices.find(v => v.name === adVoiceName);
        if (voiceObj) utterance.voice = voiceObj;
        utterance.rate = adRate;

        setActiveCaption(ad.text); // Display subtitle in Player Mode

        // Apply AD Mode
        if (player) {
            if (ad.mode === 'pause') {
                player.pauseVideo();
            } else if (ad.mode === 'duck') {
                player.setVolume(50); // Drop volume to 50%
            }
        }

        utterance.onend = () => {
             // Restore when done
             if (player) {
                if (ad.mode === 'pause') {
                    player.playVideo();
                } else if (ad.mode === 'duck') {
                    player.setVolume(100); 
                }
             }
            setActiveCaption(''); // Clear subtitle
            activeAdRef.current = null; // Clear active AD allowing next one to trigger
        };

        window.speechUtteranceBugWorkaround = utterance;
        synth.speak(utterance);
    };


    const testSpeech = () => {
        if (!synth) return;
        
        synth.cancel();

        const textToRead = newAdText || "This is a sample sentence to test the text to speech settings.";
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        const currentVoiceName = newAdVoice || selectedVoice;
        const currentRate = newAdRate || speechRate;

        const voiceObj = voices.find(v => v.name === currentVoiceName);
        if (voiceObj) utterance.voice = voiceObj;
        utterance.rate = currentRate;
        
        window.speechUtteranceBugWorkaround = utterance;
        synth.speak(utterance);
    }


    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleLoadVideo = () => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm("You have unsaved AD changes for this video! Loading a new video will retain them in memory but you haven't explicitly saved them to the Local Browser or Database. Continue?");
            if (!confirmLeave) return;
        }

        const extractedId = extractVideoId(videoInput);
        if (extractedId) {
            setVideoId(extractedId);
        } else if (videoInput.length === 11) {
            setVideoId(videoInput); // Assume it's already an ID
        } else {
             alert("Invalid YouTube URL or ID");
             return;
        }
        setVideoInput('');
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error(err);
        }
        setIsSearching(false);
    };

    const handleSelectSearchResult = (video) => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm("You have unsaved AD changes for this video! Loading a new video will retain them in memory but you haven't explicitly saved them to the Local Browser or Database. Continue?");
            if (!confirmLeave) return;
        }
        setVideoId(video.id);
        setVideoMetadata({
            videoId: video.id,
            title: video.title,
            author: video.channel
        });
        setSearchOpen(false);
    };


    // Save & Load Functionality
    const handleSaveLocally = () => {
        localStorage.setItem('audioDescriptions', JSON.stringify(ads));
        localStorage.setItem('diySteps', JSON.stringify(diySteps));
        localStorage.setItem('tbmaBlocks', JSON.stringify(tbmaBlocks));
        setHasUnsavedChanges(false);
        setToastMessage('Successfully Saved Data to Local Browser Storage!');
    }

    const handleSaveToDB = () => {
        // Simulated DB call
        setTimeout(() => {
             setHasUnsavedChanges(false);
             setToastMessage('Success: Simulated Save to Database Complete! (Placeholder functionality)');
        }, 500);
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedAds = JSON.parse(event.target.result);
                if (Array.isArray(importedAds)) {
                    // Filter matching ADs from the imported list for this video to prevent dupes mostly
                    // Or ask user if they want to merge. Simple merge for now:
                    const mergedAds = [...ads, ...importedAds].sort((a,b) => a.time - b.time);
                    setAds(mergedAds);
                    setHasUnsavedChanges(true); // Must manually save them after import
                    setToastMessage(`Successfully imported ${importedAds.length} descriptions! Please review and save.`);
                }
            } catch (err) {
                alert("Invalid JSON file uploaded.");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    }


    const onReady = (event) => {
        setPlayer(event.target);
        setDuration(event.target.getDuration());
        
        // Extract metadata
        const data = event.target.getVideoData();
        if (data && data.video_id) {
             setVideoMetadata(prev => {
                 // Prevent overwriting rich metadata injected from the Search UI with empty onReady data
                 if (prev && prev.videoId === data.video_id && prev.author !== 'Unknown Author') {
                     return prev;
                 }
                 return {
                     videoId: data.video_id,
                     title: data.title || 'Unknown Title',
                     author: data.author ? data.author : 'Unknown Author'
                 };
             });
        }
    };

    const onError = (event) => {
        // Error 150/101 means "Playback on other websites has been disabled by the video owner."
        if (event.data === 150 || event.data === 101) {
            alert('The video owner has disabled embedding for this video. Searching YouTube for alternatives...');
            if (videoMetadata?.title || videoInput) {
                 setSearchQuery(videoMetadata?.title || videoInput);
                 setSearchOpen(true);
                 setTimeout(() => handleSearch(), 500); // Auto-trigger search
            }
        }
    }

    const onStateChange = (event) => {
        setIsPlaying(event.data === 1);
        
        if (event.data === 1 && player) {
             const time = player.getCurrentTime();
             const currentHistory = new Set(playedAdsRef.current);
             for (let adId of currentHistory) {
                 const adInfo = ads.find(a => a.id === adId);
                 if (adInfo && adInfo.time >= time) {
                     currentHistory.delete(adId);
                 }
             }
             playedAdsRef.current = currentHistory;
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
            id: Date.now().toString(),
            videoId: videoId,
            videoTitle: videoMetadata?.title || 'Unknown Title',
            videoAuthor: videoMetadata?.author || 'Unknown Author',
            time: parseFloat(newAdTime), 
            text: newAdText,
            mode: newAdMode,
            voice: newAdVoice || selectedVoice,
            rate: newAdRate || speechRate,
            votes: 0 // Default to 0 votes for new ADs
        };

        const updatedAds = [...ads, newAd].sort((a, b) => a.time - b.time); 
        setAds(updatedAds);
        setHasUnsavedChanges(true); // Flag that user has added a new AD that isn't saved yet
        
        setNewAdText('');
    };

    const handleDeleteAd = (id) => {
        const updatedAds = ads.filter(ad => ad.id !== id);
        setAds(updatedAds);
        setHasUnsavedChanges(true);
    };

    const handleAddDiyStep = () => {
        if (newStepStart >= newStepEnd) {
             alert("End time must be greater than start time.");
             return;
        }

        const newStep = {
             id: Date.now().toString(),
             videoId: videoId,
             startTime: parseFloat(newStepStart),
             endTime: parseFloat(newStepEnd),
             text: newStepAd,
             voice: newAdVoice || selectedVoice,
             rate: newAdRate || speechRate
        };

        const updatedSteps = [...diySteps, newStep].sort((a,b) => a.startTime - b.startTime);
        setDiySteps(updatedSteps);
        setHasUnsavedChanges(true);
        setNewStepAd('');
    };

    const handleDeleteDiyStep = (id) => {
         const updatedSteps = diySteps.filter(s => s.id !== id);
         setDiySteps(updatedSteps);
         setHasUnsavedChanges(true);
    };

    const handleVoteProcess = (id, direction) => {
        // Mock voting system locally - in a real DB this would ping a server
        const updatedAds = ads.map(ad => {
             if (ad.id === id) {
                 return { ...ad, votes: (ad.votes || 0) + (direction === 'up' ? 1 : -1) };
             }
             return ad;
        });
        // Optionally resort by time if needed, but they should still be sorted
        setAds(updatedAds);
        setHasUnsavedChanges(true);
    };

    const formatTime = (seconds) => {
        const d = new Date(seconds * 1000);
        return d.toISOString().substr(14, 5); // Format mm:ss
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
    const currentVideoAds = ads.filter(ad => ad.videoId === videoId);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
             <Typography variant="h4" gutterBottom>Audio Description Player</Typography>
            
            <style>{`
                .youtube-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                .youtube-container iframe { width: 100% !important; height: 100% !important; }
            `}</style>
            
            <Paper style={{ padding: '15px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
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

                <div style={{ display: 'flex', alignItems: 'center' }}>
                     <Typography variant="h6" style={{ marginRight: '15px', minWidth: '150px' }}>Load Video:</Typography>
                 <TextField 
                     placeholder="Paste YouTube URL or Video ID..." 
                     variant="outlined"
                     size="small"
                     fullWidth
                     value={videoInput}
                     onChange={(e) => setVideoInput(e.target.value)}
                     style={{ marginRight: '15px' }}
                     inputProps={{ 'aria-label': 'YouTube URL or Video ID' }}
                 />
                 <Button variant="contained" color="primary" onClick={handleLoadVideo} style={{ marginRight: '10px' }}>
                     Load
                 </Button>
                 <Button variant="outlined" color="primary" startIcon={<SearchIcon />} onClick={() => setSearchOpen(true)}>
                     Search
                 </Button>
                </div>
            </Paper>
            
            <Grid container spacing={4}>
                {/* Video Column */}
                <Grid item xs={12} md={appMode === 'player' ? 12 : 7}>
                    <div style={{ position: 'relative', paddingTop: appMode === 'player' ? '45%' : '56.25%', width: '100%', backgroundColor: '#000', marginBottom: '15px' }}>
                        <YouTube
                            key={videoId} 
                            videoId={videoId}
                            onReady={onReady}
                            onError={onError}
                            onStateChange={onStateChange}
                            opts={{ playerVars: { controls: 1 } }}
                            className="youtube-container"
                        />
                    </div>

                    {/* PLAYER MODE OVERLAY / CAPTIONS */}
                    {appMode === 'player' && (
                        <div style={{ textAlign: 'center', marginTop: '20px', minHeight: '80px' }}>
                            {activeCaption && (
                                <Paper style={{ display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.8)', padding: '15px 30px', borderRadius: '8px' }}>
                                    <Typography variant="h5" style={{ color: '#fff' }}>
                                        {activeCaption}
                                    </Typography>
                                </Paper>
                            )}
                            <div style={{ marginTop: '10px' }}>
                                <Typography variant="caption" style={{ color: isListening ? "#4caf50" : "#9e9e9e", fontWeight: 'bold' }}>
                                    {isListening ? "🎙️ Voice Control Active (Try: 'Next Step', 'Pause', 'Play')" : "🎙️ Voice Control disabled or not supported"}
                                </Typography>
                            </div>
                        </div>
                    )}

                    {appMode !== 'player' && videoMetadata && (
                        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div>
                                <Typography variant="subtitle1"><strong>Title:</strong> {videoMetadata.title}</Typography>
                                <Typography variant="body2" color="textSecondary"><strong>Author:</strong> {videoMetadata.author} • <strong>ID:</strong> {videoMetadata.videoId}</Typography>
                             </div>
                             
                             {/* Mock DB Interaction & External Importing Tools */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 <input 
                                     type="file" 
                                     accept="application/json" 
                                     style={{ display: 'none' }} 
                                     ref={fileUploadRef}
                                     onChange={handleFileUpload}
                                 />
                                 <Button 
                                    variant="outlined" 
                                    color="default" 
                                    size="small"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={() => fileUploadRef.current.click()}
                                >
                                    Import Saved ADs from File
                                </Button>
                                
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                      <Button 
                                         variant="contained" 
                                         size="small"
                                         style={{ backgroundColor: hasUnsavedChanges ? '#e65100' : '#4caf50', color: '#fff', flex: 1 }}
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
                {appMode !== 'player' && (
                <Grid item xs={12} md={5}>

                    {appMode === 'ad_editor' && (
                    <Paper style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <Typography variant="h6" gutterBottom>Add Description</Typography>
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
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <TextField 
                                label="Timestamp (s)"
                                type="number"
                                step="0.1"
                                value={newAdTime}
                                onChange={(e) => setNewAdTime(parseFloat(e.target.value))}
                                style={{ marginRight: '10px', width: '120px' }}
                            />
                            <Button variant="outlined" size="small" onClick={() => handleCaptureTime(setNewAdTime)}>
                                Capture Time
                            </Button>
                        </div>

                        <FormControl fullWidth style={{ marginBottom: '15px' }}>
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
                            style={{ marginBottom: '15px' }}
                        />

                        {/* Per AD TTS Controls inside Authoring Block */}
                        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                             <Typography variant="subtitle2" gutterBottom>Description Voice Settings</Typography>
                             <FormControl fullWidth style={{ marginBottom: '15px' }}>
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
                            
                            <Typography variant="caption">Speech Rate: {newAdRate || speechRate}</Typography>
                            <Slider
                                value={newAdRate || speechRate}
                                min={0.5}
                                max={2}
                                step={0.1}
                                onChange={(e, val) => setNewAdRate(val)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
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

                    {appMode === 'diy_editor' && (
                    <Paper style={{ padding: '20px' }}>
                        <Typography variant="h6" gutterBottom>Add DIY Step</Typography>
                        <Typography variant="body2" color="textSecondary" style={{ marginBottom: '15px' }}>
                            Define a section of the video to loop during hands-free DIY playback.
                        </Typography>
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <TextField 
                                label="Start Time (s)"
                                type="number"
                                step="0.1"
                                value={newStepStart}
                                onChange={(e) => setNewStepStart(parseFloat(e.target.value))}
                                style={{ marginRight: '10px', flex: 1 }}
                            />
                            <Button variant="outlined" size="small" onClick={() => handleCaptureTime(setNewStepStart)}>Current</Button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <TextField 
                                label="End Time (s)"
                                type="number"
                                step="0.1"
                                value={newStepEnd}
                                onChange={(e) => setNewStepEnd(parseFloat(e.target.value))}
                                style={{ marginRight: '10px', flex: 1 }}
                            />
                            <Button variant="outlined" size="small" onClick={() => handleCaptureTime(setNewStepEnd)}>Current</Button>
                        </div>

                        <TextField
                            label="Optional Step Description/Context"
                            multiline
                            rows={2}
                            variant="outlined"
                            fullWidth
                            value={newStepAd}
                            onChange={(e) => setNewStepAd(e.target.value)}
                            style={{ marginBottom: '15px' }}
                        />

                        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                             <Typography variant="subtitle2" gutterBottom>Voice Settings</Typography>
                             <FormControl fullWidth style={{ marginBottom: '10px' }}>
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
            {appMode === 'ad_editor' && (
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
            {appMode === 'diy_editor' && (
                <DiyTimeline
                    diySteps={diySteps}
                    videoId={videoId}
                    formatTime={formatTime}
                    onDeleteDiyStep={handleDeleteDiyStep}
                />
            )}

            {/* TBMA Editor */}
            {appMode === 'tbma_editor' && (
                <TbmaEditor
                    videoId={videoId}
                    player={player}
                    currentTime={currentTime}
                    tbmaBlocks={tbmaBlocks}
                    setTbmaBlocks={setTbmaBlocks}
                    voices={voices}
                    selectedVoice={selectedVoice}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                    formatTime={formatTime}
                    onPlayAd={playAd}
                />
            )}

            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={!!toastMessage}
                autoHideDuration={4000}
                onClose={() => setToastMessage('')}
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

        </div>
    );
};

export default VideoPlayer;

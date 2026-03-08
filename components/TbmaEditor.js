import React, { useState } from 'react';
import { Typography, Button, TextField, Paper, CircularProgress, IconButton, Grid, Select, MenuItem, FormControl, InputLabel, Divider } from "@material-ui/core";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';

const TbmaEditor = ({ 
    videoId, 
    player, 
    currentTime, 
    tbmaBlocks, 
    setTbmaBlocks, 
    voices, 
    selectedVoice, 
    setHasUnsavedChanges, 
    formatTime,
    onPlayAd
}) => {
    const [isFetching, setIsFetching] = useState(false);
    const [manualPaste, setManualPaste] = useState('');
    const [importError, setImportError] = useState('');

    const parseManualVtt = (text) => {
        // Very basic WebVTT parser to get block text and start times
        const lines = text.split('\n');
        const blocks = [];
        let currentBlock = null;

        const timeRegex = /(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})/;

        for (let line of lines) {
            line = line.trim();
            if (!line || line === 'WEBVTT' || line === 'Kind: captions' || line.startsWith('Language:')) continue;
            
            if (line.includes('-->')) {
                // Time line
                const parts = line.split('-->');
                const startStr = parts[0].trim();
                const match = startStr.match(timeRegex);
                if (match) {
                    const hours = match[1] ? parseInt(match[1].replace(':', '')) : 0;
                    const mins = parseInt(match[2]);
                    const secs = parseInt(match[3]);
                    const ms = parseInt(match[4]);
                    const totalSeconds = (hours * 3600) + (mins * 60) + secs + (ms / 1000);
                    currentBlock = { type: 'dialog', time: totalSeconds, text: '' };
                }
            } else if (currentBlock) {
                // Text line formatting (removing tags)
                currentBlock.text += line.replace(/<[^>]+>/g, '') + ' ';
                // If it ends with period or we assume it's the end of a block
                if (line) {
                     blocks.push({...currentBlock, text: currentBlock.text.trim(), id: Date.now() + Math.random()});
                     currentBlock = null;
                }
            }
        }
        return blocks;
    };

    const handleAutoFetchCaptions = async () => {
        setIsFetching(true);
        setImportError('');
        try {
            const res = await fetch(`/api/captions?videoId=${videoId}`);
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            
            if (data.transcript && data.transcript.length > 0) {
                const newBlocks = data.transcript.map(t => ({
                    id: Date.now() + Math.random(),
                    type: 'dialog',
                    time: t.offset / 1000,
                    text: t.text
                }));
                setTbmaBlocks(newBlocks);
                setHasUnsavedChanges(true);
            } else {
                setImportError("No captions found for this video.");
            }
        } catch (err) {
            setImportError(err.message);
        }
        setIsFetching(false);
    };

    const handleManualImport = () => {
        if (!manualPaste.trim()) return;
        const blocks = parseManualVtt(manualPaste);
        if (blocks.length > 0) {
            setTbmaBlocks(blocks);
            setHasUnsavedChanges(true);
            setManualPaste('');
            setImportError('');
        } else {
            setImportError("Could not parse VTT format. Please ensure it is a valid format.");
        }
    };

    const addActionBlock = (index) => {
        const newBlocks = [...tbmaBlocks];
        // Insert an action block immediately after the selected index
        const insertTime = tbmaBlocks[index].time; // Adopt the time of the previous dialog
        newBlocks.splice(index + 1, 0, {
            id: Date.now() + Math.random(),
            type: 'action',
            time: insertTime,
            text: '',
            voice: selectedVoice,
            rate: 1,
            mode: 'pause'
        });
        setTbmaBlocks(newBlocks);
        setHasUnsavedChanges(true);
    };

    const updateActionBlock = (id, field, value) => {
        setTbmaBlocks(blocks => blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
        setHasUnsavedChanges(true);
    };

    const deleteBlock = (id) => {
        setTbmaBlocks(blocks => blocks.filter(b => b.id !== id));
        setHasUnsavedChanges(true);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <Typography variant="h5" gutterBottom>TBMA Script Editor</Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: '20px' }}>
                Create a Time-Based Media Alternative by importing YouTube's Closed Captions as dialog, then injecting descriptive "Action" blocks in between them.
            </Typography>

            {tbmaBlocks.length === 0 ? (
                <Paper style={{ padding: '20px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
                    <Typography variant="h6" gutterBottom>1. Import Dialog (Closed Captions)</Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleAutoFetchCaptions}
                        disabled={isFetching || !videoId}
                        style={{ marginBottom: '15px' }}
                    >
                        {isFetching ? <CircularProgress size={24} color="inherit" /> : 'Attempt Auto-Fetch Captions'}
                    </Button>
                    
                    {importError && <Typography color="error" style={{ marginBottom: '15px' }}>🚨 {importError}</Typography>}

                    <Divider style={{ margin: '15px 0' }} />
                    
                    <Typography variant="subtitle2" gutterBottom>Fallback: Manual `.vtt` Paste</Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        variant="outlined"
                        placeholder={'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world!\n...'}
                        value={manualPaste}
                        onChange={(e) => setManualPaste(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <Button variant="outlined" color="primary" onClick={handleManualImport} disabled={!manualPaste.trim()}>
                        Import Pasted VTT
                    </Button>
                </Paper>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <Typography variant="h6">Script Timeline</Typography>
                        <Button color="secondary" size="small" onClick={() => { setTbmaBlocks([]); setHasUnsavedChanges(true); }}>Clear All</Button>
                    </div>

                    {tbmaBlocks.map((block, index) => (
                        <div key={block.id} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Paper style={{ 
                                padding: '15px', 
                                width: '100%', 
                                borderLeft: block.type === 'action' ? '5px solid #e91e63' : '5px solid #2196f3',
                                backgroundColor: block.type === 'action' ? '#fff0f4' : '#ffffff' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: '80px', paddingTop: '5px' }}>
                                        <Typography variant="caption" style={{ fontWeight: 'bold', color: block.type === 'action' ? '#e91e63' : '#2196f3' }}>
                                            {formatTime(block.time)}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="textSecondary">
                                            {block.type.toUpperCase()}
                                        </Typography>
                                    </div>
                                    
                                    <div style={{ flexGrow: 1, padding: '0 15px' }}>
                                        {block.type === 'dialog' ? (
                                            <Typography variant="body1">"{block.text}"</Typography>
                                        ) : (
                                            <div>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    variant="outlined"
                                                    size="small"
                                                    placeholder="Describe the unseen action..."
                                                    value={block.text}
                                                    onChange={(e) => updateActionBlock(block.id, 'text', e.target.value)}
                                                    style={{ marginBottom: '10px' }}
                                                    inputProps={{ 'aria-label': 'Action Block Text' }}
                                                />
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                     <FormControl size="small" style={{ minWidth: '120px' }}>
                                                        <Select
                                                            value={block.voice}
                                                            onChange={(e) => updateActionBlock(block.id, 'voice', e.target.value)}
                                                            inputProps={{ 'aria-label': 'Action Voice' }}
                                                        >
                                                            {voices.map((v, idx) => (
                                                                <MenuItem key={idx} value={v.name}>{v.name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined"
                                                        onClick={() => updateActionBlock(block.id, 'mode', block.mode === 'pause' ? 'duck' : 'pause')}
                                                    >
                                                        {block.mode}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {block.type === 'action' && (
                                            <IconButton size="small" color="primary" onClick={() => onPlayAd(block)} aria-label="Preview Action">
                                                <PlayArrowIcon />
                                            </IconButton>
                                        )}
                                        <IconButton size="small" color="secondary" onClick={() => deleteBlock(block.id)} aria-label="Delete Block">
                                            <DeleteIcon />
                                        </IconButton>
                                    </div>
                                </div>
                            </Paper>
                            
                            {/* Insert Action Button between blocks */}
                            <IconButton 
                                size="small" 
                                style={{ margin: '5px 0', backgroundColor: '#e0e0e0' }}
                                onClick={() => addActionBlock(index)}
                                aria-label="Add Action Here"
                                title="Insert Action Below"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TbmaEditor;

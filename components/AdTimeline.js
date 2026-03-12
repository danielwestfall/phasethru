import React from 'react';
import { Typography, Button, Grid, Paper, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Box, Tooltip } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';

const AdTimeline = ({ 
    currentVideoAds, 
    hasUnsavedChanges, 
    onPlayVideoWithAds, 
    onVote, 
    formatTime, 
    onPlayAd, 
    onDeleteAd,
    onUpdateAd,
    voices,
    estimateDuration
}) => {
    const [editingId, setEditingId] = React.useState(null);
    const [editForm, setEditForm] = React.useState({});

    const handleStartEdit = (ad) => {
        setEditingId(ad.id);
        setEditForm({ ...ad });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        // Recalculate duration if text or rate changed
        const newDuration = estimateDuration(editForm.text, editForm.rate);
        const updatedAd = { ...editForm, duration: newDuration };
        onUpdateAd(updatedAd);
        setEditingId(null);
    };

    const handleFormChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '15px' }}>
                <Typography variant="h5" style={{ flexGrow: 1, color: "#212121", fontWeight: 700 }}>
                     Saved Descriptions ({currentVideoAds.length}) {hasUnsavedChanges && <span style={{ color: '#bf360c', fontSize: '0.6em', verticalAlign: 'middle' }}>(Unsaved Edits)</span>}
                </Typography>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<PlayArrowIcon />}
                    onClick={onPlayVideoWithAds}
                >
                    Play Video with ADs
                </Button>
            </div>
            
            {currentVideoAds.length === 0 ? (
                <Typography sx={{ color: "#424242", fontStyle: "italic", mt: 2 }}>No descriptions added for this video yet.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {currentVideoAds.map((ad, index) => {
                        const nextAd = currentVideoAds[index + 1];
                        const duration = ad.duration || 0;
                        const effectiveVideoDuration = ad.mode === 'fluid' ? duration * (ad.videoRate || 1) : duration;
                        const isOverlapping = nextAd && (
                            (ad.mode !== 'pause' && ad.time + effectiveVideoDuration > nextAd.time) || 
                            (ad.time === nextAd.time)
                        );
                        const isEditing = editingId === ad.id;

                        return (
                        <Grid item xs={12} key={ad.id}>
                            <Paper 
                                style={{ 
                                    padding: '15px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    borderLeft: isOverlapping ? '5px solid #ff9800' : 'none',
                                    backgroundColor: isOverlapping ? '#fffde7' : '#fff'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    {/* Upvote / Downvote Section */}
                                    {!isEditing && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '15px', paddingRight: '15px', borderRight: '1px solid #ccc' }}>
                                            <IconButton size="small" onClick={() => onVote(ad.id, 'up')} color="primary" aria-label="Upvote Description">
                                                <ThumbUpIcon fontSize="small" />
                                            </IconButton>
                                            <Typography variant="body2" style={{ fontWeight: 'bold' }}>{ad.votes || 0}</Typography>
                                            <IconButton size="small" onClick={() => onVote(ad.id, 'down')} color="secondary" aria-label="Downvote Description">
                                                <ThumbDownIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    )}
                                    
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexGrow: 1, gap: '15px', alignItems: 'flex-start' }}>
                                            <TextField
                                                label="Time (s)"
                                                type="number"
                                                size="small"
                                                value={editForm.time}
                                                onChange={(e) => handleFormChange('time', parseFloat(e.target.value))}
                                                style={{ width: '100px' }}
                                            />
                                            <TextField
                                                label="Description Text"
                                                multiline
                                                fullWidth
                                                size="small"
                                                value={editForm.text}
                                                onChange={(e) => handleFormChange('text', e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Typography variant="subtitle1" style={{ minWidth: '80px', fontWeight: 'bold', color: "#212121" }}>
                                                {formatTime(ad.time)}
                                            </Typography>
                                            <Typography style={{ marginLeft: '15px', flexGrow: 1, color: "#424242" }}>
                                                {ad.text}
                                            </Typography>
                                        </>
                                    )}

                                    {!isEditing && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {isOverlapping && (
                                                <Tooltip title={`Warning: Overlaps with next description! (Consumes ${effectiveVideoDuration.toFixed(1)}s of video time)`}>
                                                    <WarningAmberIcon style={{ color: '#ff9800' }} />
                                                </Tooltip>
                                            )}
                                            <Box style={{ display: 'flex', alignItems: 'center', color: '#757575', marginRight: '10px' }}>
                                                <TimerIcon fontSize="small" style={{ marginRight: '4px' }} />
                                                <Typography variant="caption">{duration.toFixed(1)}s</Typography>
                                            </Box>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {isEditing ? (
                                            <>
                                                <IconButton onClick={handleSaveEdit} color="primary" title="Save Changes">
                                                    <SaveIcon />
                                                </IconButton>
                                                <IconButton onClick={handleCancelEdit} color="secondary" title="Cancel">
                                                    <CancelIcon />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                <IconButton onClick={() => handleStartEdit(ad)} color="primary" title="Edit AD">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => onPlayAd(ad)} color="primary" title="Preview this AD" aria-label="Preview Description">
                                                    <PlayArrowIcon />
                                                </IconButton>
                                                <IconButton onClick={() => onDeleteAd(ad.id)} color="secondary" title="Delete" aria-label="Delete Description">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px', paddingLeft: '0', alignItems: 'center' }}>
                                        <FormControl size="small" style={{ minWidth: '150px' }}>
                                            <InputLabel>Voice</InputLabel>
                                            <Select
                                                value={editForm.voice}
                                                label="Voice"
                                                onChange={(e) => handleFormChange('voice', e.target.value)}
                                            >
                                                {voices.map((v, i) => (
                                                    <MenuItem key={i} value={v.name}>{v.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                                            <Typography variant="caption">Rate: {editForm.rate}x</Typography>
                                            <input 
                                                type="range" 
                                                min={0.5} 
                                                max={4} 
                                                step={0.1}
                                                value={editForm.rate}
                                                onChange={(e) => handleFormChange('rate', parseFloat(e.target.value))}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <FormControl size="small" style={{ minWidth: '100px' }}>
                                            <InputLabel>Mode</InputLabel>
                                            <Select
                                                value={editForm.mode}
                                                label="Mode"
                                                onChange={(e) => handleFormChange('mode', e.target.value)}
                                            >
                                                <MenuItem value="pause">Pause</MenuItem>
                                                <MenuItem value="duck">Duck</MenuItem>
                                                <MenuItem value="fluid">Fluid</MenuItem>
                                            </Select>
                                        </FormControl>

                                        {editForm.mode === 'fluid' && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                                                    <Typography variant="caption">Video Rate: {editForm.videoRate || 1}x</Typography>
                                                    <input 
                                                        type="range" 
                                                        min={0.25} 
                                                        max={2} 
                                                        step={0.05}
                                                        value={editForm.videoRate || 1}
                                                        onChange={(e) => handleFormChange('videoRate', parseFloat(e.target.value))}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                                                    <Typography variant="caption">Vid Vol: {editForm.videoVolume !== undefined ? editForm.videoVolume : 50}%</Typography>
                                                    <input 
                                                        type="range" 
                                                        min={0} 
                                                        max={100} 
                                                        step={1}
                                                        value={editForm.videoVolume !== undefined ? editForm.videoVolume : 50}
                                                        onChange={(e) => handleFormChange('videoVolume', parseInt(e.target.value))}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {!isEditing && ad.voice && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px', paddingLeft: '95px' }}>
                                        <Typography variant="caption" style={{ color: '#424242', fontStyle: 'italic', fontWeight: 500 }}>
                                            {ad.voice} ({ad.rate}x)
                                        </Typography>
                                        <Typography variant="caption" style={{ backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>
                                            {ad.mode.toUpperCase()} {ad.mode === 'fluid' && `(${ad.videoRate || 1}x Speed, ${ad.videoVolume !== undefined ? ad.videoVolume : 50}% Vol)`}
                                        </Typography>
                                    </div>
                                )}
                            </Paper>
                        </Grid>
                        );
                    })}
                </Grid>
            )}
        </div>
    );
};

export default React.memo(AdTimeline);

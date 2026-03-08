import React from 'react';
import { Typography, Button, Grid, Paper, IconButton } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const AdTimeline = ({ 
    currentVideoAds, 
    hasUnsavedChanges, 
    onPlayVideoWithAds, 
    onVote, 
    formatTime, 
    onPlayAd, 
    onDeleteAd 
}) => {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '15px' }}>
                <Typography variant="h5" style={{ flexGrow: 1 }}>
                     Saved Descriptions ({currentVideoAds.length}) {hasUnsavedChanges && <span style={{ color: '#e65100', fontSize: '0.6em', verticalAlign: 'middle' }}>(Unsaved Edits)</span>}
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
                <Typography color="textSecondary">No descriptions added for this video yet.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {currentVideoAds.map((ad, index) => (
                        <Grid item xs={12} key={ad.id}>
                            <Paper style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                                {/* Upvote / Downvote Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '15px', paddingRight: '15px', borderRight: '1px solid #ccc' }}>
                                     <IconButton size="small" onClick={() => onVote(ad.id, 'up')} color="primary" aria-label="Upvote Description">
                                        <ThumbUpIcon fontSize="small" />
                                     </IconButton>
                                     <Typography variant="body2" style={{ fontWeight: 'bold' }}>{ad.votes || 0}</Typography>
                                     <IconButton size="small" onClick={() => onVote(ad.id, 'down')} color="secondary" aria-label="Downvote Description">
                                        <ThumbDownIcon fontSize="small" />
                                     </IconButton>
                                </div>
                                
                                <Typography variant="subtitle1" style={{ minWidth: '80px', fontWeight: 'bold' }}>
                                    {formatTime(ad.time)}
                                </Typography>
                                <Typography style={{ marginLeft: '15px', flexGrow: 1 }}>
                                    {ad.text}
                                </Typography>
                                {ad.voice && (
                                     <Typography variant="caption" style={{ color: '#666', marginRight: '15px', fontStyle: 'italic' }}>
                                         {ad.voice} ({ad.rate}x)
                                     </Typography>
                                )}
                                <Typography variant="caption" style={{ backgroundColor: '#e0e0e0', padding: '4px 8px', borderRadius: '4px', marginRight: '15px' }}>
                                    {ad.mode.toUpperCase()}
                                </Typography>
                                <IconButton onClick={() => onPlayAd(ad)} color="primary" title="Preview this AD" aria-label="Preview Description">
                                    <PlayArrowIcon />
                                </IconButton>
                                <IconButton onClick={() => onDeleteAd(ad.id)} color="secondary" title="Delete" aria-label="Delete Description">
                                    <DeleteIcon />
                                </IconButton>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </div>
    );
};

export default React.memo(AdTimeline);

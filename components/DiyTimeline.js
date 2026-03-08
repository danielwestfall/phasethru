import React from 'react';
import { Typography, Grid, Paper, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

const DiyTimeline = ({ diySteps, videoId, formatTime, onDeleteDiyStep }) => {
    const videoSteps = diySteps.filter(s => s.videoId === videoId);
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '15px' }}>
                <Typography variant="h5" style={{ flexGrow: 1 }}>
                     Saved DIY Steps ({videoSteps.length})
                </Typography>
            </div>
            
            {videoSteps.length === 0 ? (
                <Typography color="textSecondary">No DIY steps added for this video yet.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {videoSteps.map((step, index) => (
                        <Grid item xs={12} key={step.id}>
                            <Paper style={{ padding: '15px', display: 'flex', alignItems: 'center' }}>
                                
                                <Typography variant="subtitle1" style={{ minWidth: '130px', fontWeight: 'bold' }}>
                                    {formatTime(step.startTime)} - {formatTime(step.endTime)}
                                </Typography>

                                <Typography style={{ marginLeft: '15px', flexGrow: 1 }}>
                                    {step.text || "[No Context Text]"}
                                </Typography>

                                <IconButton onClick={() => onDeleteDiyStep(step.id)} color="secondary" title="Delete Step" aria-label="Delete DIY Step">
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

export default DiyTimeline;

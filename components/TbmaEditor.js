import React, { useState } from "react";
import {
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";

const TbmaEditor = ({
  videoId,
  tbmaBlocks,
  setTbmaBlocks,
  voices,
  selectedVoice,
  setHasUnsavedChanges,
  formatTime,
  onPlayAd,
  videoTitle,
}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [manualPaste, setManualPaste] = useState("");
  const [importError, setImportError] = useState("");

  const parseManualVtt = (text) => {
    // Very basic WebVTT parser to get block text and start times
    const lines = text.split("\n");
    const blocks = [];
    let currentBlock = null;

    const timeRegex = /(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})/;

    for (let line of lines) {
      line = line.trim();
      if (
        !line ||
        line === "WEBVTT" ||
        line === "Kind: captions" ||
        line.startsWith("Language:")
      )
        continue;

      if (line.includes("-->")) {
        // Time line
        const parts = line.split("-->");
        const startStr = parts[0].trim();
        const match = startStr.match(timeRegex);
        if (match) {
          const hours = match[1] ? parseInt(match[1].replace(":", "")) : 0;
          const mins = parseInt(match[2]);
          const secs = parseInt(match[3]);
          const ms = parseInt(match[4]);
          const totalSeconds = hours * 3600 + mins * 60 + secs + ms / 1000;
          currentBlock = { type: "dialog", time: totalSeconds, text: "" };
        }
      } else if (currentBlock) {
        // Text line formatting (removing tags)
        currentBlock.text += line.replace(/<[^>]+>/g, "") + " ";
        // If it ends with period or we assume it's the end of a block
        if (line) {
          blocks.push({
            ...currentBlock,
            text: currentBlock.text.trim(),
            id: crypto.randomUUID(),
          });
          currentBlock = null;
        }
      }
    }
    return blocks;
  };

  const handleAutoFetchCaptions = async () => {
    setIsFetching(true);
    setImportError("");
    try {
      const res = await fetch(`/api/captions?videoId=${videoId}`);

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          `Server returned a non-JSON error (Status ${res.status}): ${text.substring(0, 50)}...`,
        );
      }

      if (!res.ok) throw new Error(data.error || "Failed to fetch captions");

      if (data.transcript && data.transcript.length > 0) {
        const newBlocks = data.transcript.map((t) => ({
          id: crypto.randomUUID(),
          type: "dialog",
          time: t.offset / 1000,
          text: t.text,
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
      setManualPaste("");
      setImportError("");
    } else {
      setImportError(
        "Could not parse VTT format. Please ensure it is a valid format.",
      );
    }
  };

  const addActionBlock = (index) => {
    const newBlocks = [...tbmaBlocks];
    // Insert an action block immediately after the selected index
    let insertTime = tbmaBlocks[index].time; // Adopt the time of the previous dialog
    if (insertTime < 0.5) insertTime = 0.5;

    newBlocks.splice(index + 1, 0, {
      id: crypto.randomUUID(),
      type: "action",
      time: insertTime,
      text: "",
      voice: selectedVoice,
      rate: 1,
      mode: "pause",
    });
    setTbmaBlocks(newBlocks);
    setHasUnsavedChanges(true);
  };

  const updateActionBlock = (id, field, value) => {
    setTbmaBlocks((blocks) =>
      blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
    setHasUnsavedChanges(true);
  };

  const deleteBlock = (id) => {
    setTbmaBlocks((blocks) => blocks.filter((b) => b.id !== id));
    setHasUnsavedChanges(true);
  };

  const generateTextTbma = () => {
    let content = `EquiViewer TBMA Script\nTitle: ${videoTitle || "Unknown Video"}\n`;
    content += `Video ID: ${videoId}\n`;
    content += `Exported: ${new Date().toLocaleString()}\n\n`;
    content += `=================================================\n\n`;

    tbmaBlocks.forEach((block) => {
      const timeStr = formatTime(block.time);
      if (block.type === "action") {
        content += `[${timeStr}] ACTION [${block.voice}]: ${block.text}\n\n`;
      } else {
        content += `[${timeStr}] DIALOG: ${block.text}\n\n`;
      }
    });

    return content;
  };

  const handleDownloadTxt = () => {
    const textContent = generateTextTbma();
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TBMA_${videoTitle || "Script"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintTbma = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the script.");
      return;
    }

    let htmlContent = `
      <html>
        <head>
          <title>TBMA Script - ${videoTitle}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { font-size: 24px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .meta { color: #444; font-size: 14px; margin-bottom: 30px; }
            .block { margin-bottom: 15px; }
            .time { font-weight: bold; font-family: monospace; display: inline-block; width: 80px; }
            .action { color: #d81b60; }
            .dialog { color: #1976d2; }
            .action-label, .dialog-label { font-size: 12px; font-weight: bold; background: #eee; padding: 2px 6px; border-radius: 4px; margin-right: 10px; }
            .action-label { background: #fce4ec; color: #c2185b; }
            .dialog-label { background: #e3f2fd; color: #1565c0; }
            @media print {
              body { font-size: 12pt; }
              .block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>EquiViewer TBMA Script</h1>
          <div class="meta">
            <strong>Video Title:</strong> ${videoTitle || "Unknown Video"}<br/>
            <strong>Video ID:</strong> ${videoId}<br/>
          </div>
    `;

    tbmaBlocks.forEach((block) => {
      const timeStr = formatTime(block.time);
      if (block.type === "action") {
        htmlContent += `
          <div class="block action">
            <span class="time">[${timeStr}]</span>
            <span class="action-label">ACTION</span>
            <span class="text"><strong>[${block.voice}]:</strong> ${block.text}</span>
          </div>`;
      } else {
        htmlContent += `
          <div class="block dialog">
            <span class="time">[${timeStr}]</span>
            <span class="dialog-label">DIALOG</span>
            <span class="text">"${block.text}"</span>
          </div>`;
      }
    });

    htmlContent += `
        </body>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <Typography variant="h5" gutterBottom style={{ color: "#212121", fontWeight: 700 }}>
        TBMA Script Editor
      </Typography>
      <Typography
        variant="body2"
        style={{ marginBottom: "20px", color: "#424242" }}
      >
        Create a Time-Based Media Alternative by importing YouTube&apos;s Closed
        Captions as dialog, then injecting descriptive &ldquo;Action&rdquo;
        blocks in between them.
      </Typography>

      {tbmaBlocks.length === 0 ? (
        <Paper
          style={{
            padding: "20px",
            marginBottom: "20px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="h6" gutterBottom style={{ color: "#212121" }}>
            1. Import Dialog (Closed Captions)
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAutoFetchCaptions}
            disabled={isFetching || !videoId}
            style={{ marginBottom: "15px" }}
          >
            {isFetching ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Attempt Auto-Fetch Captions"
            )}
          </Button>

          {importError && (
            <Typography color="error" style={{ marginBottom: "15px" }}>
              🚨 {importError}
            </Typography>
          )}

          <Divider style={{ margin: "15px 0" }} />

          <Typography variant="subtitle2" gutterBottom style={{ color: "#424242", fontWeight: 700 }}>
            Fallback: Manual `.vtt` Paste
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            placeholder={
              "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world!\n..."
            }
            value={manualPaste}
            onChange={(e) => setManualPaste(e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={handleManualImport}
            disabled={!manualPaste.trim()}
          >
            Import Pasted VTT
          </Button>
        </Paper>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
            }}
          >
            <Typography variant="h6" style={{ flexGrow: 1, color: "#212121" }}>
              Script Timeline
            </Typography>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTxt}
              >
                Download (.txt)
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrintTbma}
              >
                Print / Save PDF
              </Button>
              <Button
                color="secondary"
                size="small"
                variant="text"
                onClick={() => {
                  setTbmaBlocks([]);
                  setHasUnsavedChanges(true);
                }}
              >
                Clear All
              </Button>
            </div>
          </div>

          {tbmaBlocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                marginBottom: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Paper
                style={{
                  padding: "15px",
                  width: "100%",
                  borderLeft:
                    block.type === "action"
                      ? "5px solid #e91e63"
                      : "5px solid #2196f3",
                  backgroundColor:
                    block.type === "action" ? "#fff0f4" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ minWidth: "80px", paddingTop: "5px" }}>
                    <Typography
                      variant="caption"
                      style={{
                        fontWeight: "bold",
                        color: block.type === "action" ? "#e91e63" : "#2196f3",
                      }}
                    >
                      {formatTime(block.time)}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      style={{ color: "#424242", fontWeight: 500 }}
                    >
                      {block.type.toUpperCase()}
                    </Typography>
                  </div>

                  <div style={{ flexGrow: 1, padding: "0 15px" }}>
                    {block.type === "dialog" ? (
                      <Typography variant="body1">
                        &ldquo;{block.text}&rdquo;
                      </Typography>
                    ) : (
                      <div>
                        <TextField
                          fullWidth
                          multiline
                          variant="outlined"
                          size="small"
                          placeholder="Describe the unseen action..."
                          value={block.text}
                          onChange={(e) =>
                            updateActionBlock(block.id, "text", e.target.value)
                          }
                          style={{ marginBottom: "10px" }}
                          inputProps={{ "aria-label": "Action Block Text" }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <FormControl
                            size="small"
                            style={{ minWidth: "120px" }}
                          >
                            <Select
                              value={block.voice}
                              onChange={(e) =>
                                updateActionBlock(
                                  block.id,
                                  "voice",
                                  e.target.value,
                                )
                              }
                              inputProps={{ "aria-label": "Action Voice" }}
                            >
                              {voices.map((v, idx) => (
                                <MenuItem key={idx} value={v.name}>
                                  {v.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" style={{ minWidth: "100px" }}>
                            <Select
                              value={block.mode || "pause"}
                              onChange={(e) =>
                                updateActionBlock(block.id, "mode", e.target.value)
                              }
                              inputProps={{ "aria-label": "Action Mode" }}
                            >
                              <MenuItem value="pause">Pause</MenuItem>
                              <MenuItem value="duck">Duck</MenuItem>
                              <MenuItem value="fluid">Fluid</MenuItem>
                            </Select>
                          </FormControl>

                          <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
                            <Typography variant="caption" style={{ color: "#424242" }}>Speech Rate: {block.rate || 1}x</Typography>
                            <input 
                              type="range" 
                              min={0.5} 
                              max={4} 
                              step={0.1}
                              value={block.rate || 1}
                              onChange={(e) => updateActionBlock(block.id, "rate", parseFloat(e.target.value))}
                              style={{ width: "100%" }}
                            />
                          </div>

                          {block.mode === "fluid" && (
                            <>
                              <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
                                <Typography variant="caption" style={{ color: "#424242" }}>Video Rate: {block.videoRate || 1}x</Typography>
                                <input 
                                  type="range" 
                                  min={0.25} 
                                  max={2} 
                                  step={0.05}
                                  value={block.videoRate || 1}
                                  onChange={(e) => updateActionBlock(block.id, "videoRate", parseFloat(e.target.value))}
                                  style={{ width: "100%" }}
                                />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", width: "120px" }}>
                                <Typography variant="caption" style={{ color: "#424242" }}>Vid Vol: {block.videoVolume !== undefined ? block.videoVolume : 50}%</Typography>
                                <input 
                                  type="range" 
                                  min={0} 
                                  max={100} 
                                  step={1}
                                  value={block.videoVolume !== undefined ? block.videoVolume : 50}
                                  onChange={(e) => updateActionBlock(block.id, "videoVolume", parseInt(e.target.value))}
                                  style={{ width: "100%" }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {block.type === "action" && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onPlayAd(block)}
                        aria-label="Preview Action"
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => deleteBlock(block.id)}
                      aria-label="Delete Block"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
              </Paper>

              {/* Insert Action Button between blocks */}
              <IconButton
                size="small"
                style={{ margin: "5px 0", backgroundColor: "#e0e0e0" }}
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

export default React.memo(TbmaEditor);

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { supabase } from "../lib/supabase";

const LoginDialog = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // You must set this to the deployed URL eventually, or localhost for dev.
          // Vercel auto-sets NEXT_PUBLIC_VERCEL_URL if configured, but let's keep it robust.
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) throw error;
      setMessage("Check your email for the magic login link!");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(`${provider} login error:`, err);
      setError(err.message || `An error occurred during ${provider} login.`);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sign In to EquiViewer</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            Sign in with a Magic Link to save your created Audio Descriptions,
            DIY steps, and TBMA scripts under your profile.
          </Typography>

          <DialogActions sx={{ px: 0, pb: 0, flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
              >
                GitHub
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
              >
                Google
              </Button>
            </Box>

            <Divider sx={{ width: '100%', my: 1 }}>OR</Divider>

            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                variant="outlined"
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || Boolean(message)}
                sx={{ mb: 1 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading || !email || Boolean(message)}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Send Magic Link
              </Button>
            </Box>

            <Button onClick={onClose} disabled={loading} sx={{ mt: 1 }}>
              Cancel
            </Button>
          </DialogActions>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              By signing in, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Privacy Policy</a>.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(LoginDialog);

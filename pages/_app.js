import "../styles/globals.css";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import Footer from "../components/Footer";
import { useEffect } from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#c2185b", // Darkened from #e91e63 to meet 4.5:1 contrast ratio
    },
  },
  typography: {
    fontFamily: "'Atkinson Hyperlegible', sans-serif",
  },
});

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Mobile Web Speech API Sandbox Unlock
    // Fires an invisible, silent utterance on the very first user interaction
    const unlockAudio = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance("");
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}
      >
        <Component {...pageProps} />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default MyApp;

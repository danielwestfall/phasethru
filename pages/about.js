import React from "react";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";

const AboutPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, flex: 1 }}>
      <Head>
        <title>About - EquiViewer</title>
      </Head>
      
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        About EquiViewer
      </Typography>
      
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Bridging the gap in media accessibility and interactive learning.
        </Typography>
        <Typography variant="body1" paragraph mt={2}>
          EquiViewer empowers creators and users to inject custom audio contexts into existing YouTube videos without needing complex video editing software. Whether you are generating WCAG-compliant Audio Descriptions for the visually impaired or breaking down complex DIY videos into loopable, voice-controllable segments, EquiViewer provides the tools in one unified interface.
        </Typography>
        <Typography variant="body1" paragraph>
          Through its community-driven database, users can permanently save, share, discover, and vote on accessibility layers created by others for any YouTube video.
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
        About the Creator
      </Typography>

      <Card elevation={3} sx={{ mt: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Daniel Westfall
          </Typography>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Digital Accessibility Specialist (CPWA)
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Hi, I&apos;m Daniel. I am a Digital Accessibility Manager and CPWA certified professional specializing in WCAG compliance, accessibility auditing, and inclusive design. I have deep expertise in assistive technologies, accessible development, and accessibility training.
          </Typography>
          <Typography variant="body1" paragraph>
            My passion is building more inclusive and accessible experiences for everyone, across both the web and games. EquiViewer represents a step towards making visual media universally comprehensible.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<LanguageIcon />}
              href="https://codea11y.dev/"
              target="_blank"
              rel="noopener"
            >
              My Digital Workshop (Blog)
            </Button>
            <Button
              variant="outlined"
              startIcon={<LinkedInIcon />}
              href="https://www.linkedin.com/in/danielwestfall/"
              target="_blank"
              rel="noopener"
            >
              LinkedIn
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              href="https://github.com/danielwestfall"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </Button>
            <Button
              variant="outlined"
              startIcon={<TwitterIcon />}
              href="https://twitter.com/Dan_Westfall82"
              target="_blank"
              rel="noopener"
            >
              Twitter
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AboutPage;

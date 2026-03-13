import Head from 'next/head';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import Link from 'next/link';

export default function Terms() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Head>
        <title>Terms of Service - PhaseThru</title>
      </Head>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>Terms of Service</Typography>
        <Typography variant="body1" paragraph>
          Last Updated: March 2026
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>1. Acceptance of Terms</Typography>
        <Typography variant="body1" paragraph>
          By using PhaseThru, you agree to follow these terms. This application is an accessibility tool for enhancing YouTube content.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>2. User Contributions</Typography>
        <Typography variant="body1" paragraph>
          You are responsible for the content you upload (Audio Descriptions, Scripts). Do not upload spam, offensive content, or material that violates intellectual property rights.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>3. Disclaimer</Typography>
        <Typography variant="body1" paragraph>
          PhaseThru is provided "as is" without warranty of any kind. We are not affiliated with YouTube or Google.
        </Typography>

        <Box sx={{ mt: 6 }}>
          <Link href="/video" passHref>
            <Button variant="outlined">Back to App</Button>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}

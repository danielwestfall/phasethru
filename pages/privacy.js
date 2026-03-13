import Head from 'next/head';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Head>
        <title>Privacy Policy - PhaseThru</title>
      </Head>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>Privacy Policy</Typography>
        <Typography variant="body1" paragraph>
          Last Updated: March 2026
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>1. Information We Collect</Typography>
        <Typography variant="body1" paragraph>
          PhaseThru uses Supabase Authentication (GitHub, Google, and Email) to prevent spam and allow you to save your own audio descriptions and scripts. When you log in, we receive your email address and profile name from the provider.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>2. How We Use Information</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" component="div">
            We use your information solely to:
            <ul style={{ marginTop: '8px' }}>
              <li>Attribute your contributions (ADs, TBMA scripts) to your account.</li>
              <li>Prevent automated spam and abuse of the database.</li>
            </ul>
          </Typography>
          <Typography variant="body1">
            We do not sell your data or use it for marketing.
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>3. Data Storage</Typography>
        <Typography variant="body1" paragraph>
          Your data is stored securely using Supabase. You can request deletion of your account and contributions at any time by contacting the administrator.
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

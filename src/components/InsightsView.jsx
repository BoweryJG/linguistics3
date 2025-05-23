import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardHeader,
  CardContent,
  Button
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import LoginDialog from './auth/LoginDialog';

const InsightsView = ({ analysisResults }) => {
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  const handleLoginOpen = () => {
    setLoginDialogOpen(true);
  };
  
  const handleLoginClose = () => {
    setLoginDialogOpen(false);
  };
  
  return (
    <Box>
      {!isAuthenticated && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                p: 3,
                bgcolor: '#fff8e1',
                borderRadius: 2,
                border: '1px solid #ffd54f',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ mb: 1, color: '#f57c00' }}>
                Authentication Required
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You need to be logged in to view analysis results.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleLoginOpen}
              >
                Log In Now
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && analysisResults ? (
        <>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={analysisResults.conversation?.title || analysisResults.conversation?.file_name || 'Analysis Results'}
            />
            <CardContent>
              {analysisResults.conversation?.meeting_date && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {new Date(analysisResults.conversation.meeting_date).toLocaleString()}
                </Typography>
              )}

              {analysisResults.linguistics?.sentiment && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Sentiment: {analysisResults.linguistics.sentiment}
                </Typography>
              )}

              {analysisResults.linguistics?.key_points?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Key Points</Typography>
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {analysisResults.linguistics.key_points.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                    ))}
                  </Box>
                </Box>
              )}

              {analysisResults.linguistics?.pain_points?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Pain Points</Typography>
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {analysisResults.linguistics.pain_points.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                    ))}
                  </Box>
                </Box>
              )}

              {analysisResults.linguistics?.objections?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Objections</Typography>
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {analysisResults.linguistics.objections.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                    ))}
                  </Box>
                </Box>
              )}

              {analysisResults.linguistics?.next_steps?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Next Steps</Typography>
                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {analysisResults.linguistics.next_steps.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                    ))}
                  </Box>
                </Box>
              )}

              {analysisResults.linguistics?.full_analysis && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Full Analysis</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {analysisResults.linguistics.full_analysis}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {analysisResults.linguistics?.transcription && (
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Transcription" />
              <CardContent>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {analysisResults.linguistics.transcription}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      ) : isAuthenticated ? (
        <Typography>No analysis results available.</Typography>
      ) : null}

      <LoginDialog open={loginDialogOpen} onClose={handleLoginClose} />
    </Box>
  );
};

export default InsightsView;

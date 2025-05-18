import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';

// Import API service
import api from './api';

// Import NavBar component
import NavBar from './components/NavBar';

// Import components
import DashboardView from './components/DashboardView';
import AnalysisView from './components/AnalysisView';
import CompleteView from './components/CompleteView';
import InsightsView from './components/InsightsView';
import LoginDialog from './components/auth/LoginDialog';
import SignupDialog from './components/auth/SignupDialog';

// Import contexts
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import OrbContextProvider from './OrbContextProvider';

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [uploadState, setUploadState] = useState('upload'); // upload, selected, uploading, analyzing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const fileInputRef = useRef(null);
  const activeSubscription = useRef(null);
  
  // Handle view navigation without authentication check
  const handleViewChange = (view) => {
    // No authentication check needed anymore
    setCurrentView(view);
    setError('');
  };
  
  // Handle file selection and analysis flow
  const handleFileSelect = (event) => {
    const file = event?.target?.files?.[0] || null;
    
    if (file) {
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid audio file (MP3, WAV, or M4A)');
        return;
      }
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setError('File size exceeds 50MB limit');
        return;
      }
      
      setSelectedFile(file);
      setUploadState('selected');
      setError('');
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleRemoveFile = () => {
    setUploadState('upload');
    setSelectedFile(null);
    setError('');
  };
  
  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    setLoading(true);
    setError('');
    setUploadState('uploading');
    setUploadProgress(0);
    
    try {
      // Upload file to Supabase
      const filePath = `audio/${Date.now()}_${selectedFile.name}`;
      const { data, error: uploadError } = await api.uploadFile(
        selectedFile, 
        filePath,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (uploadError) {
        throw new Error(uploadError.message || 'File upload failed');
      }
      
      // Create a conversation record in Supabase
      const { data: conversationData, error: conversationError } = await api.createConversation({
        file_name: selectedFile.name,
        file_url: data?.publicUrl || '',
        file_path: filePath,
        file_size: selectedFile.size,
        duration_seconds: null, // Will be updated after analysis
        title: `Analysis - ${selectedFile.name}`,
        meeting_type: 'discovery',
        approach: 'socratic',
        meeting_date: new Date().toISOString(),
        status: 'uploading'
      });
      
      let conversationId;
      if (conversationError) {
        console.error('Error creating conversation record:', conversationError);
        throw new Error('Error creating conversation record: ' + conversationError.message);
      } else {
        conversationId = conversationData?.[0]?.id;
        
        // Set up polling for status updates instead of real-time subscriptions
        console.log(`Setting up polling for conversation ${conversationId}`);
        
        // Start polling for status updates
        const statusCheckInterval = setInterval(async () => {
          try {
            // Check conversation status
            const { data: checkData, error: checkError } = await api.getConversationStatus(conversationId);
            
            if (checkError) {
              console.error('Error checking conversation status:', checkError);
              return;
            }
            
            if (checkData) {
              const currentStatus = checkData.status;
              console.log(`Current status: ${currentStatus}`);
              
              // Update UI based on status changes
              if (currentStatus === 'transcribing') {
                setUploadState('transcribing');
              } else if (currentStatus === 'analyzing') {
                setUploadState('analyzing');
              } else if (currentStatus === 'completed') {
                setUploadState('completed');
                // Fetch the complete analysis data
                loadAnalysisResults(conversationId);
                // Clear the interval when completed
                clearInterval(statusCheckInterval);
              } else if (currentStatus === 'error') {
                setError(checkData.error_message || 'An error occurred during processing');
                setUploadState('error');
                // Clear the interval on error
                clearInterval(statusCheckInterval);
              }
            }
          } catch (err) {
            console.error('Error polling for status:', err);
          }
        }, 3000); // Check every 3 seconds
        
        // Store the interval ID for cleanup
        activeSubscription.current = statusCheckInterval;
      }
      
      // Call the backend API with the file URL
      try {
        const result = await api.sendRequest({
          action: 'analyze',
          data: {
            meetingType: 'discovery',
            approach: 'socratic',
            fileUrl: data?.publicUrl || '',
            conversationId: conversationId
          }
        });
        
        console.log('API response:', result);
        
        // The UI will be updated through the Supabase subscription
        
      } catch (apiError) {
        console.error('Error calling API:', apiError);
        setError('API Error: ' + apiError.message);
        setUploadState('error');
      }
      
    } catch (error) {
      console.error('Error during analysis:', error);
      setError(error.message || 'An unexpected error occurred');
      setUploadState('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load analysis results when completed
  const loadAnalysisResults = async (conversationId) => {
    try {
      const { data, error } = await api.getConversationWithAnalysis(conversationId);
      
      if (error) {
        console.error('Error loading analysis results:', error);
        return;
      }
      
      setAnalysisResults(data);
      setCurrentView('insights');
    } catch (err) {
      console.error('Error loading analysis results:', err);
    }
  };
  
  // Clean up polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (activeSubscription.current) {
        console.log('Cleaning up polling interval');
        clearInterval(activeSubscription.current);
      }
    };
  }, []);
  
  const handleNewAnalysis = () => {
    setCurrentView('analyze');
    setUploadState('upload');
    setSelectedFile(null);
    setError('');
    setUploadProgress(0);
  };

  // New state for auth dialogs and user menu
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  // Get theme and auth from contexts
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout, getInitials } = useAuth();
  
  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await logout();
    handleUserMenuClose();
  };
  
  // Dialog handlers
  const handleLoginOpen = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);
  const handleSignupOpen = () => setSignupOpen(true);
  const handleSignupClose = () => setSignupOpen(false);

  return (
    <OrbContextProvider>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}>
        {/* Navigation Bar */}
        <NavBar />

        <Container sx={{ py: 4, flex: 1 }}>
        {/* Subscription Info - Always show */}
        {currentView !== 'complete' && (
          <React.Suspense fallback={<div>Loading subscription info...</div>}>
            {/* Lazy load the SubscriptionInfo component */}
            {React.createElement(React.lazy(() => import('./components/SubscriptionInfo')))}
          </React.Suspense>
        )}
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <DashboardView onUploadClick={() => handleViewChange('analyze')} />
        )}
        
        {/* Analysis View */}
        {currentView === 'analyze' && (
          <AnalysisView 
            uploadState={uploadState}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            onStartAnalysis={handleStartAnalysis}
            loading={loading}
            error={error}
            selectedFile={selectedFile}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
          />
        )}
        
        {/* Complete Analysis View */}
        {currentView === 'complete' && (
          <CompleteView onNewAnalysis={handleNewAnalysis} />
        )}
        
        {/* Team Insights View */}
        {currentView === 'insights' && (
          <InsightsView analysisResults={analysisResults} />
        )}
        </Container>
        
        {/* User menu */}
        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
        >
          <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleUserMenuClose}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
        
        {/* Auth dialogs - hidden but kept for compatibility */}
        <LoginDialog open={false} onClose={handleLoginClose} />
        <SignupDialog open={false} onClose={handleSignupClose} />
      </Box>
    </OrbContextProvider>
  );
};

export default App;

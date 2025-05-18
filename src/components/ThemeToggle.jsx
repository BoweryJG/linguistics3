import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';

export default function ThemeToggle() {
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('themeMode') === 'dark' || 
    (!localStorage.getItem('themeMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    // Apply the theme
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'light');
    
    // Dispatch event for other components that might need to react to theme changes
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: isDarkMode ? 'dark' : 'light' } 
    }));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <IconButton 
      onClick={toggleTheme} 
      color="inherit"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      sx={{
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'rotate(30deg)',
        },
      }}
    >
      {isDarkMode ? (
        <Brightness7Icon sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#222' }} />
      ) : (
        <Brightness4Icon sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#222' }} />
      )}
    </IconButton>
  );
}

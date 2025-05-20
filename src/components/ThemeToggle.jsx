import React, { useContext } from 'react';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

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

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Only check localStorage for explicit user preference
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // Always default to light mode unless user explicitly set dark mode
    return false;
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Update document class for CSS targeting
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-mode');
      }
    }
  }, [isDarkMode]);

  // Removed system preference listener - dark mode only activates on explicit user action

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (dark) => {
    setIsDarkMode(dark);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

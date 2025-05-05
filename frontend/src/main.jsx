import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CompleteApp from './CompleteApp';

// Add debugging logs
console.log('main.jsx is executing');
console.log('Looking for root element');

const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

// Create theme with company colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // Dark blue
    },
    secondary: {
      main: '#29ABE2', // Light blue
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

try {
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    console.log('ReactDOM.createRoot called');
    
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <CompleteApp />
        </ThemeProvider>
      </React.StrictMode>
    );
    console.log('Render method called');
  } else {
    console.error('Root element not found in the DOM');
    // Create a fallback element if root is not found
    const fallbackElement = document.createElement('div');
    fallbackElement.innerHTML = '<h1>Error: Root element not found</h1>';
    document.body.appendChild(fallbackElement);
  }
} catch (error) {
  console.error('Error rendering React app:', error);
  // Display error on page
  const errorElement = document.createElement('div');
  errorElement.innerHTML = `<h1>Error rendering React app</h1><pre>${error.message}</pre>`;
  document.body.appendChild(errorElement);
}

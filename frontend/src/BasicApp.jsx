import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Button,
  CssBaseline
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

// Basic App component
const BasicApp = () => {
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Compensation Calculator
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Compensation Simulator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload employee data, adjust parameters, and run simulations to calculate compensation
            </Typography>
          </Box>

          {/* Control Panel */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Basic Test Component
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="body1">
                Count: {count}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setCount(count + 1)}
                sx={{ mt: 2 }}
              >
                Increment Count
              </Button>
            </Box>
          </Paper>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: theme.palette.grey[100]
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="body2" color="text.secondary" align="center">
              Compensation Calculator &copy; {new Date().getFullYear()}
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default BasicApp;

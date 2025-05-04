/**
 * Main App Component
 * 
 * Integrates all UI components and handles the simulation run
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useScenario } from './context/ScenarioContext';
import { ActionType } from './types';
import { calculateScenario } from './api/compensationService';

// Import components
import UploadPanel from './components/controls/UploadPanel';
import RevenueDeltaSlider from './components/controls/RevenueDeltaSlider';
import SensitivitySlider from './components/controls/SensitivitySlider';
import CompTable from './components/table/CompTable';
import ChartsSection from './components/charts/ChartsSection';
import ScenarioSummaryCards from './components/layout/ScenarioSummaryCards';
import ExportButton from './components/controls/ExportButton';

/**
 * Main App component
 */
const App: React.FC = () => {
  const theme = useTheme();
  const { state, dispatch } = useScenario();
  const { employees, scenario, loading, error } = state;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch({ type: ActionType.SET_ERROR, payload: null });
      }, 6000);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    }
  }, [successMessage]);

  /**
   * Run the compensation simulation
   */
  const handleRunSimulation = async () => {
    if (!employees || employees.length === 0) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: 'Please upload employee data first'
      });
      return;
    }

    try {
      // Set loading state
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      
      // Call the API to calculate compensation
      const response = await calculateScenario(employees, scenario);
      
      // Update state with results
      dispatch({
        type: ActionType.SET_RESULTS,
        payload: response
      });
      
      // Show success message
      setSuccessMessage('Simulation completed successfully');
      
      // Clear error state
      dispatch({ type: ActionType.SET_ERROR, payload: null });
    } catch (err) {
      // Handle error
      const errorMessage = err instanceof Error ? err.message : 'Failed to run simulation';
      dispatch({ type: ActionType.SET_ERROR, payload: errorMessage });
    } finally {
      // Clear loading state
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  /**
   * Handle error close
   */
  const handleCloseError = () => {
    dispatch({ type: ActionType.SET_ERROR, payload: null });
  };

  /**
   * Handle success message close
   */
  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#003366' }}>
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
            Simulation Controls
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <UploadPanel />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Scenario Parameters
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <RevenueDeltaSlider />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <SensitivitySlider />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRunSimulation}
              disabled={loading || !employees || employees.length === 0}
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </Button>
            
            <ExportButton />
          </Box>
        </Paper>

        {/* Summary Cards */}
        <ScenarioSummaryCards />

        {/* Data Table */}
        <CompTable />

        {/* Charts */}
        <ChartsSection />
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

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;

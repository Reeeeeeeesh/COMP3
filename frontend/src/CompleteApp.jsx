import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Slider,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ScenarioProvider, useScenario, ActionType } from './SimpleContext';

// Revenue Delta Slider Component
const RevenueDeltaSlider = () => {
  const { state, dispatch } = useScenario();
  
  const handleChange = (event, newValue) => {
    dispatch({
      type: ActionType.SET_SCENARIO,
      payload: { revenueDelta: newValue }
    });
  };
  
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Typography gutterBottom>
        Revenue Delta: {state.scenario.revenueDelta}%
      </Typography>
      <Slider
        value={state.scenario.revenueDelta}
        onChange={handleChange}
        aria-labelledby="revenue-delta-slider"
        valueLabelDisplay="auto"
        step={1}
        marks
        min={-10}
        max={20}
        valueLabelFormat={(value) => `${value}%`}
      />
      <Typography variant="body2" color="text.secondary">
        Adjust the expected revenue change percentage
      </Typography>
    </Box>
  );
};

// Sensitivity Slider Component
const SensitivitySlider = () => {
  const { state, dispatch } = useScenario();
  
  const handleChange = (event, newValue) => {
    dispatch({
      type: ActionType.SET_SCENARIO,
      payload: { sensitivityFactor: newValue }
    });
  };
  
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Typography gutterBottom>
        Sensitivity Factor: {state.scenario.sensitivityFactor}
      </Typography>
      <Slider
        value={state.scenario.sensitivityFactor}
        onChange={handleChange}
        aria-labelledby="sensitivity-slider"
        valueLabelDisplay="auto"
        step={0.1}
        marks
        min={0}
        max={1}
      />
      <Typography variant="body2" color="text.secondary">
        Adjust how sensitive compensation is to revenue changes
      </Typography>
    </Box>
  );
};

// Mock Upload Component
const UploadPanel = () => {
  const { dispatch } = useScenario();
  
  const handleUpload = () => {
    // Mock employee data
    const mockEmployees = [
      {
        id: '1',
        name: 'John Doe',
        department: 'Sales',
        role: 'Account Manager',
        base_salary: 80000,
        performance_rating: 4,
        quintile: 'Q2',
        aum: 5,
        is_mrt: false
      },
      {
        id: '2',
        name: 'Jane Smith',
        department: 'Marketing',
        role: 'Marketing Manager',
        base_salary: 90000,
        performance_rating: 5,
        quintile: 'Q1',
        aum: 0,
        is_mrt: false
      },
      {
        id: '3',
        name: 'Bob Johnson',
        department: 'Finance',
        role: 'Financial Advisor',
        base_salary: 120000,
        performance_rating: 3,
        quintile: 'Q3',
        aum: 15,
        is_mrt: true
      }
    ];
    
    dispatch({
      type: ActionType.SET_EMPLOYEES,
      payload: mockEmployees
    });
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          textAlign: 'center',
          mb: 2
        }}
      >
        <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Upload Employee Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag & drop a CSV file or click to browse
        </Typography>
      </Paper>
      
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleUpload}
      >
        Load Sample Data
      </Button>
    </Box>
  );
};

// Summary Component
const SummaryCards = () => {
  const { state } = useScenario();
  const { summary } = state;
  
  if (!summary) return null;
  
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Scenario Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">Total Payroll</Typography>
            <Typography variant="h4">${summary.total_payroll.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">Avg Increase</Typography>
            <Typography variant="h4">{summary.avg_base_increase.toFixed(1)}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">MRT Breaches</Typography>
            <Typography variant="h4">{summary.mrt_breaches}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">Total Flags</Typography>
            <Typography variant="h4">{summary.total_flags}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Main App Component
const AppContent = () => {
  const { state, dispatch } = useScenario();
  const { employees, loading, error } = state;
  const [successMessage, setSuccessMessage] = useState(null);
  
  const handleRunSimulation = () => {
    if (!employees || employees.length === 0) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: 'Please upload employee data first'
      });
      return;
    }
    
    // Set loading state
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock results
      const mockResults = employees.map(emp => ({
        employee_id: emp.id,
        adjusted_salary: emp.base_salary * (1 + (state.scenario.revenueDelta / 100) * state.scenario.sensitivityFactor),
        salary_change: emp.base_salary * ((state.scenario.revenueDelta / 100) * state.scenario.sensitivityFactor),
        bonus: emp.base_salary * 0.15 * emp.performance_rating / 3,
        total_compensation: 0, // Will be calculated below
        flags: []
      }));
      
      // Calculate total_compensation
      mockResults.forEach(result => {
        result.total_compensation = result.adjusted_salary + result.bonus;
      });
      
      // Mock summary
      const mockSummary = {
        total_payroll: mockResults.reduce((sum, r) => sum + r.total_compensation, 0),
        avg_base_increase: state.scenario.revenueDelta * state.scenario.sensitivityFactor,
        mrt_breaches: 0,
        total_flags: 0,
        total_employees: employees.length,
        flag_distribution: {}
      };
      
      // Update state with results
      dispatch({
        type: ActionType.SET_RESULTS,
        payload: {
          results: mockResults,
          summary: mockSummary
        }
      });
      
      // Show success message
      setSuccessMessage('Simulation completed successfully');
      
      // Clear loading state
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }, 1500);
  };
  
  const handleCloseError = () => {
    dispatch({ type: ActionType.SET_ERROR, payload: null });
  };
  
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
          </Box>
        </Paper>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Employee Table */}
        {employees && employees.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Employee Data
            </Typography>
            <Typography variant="body2">
              {employees.length} employees loaded. Run a simulation to see results.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.100'
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

// Wrap the app with the ScenarioProvider
const CompleteApp = () => {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  );
};

export default CompleteApp;

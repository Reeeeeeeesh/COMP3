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
import { ScenarioProvider, useScenario, ActionType } from './SimpleContext';
import UploadPanel from './components/controls/UploadPanel';

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
  
  // Sample employee data for testing
  const sampleEmployees = [
    {
      id: 'FM-001',
      name: 'Jennifer Santana',
      department: 'Global Equities',
      role: 'Fund Manager',
      base_salary: 175000,
      performance_rating: 5,
      quintile: 'Q5',
      aum: 509,
      is_mrt: true
    },
    {
      id: 'FM-002',
      name: 'April Bowman',
      department: 'Global Equities',
      role: 'Fund Manager',
      base_salary: 265000,
      performance_rating: 4,
      quintile: 'Q2',
      aum: 490,
      is_mrt: false
    },
    {
      id: 'FM-003',
      name: 'Patrick Thompson',
      department: 'Quant Strategies',
      role: 'Fund Manager',
      base_salary: 200000,
      performance_rating: 4,
      quintile: 'Q2',
      aum: 1231,
      is_mrt: true
    }
  ];
  
  // Load sample data
  const handleLoadSampleData = () => {
    dispatch({
      type: ActionType.SET_EMPLOYEES,
      payload: sampleEmployees
    });
    setSuccessMessage('Sample data loaded successfully');
  };
  
  // Clear all employee data
  const handleClearData = () => {
    dispatch({
      type: ActionType.SET_EMPLOYEES,
      payload: []
    });
    dispatch({
      type: ActionType.SET_RESULTS,
      payload: { results: null, summary: null }
    });
    setSuccessMessage('Employee data cleared');
  };
  
  // Create test data with 50 employees
  const handleCreateTestData = () => {
    const numEmployees = 50;
    const departments = ['Global Equities', 'Quant Strategies', 'Alternatives'];
    const roles = ['Fund Manager', 'Portfolio Manager', 'Analyst'];
    const levels = ['Junior', 'Associate', 'Director', 'Managing Director'];
    const quintiles = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
    
    const testEmployees = Array.from({ length: numEmployees }, (_, i) => ({
      id: `EMP-${i + 1}`.padStart(6, '0'),
      name: `Test Employee ${i + 1}`,
      department: departments[i % departments.length],
      role: roles[i % roles.length],
      base_salary: 100000 + Math.floor(Math.random() * 200000),
      performance_rating: 1 + Math.floor(Math.random() * 5),
      quintile: quintiles[i % quintiles.length],
      aum: Math.floor(Math.random() * 1000),
      is_mrt: i % 5 === 0
    }));
    
    dispatch({
      type: ActionType.SET_EMPLOYEES,
      payload: testEmployees
    });
    setSuccessMessage(`Created ${numEmployees} test employees`);
  };
  
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
      try {
        console.log("Running simulation with employees:", employees);
        
        // Mock results
        const mockResults = employees.map(emp => {
          const baseSalary = parseFloat(emp.base_salary) || 0;
          const performanceRating = parseInt(emp.performance_rating) || 3;
          const revenueImpact = (state.scenario.revenueDelta / 100) * state.scenario.sensitivityFactor;
          
          // Calculate adjusted salary with revenue impact
          const adjustedSalary = baseSalary * (1 + revenueImpact);
          
          // Calculate salary change
          const salaryChange = adjustedSalary - baseSalary;
          
          // Calculate bonus (simplified formula)
          const bonus = baseSalary * 0.15 * (performanceRating / 3);
          
          // Calculate total compensation
          const totalCompensation = adjustedSalary + bonus;
          
          // Generate mock flags
          const flags = [];
          if (emp.is_mrt && revenueImpact < 0) {
            flags.push('MRT_DECREASE');
          }
          if (revenueImpact > 0.1) {
            flags.push('HIGH_INCREASE');
          }
          
          return {
            employee_id: emp.id,
            name: emp.name,
            department: emp.department,
            adjusted_salary: adjustedSalary,
            salary_change: salaryChange,
            bonus: bonus,
            total_compensation: totalCompensation,
            flags: flags
          };
        });
        
        // Calculate summary metrics
        const totalPayroll = mockResults.reduce((sum, r) => sum + r.total_compensation, 0);
        const avgBaseIncrease = state.scenario.revenueDelta * state.scenario.sensitivityFactor;
        const mrtBreaches = mockResults.filter(r => r.flags.includes('MRT_DECREASE')).length;
        const totalFlags = mockResults.reduce((sum, r) => sum + r.flags.length, 0);
        
        // Create flag distribution
        const flagDistribution = {};
        mockResults.forEach(result => {
          result.flags.forEach(flag => {
            flagDistribution[flag] = (flagDistribution[flag] || 0) + 1;
          });
        });
        
        // Mock summary
        const mockSummary = {
          total_payroll: totalPayroll,
          avg_base_increase: avgBaseIncrease,
          mrt_breaches: mrtBreaches,
          total_flags: totalFlags,
          total_employees: employees.length,
          flag_distribution: flagDistribution
        };
        
        console.log("Simulation results:", mockResults);
        console.log("Summary:", mockSummary);
        
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
      } catch (err) {
        console.error("Simulation error:", err);
        // Handle any errors
        dispatch({
          type: ActionType.SET_ERROR,
          payload: `Error running simulation: ${err.message}`
        });
      } finally {
        // Clear loading state
        dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
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
            
            {/* Data Management Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleLoadSampleData}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Load 3 Sample Employees
              </Button>
              
              <Button
                variant="outlined"
                color="info"
                onClick={handleCreateTestData}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Create 50 Test Employees
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearData}
                disabled={loading || !employees || employees.length === 0}
                sx={{ flex: 1 }}
              >
                Clear Data
              </Button>
            </Box>
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
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRunSimulation}
              disabled={loading || !employees || employees.length === 0}
              sx={{ px: 4, py: 1.5 }}
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
            <Typography variant="body2" sx={{ mb: 2 }}>
              {employees.length} employees loaded. Run a simulation to see results.
            </Typography>
            
            {/* Display first 5 employees only to avoid overwhelming the UI */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sample of loaded employees (showing first 5):
              </Typography>
              <pre style={{ overflowX: 'auto', fontSize: '0.8rem' }}>
                {JSON.stringify(employees.slice(0, 5), null, 2)}
              </pre>
              {employees.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  ...and {employees.length - 5} more employees
                </Typography>
              )}
            </Box>
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

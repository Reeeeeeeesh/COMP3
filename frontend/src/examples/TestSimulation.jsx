import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Paper, 
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Slider,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Simple test application with direct state management
const TestSimulation = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [results, setResults] = useState(null);
  const [revenueDelta, setRevenueDelta] = useState(5);
  const [sensitivityFactor, setSensitivityFactor] = useState(0.5);
  
  // Sample employee data
  const sampleData = [
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
  const handleLoadSample = () => {
    setEmployees(sampleData);
    setSuccess('Sample data loaded');
  };
  
  // Clear all data
  const handleClearData = () => {
    setEmployees([]);
    setResults(null);
    setSuccess('Data cleared');
  };
  
  // Run simulation
  const handleRunSimulation = () => {
    if (employees.length === 0) {
      setError('Please load data first');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Calculate results
        const calculatedResults = employees.map(emp => {
          const baseSalary = parseFloat(emp.base_salary) || 0;
          const performanceRating = parseInt(emp.performance_rating) || 3;
          const revenueImpact = (revenueDelta / 100) * sensitivityFactor;
          
          // Calculate adjusted salary
          const adjustedSalary = baseSalary * (1 + revenueImpact);
          const salaryChange = adjustedSalary - baseSalary;
          const bonus = baseSalary * 0.15 * (performanceRating / 3);
          const totalComp = adjustedSalary + bonus;
          
          return {
            employee_id: emp.id,
            name: emp.name,
            department: emp.department,
            adjusted_salary: adjustedSalary,
            salary_change: salaryChange,
            bonus: bonus,
            total_compensation: totalComp,
            flags: []
          };
        });
        
        // Calculate summary
        const totalPayroll = calculatedResults.reduce((sum, r) => sum + r.total_compensation, 0);
        
        const summary = {
          total_payroll: totalPayroll,
          avg_base_increase: revenueDelta * sensitivityFactor,
          total_employees: employees.length
        };
        
        // Set results
        setResults({
          results: calculatedResults,
          summary: summary
        });
        
        setSuccess('Simulation completed successfully');
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 1000);
  };
  
  // Handle slider changes
  const handleRevenueDeltaChange = (event, newValue) => {
    setRevenueDelta(newValue);
  };
  
  const handleSensitivityChange = (event, newValue) => {
    setSensitivityFactor(newValue);
  };
  
  // Close notifications
  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccess(null);
  
  // Create CSV data
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
    
    setEmployees(testEmployees);
    setSuccess(`Created ${numEmployees} test employees`);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#003366' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Compensation Calculator (Test Version)
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Test Simulation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Simple test version with direct state management
          </Typography>
        </Box>

        {/* Control Panel */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Data Controls
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleLoadSample}
              disabled={loading}
            >
              Load 3 Sample Employees
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleCreateTestData}
              disabled={loading}
            >
              Create 50 Test Employees
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleClearData}
              disabled={loading || employees.length === 0}
            >
              Clear Data
            </Button>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>
              Revenue Delta: {revenueDelta}%
            </Typography>
            <Slider
              value={revenueDelta}
              onChange={handleRevenueDeltaChange}
              aria-labelledby="revenue-delta-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={-10}
              max={20}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Sensitivity Factor: {sensitivityFactor}
            </Typography>
            <Slider
              value={sensitivityFactor}
              onChange={handleSensitivityChange}
              aria-labelledby="sensitivity-slider"
              valueLabelDisplay="auto"
              step={0.1}
              marks
              min={0}
              max={1}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRunSimulation}
              disabled={loading || employees.length === 0}
              sx={{ px: 4, py: 1.5 }}
            >
              {loading ? 'Running...' : 'Run Simulation'}
            </Button>
          </Box>
        </Paper>

        {/* Employee Data */}
        {employees.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Employee Data
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {employees.length} employees loaded
            </Typography>
            
            {/* Show first 3 employees */}
            <Box sx={{ mt: 2 }}>
              <pre style={{ overflowX: 'auto', fontSize: '0.8rem' }}>
                {JSON.stringify(employees.slice(0, 3), null, 2)}
              </pre>
              {employees.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  ...and {employees.length - 3} more employees
                </Typography>
              )}
            </Box>
          </Paper>
        )}
        
        {/* Results */}
        {results && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Simulation Results
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1">Total Payroll</Typography>
                  <Typography variant="h4">${results.summary.total_payroll.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1">Avg Increase</Typography>
                  <Typography variant="h4">{results.summary.avg_base_increase.toFixed(1)}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1">Total Employees</Typography>
                  <Typography variant="h4">{results.summary.total_employees}</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Show first result */}
            <Typography variant="subtitle2" gutterBottom>
              Sample Result:
            </Typography>
            <pre style={{ overflowX: 'auto', fontSize: '0.8rem' }}>
              {JSON.stringify(results.results[0], null, 2)}
            </pre>
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
            Test Simulation &copy; {new Date().getFullYear()}
          </Typography>
        </Container>
      </Box>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestSimulation;

/**
 * InsightsDashboard Component
 * 
 * A dashboard of data visualizations for the Compensation Calculator
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  useTheme,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DownloadIcon from '@mui/icons-material/Download';
import { useScenario } from '../SimpleContext';

// Import chart components
import WaterfallChart from './WaterfallChart';
import Histogram from './Histogram';
import PerfBonusScatter from './PerfBonusScatter';
import DeptStackedBar from './DeptStackedBar';
import PayrollSunburst from './PayrollSunburst';
import FlagsHeatmap from './FlagsHeatmap';
import SensitivityCurve from './SensitivityCurve';

// Chart configuration interface
interface ChartConfig {
  id: string;
  title: string;
  component: React.ReactNode;
  visible: boolean;
}

/**
 * InsightsDashboard component
 * A dashboard of data visualizations for the Compensation Calculator
 */
const InsightsDashboard: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { results, summary } = state;
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // State for chart visibility
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
    { id: 'waterfall', title: 'Payroll Impact', component: <WaterfallChart />, visible: true },
    { id: 'histogram', title: 'Salary Change Distribution', component: <Histogram />, visible: true },
    { id: 'scatter', title: 'Performance vs. Bonus', component: <PerfBonusScatter />, visible: true },
    { id: 'stackedBar', title: 'Department Breakdown', component: <DeptStackedBar />, visible: true },
    { id: 'sunburst', title: 'Payroll Cost Drivers', component: <PayrollSunburst />, visible: true },
    { id: 'heatmap', title: 'Compliance Flags', component: <FlagsHeatmap />, visible: true },
    { id: 'sensitivity', title: 'Sensitivity Analysis', component: <SensitivityCurve />, visible: false }
  ]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Toggle chart visibility
  const toggleChartVisibility = (chartId: string) => {
    setChartConfigs(prevConfigs => 
      prevConfigs.map(config => 
        config.id === chartId 
          ? { ...config, visible: !config.visible } 
          : config
      )
    );
  };
  
  // Check if any data is available
  const hasData = results && results.length > 0 && summary;
  
  // Filter visible charts
  const visibleCharts = chartConfigs.filter(config => config.visible);
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Dashboard header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h5" component="h2" gutterBottom={false}>
            Compensation Insights Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasData 
              ? `Analyzing ${results.length} employees across ${Object.keys(summary.dept_totals || {}).length} departments`
              : 'Run a simulation to generate insights'
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Dashboard Settings">
            <IconButton 
              size="small"
              onClick={() => {
                // Open settings dialog (simplified for this implementation)
                alert('Chart settings would open here');
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Dashboard">
            <IconButton 
              size="small"
              disabled={!hasData}
              onClick={() => {
                // Export dashboard (simplified for this implementation)
                alert('Dashboard export would happen here');
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Tab navigation */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Insights" />
          <Tab label="Payroll Analysis" />
          <Tab label="Department Analysis" />
          <Tab label="Compliance" />
          <Tab label="Advanced" />
        </Tabs>
      </Box>
      
      {/* Dashboard content */}
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          {visibleCharts.map((config, index) => (
            <Grid item xs={12} md={6} key={config.id}>
              {config.component}
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <WaterfallChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <Histogram />
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DeptStackedBar />
          </Grid>
          <Grid item xs={12} md={6}>
            <PayrollSunburst />
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FlagsHeatmap />
          </Grid>
          <Grid item xs={12} md={6}>
            <PerfBonusScatter />
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SensitivityCurve />
          </Grid>
        </Grid>
      </Box>
      
      {/* No data message */}
      {!hasData && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: theme.palette.grey[100],
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            No simulation data available
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload employee data and run a simulation to generate insights
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InsightsDashboard;

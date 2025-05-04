/**
 * ScenarioSummaryCards Component
 * 
 * Displays aggregate metrics from the compensation calculation results
 */

import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useScenario } from '../../context/ScenarioContext';

/**
 * Format currency values for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage values for display
 */
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * SummaryCard component for displaying a single metric
 */
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color 
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: color ? `4px solid ${color}` : undefined
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box 
          sx={{ 
            mr: 2, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: color || theme.palette.primary.main,
            color: 'white'
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="h4" component="div" sx={{ my: 1, fontWeight: 'bold' }}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

/**
 * ScenarioSummaryCards component
 * Displays aggregate metrics from the compensation calculation results
 */
const ScenarioSummaryCards: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { summary, scenario, results } = state;
  
  // If no summary data is available, don't render anything
  if (!summary || !results) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Scenario Summary
      </Typography>
      
      <Grid container spacing={3}>
        {/* Total Payroll */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Payroll"
            value={formatCurrency(summary.total_payroll)}
            icon={<AttachMoney />}
            subtitle={`${results.length} employees`}
            color={theme.palette.primary.main}
          />
        </Grid>
        
        {/* Average Increase */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Avg Base Increase"
            value={formatPercentage(summary.avg_base_increase)}
            icon={
              summary.avg_base_increase >= 0 
                ? <TrendingUp /> 
                : <TrendingDown />
            }
            subtitle={`Revenue Delta: ${formatPercentage(scenario.revenueDelta)}`}
            color={
              summary.avg_base_increase >= 0 
                ? theme.palette.success.main 
                : theme.palette.error.main
            }
          />
        </Grid>
        
        {/* MRT Breaches */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="MRT Breaches"
            value={summary.mrt_breaches}
            icon={<Warning />}
            subtitle={`${formatPercentage(summary.mrt_breaches / results.length)} of employees`}
            color={
              summary.mrt_breaches > 0 
                ? theme.palette.warning.main 
                : theme.palette.success.main
            }
          />
        </Grid>
        
        {/* Total Flags */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Flags"
            value={summary.total_flags}
            icon={
              summary.total_flags > 0 
                ? <Warning /> 
                : <CheckCircle />
            }
            subtitle={`${formatPercentage(summary.total_flags / results.length)} of employees flagged`}
            color={
              summary.total_flags > 0 
                ? theme.palette.warning.main 
                : theme.palette.success.main
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScenarioSummaryCards;

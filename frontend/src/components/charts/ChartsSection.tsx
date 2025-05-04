/**
 * ChartsSection Component
 * 
 * Displays visualizations of compensation data using recharts
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
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
 * Custom tooltip for charts
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 1, backgroundColor: 'background.paper' }}>
        <Typography variant="body2">{label}</Typography>
        {payload.map((entry: any, index: number) => (
          <Typography 
            key={`tooltip-${index}`} 
            variant="body2" 
            sx={{ color: entry.color }}
          >
            {entry.name}: {
              entry.unit === '$' 
                ? formatCurrency(entry.value) 
                : entry.unit === '%' 
                  ? formatPercentage(entry.value) 
                  : entry.value
            }
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

/**
 * ChartsSection component
 * Displays visualizations of compensation data
 */
const ChartsSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state } = useScenario();
  const { results, summary, employees } = state;

  // Colors for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    // Additional colors for pie chart
    pieColors: [
      '#003366', // Primary dark blue
      '#29ABE2', // Secondary light blue
      '#00CC99', // Teal
      '#FF9900', // Orange
      '#FF3366', // Pink
      '#9966CC', // Purple
    ],
  };

  // Prepare data for salary distribution chart
  const salaryDistributionData = useMemo(() => {
    if (!results || !employees) return [];

    // Create salary brackets
    const brackets = [
      { min: 0, max: 50000, label: '0-50K' },
      { min: 50000, max: 100000, label: '50K-100K' },
      { min: 100000, max: 150000, label: '100K-150K' },
      { min: 150000, max: 200000, label: '150K-200K' },
      { min: 200000, max: Infinity, label: '200K+' },
    ];

    // Count employees in each bracket
    const distribution = brackets.map(bracket => {
      const originalCount = employees.filter(
        emp => emp.base_salary >= bracket.min && emp.base_salary < bracket.max
      ).length;

      const adjustedCount = results.filter(result => {
        const employee = employees.find(emp => emp.id === result.employee_id);
        if (!employee) return false;
        const adjustedSalary = result.adjusted_salary;
        return adjustedSalary >= bracket.min && adjustedSalary < bracket.max;
      }).length;

      return {
        name: bracket.label,
        original: originalCount,
        adjusted: adjustedCount,
      };
    });

    return distribution;
  }, [results, employees]);

  // Prepare data for performance rating distribution
  const performanceDistributionData = useMemo(() => {
    if (!employees) return [];

    // Count employees by performance rating
    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const count = employees.filter(emp => emp.performance_rating === rating).length;
      return {
        name: `Rating ${rating}`,
        value: count,
        label: count > 0 ? `${Math.round((count / employees.length) * 100)}%` : '',
      };
    });

    return distribution;
  }, [employees]);

  // Prepare data for flag distribution chart
  const flagDistributionData = useMemo(() => {
    if (!summary || !summary.flag_distribution) return [];

    // Convert flag distribution to array
    return Object.entries(summary.flag_distribution).map(([flag, count]) => ({
      name: flag,
      value: count,
    }));
  }, [summary]);

  // If no results or employees, show placeholder
  if (!results || !employees || employees.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Charts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Run a simulation to view charts and visualizations
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Compensation Analysis
      </Typography>
      
      <Grid container spacing={3}>
        {/* Salary Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: isMobile ? 300 : 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Salary Distribution
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salaryDistributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="original" 
                    name="Original Salary" 
                    fill={colors.primary} 
                    unit="$"
                  />
                  <Bar 
                    dataKey="adjusted" 
                    name="Adjusted Salary" 
                    fill={colors.secondary} 
                    unit="$"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Performance Rating Distribution */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: isMobile ? 300 : 400,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Performance Rating Distribution
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill={colors.primary}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {performanceDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors.pieColors[index % colors.pieColors.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} employees`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Flag Distribution Chart */}
        {flagDistributionData.length > 0 && (
          <Grid item xs={12}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                height: 300,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Compensation Flags
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={flagDistributionData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      name="Count" 
                      fill={colors.warning}
                    >
                      <LabelList dataKey="value" position="right" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ChartsSection;

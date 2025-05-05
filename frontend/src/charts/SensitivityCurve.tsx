/**
 * SensitivityCurve Component
 * 
 * Displays a line chart showing the relationship between revenue delta and total payroll
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useTheme, Box, CircularProgress } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';
import { calculateScenario } from '../api/compensationService';

// Custom tooltip for the sensitivity curve
const SensitivityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenueDelta = parseFloat(label);
    const totalPayroll = payload[0].value;
    const payrollRatio = payload[1] ? payload[1].value : null;
    
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Revenue Delta: {(revenueDelta * 100).toFixed(1)}%
        </p>
        <p style={{ margin: 0 }}>
          Total Payroll: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(totalPayroll)}
        </p>
        {payrollRatio !== null && (
          <p style={{ margin: 0 }}>
            Payroll/Revenue Ratio: {payrollRatio.toFixed(2)}
          </p>
        )}
      </div>
    );
  }
  
  return null;
};

/**
 * SensitivityCurve component
 * Shows how total payroll changes with different revenue delta values
 */
const SensitivityCurve: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { employees, scenario } = state;
  
  // State for sensitivity data and loading status
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Current revenue delta from scenario
  const currentRevenueDelta = useMemo(() => {
    return scenario?.revenue_delta || 0;
  }, [scenario]);
  
  // Generate sensitivity data when employees are available
  useEffect(() => {
    const generateSensitivityData = async () => {
      if (!employees || employees.length === 0) return;
      
      setLoading(true);
      
      try {
        // Define revenue delta points to simulate
        const deltaPoints = [-0.1, -0.05, -0.02, 0, 0.02, 0.05, 0.1, 0.15, 0.2];
        
        // Get current adjustment factor
        const adjustmentFactor = scenario?.adjustment_factor || 0.8;
        
        // Run simulations for each revenue delta point
        const results = await Promise.all(
          deltaPoints.map(async (delta) => {
            try {
              // Create scenario config with this delta
              const testScenario = {
                revenue_delta: delta,
                adjustment_factor: adjustmentFactor
              };
              
              // Run calculation
              const response = await calculateScenario(employees, testScenario);
              
              // Extract total payroll from summary
              const totalPayroll = parseFloat(response.summary.total_payroll);
              
              // Estimate revenue (this is a simplification)
              // In a real system, we would have actual revenue data
              const baseRevenue = 10000000; // Placeholder base revenue
              const estimatedRevenue = baseRevenue * (1 + delta);
              
              // Calculate payroll to revenue ratio
              const payrollRatio = totalPayroll / estimatedRevenue;
              
              return {
                revenueDelta: delta,
                totalPayroll,
                payrollRatio,
                // Flag if this is the current scenario
                isCurrent: Math.abs(delta - currentRevenueDelta) < 0.001
              };
            } catch (error) {
              console.error(`Error calculating for delta ${delta}:`, error);
              return {
                revenueDelta: delta,
                totalPayroll: null,
                payrollRatio: null,
                isCurrent: Math.abs(delta - currentRevenueDelta) < 0.001
              };
            }
          })
        );
        
        // Filter out failed calculations and sort by revenue delta
        const validResults = results
          .filter(result => result.totalPayroll !== null)
          .sort((a, b) => a.revenueDelta - b.revenueDelta);
        
        setSensitivityData(validResults);
      } catch (error) {
        console.error('Error generating sensitivity data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    generateSensitivityData();
  }, [employees, scenario, currentRevenueDelta]);
  
  // If loading, show spinner
  if (loading) {
    return (
      <ChartCard 
        title="Sensitivity Analysis" 
        description="Analyzing how total payroll changes with different revenue delta values"
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
          <div>Generating sensitivity analysis...</div>
        </Box>
      </ChartCard>
    );
  }
  
  // If no data, return empty chart card
  if (!employees || employees.length === 0 || sensitivityData.length === 0) {
    return (
      <ChartCard 
        title="Sensitivity Analysis" 
        description="Run a simulation to see how total payroll changes with different revenue delta values"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Sensitivity Analysis" 
      description="Shows how total payroll changes with different revenue delta values"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sensitivityData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="revenueDelta" 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            label={{ 
              value: 'Revenue Delta (%)', 
              position: 'insideBottom', 
              offset: -5 
            }}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(value)
            }
            label={{ 
              value: 'Total Payroll ($)', 
              angle: -90, 
              position: 'insideLeft' 
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 'auto']}
            tickFormatter={(value) => value.toFixed(2)}
            label={{ 
              value: 'Payroll/Revenue Ratio', 
              angle: 90, 
              position: 'insideRight' 
            }}
          />
          <Tooltip content={<SensitivityTooltip />} />
          <Legend />
          
          {/* Reference line for current revenue delta */}
          <ReferenceLine 
            x={currentRevenueDelta} 
            stroke={theme.palette.warning.main} 
            strokeDasharray="3 3"
            label={{ 
              value: 'Current', 
              position: 'top',
              fill: theme.palette.warning.main,
              fontSize: 12
            }}
          />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalPayroll" 
            name="Total Payroll" 
            stroke={theme.palette.primary.main} 
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="payrollRatio" 
            name="Payroll/Revenue Ratio" 
            stroke={theme.palette.secondary.main} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default SensitivityCurve;

/**
 * Histogram Component
 * 
 * Displays a histogram of base salary percentage changes
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';

// Custom tooltip for the histogram
const HistogramTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const count = payload[0].value;
    const { binRange, totalSalary, percentOfPayroll } = payload[0].payload;
    
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{binRange}</p>
        <p style={{ margin: 0 }}>
          Employees: {count}
        </p>
        <p style={{ margin: 0 }}>
          Total Salary: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(totalSalary)}
        </p>
        <p style={{ margin: 0 }}>
          % of Payroll: {percentOfPayroll.toFixed(1)}%
        </p>
      </div>
    );
  }
  
  return null;
};

/**
 * Histogram component
 * Shows distribution of base salary percentage changes
 */
const Histogram: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { results, summary } = state;
  
  // Prepare data for the histogram
  const histogramData = useMemo(() => {
    if (!results || !summary || !summary.salary_change_histogram) return [];
    
    // Get the histogram data from the summary
    const histogramBins = summary.salary_change_histogram;
    
    // Calculate total payroll
    const totalPayroll = parseFloat(summary.total_payroll || '0');
    
    // Calculate salary totals for each bin
    const binsWithTotals = Object.entries(histogramBins).map(([binRange, count]) => {
      // Extract the average percentage from the bin range
      const rangeParts = binRange.split(' to ');
      const minPct = parseFloat(rangeParts[0]);
      const maxPct = parseFloat(rangeParts[1]);
      const avgPct = (minPct + maxPct) / 2;
      
      // Estimate the total salary in this bin
      // This is an approximation - in a real system, we would have actual salary values
      const avgSalary = totalPayroll / results.length;
      const totalSalary = (count as number) * avgSalary;
      
      // Calculate percentage of total payroll
      const percentOfPayroll = (totalSalary / totalPayroll) * 100;
      
      return {
        binRange,
        count,
        avgPct,
        totalSalary,
        percentOfPayroll
      };
    });
    
    // Sort bins by the average percentage
    return binsWithTotals.sort((a, b) => a.avgPct - b.avgPct);
  }, [results, summary]);
  
  // Determine the color for each bar based on the percentage change
  const getBarColor = (avgPct: number) => {
    if (avgPct < -5) return theme.palette.error.dark;
    if (avgPct < 0) return theme.palette.error.main;
    if (avgPct < 5) return theme.palette.primary.main;
    if (avgPct < 10) return theme.palette.success.main;
    return theme.palette.success.dark;
  };
  
  // If no data, return empty chart card
  if (!results || !summary || histogramData.length === 0) {
    return (
      <ChartCard 
        title="Salary Change Distribution" 
        description="Run a simulation to see the distribution of salary changes"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Salary Change Distribution" 
      description="Shows how employees are distributed across different salary change percentages"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={histogramData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="binRange" />
          <YAxis 
            label={{ 
              value: 'Number of Employees', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<HistogramTooltip />} />
          <Legend />
          <Bar 
            dataKey="count" 
            name="Employees" 
            fill={theme.palette.primary.main}
            // Use different colors based on the percentage change
            fill={(data) => getBarColor(data.avgPct)}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default Histogram;

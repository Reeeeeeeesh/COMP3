/**
 * DeptStackedBar Component
 * 
 * Displays a stacked bar chart showing base salary and bonus by department
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

// Custom tooltip for the stacked bar chart
const StackedBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const baseSalary = payload[0].value;
    const bonus = payload[1].value;
    const total = baseSalary + bonus;
    const bonusRatio = (bonus / total * 100).toFixed(1);
    
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: 0 }}>
          Base Salary: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(baseSalary)}
        </p>
        <p style={{ margin: 0 }}>
          Bonus: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(bonus)}
        </p>
        <p style={{ margin: 0 }}>
          Total: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(total)}
        </p>
        <p style={{ margin: 0 }}>
          Bonus Ratio: {bonusRatio}%
        </p>
      </div>
    );
  }
  
  return null;
};

/**
 * DeptStackedBar component
 * Shows how total compensation is split between base and bonus per department
 */
const DeptStackedBar: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { summary } = state;
  
  // Prepare data for the stacked bar chart
  const barData = useMemo(() => {
    if (!summary || !summary.dept_totals) return [];
    
    // Convert department totals to array format for the chart
    const deptData = Object.entries(summary.dept_totals).map(([dept, values]: [string, any]) => ({
      department: dept,
      base: parseFloat(values.base) || 0,
      bonus: parseFloat(values.bonus) || 0,
      total: parseFloat(values.total) || 0
    }));
    
    // Sort by total compensation (descending)
    return deptData.sort((a, b) => b.total - a.total);
  }, [summary]);
  
  // If no data, return empty chart card
  if (!summary || !summary.dept_totals || barData.length === 0) {
    return (
      <ChartCard 
        title="Department Compensation Breakdown" 
        description="Run a simulation to see compensation breakdown by department"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Department Compensation Breakdown" 
      description="Shows how total compensation is split between base salary and bonus for each department"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" />
          <YAxis 
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(value)
            }
            label={{ 
              value: 'Compensation ($)', 
              angle: -90, 
              position: 'insideLeft' 
            }}
          />
          <Tooltip content={<StackedBarTooltip />} />
          <Legend />
          <Bar 
            dataKey="base" 
            name="Base Salary" 
            stackId="a" 
            fill={theme.palette.primary.main} 
          />
          <Bar 
            dataKey="bonus" 
            name="Bonus" 
            stackId="a" 
            fill={theme.palette.secondary.main} 
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default DeptStackedBar;

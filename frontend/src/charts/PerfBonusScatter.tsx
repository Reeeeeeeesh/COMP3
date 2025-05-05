/**
 * PerfBonusScatter Component
 * 
 * Displays a scatter plot showing the relationship between performance ratings and bonuses
 */

import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';

// Custom tooltip for the scatter plot
const ScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
        <p style={{ margin: 0 }}>
          Department: {data.department}
        </p>
        <p style={{ margin: 0 }}>
          Performance Rating: {data.performanceRating}
        </p>
        <p style={{ margin: 0 }}>
          Bonus: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(data.bonus)}
        </p>
        <p style={{ margin: 0 }}>
          AUM: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(data.aum)}
        </p>
      </div>
    );
  }
  
  return null;
};

/**
 * PerfBonusScatter component
 * Shows relationship between performance ratings and bonuses
 * Dot size represents AUM, color represents department
 */
const PerfBonusScatter: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { results, employees } = state;
  
  // Department colors for the scatter plot
  const departmentColors = useMemo(() => {
    return {
      'Global Equities': theme.palette.primary.main,
      'Alternatives': theme.palette.secondary.main,
      'Quant Strategies': theme.palette.info.main,
      'Fixed Income': theme.palette.success.main,
      'Multi-Asset': theme.palette.warning.main
    };
  }, [theme]);
  
  // Prepare data for the scatter plot
  const scatterData = useMemo(() => {
    if (!results || !employees) return [];
    
    // Create a map of employee IDs to employee data
    const employeeMap = new Map();
    employees.forEach((employee: any) => {
      employeeMap.set(employee.id, employee);
    });
    
    // Create scatter data points
    return results.map((result: any) => {
      const employee = employeeMap.get(result.employee_id);
      if (!employee) return null;
      
      return {
        name: employee.name || `Employee ${result.employee_id}`,
        department: employee.department || 'Unknown',
        performanceRating: parseInt(employee.performance_rating) || 3,
        bonus: parseFloat(result.bonus || '0'),
        aum: parseFloat(employee.aum || '0'),
        // For ZAxis (bubble size) - scale AUM to a reasonable range
        z: Math.sqrt(parseFloat(employee.aum || '0')) / 10
      };
    }).filter(Boolean);
  }, [results, employees]);
  
  // Group scatter data by department for multiple series
  const scatterDataByDepartment = useMemo(() => {
    if (!scatterData.length) return [];
    
    // Get unique departments
    const departments = [...new Set(scatterData.map((d: any) => d.department))];
    
    // Create a series for each department
    return departments.map(department => ({
      name: department,
      data: scatterData.filter((d: any) => d.department === department),
      fill: departmentColors[department as keyof typeof departmentColors] || theme.palette.grey[500]
    }));
  }, [scatterData, departmentColors, theme]);
  
  // If no data, return empty chart card
  if (!results || !employees || scatterData.length === 0) {
    return (
      <ChartCard 
        title="Performance vs. Bonus" 
        description="Run a simulation to see the relationship between performance ratings and bonuses"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Performance vs. Bonus" 
      description="Shows relationship between performance ratings and bonuses. Dot size represents AUM, color represents department."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="performanceRating" 
            name="Performance Rating" 
            domain={[0, 6]}
            label={{ 
              value: 'Performance Rating', 
              position: 'insideBottom', 
              offset: -5 
            }}
            ticks={[1, 2, 3, 4, 5]}
          />
          <YAxis 
            type="number" 
            dataKey="bonus" 
            name="Bonus" 
            label={{ 
              value: 'Bonus ($)', 
              angle: -90, 
              position: 'insideLeft' 
            }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 0
              }).format(value)
            }
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip content={<ScatterTooltip />} />
          <Legend />
          
          {scatterDataByDepartment.map((series) => (
            <Scatter 
              key={series.name} 
              name={series.name} 
              data={series.data} 
              fill={series.fill}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default PerfBonusScatter;

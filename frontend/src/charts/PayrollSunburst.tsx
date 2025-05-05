/**
 * PayrollSunburst Component
 * 
 * Displays a treemap showing the hierarchical breakdown of compensation by department and role
 */

import React, { useMemo } from 'react';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useTheme, Box, Typography } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';

// Custom tooltip for the treemap
const TreemapTooltip = ({ active, payload }: any) => {
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
          {data.depth === 1 ? 'Department' : 'Role'} Total: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(data.value)}
        </p>
        {data.depth === 2 && (
          <p style={{ margin: 0 }}>
            Department: {data.parent}
          </p>
        )}
        <p style={{ margin: 0 }}>
          Share of Total: {(data.value / data.root).toFixed(1)}%
        </p>
      </div>
    );
  }
  
  return null;
};

// Custom content for treemap cells
const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, depth, value, root, colors } = props;
  
  // Format value as currency
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
  
  // Calculate percentage of total
  const percentage = (value / root * 100).toFixed(1);
  
  // Determine text color based on background brightness
  const getContrastText = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark backgrounds, black for light backgrounds
    return brightness > 128 ? '#000000' : '#ffffff';
  };
  
  // Get background color based on depth
  const backgroundColor = colors[depth - 1];
  const textColor = getContrastText(backgroundColor);
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: backgroundColor,
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 50 && height > 30 ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: depth === 1 ? 14 : 12,
            fontWeight: depth === 1 ? 'bold' : 'normal',
            fill: textColor,
          }}
        >
          {name}
        </text>
      ) : null}
      {width > 100 && height > 50 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: 11,
            fill: textColor,
          }}
        >
          {formattedValue} ({percentage}%)
        </text>
      ) : null}
    </g>
  );
};

/**
 * PayrollSunburst component
 * Shows which roles drive payroll cost inside each department
 */
const PayrollSunburst: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { summary } = state;
  
  // Define colors for the treemap
  const colors = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ], [theme]);
  
  // Prepare data for the treemap
  const treemapData = useMemo(() => {
    if (!summary || !summary.role_totals) return [];
    
    // Get total payroll
    const totalPayroll = parseFloat(summary.total_payroll || '0');
    
    // Convert role totals to hierarchical format for the treemap
    const hierarchicalData = {
      name: 'Total Payroll',
      value: totalPayroll,
      children: Object.entries(summary.role_totals).map(([dept, roles]: [string, any], deptIndex) => {
        // Calculate department total
        const deptTotal = Object.values(roles).reduce((sum: number, value: any) => sum + parseFloat(value), 0);
        
        return {
          name: dept,
          value: deptTotal,
          // Add department index for color assignment
          deptIndex,
          // Add children for each role
          children: Object.entries(roles).map(([role, value]: [string, any], roleIndex) => ({
            name: role,
            value: parseFloat(value),
            parent: dept,
            // Add role index for color assignment
            roleIndex
          }))
        };
      })
    };
    
    return [hierarchicalData];
  }, [summary]);
  
  // If no data, return empty chart card
  if (!summary || !summary.role_totals || treemapData.length === 0) {
    return (
      <ChartCard 
        title="Payroll Cost Drivers" 
        description="Run a simulation to see which roles drive payroll costs in each department"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Payroll Cost Drivers" 
      description="Shows which roles drive payroll cost inside each department"
    >
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="value"
          aspectRatio={4/3}
          stroke="#fff"
          fill={theme.palette.primary.main}
          content={<CustomizedContent colors={colors} root={parseFloat(summary.total_payroll)} />}
        >
          <Tooltip content={<TreemapTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default PayrollSunburst;

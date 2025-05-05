/**
 * WaterfallChart Component
 * 
 * Displays a waterfall/bridge chart showing the step-by-step impact on payroll
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
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';

// Custom shape for the waterfall bars with connecting bridges
const WaterfallBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      {/* Draw connecting bridge to next bar if not the last bar */}
      {props.index < props.allBars.length - 1 && (
        <line
          x1={x + width}
          y1={y + height}
          x2={props.nextX}
          y2={y + height}
          stroke="#999"
          strokeDasharray="3 3"
        />
      )}
    </g>
  );
};

// Custom tooltip for the waterfall chart
const WaterfallTooltip = ({ active, payload, label }: any) => {
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
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: 0 }}>
          Value: {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(data.value)}
        </p>
        {data.description && (
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
            {data.description}
          </p>
        )}
      </div>
    );
  }
  
  return null;
};

/**
 * WaterfallChart component
 * Shows step-by-step impact: Last-year payroll → Pay-rise delta → Bonus delta → 
 * Flags-driven adjustments → New payroll
 */
const WaterfallChart: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { results, summary } = state;
  
  // Prepare data for the waterfall chart
  const chartData = useMemo(() => {
    if (!results || !summary) return [];
    
    // Calculate the total original base salary
    const totalOriginalBase = results.reduce((sum, result) => {
      return sum + parseFloat(result.original_base || '0');
    }, 0);
    
    // Calculate the total adjusted base salary
    const totalAdjustedBase = results.reduce((sum, result) => {
      return sum + parseFloat(result.adjusted_base || '0');
    }, 0);
    
    // Calculate the total bonus
    const totalBonus = results.reduce((sum, result) => {
      return sum + parseFloat(result.bonus || '0');
    }, 0);
    
    // Calculate the base salary change
    const baseSalaryChange = totalAdjustedBase - totalOriginalBase;
    
    // Calculate flag-driven adjustments (if any)
    const flagAdjustments = results.reduce((sum, result) => {
      // If there are flags, assume some adjustment was made
      if (result.flags && result.flags.length > 0) {
        // This is a simplified approximation - in a real system, 
        // we would have actual flag-driven adjustment values
        const estimatedAdjustment = 
          result.flags.includes('MRT_DECREASE') ? -5000 : 
          result.flags.includes('HIGH_INCREASE') ? 2000 : 0;
        
        return sum + estimatedAdjustment;
      }
      return sum;
    }, 0);
    
    // Create the waterfall data
    return [
      {
        name: 'Last Year Payroll',
        value: totalOriginalBase,
        description: 'Total base salary before adjustments',
        fill: theme.palette.primary.main
      },
      {
        name: 'Base Salary Change',
        value: baseSalaryChange,
        description: `Impact of ${summary.avg_base_increase}% revenue change`,
        fill: baseSalaryChange >= 0 ? theme.palette.success.main : theme.palette.error.main
      },
      {
        name: 'Bonus Impact',
        value: totalBonus,
        description: 'Performance-based bonuses',
        fill: theme.palette.secondary.main
      },
      {
        name: 'Flag Adjustments',
        value: flagAdjustments,
        description: `Adjustments from ${summary.total_flags} compliance flags`,
        fill: flagAdjustments >= 0 ? theme.palette.info.main : theme.palette.warning.main
      },
      {
        name: 'New Payroll',
        value: parseFloat(summary.total_payroll),
        description: 'Total compensation after all adjustments',
        fill: theme.palette.primary.dark
      }
    ];
  }, [results, summary, theme]);
  
  // If no data, return empty chart card
  if (!results || !summary || chartData.length === 0) {
    return (
      <ChartCard 
        title="Payroll Impact Analysis" 
        description="Run a simulation to see the step-by-step impact on total payroll"
      >
        <div>No data available</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Payroll Impact Analysis" 
      description="Shows step-by-step impact on total payroll from last year to new compensation"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(value)
            }
          />
          <Tooltip content={<WaterfallTooltip />} />
          <Legend />
          <ReferenceLine y={0} stroke="#000" />
          <Bar 
            dataKey="value" 
            shape={<WaterfallBar />}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default WaterfallChart;

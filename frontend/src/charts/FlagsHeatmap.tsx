/**
 * FlagsHeatmap Component
 * 
 * Displays a heatmap showing the distribution of compliance flags by department
 */

import React, { useMemo } from 'react';
import { useTheme, Box } from '@mui/material';
import ChartCard from './ChartCard';
import { useScenario } from '../SimpleContext';

// Since Recharts doesn't have a built-in heatmap, we'll create a custom implementation
const CustomHeatmap = ({ data, xLabels, yLabels, colorScale }: any) => {
  const theme = useTheme();
  
  // Calculate cell dimensions
  const cellWidth = 100 / xLabels.length;
  const cellHeight = 100 / yLabels.length;
  
  // Get the maximum value for color scaling
  const maxValue = Math.max(...data.map((cell: any) => cell.value));
  
  // Function to determine cell color based on value
  const getCellColor = (value: number) => {
    if (value === 0) return theme.palette.grey[200];
    
    // Calculate color intensity (0-1)
    const intensity = value / maxValue;
    
    // Use the provided color scale
    if (intensity < 0.25) return colorScale[0];
    if (intensity < 0.5) return colorScale[1];
    if (intensity < 0.75) return colorScale[2];
    return colorScale[3];
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Y-axis labels */}
      <Box 
        sx={{ 
          position: 'absolute', 
          left: 0, 
          top: 0, 
          bottom: 0, 
          width: '120px', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          pr: 1,
          pt: cellHeight / 2,
          pb: cellHeight / 2
        }}
      >
        {yLabels.map((label: string) => (
          <Box 
            key={label} 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: '0.75rem',
              textAlign: 'right',
              height: `${cellHeight}%`
            }}
          >
            {label}
          </Box>
        ))}
      </Box>
      
      {/* X-axis labels */}
      <Box 
        sx={{ 
          position: 'absolute', 
          left: '120px', 
          top: 0, 
          right: 0, 
          height: '30px', 
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        {xLabels.map((label: string) => (
          <Box 
            key={label} 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: '0.75rem',
              width: `${cellWidth}%`,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {label}
          </Box>
        ))}
      </Box>
      
      {/* Heatmap grid */}
      <Box 
        sx={{ 
          position: 'absolute', 
          left: '120px', 
          top: '30px', 
          right: 0, 
          bottom: 0, 
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {yLabels.map((yLabel: string, yIndex: number) => (
          <Box 
            key={yLabel} 
            sx={{ 
              display: 'flex', 
              height: `${cellHeight}%`
            }}
          >
            {xLabels.map((xLabel: string, xIndex: number) => {
              // Find the cell data for this x,y position
              const cell = data.find((d: any) => 
                d.x === xLabel && d.y === yLabel
              ) || { value: 0 };
              
              return (
                <Box 
                  key={`${xLabel}-${yLabel}`} 
                  sx={{ 
                    width: `${cellWidth}%`, 
                    height: '100%', 
                    backgroundColor: getCellColor(cell.value),
                    border: '1px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: cell.value > 0 ? 'bold' : 'normal',
                    color: cell.value > maxValue / 2 ? 'white' : 'black',
                    '&:hover': {
                      opacity: 0.8,
                      cursor: 'pointer'
                    }
                  }}
                  title={`${yLabel} - ${xLabel}: ${cell.value}`}
                >
                  {cell.value > 0 ? cell.value : ''}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      
      {/* Legend */}
      <Box 
        sx={{ 
          position: 'absolute', 
          right: 0, 
          bottom: '-30px', 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '0.75rem'
        }}
      >
        <Box sx={{ fontWeight: 'bold' }}>Severity:</Box>
        {colorScale.map((color: string, index: number) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: color,
                border: '1px solid #ccc'
              }} 
            />
            <Box>
              {index === 0 ? 'Low' : 
               index === 1 ? 'Medium' : 
               index === 2 ? 'High' : 'Critical'}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * FlagsHeatmap component
 * Shows where compliance / salary-band issues are concentrated
 */
const FlagsHeatmap: React.FC = () => {
  const theme = useTheme();
  const { state } = useScenario();
  const { summary } = state;
  
  // Define color scale for the heatmap
  const colorScale = useMemo(() => [
    theme.palette.warning.light,
    theme.palette.warning.main,
    theme.palette.error.light,
    theme.palette.error.main
  ], [theme]);
  
  // Prepare data for the heatmap
  const { heatmapData, departments, flagTypes } = useMemo(() => {
    if (!summary || !summary.flag_matrix) {
      return { heatmapData: [], departments: [], flagTypes: [] };
    }
    
    // Extract departments and flag types from the flag matrix
    const deptSet = new Set<string>();
    const flagSet = new Set<string>();
    const data: { x: string, y: string, value: number }[] = [];
    
    // Process flag matrix data
    Object.entries(summary.flag_matrix).forEach(([key, count]) => {
      // Key format is (department, flag_type)
      const keyParts = key.replace(/[()]/g, '').split(', ');
      if (keyParts.length === 2) {
        const [dept, flagType] = keyParts;
        
        // Add to sets
        deptSet.add(dept);
        flagSet.add(flagType);
        
        // Add to data array
        data.push({
          x: flagType,
          y: dept,
          value: count as number
        });
      }
    });
    
    // Convert sets to arrays
    const departments = Array.from(deptSet);
    const flagTypes = Array.from(flagSet);
    
    return { heatmapData: data, departments, flagTypes };
  }, [summary]);
  
  // If no data, return empty chart card
  if (!summary || !summary.flag_matrix || heatmapData.length === 0) {
    return (
      <ChartCard 
        title="Compliance Flag Distribution" 
        description="Run a simulation to see where compliance issues are concentrated"
        height={300}
      >
        <div>No compliance flags detected</div>
      </ChartCard>
    );
  }
  
  return (
    <ChartCard 
      title="Compliance Flag Distribution" 
      description="Shows where compliance and salary-band issues are concentrated by department"
      height={300}
    >
      <CustomHeatmap 
        data={heatmapData}
        xLabels={flagTypes}
        yLabels={departments}
        colorScale={colorScale}
      />
    </ChartCard>
  );
};

export default FlagsHeatmap;

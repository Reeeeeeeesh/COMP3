/**
 * RevenueDeltaSlider Component
 * 
 * Slider for adjusting the revenue delta percentage in the scenario
 */

import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useScenario } from '../../context/ScenarioContext';
import { ActionType } from '../../types';

/**
 * RevenueDeltaSlider component
 * Allows users to adjust the revenue delta percentage (-20% to +20%)
 */
const RevenueDeltaSlider: React.FC = () => {
  const { state, dispatch } = useScenario();
  
  // Get the revenue delta value from state
  const displayValue = state.scenario.revenueDelta;
  
  /**
   * Handle slider change
   * @param event - Change event
   * @param newValue - New slider value
   */
  const handleChange = (_event: Event, newValue: number | number[]) => {
    dispatch({
      type: ActionType.SET_SCENARIO,
      payload: { revenueDelta: newValue as number }
    });
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography id="revenue-delta-slider-label" gutterBottom>
        Revenue Change: {displayValue > 0 ? '+' : ''}{displayValue}%
      </Typography>
      <Slider
        aria-labelledby="revenue-delta-slider-label"
        value={displayValue}
        onChange={handleChange}
        min={-20}
        max={20}
        step={1}
        marks={[
          { value: -20, label: '-20%' },
          { value: -10, label: '-10%' },
          { value: 0, label: '0%' },
          { value: 10, label: '+10%' },
          { value: 20, label: '+20%' }
        ]}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value > 0 ? '+' : ''}${value}%`}
        sx={{ 
          '& .MuiSlider-valueLabel': { 
            bgcolor: 'primary.main' 
          } 
        }}
      />
    </Box>
  );
};

export default RevenueDeltaSlider;

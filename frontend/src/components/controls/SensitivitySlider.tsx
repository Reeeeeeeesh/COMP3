/**
 * SensitivitySlider Component
 * 
 * Slider for adjusting the adjustment factor (sensitivity) in the scenario
 */

import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { useScenario } from '../../context/ScenarioContext';
import { ActionType } from '../../types';

/**
 * SensitivitySlider component
 * Allows users to adjust the adjustment factor (0% to 100%)
 */
const SensitivitySlider: React.FC = () => {
  const { state, dispatch } = useScenario();
  
  // Get the sensitivity factor value from state
  const displayValue = state.scenario.sensitivityFactor;
  
  /**
   * Handle slider change
   * @param event - Change event
   * @param newValue - New slider value
   */
  const handleChange = (_event: Event, newValue: number | number[]) => {
    dispatch({
      type: ActionType.SET_SCENARIO,
      payload: { sensitivityFactor: newValue as number }
    });
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography id="sensitivity-slider-label" gutterBottom>
        Adjustment Factor: {displayValue}%
      </Typography>
      <Slider
        aria-labelledby="sensitivity-slider-label"
        value={displayValue}
        onChange={handleChange}
        min={0}
        max={100}
        step={5}
        marks={[
          { value: 0, label: '0%' },
          { value: 25, label: '25%' },
          { value: 50, label: '50%' },
          { value: 75, label: '75%' },
          { value: 100, label: '100%' }
        ]}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}%`}
        sx={{ 
          '& .MuiSlider-valueLabel': { 
            bgcolor: 'primary.main' 
          } 
        }}
      />
    </Box>
  );
};

export default SensitivitySlider;

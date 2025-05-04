/**
 * Simple test component to verify React rendering
 */

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const TestComponent: React.FC = () => {
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Test Component
      </Typography>
      <Typography variant="body1" paragraph>
        If you can see this message, React components are rendering correctly!
      </Typography>
      <Button 
        variant="contained"
        color="primary"
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </Button>
    </Paper>
  );
};

export default TestComponent;

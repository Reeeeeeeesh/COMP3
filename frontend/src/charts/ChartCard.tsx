/**
 * ChartCard Component
 * 
 * A reusable wrapper for chart components with consistent styling and layout
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface ChartCardProps {
  title: string;
  description?: string;
  height?: number | string;
  children: React.ReactNode;
}

/**
 * ChartCard component
 * A Material-UI Card wrapper for chart components with consistent styling
 */
const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  height = 400,
  children
}) => {
  const theme = useTheme();

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: height,
        display: 'flex',
        flexDirection: 'column',
        mb: 3
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {description && (
              <Tooltip title={description} arrow placement="top">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        sx={{ 
          pb: 0,
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem',
          }
        }}
      />
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          pt: 1,
          '&:last-child': {
            pb: 2
          }
        }}
      >
        <Box 
          sx={{ 
            flexGrow: 1, 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartCard;

/**
 * CompTable Component
 * 
 * Displays employee data and compensation results in a DataGrid
 * Supports inline editing for specific fields
 */

import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  Chip,
  useTheme
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueFormatterParams,
  GridCellParams,
  GridRenderCellParams,
  GridValueGetterParams,
  GridPreProcessEditCellProps,
  GridCellEditStopParams,
  GridEventListener,
  GridCellEditStopReasons
} from '@mui/x-data-grid';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useScenario } from '../../context/ScenarioContext';
import { Employee, CompResult, ActionType } from '../../types';
import * as Yup from 'yup';

// Validation schema for employee data
const employeeValidationSchema = Yup.object().shape({
  base_salary: Yup.number()
    .positive('Salary must be positive')
    .required('Salary is required'),
  performance_rating: Yup.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .required('Rating is required'),
  quintile: Yup.string()
    .oneOf(['Q1', 'Q2', 'Q3', 'Q4', 'Q5'], 'Invalid quintile')
    .required('Quintile is required'),
  aum: Yup.number()
    .min(0, 'AUM must be non-negative')
    .required('AUM is required'),
});

// Currency formatter
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Percentage formatter
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * CompTable component
 * Displays employee data and compensation results in a DataGrid
 */
const CompTable: React.FC = () => {
  const theme = useTheme();
  const { state, dispatch } = useScenario();
  const { employees, results } = state;

  // Handle cell edit stop
  const handleCellEditStop: GridEventListener<'cellEditStop'> = useCallback(
    (params, event) => {
      if (params.reason === GridCellEditStopReasons.enterKeyDown || 
          params.reason === GridCellEditStopReasons.tabKeyDown) {
        const { id, field, value } = params as GridCellEditStopParams;
        
        try {
          const employee = employees.find(emp => emp.id === id);
          
          if (!employee) return;
          
          // Create updated employee object for validation
          const updatedEmployee = { ...employee, [field]: value };
          
          // Validate the updated field
          employeeValidationSchema.validateSyncAt(field as string, updatedEmployee);
          
          // Dispatch update action
          dispatch({
            type: ActionType.UPDATE_EMPLOYEE,
            payload: {
              id: id as string,
              field: field as keyof Employee,
              value,
            },
          });
        } catch (error) {
          console.error('Validation error:', error);
          // Error handling could be improved with a UI notification
        }
      }
    },
    [employees, dispatch]
  );

  // Define columns for the DataGrid
  const columns = useMemo<GridColDef[]>(
    () => [
      { 
        field: 'id', 
        headerName: 'ID', 
        width: 100,
        editable: false,
      },
      { 
        field: 'name', 
        headerName: 'Name', 
        width: 180,
        editable: true,
      },
      { 
        field: 'department', 
        headerName: 'Department', 
        width: 150,
        editable: true,
      },
      { 
        field: 'role', 
        headerName: 'Role', 
        width: 150,
        editable: true,
      },
      { 
        field: 'base_salary', 
        headerName: 'Base Salary', 
        type: 'number',
        width: 150,
        editable: true,
        valueFormatter: (params: GridValueFormatterParams) => 
          formatCurrency(params.value as number),
        preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
          const hasError = isNaN(Number(params.props.value)) || Number(params.props.value) <= 0;
          return { ...params.props, error: hasError };
        },
      },
      { 
        field: 'performance_rating', 
        headerName: 'Performance', 
        type: 'number',
        width: 120,
        editable: true,
        preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
          const value = Number(params.props.value);
          const hasError = isNaN(value) || value < 1 || value > 5;
          return { ...params.props, error: hasError };
        },
      },
      { 
        field: 'quintile', 
        headerName: 'Quintile', 
        width: 120,
        editable: true,
        type: 'singleSelect',
        valueOptions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
      },
      { 
        field: 'aum', 
        headerName: 'AUM ($M)', 
        type: 'number',
        width: 120,
        editable: true,
        valueFormatter: (params: GridValueFormatterParams) => 
          params.value ? `$${params.value}M` : '-',
        preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
          const hasError = isNaN(Number(params.props.value)) || Number(params.props.value) < 0;
          return { ...params.props, error: hasError };
        },
      },
      { 
        field: 'is_mrt', 
        headerName: 'MRT', 
        width: 100,
        type: 'boolean',
        editable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Chip 
            label={params.value ? 'Yes' : 'No'} 
            color={params.value ? 'secondary' : 'default'} 
            size="small" 
          />
        ),
      },
    ],
    []
  );

  // Define additional columns for results
  const resultColumns = useMemo<GridColDef[]>(
    () => [
      { 
        field: 'adjusted_salary', 
        headerName: 'Adjusted Salary', 
        type: 'number',
        width: 150,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => {
          if (!results) return null;
          const result = results.find(r => r.employee_id === params.row.id);
          return result ? result.adjusted_salary : null;
        },
        valueFormatter: (params: GridValueFormatterParams) => 
          params.value ? formatCurrency(params.value as number) : '-',
      },
      { 
        field: 'salary_increase', 
        headerName: 'Increase %', 
        type: 'number',
        width: 120,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => {
          if (!results) return null;
          const result = results.find(r => r.employee_id === params.row.id);
          if (!result) return null;
          
          const baseSalary = params.row.base_salary;
          if (!baseSalary) return null;
          
          return ((result.adjusted_salary / baseSalary) - 1) * 100;
        },
        valueFormatter: (params: GridValueFormatterParams) => 
          params.value !== null ? formatPercentage(params.value as number) : '-',
        cellClassName: (params: GridCellParams) => {
          if (params.value === null) return '';
          return (params.value as number) > 0 ? 'positive-value' : 'negative-value';
        },
      },
      { 
        field: 'bonus', 
        headerName: 'Bonus', 
        type: 'number',
        width: 150,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => {
          if (!results) return null;
          const result = results.find(r => r.employee_id === params.row.id);
          return result ? result.bonus : null;
        },
        valueFormatter: (params: GridValueFormatterParams) => 
          params.value ? formatCurrency(params.value as number) : '-',
      },
      { 
        field: 'total_comp', 
        headerName: 'Total Comp', 
        type: 'number',
        width: 150,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => {
          if (!results) return null;
          const result = results.find(r => r.employee_id === params.row.id);
          return result ? result.adjusted_salary + result.bonus : null;
        },
        valueFormatter: (params: GridValueFormatterParams) => 
          params.value ? formatCurrency(params.value as number) : '-',
      },
      { 
        field: 'flags', 
        headerName: 'Flags', 
        width: 120,
        editable: false,
        sortable: false,
        filterable: false,
        valueGetter: (params: GridValueGetterParams) => {
          if (!results) return null;
          const result = results.find(r => r.employee_id === params.row.id);
          return result ? result.flags : null;
        },
        renderCell: (params: GridRenderCellParams) => {
          const flags = params.value as string[] | null;
          if (!flags || flags.length === 0) {
            return (
              <Tooltip title="No issues detected">
                <CheckCircleIcon color="success" />
              </Tooltip>
            );
          }
          
          return (
            <Tooltip title={flags.join(', ')}>
              <WarningIcon color="error" />
            </Tooltip>
          );
        },
      },
    ],
    [results]
  );

  // Combine columns based on whether results are available
  const displayColumns = useMemo(() => {
    return results ? [...columns, ...resultColumns] : columns;
  }, [columns, resultColumns, results]);

  // Prepare rows for the DataGrid
  const rows = useMemo(() => {
    return employees || [];
  }, [employees]);

  return (
    <Paper
      elevation={2}
      sx={{
        height: 500,
        width: '100%',
        mb: 4,
        '& .positive-value': {
          color: theme.palette.success.main,
          fontWeight: 'bold',
        },
        '& .negative-value': {
          color: theme.palette.error.main,
          fontWeight: 'bold',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6">
          Employee Compensation Data
          {results && (
            <Typography component="span" variant="subtitle2" sx={{ ml: 2, color: 'text.secondary' }}>
              ({rows.length} employees)
            </Typography>
          )}
        </Typography>
      </Box>
      
      <DataGrid
        rows={rows}
        columns={displayColumns}
        autoPageSize
        disableRowSelectionOnClick
        onCellEditStop={handleCellEditStop}
        getRowHeight={() => 'auto'}
        sx={{
          '& .MuiDataGrid-cell': {
            py: 1,
          },
        }}
      />
    </Paper>
  );
};

export default CompTable;

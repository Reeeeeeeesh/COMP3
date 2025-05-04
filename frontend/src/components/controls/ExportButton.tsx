/**
 * ExportButton Component
 * 
 * Provides functionality to export compensation results to CSV
 */

import React, { useCallback } from 'react';
import { Button, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Parser } from 'json2csv';
import { useScenario } from '../../context/ScenarioContext';
import { Employee, CompResult } from '../../types';

/**
 * ExportButton component
 * Allows users to export compensation results to CSV
 */
const ExportButton: React.FC = () => {
  const { state } = useScenario();
  const { employees, results } = state;
  
  /**
   * Prepare data for CSV export by combining employee data with results
   */
  const prepareExportData = useCallback(() => {
    if (!employees || !results) return [];
    
    return employees.map(employee => {
      // Find the corresponding result for this employee
      const result = results.find(r => r.employee_id === employee.id);
      
      if (!result) return employee;
      
      // Combine employee data with calculation results
      return {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        is_mrt: employee.is_mrt ? 'Yes' : 'No',
        base_salary: employee.base_salary,
        performance_rating: employee.performance_rating,
        quintile: employee.quintile,
        aum: employee.aum,
        adjusted_salary: result.adjusted_salary,
        salary_change: result.salary_change,
        salary_increase_percent: ((result.adjusted_salary / employee.base_salary) - 1) * 100,
        bonus: result.bonus,
        total_compensation: result.adjusted_salary + result.bonus,
        flags: result.flags.join(', ')
      };
    });
  }, [employees, results]);
  
  /**
   * Format date for filename
   */
  const formatDate = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  
  /**
   * Handle export button click
   */
  const handleExport = useCallback(() => {
    try {
      // Prepare data for export
      const exportData = prepareExportData();
      
      if (exportData.length === 0) {
        console.error('No data to export');
        return;
      }
      
      // Define fields for CSV
      const fields = [
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Department', value: 'department' },
        { label: 'Role', value: 'role' },
        { label: 'MRT', value: 'is_mrt' },
        { label: 'Base Salary', value: 'base_salary' },
        { label: 'Performance Rating', value: 'performance_rating' },
        { label: 'Quintile', value: 'quintile' },
        { label: 'AUM ($M)', value: 'aum' },
        { label: 'Adjusted Salary', value: 'adjusted_salary' },
        { label: 'Salary Change', value: 'salary_change' },
        { label: 'Increase %', value: 'salary_increase_percent' },
        { label: 'Bonus', value: 'bonus' },
        { label: 'Total Compensation', value: 'total_compensation' },
        { label: 'Flags', value: 'flags' }
      ];
      
      // Create JSON to CSV parser
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(exportData);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set link properties
      link.setAttribute('href', url);
      link.setAttribute('download', `compensation_results_${formatDate()}.csv`);
      link.style.visibility = 'hidden';
      
      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }, [prepareExportData]);
  
  return (
    <Tooltip title="Export results to CSV">
      <span>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={!results || results.length === 0}
          sx={{ ml: 2 }}
        >
          Export Results
        </Button>
      </span>
    </Tooltip>
  );
};

export default ExportButton;

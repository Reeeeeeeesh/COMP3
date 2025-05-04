/**
 * Compensation Service
 * 
 * Handles API communication with the backend for the Compensation Calculator
 */

import axios from 'axios';
import { Employee, CompResult, Summary, ScenarioConfig } from '../types';

// Base API URL
const API_URL = '/api';

// Axios instance with common configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload employee data
 * @param employees Array of employee objects
 * @returns Promise with the response data
 */
export const uploadEmployees = async (employees: Employee[]): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post('/upload-data/', employees);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to upload employee data');
    }
    throw error;
  }
};

/**
 * Upload CSV file with employee data
 * @param file CSV file to upload
 * @returns Promise with the response data
 */
export const uploadCsvFile = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload-data/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to upload CSV file');
    }
    throw error;
  }
};

/**
 * Calculate compensation based on employee data and scenario configuration
 * @param employees Array of employee objects
 * @param scenario Scenario configuration
 * @returns Promise with calculation results and summary
 */
export const calculateScenario = async (
  employees: Employee[],
  scenario: ScenarioConfig
): Promise<{ results: CompResult[]; summary: Summary }> => {
  try {
    // Convert JavaScript values to backend-compatible format
    // Backend expects decimal values as strings for precision
    const payload = {
      employees,
      config: {
        revenue_delta: scenario.revenueDelta / 100, // Convert from percentage to decimal
        adjustment_factor: scenario.sensitivityFactor / 100, // Convert from percentage to decimal
      },
    };
    
    const response = await apiClient.post('/calculate/', payload);
    
    // Process the response data
    // Convert string decimal values back to numbers for frontend use
    const results = response.data.results.map((result: any) => ({
      ...result,
      adjusted_base: parseFloat(result.adjusted_base),
      base_salary_change: parseFloat(result.base_salary_change),
      performance_adjusted_bonus: parseFloat(result.performance_adjusted_bonus),
      total_compensation: parseFloat(result.total_compensation),
    }));
    
    const summary = {
      ...response.data.summary,
      total_payroll: parseFloat(response.data.summary.total_payroll),
      avg_base_increase: parseFloat(response.data.summary.avg_base_increase),
    };
    
    return { results, summary };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to calculate compensation');
    }
    throw error;
  }
};

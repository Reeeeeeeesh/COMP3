"""
API views for the compensation calculator.

This module provides the API endpoints for the compensation calculator,
exposing the functionality of the compensation engine to the frontend.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
import json
import csv
import io

from employees.compensation_engine import calculate_unified_compensation
from employees.analytics import generate_summary


class CalculateCompensationView(APIView):
    """
    API endpoint for calculating compensation.
    
    POST: Calculate compensation for a single employee or batch of employees.
    """
    
    def post(self, request, format=None):
        """
        Calculate compensation based on employee data and configuration.
        
        Args:
            request: HTTP request containing employee data and configuration
            
        Returns:
            Response: JSON response with calculated compensation
        """
        try:
            # Extract data from request
            data = request.data
            
            # Check if this is a single employee or batch calculation
            if 'employees' in data:
                # Batch calculation
                employees = data['employees']
                config = data['config']
                
                # Convert string values to Decimal for monetary fields
                self._convert_config_to_decimal(config)
                
                # Calculate compensation for each employee
                results = []
                for employee in employees:
                    # Convert string values to Decimal for monetary fields
                    self._convert_employee_to_decimal(employee)
                    
                    # Calculate compensation
                    result = calculate_unified_compensation(employee, config)
                    
                    # Convert Decimal objects to strings for JSON serialization
                    result = self._convert_decimal_to_str(result)
                    
                    # Add employee identifier to result
                    if 'id' in employee:
                        result['employee_id'] = employee['id']
                    
                    # Add department and role to result for analytics
                    if 'department' in employee:
                        result['department'] = employee['department']
                    if 'role' in employee:
                        result['role'] = employee['role']
                    
                    results.append(result)
                
                # Generate comprehensive summary using analytics module
                summary = generate_summary(results, employees, config)
                
                # Return both results and summary in the expected format
                return Response({
                    'results': results,
                    'summary': summary
                })
            else:
                # Single employee calculation
                employee = data['employee']
                config = data['config']
                
                # Convert string values to Decimal for monetary fields
                self._convert_config_to_decimal(config)
                self._convert_employee_to_decimal(employee)
                
                # Calculate compensation
                result = calculate_unified_compensation(employee, config)
                
                # Convert Decimal objects to strings for JSON serialization
                result = self._convert_decimal_to_str(result)
                
                # Add department and role to result for analytics
                if 'department' in employee:
                    result['department'] = employee['department']
                if 'role' in employee:
                    result['role'] = employee['role']
                
                # Create a minimal summary for single employee
                summary = generate_summary([result], [employee], config)
                
                # Return both result and summary in the expected format
                return Response({
                    'results': [result],
                    'summary': summary
                })
                
        except KeyError as e:
            return Response(
                {'error': f'Missing required field: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _convert_employee_to_decimal(self, employee):
        """
        Convert string values to Decimal for monetary fields in employee data.
        
        Args:
            employee: Employee data dictionary
        """
        decimal_fields = ['base_salary', 'aum', 'last_year_revenue']
        for field in decimal_fields:
            if field in employee and not isinstance(employee[field], Decimal):
                employee[field] = Decimal(str(employee[field]))
    
    def _convert_config_to_decimal(self, config):
        """
        Convert string values to Decimal for monetary fields in configuration.
        
        Args:
            config: Configuration dictionary
        """
        decimal_fields = [
            'revenue_delta', 
            'adjustment_factor', 
            'performance_multiplier_base',
            'salary_band_breach_threshold'
        ]
        
        for field in decimal_fields:
            if field in config and not isinstance(config[field], Decimal):
                config[field] = Decimal(str(config[field]))
        
        # Convert nested decimal values
        if 'SALARY_BANDS' in config:
            for role, bands in config['SALARY_BANDS'].items():
                for level, band in bands.items():
                    for key in ['min', 'max', 'target']:
                        if key in band and not isinstance(band[key], Decimal):
                            band[key] = Decimal(str(band[key]))
        
        if 'AUM_BRACKETS' in config:
            for bracket in range(len(config['AUM_BRACKETS'])):
                min_val = config['AUM_BRACKETS'][bracket][0]
                if min_val is not None and not isinstance(min_val, Decimal):
                    config['AUM_BRACKETS'][bracket] = (
                        Decimal(str(min_val)),
                        config['AUM_BRACKETS'][bracket][1]
                    )
                max_val = config['AUM_BRACKETS'][bracket][1]
                if max_val is not None and not isinstance(max_val, Decimal):
                    config['AUM_BRACKETS'][bracket] = (
                        config['AUM_BRACKETS'][bracket][0],
                        Decimal(str(max_val))
                    )
        
        if 'QUINTILE_MULTIPLIERS' in config:
            for quintile, value in config['QUINTILE_MULTIPLIERS'].items():
                if not isinstance(value, Decimal):
                    config['QUINTILE_MULTIPLIERS'][quintile] = Decimal(str(value))
        
        if 'management_fee_rate' in config and not isinstance(config['management_fee_rate'], Decimal):
            config['management_fee_rate'] = Decimal(str(config['management_fee_rate']))
    
    def _convert_decimal_to_str(self, data):
        """
        Convert Decimal objects to strings for JSON serialization.
        
        Args:
            data: Dictionary containing Decimal objects
            
        Returns:
            dict: Dictionary with Decimal objects converted to strings
        """
        result = {}
        for key, value in data.items():
            if isinstance(value, Decimal):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = self._convert_decimal_to_str(value)
            else:
                result[key] = value
        return result


class UploadDataView(APIView):
    """
    API endpoint for uploading employee data.
    
    POST: Upload employee data from a CSV file.
    """
    
    def post(self, request, format=None):
        """
        Upload employee data from a CSV file.
        
        Args:
            request: HTTP request containing CSV file
            
        Returns:
            Response: JSON response with parsed employee data
        """
        try:
            # Check if file is in request
            if 'file' not in request.FILES:
                # Check if JSON data was sent instead of a file
                if isinstance(request.data, list):
                    # Direct JSON payload of employees
                    return Response({'employees': request.data})
                elif 'employees' in request.data:
                    # JSON payload with employees key
                    return Response({'employees': request.data['employees']})
                else:
                    return Response(
                        {'error': 'No file or employee data provided'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get file from request
            file = request.FILES['file']
            
            # Check if file is CSV
            if not file.name.endswith('.csv'):
                return Response(
                    {'error': 'File must be a CSV'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse CSV file
            employees = []
            csv_file = io.StringIO(file.read().decode('utf-8'))
            reader = csv.DictReader(csv_file)
            
            for row in reader:
                # Convert numeric strings to appropriate types
                employee = {}
                for key, value in row.items():
                    # Skip empty values
                    if value == '':
                        continue
                    
                    # Convert to appropriate type
                    if key in ['base_salary', 'aum', 'last_year_revenue']:
                        try:
                            # Return as string to preserve precision
                            employee[key] = str(Decimal(value))
                        except ValueError:
                            employee[key] = value
                    elif key == 'team_size':
                        try:
                            employee[key] = int(value)
                        except ValueError:
                            employee[key] = value
                    elif key in ['is_mrt', 'mrt_status']:
                        employee['is_mrt'] = value.lower() in ['true', 'yes', '1']
                    else:
                        employee[key] = value
                
                employees.append(employee)
            
            return Response({'employees': employees})
            
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

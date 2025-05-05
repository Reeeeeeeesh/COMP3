"""
Analytics Module for Compensation Engine

This module provides aggregation and analysis functions for compensation data.
It generates summary statistics and distributions for visualization.
"""

from decimal import Decimal
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Any, Optional


def aggregate_department_totals(results: List[Dict[str, Any]]) -> Dict[str, Dict[str, Decimal]]:
    """
    Aggregate compensation totals by department.
    
    Args:
        results: List of compensation calculation results
        
    Returns:
        Dictionary with department totals for base salary, bonus, and total compensation
    """
    dept_totals = defaultdict(lambda: {'base': Decimal('0'), 'bonus': Decimal('0'), 'total': Decimal('0')})
    
    for result in results:
        # Skip if department is missing
        if 'department' not in result:
            continue
            
        department = result['department']
        adjusted_base = Decimal(result.get('adjusted_base', '0'))
        bonus = Decimal(result.get('bonus', '0'))
        total = adjusted_base + bonus
        
        dept_totals[department]['base'] += adjusted_base
        dept_totals[department]['bonus'] += bonus
        dept_totals[department]['total'] += total
    
    # Convert defaultdict to regular dict for serialization
    return {dept: dict(values) for dept, values in dept_totals.items()}


def build_flag_matrix(results: List[Dict[str, Any]]) -> Dict[Tuple[str, str], int]:
    """
    Build a matrix of flag counts by department and flag type.
    
    Args:
        results: List of compensation calculation results
        
    Returns:
        Dictionary with (department, flag_type) keys and count values
    """
    flag_matrix = defaultdict(int)
    
    for result in results:
        department = result.get('department', 'Unknown')
        flags = result.get('flags', [])
        
        for flag in flags:
            flag_matrix[(department, flag)] += 1
    
    # Convert defaultdict to regular dict for serialization
    return dict(flag_matrix)


def calculate_salary_change_histogram(results: List[Dict[str, Any]], 
                                     bin_width: int = 1) -> Dict[str, int]:
    """
    Calculate histogram of salary change percentages.
    
    Args:
        results: List of compensation calculation results
        bin_width: Width of histogram bins in percentage points
        
    Returns:
        Dictionary with bin ranges as keys and counts as values
    """
    # Extract salary change percentages
    changes = []
    for result in results:
        original_base = Decimal(result.get('original_base', '0'))
        adjusted_base = Decimal(result.get('adjusted_base', '0'))
        
        # Avoid division by zero
        if original_base > Decimal('0'):
            percent_change = ((adjusted_base / original_base) - Decimal('1')) * Decimal('100')
            changes.append(float(percent_change))
    
    # Create histogram bins
    if not changes:
        return {}
        
    min_change = min(changes)
    max_change = max(changes)
    
    # Round to nearest bin_width
    min_bin = int(min_change / bin_width) * bin_width
    max_bin = int(max_change / bin_width) * bin_width + bin_width
    
    bins = {}
    for i in range(min_bin, max_bin, bin_width):
        bin_key = f"{i}% to {i + bin_width}%"
        bins[bin_key] = 0
    
    # Count values in each bin
    for change in changes:
        bin_index = int(change / bin_width) * bin_width
        bin_key = f"{bin_index}% to {bin_index + bin_width}%"
        bins[bin_key] += 1
    
    return bins


def aggregate_role_totals(results: List[Dict[str, Any]]) -> Dict[str, Dict[str, Decimal]]:
    """
    Aggregate compensation totals by department and role.
    
    Args:
        results: List of compensation calculation results
        
    Returns:
        Nested dictionary with department -> role -> total compensation
    """
    role_totals = defaultdict(lambda: defaultdict(Decimal))
    
    for result in results:
        department = result.get('department', 'Unknown')
        role = result.get('role', 'Unknown')
        
        adjusted_base = Decimal(result.get('adjusted_base', '0'))
        bonus = Decimal(result.get('bonus', '0'))
        total = adjusted_base + bonus
        
        role_totals[department][role] += total
    
    # Convert nested defaultdicts to regular dicts for serialization
    return {dept: dict(roles) for dept, roles in role_totals.items()}


def generate_summary(results: List[Dict[str, Any]], 
                    employees: List[Dict[str, Any]],
                    config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate comprehensive summary statistics for compensation results.
    
    Args:
        results: List of compensation calculation results
        employees: List of employee data
        config: Configuration parameters used for calculation
        
    Returns:
        Dictionary with summary statistics
    """
    # Initialize summary
    summary = {
        'total_payroll': Decimal('0'),
        'avg_base_increase': Decimal('0'),
        'total_employees': len(employees),
        'mrt_breaches': 0,
        'total_flags': 0,
        'flag_distribution': defaultdict(int),
        'dept_totals': {},
        'role_totals': {},
        'flag_matrix': {},
        'salary_change_histogram': {},
        'version': '1.0.0'  # API version for frontend compatibility checks
    }
    
    # Skip if no results
    if not results:
        return summary
    
    # Calculate total payroll and count flags
    for result in results:
        adjusted_base = Decimal(result.get('adjusted_base', '0'))
        bonus = Decimal(result.get('bonus', '0'))
        total_compensation = adjusted_base + bonus
        
        # Update total payroll
        summary['total_payroll'] += total_compensation
        
        # Count flags
        flags = result.get('flags', [])
        summary['total_flags'] += len(flags)
        
        # Count MRT breaches
        if 'MRT_DECREASE' in flags:
            summary['mrt_breaches'] += 1
        
        # Update flag distribution
        for flag in flags:
            summary['flag_distribution'][flag] += 1
    
    # Calculate average base increase
    summary['avg_base_increase'] = config.get('revenue_delta', Decimal('0')) * config.get('adjustment_factor', Decimal('1'))
    
    # Generate department totals
    summary['dept_totals'] = aggregate_department_totals(results)
    
    # Generate role totals for sunburst/treemap
    summary['role_totals'] = aggregate_role_totals(results)
    
    # Generate flag matrix for heatmap
    summary['flag_matrix'] = build_flag_matrix(results)
    
    # Generate salary change histogram
    summary['salary_change_histogram'] = calculate_salary_change_histogram(results)
    
    # Convert defaultdicts to regular dicts for serialization
    summary['flag_distribution'] = dict(summary['flag_distribution'])
    
    # Convert Decimal objects to strings for JSON serialization
    summary['total_payroll'] = str(summary['total_payroll'])
    summary['avg_base_increase'] = str(summary['avg_base_increase'])
    
    return summary

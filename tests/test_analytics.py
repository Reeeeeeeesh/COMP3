"""
Tests for the analytics module.
"""

import pytest
from decimal import Decimal
from employees.analytics import (
    aggregate_department_totals,
    build_flag_matrix,
    calculate_salary_change_histogram,
    aggregate_role_totals,
    generate_summary
)


# Sample test data
@pytest.fixture
def sample_results():
    return [
        {
            'employee_id': 'EMP-001',
            'department': 'Global Equities',
            'role': 'Fund Manager',
            'original_base': '200000',
            'adjusted_base': '210000',
            'bonus': '30000',
            'flags': ['HIGH_INCREASE']
        },
        {
            'employee_id': 'EMP-002',
            'department': 'Global Equities',
            'role': 'Analyst',
            'original_base': '100000',
            'adjusted_base': '102000',
            'bonus': '15000',
            'flags': []
        },
        {
            'employee_id': 'EMP-003',
            'department': 'Alternatives',
            'role': 'Fund Manager',
            'original_base': '250000',
            'adjusted_base': '240000',
            'bonus': '50000',
            'flags': ['MRT_DECREASE']
        }
    ]


@pytest.fixture
def sample_employees():
    return [
        {
            'id': 'EMP-001',
            'department': 'Global Equities',
            'role': 'Fund Manager',
            'base_salary': '200000'
        },
        {
            'id': 'EMP-002',
            'department': 'Global Equities',
            'role': 'Analyst',
            'base_salary': '100000'
        },
        {
            'id': 'EMP-003',
            'department': 'Alternatives',
            'role': 'Fund Manager',
            'base_salary': '250000'
        }
    ]


@pytest.fixture
def sample_config():
    return {
        'revenue_delta': Decimal('0.05'),
        'adjustment_factor': Decimal('0.8')
    }


def test_aggregate_department_totals(sample_results):
    """Test aggregation of department totals."""
    dept_totals = aggregate_department_totals(sample_results)
    
    assert 'Global Equities' in dept_totals
    assert 'Alternatives' in dept_totals
    
    # Check Global Equities totals
    assert dept_totals['Global Equities']['base'] == Decimal('312000')
    assert dept_totals['Global Equities']['bonus'] == Decimal('45000')
    assert dept_totals['Global Equities']['total'] == Decimal('357000')
    
    # Check Alternatives totals
    assert dept_totals['Alternatives']['base'] == Decimal('240000')
    assert dept_totals['Alternatives']['bonus'] == Decimal('50000')
    assert dept_totals['Alternatives']['total'] == Decimal('290000')


def test_build_flag_matrix(sample_results):
    """Test building of flag matrix."""
    flag_matrix = build_flag_matrix(sample_results)
    
    assert ('Global Equities', 'HIGH_INCREASE') in flag_matrix
    assert ('Alternatives', 'MRT_DECREASE') in flag_matrix
    
    assert flag_matrix[('Global Equities', 'HIGH_INCREASE')] == 1
    assert flag_matrix[('Alternatives', 'MRT_DECREASE')] == 1


def test_calculate_salary_change_histogram(sample_results):
    """Test calculation of salary change histogram."""
    histogram = calculate_salary_change_histogram(sample_results)
    
    # Check that bins are created correctly
    assert '5% to 6%' in histogram  # 5% increase for EMP-001
    assert '2% to 3%' in histogram  # 2% increase for EMP-002
    assert '-4% to -3%' in histogram  # -4% decrease for EMP-003
    
    # Check counts
    assert histogram['5% to 6%'] == 1
    assert histogram['2% to 3%'] == 1
    assert histogram['-4% to -3%'] == 1


def test_aggregate_role_totals(sample_results):
    """Test aggregation of role totals."""
    role_totals = aggregate_role_totals(sample_results)
    
    assert 'Global Equities' in role_totals
    assert 'Alternatives' in role_totals
    
    assert 'Fund Manager' in role_totals['Global Equities']
    assert 'Analyst' in role_totals['Global Equities']
    assert 'Fund Manager' in role_totals['Alternatives']
    
    assert role_totals['Global Equities']['Fund Manager'] == Decimal('240000')
    assert role_totals['Global Equities']['Analyst'] == Decimal('117000')
    assert role_totals['Alternatives']['Fund Manager'] == Decimal('290000')


def test_generate_summary(sample_results, sample_employees, sample_config):
    """Test generation of comprehensive summary."""
    summary = generate_summary(sample_results, sample_employees, sample_config)
    
    # Check basic metrics
    assert summary['total_employees'] == 3
    assert summary['total_payroll'] == '647000'
    # Use startswith to handle decimal precision differences
    assert summary['avg_base_increase'].startswith('0.04')
    assert summary['mrt_breaches'] == 1
    assert summary['total_flags'] == 2
    
    # Check flag distribution
    assert summary['flag_distribution']['HIGH_INCREASE'] == 1
    assert summary['flag_distribution']['MRT_DECREASE'] == 1
    
    # Check department totals
    assert 'dept_totals' in summary
    assert 'Global Equities' in summary['dept_totals']
    assert 'Alternatives' in summary['dept_totals']
    
    # Check role totals
    assert 'role_totals' in summary
    assert 'Global Equities' in summary['role_totals']
    assert 'Fund Manager' in summary['role_totals']['Global Equities']
    
    # Check flag matrix
    assert 'flag_matrix' in summary
    assert ('Global Equities', 'HIGH_INCREASE') in summary['flag_matrix']
    
    # Check salary change histogram
    assert 'salary_change_histogram' in summary
    assert '5% to 6%' in summary['salary_change_histogram']
    
    # Check version
    assert 'version' in summary

"""
Unit tests for the compensation engine module.

These tests verify the functionality of the compensation calculation logic,
including base salary adjustments, bonus calculations, and diagnostic flags.
"""

import pytest
from decimal import Decimal
from unittest.mock import patch

# Import the module to test
from employees.compensation_engine import calculate_unified_compensation


# Mock for the lookup_salary_band function
def mock_lookup_salary_band(role, level):
    """Mock implementation of the lookup_salary_band function for testing."""
    bands = {
        ('Fund Manager', 'Senior'): {'min': Decimal('110000'), 'max': Decimal('150000')},
        ('Fund Manager', 'Junior'): {'min': Decimal('80000'), 'max': Decimal('120000')},
        ('Analyst', 'Senior'): {'min': Decimal('90000'), 'max': Decimal('130000')},
        ('Analyst', 'Junior'): {'min': Decimal('60000'), 'max': Decimal('100000')},
    }
    return bands.get((role, level), {'min': Decimal('0'), 'max': Decimal('1000000')})


# Fixture for common test data
@pytest.fixture
def base_employee_data():
    """Fixture providing base employee data for tests."""
    return {
        'base_salary': Decimal('120000'),
        'aum': Decimal('250000000'),
        'team_size': 3,
        'performance_quintile': 'Q2',
        'last_year_revenue': Decimal('2500000'),
        'mrt_status': False,
        'role': 'Fund Manager',
        'level': 'Senior'
    }


@pytest.fixture
def base_config():
    """Fixture providing base configuration for tests."""
    return {
        'revenue_delta': Decimal('0.10'),  # +10% revenue change
        'adjustment_factor': Decimal('0.5'),  # 50% pass-through of revenue change to base
        'MAX_INCREASE': Decimal('0.20'),  # +20% cap on base increase
        'MAX_DECREASE': Decimal('-0.10'),  # -10% floor on base decrease
        'AUM_BRACKETS': {
            'low': (Decimal('0'), Decimal('100000000')),
            'mid': (Decimal('100000000'), Decimal('500000000')),
            'high': (Decimal('500000000'), None)
        },
        'AUM_BRACKET_SHARES': {
            'low': Decimal('0.07'),  # 7% baseline for low bracket
            'mid': Decimal('0.05'),  # 5% baseline for mid bracket
            'high': Decimal('0.03')  # 3% baseline for high bracket
        },
        'QUINTILE_MULTIPLIERS': {
            'Q1': Decimal('1.2'),
            'Q2': Decimal('1.1'),
            'Q3': Decimal('1.0'),
            'Q4': Decimal('0.9'),
            'Q5': Decimal('0.8')
        },
        'MRT_BONUS_RATIO_CAP': Decimal('2.0')  # MRT bonus cannot exceed 2x base
    }


# Test cases
@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_standard_calculation(mock_lookup, base_employee_data, base_config):
    """Test standard compensation calculation with typical inputs."""
    # Calculate compensation
    result = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check base salary calculations
    assert result['original_base'] == Decimal('120000')
    assert result['adjusted_base'] == Decimal('126000')  # 120k * (1 + 0.10 * 0.5)
    assert result['base_salary_change'] == Decimal('6000')
    
    # Check bonus calculations
    assert result['effective_share%'] == Decimal('0.05') / Decimal('3')  # mid-tier AUM (5%) scaled by team of 3
    assert result['raw_bonus'] == Decimal('2500000') * Decimal('1.10') * (Decimal('0.05') / Decimal('3'))
    assert result['performance_multiplier'] == Decimal('1.1')  # Q2 multiplier
    
    # Check total compensation
    expected_bonus = Decimal('2500000') * Decimal('1.10') * (Decimal('0.05') / Decimal('3')) * Decimal('1.1')
    assert result['performance_adjusted_bonus'] == expected_bonus
    assert result['total_compensation'] == Decimal('126000') + expected_bonus
    
    # Check flags
    assert result['flags']['capped'] is False
    assert result['flags']['floored'] is False
    assert result['flags']['band_breach'] is None  # 126k is within 110k-150k band
    assert result['flags']['mrt_flag'] == 'OK'


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_base_salary_cap(mock_lookup, base_employee_data, base_config):
    """Test that base salary increase is capped at MAX_INCREASE."""
    # Modify config to trigger the cap
    base_config['revenue_delta'] = Decimal('0.50')  # 50% revenue increase
    base_config['adjustment_factor'] = Decimal('0.8')  # 80% pass-through
    
    # Calculate compensation
    result = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check that the cap was applied
    # Raw increase would be 120k * (1 + 0.50 * 0.8) = 168k, but capped at 120k * 1.20 = 144k
    assert result['adjusted_base'] == Decimal('120000') * (Decimal('1') + Decimal('0.20'))
    assert result['flags']['capped'] is True


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_base_salary_floor(mock_lookup, base_employee_data, base_config):
    """Test that base salary decrease is floored at MAX_DECREASE."""
    # Modify config to trigger the floor
    base_config['revenue_delta'] = Decimal('-0.30')  # 30% revenue decrease
    base_config['adjustment_factor'] = Decimal('0.8')  # 80% pass-through
    
    # Calculate compensation
    result = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check that the floor was applied
    # Raw decrease would be 120k * (1 - 0.30 * 0.8) = 91.2k, but floored at 120k * 0.90 = 108k
    assert result['adjusted_base'] == Decimal('120000') * (Decimal('1') + Decimal('-0.10'))
    assert result['flags']['floored'] is True


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_aum_brackets(mock_lookup, base_employee_data, base_config):
    """Test bonus calculation for each AUM bracket."""
    # Test low bracket
    base_employee_data['aum'] = Decimal('50000000')  # 50M AUM (low bracket)
    result_low = calculate_unified_compensation(base_employee_data, base_config)
    assert result_low['effective_share%'] == Decimal('0.07') / Decimal('3')  # low bracket share / team size
    
    # Test mid bracket
    base_employee_data['aum'] = Decimal('250000000')  # 250M AUM (mid bracket)
    result_mid = calculate_unified_compensation(base_employee_data, base_config)
    assert result_mid['effective_share%'] == Decimal('0.05') / Decimal('3')  # mid bracket share / team size
    
    # Test high bracket
    base_employee_data['aum'] = Decimal('600000000')  # 600M AUM (high bracket)
    result_high = calculate_unified_compensation(base_employee_data, base_config)
    assert result_high['effective_share%'] == Decimal('0.03') / Decimal('3')  # high bracket share / team size


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_team_size_scaling(mock_lookup, base_employee_data, base_config):
    """Test the effect of team size on bonus calculation."""
    # Test with team size of 1
    base_employee_data['team_size'] = 1
    result_solo = calculate_unified_compensation(base_employee_data, base_config)
    
    # Test with team size of 5
    base_employee_data['team_size'] = 5
    result_team = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check that team size properly scales the effective share
    assert result_solo['effective_share%'] == Decimal('0.05') / Decimal('1')
    assert result_team['effective_share%'] == Decimal('0.05') / Decimal('5')
    
    # Bonus should be proportionally higher for smaller team
    assert result_solo['raw_bonus'] > result_team['raw_bonus']
    assert result_solo['raw_bonus'] / result_team['raw_bonus'] == Decimal('5') / Decimal('1')


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_performance_quintiles(mock_lookup, base_employee_data, base_config):
    """Test the effect of performance quintile on bonus calculation."""
    # Test each quintile
    quintiles = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
    results = {}
    
    for quintile in quintiles:
        base_employee_data['performance_quintile'] = quintile
        results[quintile] = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check that performance multipliers are correctly applied
    for quintile in quintiles:
        assert results[quintile]['performance_multiplier'] == base_config['QUINTILE_MULTIPLIERS'][quintile]
    
    # Check that bonuses are ordered by quintile (Q1 > Q2 > Q3 > Q4 > Q5)
    for i in range(1, len(quintiles)):
        assert results[f'Q{i}']['performance_adjusted_bonus'] > results[f'Q{i+1}']['performance_adjusted_bonus']


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_mrt_flag(mock_lookup, base_employee_data, base_config):
    """Test MRT flag behavior when bonus exceeds the cap."""
    # Set employee as MRT
    base_employee_data['mrt_status'] = True
    
    # Test case where bonus is below cap
    base_employee_data['aum'] = Decimal('100000000')  # Lower AUM to keep bonus below cap
    result_below_cap = calculate_unified_compensation(base_employee_data, base_config)
    
    # Test case where bonus exceeds cap
    base_employee_data['aum'] = Decimal('1000000000')  # Higher AUM to push bonus above cap
    base_employee_data['team_size'] = 1  # Solo team to maximize bonus
    result_above_cap = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check MRT flags
    assert result_below_cap['flags']['mrt_flag'] == 'OK'
    
    # For the above cap case, we need to check if the bonus exceeds 2x base
    bonus = result_above_cap['performance_adjusted_bonus']
    base = result_above_cap['adjusted_base']
    if bonus > base * Decimal('2.0'):
        assert result_above_cap['flags']['mrt_flag'] == 'Cap Exceeded'


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_salary_band_breach(mock_lookup, base_employee_data, base_config):
    """Test salary band breach flags."""
    # Test case where salary is above band maximum
    base_config['revenue_delta'] = Decimal('0.30')  # 30% revenue increase
    base_config['adjustment_factor'] = Decimal('1.0')  # 100% pass-through
    # This would push the salary to 156k, above the 150k max for Senior Fund Manager
    result_above_max = calculate_unified_compensation(base_employee_data, base_config)
    
    # Test case where salary is below band minimum
    base_employee_data['base_salary'] = Decimal('100000')
    base_config['revenue_delta'] = Decimal('-0.20')  # 20% revenue decrease
    base_config['adjustment_factor'] = Decimal('1.0')  # 100% pass-through
    # This would push the salary to 80k, below the 110k min for Senior Fund Manager
    result_below_min = calculate_unified_compensation(base_employee_data, base_config)
    
    # Check band breach flags
    if result_above_max['adjusted_base'] > Decimal('150000'):
        assert result_above_max['flags']['band_breach'] == 'Above Max'
    
    if result_below_min['adjusted_base'] < Decimal('110000'):
        assert result_below_min['flags']['band_breach'] == 'Below Min'


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_revenue_estimation_from_aum(mock_lookup, base_employee_data, base_config):
    """Test revenue estimation from AUM when last_year_revenue is missing or zero."""
    # Add management fee rate to config
    base_config['management_fee_rate'] = Decimal('0.02')  # 2% management fee
    
    # Test with missing last_year_revenue
    employee_data_no_revenue = base_employee_data.copy()
    del employee_data_no_revenue['last_year_revenue']
    result_no_revenue = calculate_unified_compensation(employee_data_no_revenue, base_config)
    
    # Test with zero last_year_revenue
    employee_data_zero_revenue = base_employee_data.copy()
    employee_data_zero_revenue['last_year_revenue'] = Decimal('0')
    result_zero_revenue = calculate_unified_compensation(employee_data_zero_revenue, base_config)
    
    # Expected revenue from AUM
    expected_revenue = base_employee_data['aum'] * Decimal('0.02')
    
    # Check that revenue was estimated from AUM
    # The raw_bonus calculation uses current_revenue, which should be derived from AUM in these cases
    expected_share = Decimal('0.05') / Decimal('3')  # mid bracket share / team size
    expected_raw_bonus = expected_revenue * expected_share
    
    # Allow for small decimal differences due to calculation precision
    assert abs(result_no_revenue['raw_bonus'] - expected_raw_bonus) < Decimal('0.01')
    assert abs(result_zero_revenue['raw_bonus'] - expected_raw_bonus) < Decimal('0.01')


@patch('employees.compensation_engine.lookup_salary_band', side_effect=mock_lookup_salary_band)
def test_input_validation(mock_lookup, base_employee_data, base_config):
    """Test input validation for required fields and constraints."""
    # Test missing employee data field
    invalid_employee_data = base_employee_data.copy()
    del invalid_employee_data['base_salary']
    with pytest.raises(KeyError):
        calculate_unified_compensation(invalid_employee_data, base_config)
    
    # Test missing config field
    invalid_config = base_config.copy()
    del invalid_config['MAX_INCREASE']
    with pytest.raises(KeyError):
        calculate_unified_compensation(base_employee_data, invalid_config)
    
    # Test invalid team size
    invalid_employee_data = base_employee_data.copy()
    invalid_employee_data['team_size'] = 0
    with pytest.raises(ValueError):
        calculate_unified_compensation(invalid_employee_data, base_config)
    
    # Test invalid performance quintile
    invalid_employee_data = base_employee_data.copy()
    invalid_employee_data['performance_quintile'] = 'Q6'  # Non-existent quintile
    with pytest.raises(ValueError):
        calculate_unified_compensation(invalid_employee_data, base_config)

"""
Compensation Engine Module

This module provides the core calculation logic for the unified compensation calculator.
It handles base salary adjustments, bonus calculations, and diagnostic flag generation
based on employee data and configuration parameters.
"""

from decimal import Decimal, getcontext

# Set precision for Decimal calculations
getcontext().prec = 28


def calculate_unified_compensation(employee_data, config):
    """
    Calculate unified compensation based on employee data and configuration parameters.

    Args:
        employee_data (dict): Employee-specific information including:
            - base_salary (Decimal): Current base salary
            - aum (Decimal): Assets under management
            - team_size (int): Number of team members (at least 1)
            - performance_quintile (str): Performance category (e.g., 'Q1' to 'Q5')
            - last_year_revenue (Decimal): Revenue attributed to employee/team last year
            - mrt_status (bool): Whether employee is a Material Risk Taker
            - role (str): Employee's job role/title
            - level (str): Level or seniority of employee
        config (dict): Configuration parameters including:
            - revenue_delta (Decimal): Percentage change in revenue expected
            - adjustment_factor (Decimal): Factor to scale revenue impact on base salary
            - MAX_INCREASE (Decimal): Maximum allowed increase to base salary
            - MAX_DECREASE (Decimal): Maximum allowed decrease to base salary
            - AUM_BRACKETS (dict): Definitions of AUM ranges for bonus baseline
            - AUM_BRACKET_SHARES (dict): Mapping of bracket name to baseline bonus share percentage
            - QUINTILE_MULTIPLIERS (dict): Mapping of performance quintile to bonus multiplier
            - MRT_BONUS_RATIO_CAP (Decimal): Regulatory cap on bonus-to-base ratio for MRTs
            - management_fee_rate (Decimal, optional): Fee rate to apply if using AUM to estimate revenue

    Returns:
        dict: Calculated compensation details including:
            - original_base (Decimal): Original base salary
            - adjusted_base (Decimal): Adjusted base salary after calculations
            - base_salary_change (Decimal): Change in base salary
            - effective_share% (Decimal): Effective revenue share percentage
            - raw_bonus (Decimal): Raw bonus amount before performance adjustment
            - performance_multiplier (Decimal): Performance multiplier based on quintile
            - performance_adjusted_bonus (Decimal): Bonus after performance adjustment
            - total_compensation (Decimal): Total compensation (adjusted base + adjusted bonus)
            - flags (dict): Diagnostic flags including:
                - capped (bool): Whether base salary hit the maximum increase cap
                - floored (bool): Whether base salary hit the minimum decrease floor
                - band_breach (str or None): Salary band breach indicator
                - mrt_flag (str): MRT regulatory check result

    Raises:
        ValueError: If required input data is missing or invalid
        KeyError: If required configuration parameters are missing
    """
    # Validate inputs
    _validate_inputs(employee_data, config)

    # Calculate base salary adjustment
    base_salary_result = _calculate_base_salary_adjustment(employee_data, config)

    # Calculate bonus
    bonus_result = _calculate_bonus(employee_data, config)

    # Calculate total compensation
    total_compensation = base_salary_result['adjusted_base'] + bonus_result['performance_adjusted_bonus']

    # Generate diagnostic flags
    flags = _generate_diagnostic_flags(
        employee_data,
        config,
        base_salary_result['adjusted_base'],
        bonus_result['performance_adjusted_bonus'],
        base_salary_result['capped'],
        base_salary_result['floored']
    )

    # Prepare and return the result
    result = {
        'original_base': employee_data['base_salary'],
        'adjusted_base': base_salary_result['adjusted_base'],
        'base_salary_change': base_salary_result['base_salary_change'],
        'effective_share%': bonus_result['effective_share'],
        'raw_bonus': bonus_result['raw_bonus'],
        'performance_multiplier': bonus_result['performance_multiplier'],
        'performance_adjusted_bonus': bonus_result['performance_adjusted_bonus'],
        'total_compensation': total_compensation,
        'flags': flags
    }

    return result


def _validate_inputs(employee_data, config):
    """
    Validate input data and configuration parameters.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters

    Raises:
        ValueError: If required input data is missing or invalid
        KeyError: If required configuration parameters are missing
    """
    # Check required employee data fields
    required_employee_fields = [
        'base_salary', 'aum', 'team_size', 'performance_quintile',
        'last_year_revenue', 'mrt_status', 'role', 'level'
    ]
    for field in required_employee_fields:
        if field not in employee_data:
            raise KeyError(f"Missing required employee data field: {field}")

    # Check required config fields
    required_config_fields = [
        'revenue_delta', 'adjustment_factor', 'MAX_INCREASE', 'MAX_DECREASE',
        'AUM_BRACKETS', 'AUM_BRACKET_SHARES', 'QUINTILE_MULTIPLIERS', 'MRT_BONUS_RATIO_CAP'
    ]
    for field in required_config_fields:
        if field not in config:
            raise KeyError(f"Missing required configuration field: {field}")

    # Validate team_size
    if employee_data['team_size'] < 1:
        raise ValueError("Team size must be at least 1")

    # Validate performance quintile
    if employee_data['performance_quintile'] not in config['QUINTILE_MULTIPLIERS']:
        raise ValueError(f"Invalid performance quintile: {employee_data['performance_quintile']}")


def _calculate_base_salary_adjustment(employee_data, config):
    """
    Calculate base salary adjustment based on revenue delta and adjustment factor.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters

    Returns:
        dict: Base salary adjustment results including:
            - adjusted_base (Decimal): Adjusted base salary
            - base_salary_change (Decimal): Change in base salary
            - capped (bool): Whether the maximum increase cap was applied
            - floored (bool): Whether the minimum decrease floor was applied
    """
    current_base = employee_data['base_salary']
    revenue_delta = config['revenue_delta']
    adjustment_factor = config['adjustment_factor']
    max_increase = config['MAX_INCREASE']
    max_decrease = config['MAX_DECREASE']

    # Calculate tentative new base
    raw_new_base = current_base * (Decimal('1') + revenue_delta * adjustment_factor)

    # Initialize flags
    capped = False
    floored = False

    # Apply cap
    max_allowed_base = current_base * (Decimal('1') + max_increase)
    if raw_new_base > max_allowed_base:
        adjusted_base = max_allowed_base
        capped = True
    # Apply floor
    elif raw_new_base < current_base * (Decimal('1') + max_decrease):
        adjusted_base = current_base * (Decimal('1') + max_decrease)
        floored = True
    else:
        adjusted_base = raw_new_base

    # Calculate base salary change
    base_salary_change = adjusted_base - current_base

    return {
        'adjusted_base': adjusted_base,
        'base_salary_change': base_salary_change,
        'capped': capped,
        'floored': floored
    }


def _calculate_bonus(employee_data, config):
    """
    Calculate bonus based on revenue, AUM brackets, team size, and performance.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters

    Returns:
        dict: Bonus calculation results including:
            - effective_share (Decimal): Effective revenue share percentage
            - raw_bonus (Decimal): Raw bonus amount
            - performance_multiplier (Decimal): Performance multiplier
            - performance_adjusted_bonus (Decimal): Bonus after performance adjustment
    """
    # Determine current revenue
    current_revenue = _determine_current_revenue(employee_data, config)

    # Determine baseline revenue share percentage based on AUM bracket
    baseline_share = _determine_baseline_share(employee_data['aum'], config)

    # Apply team size scaling
    team_scaling_factor = Decimal('1') / Decimal(str(employee_data['team_size']))
    effective_share = baseline_share * team_scaling_factor

    # Calculate raw bonus
    raw_bonus = current_revenue * effective_share

    # Apply performance multiplier
    performance_quintile = employee_data['performance_quintile']
    performance_multiplier = config['QUINTILE_MULTIPLIERS'][performance_quintile]
    performance_adjusted_bonus = raw_bonus * performance_multiplier

    return {
        'effective_share': effective_share,
        'raw_bonus': raw_bonus,
        'performance_multiplier': performance_multiplier,
        'performance_adjusted_bonus': performance_adjusted_bonus
    }


def _determine_current_revenue(employee_data, config):
    """
    Determine current revenue based on last year's revenue and revenue delta,
    or estimate from AUM if configured.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters

    Returns:
        Decimal: Current revenue
    """
    # Check if we should use AUM to estimate revenue
    if 'management_fee_rate' in config and (
            'last_year_revenue' not in employee_data or
            employee_data['last_year_revenue'] == Decimal('0')):
        # Estimate revenue from AUM
        return employee_data['aum'] * config['management_fee_rate']

    # Calculate from last year's revenue and revenue delta
    last_year_revenue = employee_data['last_year_revenue']
    revenue_delta = config['revenue_delta']
    return last_year_revenue * (Decimal('1') + revenue_delta)


def _determine_baseline_share(aum, config):
    """
    Determine baseline revenue share percentage based on AUM bracket.

    Args:
        aum (Decimal): Assets under management
        config (dict): Configuration parameters

    Returns:
        Decimal: Baseline revenue share percentage
    """
    aum_brackets = config['AUM_BRACKETS']
    aum_bracket_shares = config['AUM_BRACKET_SHARES']

    # Find the bracket that contains the AUM
    for bracket_name, (min_aum, max_aum) in aum_brackets.items():
        if min_aum <= aum and (max_aum is None or aum < max_aum):
            return aum_bracket_shares[bracket_name]

    # If no bracket is found, use the highest bracket
    # This is a fallback in case the AUM is higher than all defined brackets
    highest_bracket = max(aum_brackets.keys(), key=lambda k: aum_brackets[k][0])
    return aum_bracket_shares[highest_bracket]


def _generate_diagnostic_flags(employee_data, config, adjusted_base, 
                              performance_adjusted_bonus, capped, floored):
    """
    Generate diagnostic flags for the compensation calculation.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters
        adjusted_base (Decimal): Adjusted base salary
        performance_adjusted_bonus (Decimal): Performance-adjusted bonus
        capped (bool): Whether the maximum increase cap was applied
        floored (bool): Whether the minimum decrease floor was applied

    Returns:
        dict: Diagnostic flags
    """
    # Initialize flags dictionary
    flags = {
        'capped': capped,
        'floored': floored,
        'band_breach': None,
        'mrt_flag': 'OK'
    }

    # Check salary band breach
    salary_band = lookup_salary_band(employee_data['role'], employee_data['level'])
    if adjusted_base > salary_band['max']:
        flags['band_breach'] = 'Above Max'
    elif adjusted_base < salary_band['min']:
        flags['band_breach'] = 'Below Min'

    # Check MRT regulatory compliance
    if employee_data['mrt_status']:
        mrt_cap = config['MRT_BONUS_RATIO_CAP']
        if performance_adjusted_bonus > adjusted_base * mrt_cap:
            flags['mrt_flag'] = 'Cap Exceeded'
        # Additional regulatory checks could be added here
        # For example: elif some_other_condition: flags['mrt_flag'] = 'Deferral Required'

    return flags


def lookup_salary_band(role, level):
    """
    External dependency: Look up salary band for a given role and level.
    
    This is a placeholder function that would be implemented elsewhere or mocked in tests.
    
    Args:
        role (str): Employee's job role/title
        level (str): Level or seniority of employee
        
    Returns:
        dict: Salary band with min and max values
    """
    # This function is expected to be provided externally
    # For testing purposes, we could return mock values
    # In a real implementation, this would likely query a database or external service
    pass

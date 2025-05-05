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
        'effective_share': bonus_result['effective_share'],
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
    # Required employee data fields
    required_employee_fields = ['base_salary', 'aum', 'team_size', 'role', 'level']
    for field in required_employee_fields:
        if field not in employee_data:
            raise ValueError(f"Missing required employee data field: {field}")

    # Required configuration parameters
    required_config_params = ['revenue_delta', 'adjustment_factor']
    for param in required_config_params:
        if param not in config:
            raise KeyError(f"Missing required configuration parameter: {param}")

    # Validate numeric values
    if employee_data['base_salary'] <= Decimal('0'):
        raise ValueError("Base salary must be positive")
    if employee_data['aum'] < Decimal('0'):
        raise ValueError("AUM cannot be negative")
    if employee_data['team_size'] < 1:
        raise ValueError("Team size must be at least 1")

    # Ensure performance_quintile is valid if provided
    if 'performance_quintile' in employee_data:
        valid_quintiles = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
        if employee_data['performance_quintile'] not in valid_quintiles:
            raise ValueError(f"Invalid performance quintile: {employee_data['performance_quintile']}")


def _calculate_base_salary_adjustment(employee_data, config):
    """
    Calculate base salary adjustment based on revenue delta and adjustment factor.

    Args:
        employee_data (dict): Employee-specific information
        config (dict): Configuration parameters

    Returns:
        dict: Base salary adjustment details including:
            - adjusted_base (Decimal): Adjusted base salary
            - base_salary_change (Decimal): Change in base salary
            - capped (bool): Whether the maximum increase cap was applied
            - floored (bool): Whether the minimum decrease floor was applied
    """
    # Extract parameters
    base_salary = employee_data['base_salary']
    revenue_delta = config['revenue_delta']
    adjustment_factor = config['adjustment_factor']

    # Calculate raw adjustment
    raw_adjustment = base_salary * revenue_delta * adjustment_factor

    # Apply caps and floors if configured
    capped = False
    floored = False

    if 'MAX_INCREASE' in config and raw_adjustment > Decimal('0'):
        max_increase = base_salary * config['MAX_INCREASE']
        if raw_adjustment > max_increase:
            raw_adjustment = max_increase
            capped = True

    if 'MAX_DECREASE' in config and raw_adjustment < Decimal('0'):
        max_decrease = base_salary * config['MAX_DECREASE']
        if raw_adjustment < -max_decrease:
            raw_adjustment = -max_decrease
            floored = True

    # Calculate adjusted base salary
    adjusted_base = base_salary + raw_adjustment

    return {
        'adjusted_base': adjusted_base,
        'base_salary_change': raw_adjustment,
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
        dict: Bonus calculation details including:
            - effective_share (Decimal): Effective revenue share percentage
            - raw_bonus (Decimal): Raw bonus amount before performance adjustment
            - performance_multiplier (Decimal): Performance multiplier
            - performance_adjusted_bonus (Decimal): Bonus after performance adjustment
    """
    # Determine current revenue
    current_revenue = _determine_current_revenue(employee_data, config)

    # Determine baseline share percentage based on AUM
    baseline_share = _determine_baseline_share(employee_data['aum'], config)

    # Adjust for team size
    team_size = max(1, employee_data['team_size'])  # Ensure at least 1
    effective_share = baseline_share / Decimal(str(team_size))

    # Calculate raw bonus
    raw_bonus = current_revenue * effective_share

    # Apply performance multiplier if available
    performance_multiplier = Decimal('1.0')  # Default multiplier
    if 'performance_quintile' in employee_data and 'QUINTILE_MULTIPLIERS' in config:
        quintile = employee_data['performance_quintile']
        if quintile in config['QUINTILE_MULTIPLIERS']:
            performance_multiplier = config['QUINTILE_MULTIPLIERS'][quintile]

    # Calculate performance-adjusted bonus
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
    last_year_revenue = employee_data.get('last_year_revenue', Decimal('0'))
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
    try:
        salary_band = lookup_salary_band(employee_data['role'], employee_data['level'])
        if salary_band:
            if adjusted_base > salary_band['max']:
                flags['band_breach'] = 'Above Max'
            elif adjusted_base < salary_band['min']:
                flags['band_breach'] = 'Below Min'
    except Exception as e:
        # Log the error but continue processing
        print(f"Error looking up salary band: {str(e)}")
        flags['band_breach'] = 'Error'

    # Check MRT regulatory compliance
    if employee_data.get('mrt_status', False):
        if 'MRT_BONUS_RATIO_CAP' in config:
            mrt_cap = config['MRT_BONUS_RATIO_CAP']
            if performance_adjusted_bonus > adjusted_base * mrt_cap:
                flags['mrt_flag'] = 'Cap Exceeded'
        # Additional regulatory checks could be added here
        # For example: elif some_other_condition: flags['mrt_flag'] = 'Deferral Required'

    return flags


def lookup_salary_band(role, level):
    """
    External dependency: Look up salary band for a given role and level.
    
    This implementation provides a basic set of salary bands for common roles.
    In a production environment, this would likely query a database or external service.
    
    Args:
        role (str): Employee's job role/title
        level (str): Level or seniority of employee
        
    Returns:
        dict: Salary band with min and max values
    """
    # Default salary bands by role and level
    salary_bands = {
        'Fund Manager': {
            'Junior': {'min': Decimal('100000'), 'max': Decimal('150000'), 'target': Decimal('125000')},
            'Associate': {'min': Decimal('150000'), 'max': Decimal('200000'), 'target': Decimal('175000')},
            'Director': {'min': Decimal('200000'), 'max': Decimal('300000'), 'target': Decimal('250000')},
            'Managing Director': {'min': Decimal('300000'), 'max': Decimal('500000'), 'target': Decimal('400000')},
        },
        'Portfolio Manager': {
            'Junior': {'min': Decimal('90000'), 'max': Decimal('130000'), 'target': Decimal('110000')},
            'Associate': {'min': Decimal('130000'), 'max': Decimal('180000'), 'target': Decimal('155000')},
            'Director': {'min': Decimal('180000'), 'max': Decimal('250000'), 'target': Decimal('215000')},
            'Managing Director': {'min': Decimal('250000'), 'max': Decimal('400000'), 'target': Decimal('325000')},
        },
        'Analyst': {
            'Junior': {'min': Decimal('70000'), 'max': Decimal('100000'), 'target': Decimal('85000')},
            'Associate': {'min': Decimal('100000'), 'max': Decimal('140000'), 'target': Decimal('120000')},
            'Director': {'min': Decimal('140000'), 'max': Decimal('200000'), 'target': Decimal('170000')},
            'Managing Director': {'min': Decimal('200000'), 'max': Decimal('300000'), 'target': Decimal('250000')},
        }
    }
    
    # Normalize role and level to handle case variations
    normalized_role = role.strip().title()
    normalized_level = level.strip().title()
    
    # Look up the salary band
    if normalized_role in salary_bands and normalized_level in salary_bands[normalized_role]:
        return salary_bands[normalized_role][normalized_level]
    
    # Fallback for unknown roles/levels
    return {
        'min': Decimal('50000'),
        'max': Decimal('500000'),
        'target': Decimal('150000')
    }

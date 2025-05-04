# Single-Model Compensation Calculator

This project implements a comprehensive compensation simulation tool with a backend calculation engine and an interactive frontend user interface.

## Project Structure

```
COMP3/
├── employees/
│   └── compensation_engine.py  # Core compensation calculation logic
├── compensation_api/
│   ├── __init__.py
│   ├── urls.py                 # API URL routing
│   └── views.py                # API endpoint implementations
├── compensation_project/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py             # Django project settings
│   ├── urls.py                 # Project URL routing
│   └── wsgi.py
├── tests/
│   └── test_compensation_engine.py  # Unit tests for the compensation engine
├── manage.py                   # Django management script
├── requirements.txt            # Project dependencies
└── README.md                   # This file
```

## Backend Components

The backend consists of two main parts:

1. **Compensation Engine**: A Python module that performs financial calculations for:
   - Base salary adjustments based on revenue delta and adjustment factors
   - Bonus calculations based on revenue, AUM brackets, team size, and performance
   - Diagnostic flags for salary band breaches, MRT regulatory checks, etc.

2. **Django API Layer**: REST API endpoints that expose the compensation engine:
   - `/api/calculate/`: Calculates compensation for single employees or batches
   - `/api/upload-data/`: Processes CSV file uploads containing employee data

### Key Features

- Uses Python's Decimal type for financial precision
- Configurable calculation parameters
- Comprehensive unit tests with pytest
- Designed for batch processing efficiency

## Running the Application

### Backend Setup

```bash
# Create and activate virtual environment
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS/Linux:
# python -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the Django development server
python manage.py runserver
```

### API Endpoints

- **POST /api/calculate/**: Calculate compensation
  - Request body for single employee:
    ```json
    {
      "employee": {
        "base_salary": 120000,
        "aum": 250000000,
        "team_size": 3,
        "performance_quintile": "Q2",
        "last_year_revenue": 2500000,
        "mrt_status": false,
        "role": "Fund Manager",
        "level": "Senior"
      },
      "config": {
        "revenue_delta": 0.10,
        "adjustment_factor": 0.5,
        "MAX_INCREASE": 0.20,
        "MAX_DECREASE": -0.10,
        "AUM_BRACKETS": {
          "low": [0, 100000000],
          "mid": [100000000, 500000000],
          "high": [500000000, null]
        },
        "AUM_BRACKET_SHARES": {
          "low": 0.07,
          "mid": 0.05,
          "high": 0.03
        },
        "QUINTILE_MULTIPLIERS": {
          "Q1": 1.2,
          "Q2": 1.1,
          "Q3": 1.0,
          "Q4": 0.9,
          "Q5": 0.8
        },
        "MRT_BONUS_RATIO_CAP": 2.0
      }
    }
    ```

- **POST /api/upload-data/**: Upload employee data
  - Request: multipart/form-data with a CSV file

## Next Steps

- ~~Implement the Django API endpoints to expose the compensation engine~~ ✓
- Develop the React/TypeScript frontend with Material-UI
- Integrate the frontend and backend components

import React, { createContext, useContext, useReducer } from 'react';

// Define action types
const ActionType = {
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  SET_SCENARIO: 'SET_SCENARIO',
  SET_LOADING: 'SET_LOADING',
  SET_RESULTS: 'SET_RESULTS',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  employees: [],
  scenario: {
    revenueDelta: 5, // Default 5%
    sensitivityFactor: 0.5, // Default 0.5
  },
  results: null,
  summary: null,
  loading: false,
  error: null,
};

// Reducer function
const scenarioReducer = (state, action) => {
  switch (action.type) {
    case ActionType.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload,
      };
    case ActionType.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(emp => 
          emp.id === action.payload.id 
            ? { ...emp, [action.payload.field]: action.payload.value }
            : emp
        ),
      };
    case ActionType.SET_SCENARIO:
      return {
        ...state,
        scenario: {
          ...state.scenario,
          ...action.payload,
        },
      };
    case ActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case ActionType.SET_RESULTS:
      return {
        ...state,
        results: action.payload.results,
        summary: action.payload.summary,
      };
    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const ScenarioContext = createContext();

// Context provider component
export const ScenarioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(scenarioReducer, initialState);

  return (
    <ScenarioContext.Provider value={{ state, dispatch }}>
      {children}
    </ScenarioContext.Provider>
  );
};

// Custom hook to use the context
export const useScenario = () => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};

// Export action types
export { ActionType };

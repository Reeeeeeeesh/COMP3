/**
 * ScenarioContext
 * 
 * Manages the global state for the Compensation Calculator application
 * using React Context API and useReducer
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  Employee, 
  CompResult, 
  Summary, 
  ScenarioConfig, 
  AppState, 
  Action, 
  ActionType 
} from '../types';

// Initial state
const initialState: AppState = {
  employees: [],
  scenario: {
    revenueDelta: 0,
    sensitivityFactor: 50,
  },
  results: null,
  summary: null,
  loading: false,
  error: null,
};

// Create context
const ScenarioContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Reducer function
const scenarioReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload,
      };
    case ActionType.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map((employee) =>
          employee.id === action.payload.id ? { ...employee, ...action.payload } : employee
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
        loading: false,
      };
    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

// Provider component
export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(scenarioReducer, initialState);

  return (
    <ScenarioContext.Provider value={{ state, dispatch }}>
      {children}
    </ScenarioContext.Provider>
  );
};

// Custom hook to use the scenario context
export const useScenario = () => useContext(ScenarioContext);

export default ScenarioContext;

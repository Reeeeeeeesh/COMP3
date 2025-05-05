/**
 * SimpleContext - TypeScript version
 * 
 * Provides global state management for the Compensation Calculator
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define action types
export enum ActionType {
  SET_EMPLOYEES = 'SET_EMPLOYEES',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  SET_SCENARIO = 'SET_SCENARIO',
  SET_LOADING = 'SET_LOADING',
  SET_RESULTS = 'SET_RESULTS',
  SET_ERROR = 'SET_ERROR',
}

// Define types for the state
export interface Employee {
  id: string;
  name?: string;
  department?: string;
  role?: string;
  level?: string;
  base_salary: string;
  performance_rating?: string;
  last_promotion?: string;
  aum?: string;
  [key: string]: any;
}

export interface ScenarioConfig {
  revenue_delta: number;
  adjustment_factor: number;
}

export interface CompResult {
  employee_id: string;
  department?: string;
  role?: string;
  original_base: string;
  adjusted_base: string;
  bonus: string;
  flags: string[];
  [key: string]: any;
}

export interface Summary {
  total_employees: number;
  total_payroll: string;
  avg_base_increase: string;
  mrt_breaches: number;
  total_flags: number;
  flag_distribution: Record<string, number>;
  dept_totals: Record<string, any>;
  role_totals: Record<string, Record<string, any>>;
  flag_matrix: Record<string, number>;
  salary_change_histogram: Record<string, number>;
  version: string;
  [key: string]: any;
}

export interface ScenarioState {
  employees: Employee[];
  scenario: ScenarioConfig;
  results: CompResult[] | null;
  summary: Summary | null;
  loading: boolean;
  error: string | null;
}

// Define types for actions
type Action =
  | { type: ActionType.SET_EMPLOYEES; payload: Employee[] }
  | { type: ActionType.UPDATE_EMPLOYEE; payload: { id: string; field: string; value: any } }
  | { type: ActionType.SET_SCENARIO; payload: Partial<ScenarioConfig> }
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_RESULTS; payload: { results: CompResult[]; summary: Summary } }
  | { type: ActionType.SET_ERROR; payload: string | null };

// Define context type
interface ScenarioContextType {
  state: ScenarioState;
  dispatch: React.Dispatch<Action>;
}

// Initial state
const initialState: ScenarioState = {
  employees: [],
  scenario: {
    revenue_delta: 0.05, // Default 5%
    adjustment_factor: 0.8, // Default 0.8
  },
  results: null,
  summary: null,
  loading: false,
  error: null,
};

// Reducer function
const scenarioReducer = (state: ScenarioState, action: Action): ScenarioState => {
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
const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

// Context provider component
interface ScenarioProviderProps {
  children: ReactNode;
}

export const ScenarioProvider: React.FC<ScenarioProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(scenarioReducer, initialState);

  return (
    <ScenarioContext.Provider value={{ state, dispatch }}>
      {children}
    </ScenarioContext.Provider>
  );
};

// Custom hook to use the context
export const useScenario = (): ScenarioContextType => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};

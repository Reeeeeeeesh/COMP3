/**
 * Type definitions for the Compensation Calculator
 */

// Employee data
export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  base_salary: number;
  performance_rating: number;
  quintile: string;
  aum: number;
  is_mrt: boolean;
}

// Compensation calculation result
export interface CompResult {
  employee_id: string;
  adjusted_salary: number;
  salary_change: number;
  bonus: number;
  total_compensation: number;
  flags: string[];
}

// Summary metrics
export interface Summary {
  total_payroll: number;
  avg_base_increase: number;
  mrt_breaches: number;
  total_employees: number;
  total_flags: number;
  flag_distribution: Record<string, number>;
}

// Scenario configuration
export interface ScenarioConfig {
  revenueDelta: number;
  sensitivityFactor: number;
}

// Application state
export interface AppState {
  employees: Employee[];
  scenario: ScenarioConfig;
  results: CompResult[] | null;
  summary: Summary | null;
  loading: boolean;
  error: string | null;
}

// Action types
export enum ActionType {
  SET_EMPLOYEES = 'SET_EMPLOYEES',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  SET_SCENARIO = 'SET_SCENARIO',
  SET_LOADING = 'SET_LOADING',
  SET_RESULTS = 'SET_RESULTS',
  SET_ERROR = 'SET_ERROR',
}

// Action interfaces
interface SetEmployeesAction {
  type: ActionType.SET_EMPLOYEES;
  payload: Employee[];
}

interface UpdateEmployeeAction {
  type: ActionType.UPDATE_EMPLOYEE;
  payload: {
    id: string;
    field: keyof Employee;
    value: any;
  };
}

interface SetScenarioAction {
  type: ActionType.SET_SCENARIO;
  payload: Partial<ScenarioConfig>;
}

interface SetLoadingAction {
  type: ActionType.SET_LOADING;
  payload: boolean;
}

interface SetResultsAction {
  type: ActionType.SET_RESULTS;
  payload: {
    results: CompResult[];
    summary: Summary;
  };
}

interface SetErrorAction {
  type: ActionType.SET_ERROR;
  payload: string | null;
}

// Union type for all actions
export type Action =
  | SetEmployeesAction
  | UpdateEmployeeAction
  | SetScenarioAction
  | SetLoadingAction
  | SetResultsAction
  | SetErrorAction;

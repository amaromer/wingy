import { Employee } from './employee.model';

export interface Payroll {
  _id: string;
  employee_id: Employee;
  employee?: Employee; // For populated employee data
  month: number;
  year: number;
  base_salary: number;
  basic_salary?: number; // Alias for base_salary
  absent_days: number;
  overtime_days: number;
  overtime_rate: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  is_paid: boolean;
  payment_date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  dailyRate?: number;
  absentDeduction?: number;
  absent_deduction?: number; // Alias for absentDeduction
  overtimeAmount?: number;
  overtime_amount?: number; // Alias for overtimeAmount
  totalSalary?: number;
}

export interface PayrollFormData {
  employee_id: string;
  month: number;
  year: number;
  absent_days?: number;
  overtime_days?: number;
  deductions?: number;
  bonuses?: number;
  notes?: string;
}

export interface PayrollSummary {
  month: number;
  year: number;
  totalEmployees: number;
  totalSalary: number;
  totalAbsentDays: number;
  totalOvertimeDays: number;
  paidCount: number;
  unpaidCount: number;
  payrolls: Payroll[];
} 
import { Employee } from './employee.model';
import { User } from './user.model';

export interface Overtime {
  _id: string;
  employee_id: Employee;
  employee?: Employee; // For populated employee data
  date: string;
  hours: number;
  rate: number;
  amount?: number;
  reason?: string; // Add reason field
  description?: string;
  is_approved: boolean;
  approved_by?: User;
  approved_at?: string;
  is_processed: boolean;
  processed_payroll_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeFormData {
  employee_id: string;
  date: string;
  hours: number;
  rate?: number;
  reason?: string;
  description?: string;
}

export interface OvertimeSummary {
  employee: Employee | null;
  totalHours: number;
  totalAmount: number;
  approvedCount: number;
  pendingCount: number;
  processedCount: number;
  overtimes: Overtime[];
} 
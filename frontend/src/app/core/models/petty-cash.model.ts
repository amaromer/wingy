import { Employee } from './employee.model';
import { User } from './user.model';

export interface PettyCash {
  _id: string;
  employee_id: Employee;
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out';
  amount: number;
  balance_after: number;
  description: string;
  reference_type: 'manual' | 'expense' | 'transfer';
  reference_id?: string;
  transfer_to_employee?: Employee;
  transfer_from_employee?: Employee;
  processed_by: User;
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
  formattedBalance?: string;
}

export interface PettyCashFormData {
  employee_id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  description: string;
  to_employee_id?: string; // For transfers
}

export interface TransferFormData {
  from_employee_id: string;
  to_employee_id: string;
  amount: number;
  description: string;
}

export interface EmployeeBalance {
  employee: Employee;
  currentBalance: number;
  totalExpenses: number;
  expenseCreditDifference: number;
  recentTransactions: PettyCash[];
}

export interface PettyCashSummary {
  totalEmployees: number;
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  employeeBalances: EmployeeBalance[];
} 
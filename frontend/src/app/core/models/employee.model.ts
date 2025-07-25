export interface Employee {
  id?: string;
  _id: string;
  name: string;
  job: string;
  salary: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  formattedSalary?: string;
}

export interface EmployeeFormData {
  name: string;
  job: string;
  salary: number;
  is_active?: boolean;
}

export interface EmployeeStats {
  employee: Employee;
  totalSalary: number;
} 
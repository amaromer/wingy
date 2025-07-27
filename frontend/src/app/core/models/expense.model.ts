import { Employee } from './employee.model';

export interface Expense {
  _id?: string;
  id?: string; // Alias for _id for compatibility
  project_id: Project | string;
  supplier_id?: Supplier | string;
  employee_id?: Employee | string;
  category_id?: Category | string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  invoice_number?: string;
  attachment_url?: string;
  is_vat: boolean;
  vat_amount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  project_id: string;
  supplier_id: string;
  employee_id?: string;
  category_id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  date: string;
  description: string;
  invoice_number?: string;
  is_vat?: boolean;
  attachment?: File;
}

export interface UpdateExpenseRequest {
  project_id?: string;
  supplier_id?: string;
  employee_id?: string;
  category_id?: string;
  amount?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  date?: string;
  description?: string;
  invoice_number?: string;
  is_vat?: boolean;
  attachment?: File;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  pages: number;
}

export interface ExpenseFilters {
  project_id?: string;
  supplier_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ExpenseStats {
  projectTotals: Array<{
    _id: string;
    projectName: string;
    projectCode: string;
    total: number;
    count: number;
  }>;
  categoryTotals: Array<{
    _id: string;
    categoryName: string;
    total: number;
    count: number;
  }>;
  overallTotal: {
    total: number;
    count: number;
  };
}

// Related interfaces
export interface Project {
  id?: string;
  _id?: string;
  name: string;
  code?: string;
}

export interface Supplier {
  id?: string;
  _id?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  main_category_ids?: string[];
}

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
} 
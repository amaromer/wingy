import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseListResponse, 
  ExpenseFilters,
  ExpenseStats 
} from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = '/api/expenses';

  constructor(private http: HttpClient) {}

  // Get all expenses with filters and pagination
  getExpenses(filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ExpenseFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    console.log('Fetching expenses with params:', filters);
    
    return this.http.get<ExpenseListResponse>(this.apiUrl, { params });
  }

  // Get a single expense by ID
  getExpense(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  // Create a new expense
  createExpense(expenseData: CreateExpenseRequest): Observable<Expense> {
    const formData = new FormData();
    
    // Add basic fields
    Object.keys(expenseData).forEach(key => {
      const value = expenseData[key as keyof CreateExpenseRequest];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'attachment' && value instanceof File) {
          formData.append('attachment', value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<Expense>(this.apiUrl, formData);
  }

  // Update an existing expense
  updateExpense(id: string, expenseData: UpdateExpenseRequest): Observable<Expense> {
    const formData = new FormData();
    
    // Add basic fields
    Object.keys(expenseData).forEach(key => {
      const value = expenseData[key as keyof UpdateExpenseRequest];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'attachment' && value instanceof File) {
          formData.append('attachment', value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.put<Expense>(`${this.apiUrl}/${id}`, formData);
  }

  // Delete an expense
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Bulk delete expenses
  bulkDeleteExpenses(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, { ids });
  }

  // Get expense statistics
  getExpenseStats(filters: ExpenseFilters = {}): Observable<ExpenseStats> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ExpenseFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ExpenseStats>(`${this.apiUrl}/stats`, { params });
  }

  // Export expenses
  exportExpenses(filters: ExpenseFilters = {}, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ExpenseFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Get expenses by project
  getExpensesByProject(projectId: string, filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    const projectFilters = { ...filters, project_id: projectId };
    return this.getExpenses(projectFilters);
  }

  // Get expenses by category
  getExpensesByCategory(categoryId: string, filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    const categoryFilters = { ...filters, category_id: categoryId };
    return this.getExpenses(categoryFilters);
  }

  // Get expenses by supplier
  getExpensesBySupplier(supplierId: string, filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    const supplierFilters = { ...filters, supplier_id: supplierId };
    return this.getExpenses(supplierFilters);
  }

  // Get expenses by date range
  getExpensesByDateRange(dateFrom: string, dateTo: string, filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    const dateFilters = { ...filters, date_from: dateFrom, date_to: dateTo };
    return this.getExpenses(dateFilters);
  }

  // Get recent expenses
  getRecentExpenses(limit: number = 10): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  // Search expenses
  searchExpenses(query: string, filters: ExpenseFilters = {}): Observable<ExpenseListResponse> {
    const searchFilters = { ...filters, search: query };
    return this.getExpenses(searchFilters);
  }

  // Validate expense data
  validateExpense(expense: CreateExpenseRequest | UpdateExpenseRequest): string[] {
    const errors: string[] = [];

    if (!expense.description || expense.description.trim().length < 3) {
      errors.push('Description must be at least 3 characters long');
    }

    if (!expense.amount || expense.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!expense.date) {
      errors.push('Date is required');
    }

    if (!expense.project_id) {
      errors.push('Project is required');
    }

    if (!expense.category_id) {
      errors.push('Category is required');
    }

    if (!expense.supplier_id) {
      errors.push('Supplier is required');
    }

    return errors;
  }

  // Format currency
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  // Get currency symbol
  getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currency] || currency;
  }
} 
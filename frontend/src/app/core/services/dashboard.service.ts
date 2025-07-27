import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  overview: {
    totalExpenses: number;
    totalExpenseCount: number;
    totalProjects: number;
    totalSuppliers: number;
    totalCategories: number;
    totalUsers: number;
    totalVAT: number;
    totalPayments: number;
    netVAT: number;
  };
  expenseStats: Array<{
    period: string;
    total: number;
    count: number;
  }>;
  projectStats: Array<{
    _id: string;
    count: number;
  }>;
  recentExpenses: Array<any>;
  vatStats: {
    currentCycle: string;
    expensesVAT: number;
    paymentsVAT: number;
    netVAT: number;
  };
}

export interface ProjectExpense {
  _id: string;
  projectName: string;
  projectCode: string;
  total: number;
  count: number;
}

export interface CategoryExpense {
  _id: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  period: string;
  total: number;
  count: number;
}

export interface TopSupplier {
  _id: string;
  supplierName: string;
  contactPerson: string;
  total: number;
  count: number;
}

export interface CurrencyBreakdown {
  _id: string;
  total: number;
  count: number;
}

export interface RecentActivity {
  type: 'expense' | 'project';
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardStats(dateFrom?: string, dateTo?: string): Observable<DashboardStats> {
    let params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<DashboardStats>(`${this.apiUrl}/overview`, { params });
  }

  getExpensesByProject(dateFrom?: string, dateTo?: string, limit: number = 10): Observable<ProjectExpense[]> {
    let params: any = { limit };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<ProjectExpense[]>(`${this.apiUrl}/expenses-by-project`, { params });
  }

  getExpensesByCategory(dateFrom?: string, dateTo?: string): Observable<CategoryExpense[]> {
    let params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<CategoryExpense[]>(`${this.apiUrl}/expenses-by-category`, { params });
  }

  getMonthlyTrend(months: number = 12, dateFrom?: string, dateTo?: string): Observable<MonthlyTrend[]> {
    let params: any = { months: months.toString() };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<MonthlyTrend[]>(`${this.apiUrl}/monthly-trend`, { params });
  }

  getTopSuppliers(dateFrom?: string, dateTo?: string, limit: number = 10): Observable<TopSupplier[]> {
    let params: any = { limit };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<TopSupplier[]>(`${this.apiUrl}/top-suppliers`, { params });
  }

  getCurrencyBreakdown(dateFrom?: string, dateTo?: string): Observable<CurrencyBreakdown[]> {
    let params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return this.http.get<CurrencyBreakdown[]>(`${this.apiUrl}/currency-breakdown`, { params });
  }

  getRecentActivity(limit: number = 20): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent-activity`, { params: { limit: limit.toString() } });
  }

  getFirstExpenseDate(): Observable<{ firstExpenseDate: string | null }> {
    return this.http.get<{ firstExpenseDate: string | null }>(`${this.apiUrl}/first-expense-date`);
  }
} 
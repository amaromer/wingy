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

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/overview`);
  }
} 
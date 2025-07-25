import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import { Payroll, PayrollFormData, PayrollSummary } from '../models/payroll.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${getApiUrl()}/payroll`;

  constructor(private http: HttpClient) { }

  getPayrolls(page: number = 1, limit: number = 10, month?: number, year?: number, employee_id?: string, is_paid?: boolean): Observable<{
    payrolls: Payroll[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (month) params.month = month.toString();
    if (year) params.year = year.toString();
    if (employee_id) params.employee_id = employee_id;
    if (is_paid !== undefined) params.is_paid = is_paid.toString();

    return this.http.get<{
      payrolls: Payroll[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(this.apiUrl, { params });
  }

  getPayroll(id: string): Observable<Payroll> {
    return this.http.get<Payroll>(`${this.apiUrl}/${id}`);
  }

  createPayroll(payrollData: PayrollFormData): Observable<Payroll> {
    return this.http.post<Payroll>(this.apiUrl, payrollData);
  }

  updatePayroll(id: string, payrollData: Partial<PayrollFormData>): Observable<Payroll> {
    return this.http.put<Payroll>(`${this.apiUrl}/${id}`, payrollData);
  }

  deletePayroll(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  markPayrollAsPaid(id: string): Observable<Payroll> {
    return this.http.patch<Payroll>(`${this.apiUrl}/${id}/mark-paid`, {});
  }

  getPayrollSummary(month: number, year: number): Observable<PayrollSummary> {
    return this.http.get<PayrollSummary>(`${this.apiUrl}/summary/${month}/${year}`);
  }
} 
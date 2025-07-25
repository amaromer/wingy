import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import { PettyCash, PettyCashFormData, TransferFormData, EmployeeBalance, PettyCashSummary } from '../models/petty-cash.model';

@Injectable({
  providedIn: 'root'
})
export class PettyCashService {
  private apiUrl = `${getApiUrl()}/petty-cash`;

  constructor(private http: HttpClient) { }

  getTransactions(page: number = 1, limit: number = 10, employee_id?: string, type?: string, reference_type?: string): Observable<{
    transactions: PettyCash[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (employee_id) params.employee_id = employee_id;
    if (type) params.type = type;
    if (reference_type) params.reference_type = reference_type;

    return this.http.get<{
      transactions: PettyCash[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(this.apiUrl, { params });
  }

  getTransaction(id: string): Observable<PettyCash> {
    return this.http.get<PettyCash>(`${this.apiUrl}/${id}`);
  }

  addCredit(employee_id: string, amount: number, description: string): Observable<PettyCash> {
    return this.http.post<PettyCash>(`${this.apiUrl}/credit`, {
      employee_id,
      amount,
      description
    });
  }

  addDebit(employee_id: string, amount: number, description: string): Observable<PettyCash> {
    return this.http.post<PettyCash>(`${this.apiUrl}/debit`, {
      employee_id,
      amount,
      description
    });
  }

  transferBetweenEmployees(from_employee_id: string, to_employee_id: string, amount: number, description: string): Observable<{
    transferOut: PettyCash;
    transferIn: PettyCash;
  }> {
    return this.http.post<{
      transferOut: PettyCash;
      transferIn: PettyCash;
    }>(`${this.apiUrl}/transfer`, {
      from_employee_id,
      to_employee_id,
      amount,
      description
    });
  }

  getEmployeeBalance(employee_id: string): Observable<EmployeeBalance> {
    return this.http.get<EmployeeBalance>(`${this.apiUrl}/employee/${employee_id}/balance`);
  }

  getAllEmployeeBalances(): Observable<EmployeeBalance[]> {
    return this.http.get<EmployeeBalance[]>(`${this.apiUrl}/balances`);
  }

  deleteTransaction(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import { Overtime, OvertimeFormData, OvertimeSummary } from '../models/overtime.model';

@Injectable({
  providedIn: 'root'
})
export class OvertimeService {
  private apiUrl = `${getApiUrl()}/overtime`;

  constructor(private http: HttpClient) { }

  getOvertimes(page: number = 1, limit: number = 10, employee_id?: string, is_approved?: boolean, is_processed?: boolean, date?: string): Observable<{
    overtimes: Overtime[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (employee_id) params.employee_id = employee_id;
    if (is_approved !== undefined) params.is_approved = is_approved.toString();
    if (is_processed !== undefined) params.is_processed = is_processed.toString();
    if (date) params.date = date;

    return this.http.get<{
      overtimes: Overtime[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(this.apiUrl, { params });
  }

  getOvertime(id: string): Observable<Overtime> {
    return this.http.get<Overtime>(`${this.apiUrl}/${id}`);
  }

  createOvertime(overtimeData: OvertimeFormData): Observable<Overtime> {
    return this.http.post<Overtime>(this.apiUrl, overtimeData);
  }

  updateOvertime(id: string, overtimeData: Partial<OvertimeFormData>): Observable<Overtime> {
    return this.http.put<Overtime>(`${this.apiUrl}/${id}`, overtimeData);
  }

  deleteOvertime(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  approveOvertime(id: string): Observable<Overtime> {
    return this.http.patch<Overtime>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectOvertime(id: string): Observable<Overtime> {
    return this.http.patch<Overtime>(`${this.apiUrl}/${id}/reject`, {});
  }

  getOvertimeSummary(employee_id: string, month?: number, year?: number): Observable<OvertimeSummary> {
    const params: any = {};
    if (month) params.month = month.toString();
    if (year) params.year = year.toString();

    return this.http.get<OvertimeSummary>(`${this.apiUrl}/employee/${employee_id}/summary`, { params });
  }
} 
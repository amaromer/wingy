import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';
import { Employee, EmployeeFormData, EmployeeStats } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${getApiUrl()}/employees`;

  constructor(private http: HttpClient) { 
    console.log('EmployeeService initialized with API URL:', this.apiUrl);
  }

  getEmployees(page: number = 1, limit: number = 10, search: string = '', active: boolean = true): Observable<{
    employees: Employee[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    const params = { page: page.toString(), limit: limit.toString(), search, active: active.toString() };
    return this.http.get<{
      employees: Employee[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>(this.apiUrl, { params });
  }

  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employeeData: EmployeeFormData): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employeeData);
  }

  updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData);
  }

  deleteEmployee(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getEmployeeStats(id: string): Observable<EmployeeStats> {
    return this.http.get<EmployeeStats>(`${this.apiUrl}/${id}/stats`);
  }
} 
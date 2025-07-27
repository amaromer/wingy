import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment, getApiUrl } from '../../../environments/environment';

import {
  Cheque,
  CreateChequeRequest,
  UpdateChequeRequest,
  VoidChequeRequest,
  ChequeListResponse,
  ChequeStats,
  NextChequeNumberResponse
} from '../models/cheque.model';

@Injectable({
  providedIn: 'root'
})
export class ChequeService {
  private apiUrl = `${getApiUrl()}/cheques`;

  constructor(private http: HttpClient) {}

  // Get all cheques with pagination and filtering
  getCheques(
    page: number = 1,
    limit: number = 10,
    filters?: {
      payee_name?: string;
      status?: string;
      currency?: string;
      date_from?: string;
      date_to?: string;
    },
    sort?: {
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ): Observable<ChequeListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.payee_name) {
        params = params.set('payee_name', filters.payee_name);
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.currency) {
        params = params.set('currency', filters.currency);
      }
      if (filters.date_from) {
        params = params.set('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params = params.set('date_to', filters.date_to);
      }
    }

    if (sort) {
      if (sort.sort_by) {
        params = params.set('sort_by', sort.sort_by);
      }
      if (sort.sort_order) {
        params = params.set('sort_order', sort.sort_order);
      }
    }

    return this.http.get<ChequeListResponse>(this.apiUrl, { params });
  }

  // Get a single cheque by ID
  getCheque(id: string): Observable<Cheque> {
    return this.http.get<Cheque>(`${this.apiUrl}/${id}`);
  }

  // Create a new cheque
  createCheque(chequeData: CreateChequeRequest): Observable<Cheque> {
    return this.http.post<Cheque>(this.apiUrl, chequeData);
  }

  // Update a cheque
  updateCheque(id: string, chequeData: UpdateChequeRequest): Observable<Cheque> {
    return this.http.put<Cheque>(`${this.apiUrl}/${id}`, chequeData);
  }

  // Delete a cheque
  deleteCheque(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Approve a cheque
  approveCheque(id: string): Observable<Cheque> {
    return this.http.patch<Cheque>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Void a cheque
  voidCheque(id: string, voidData: VoidChequeRequest): Observable<Cheque> {
    return this.http.patch<Cheque>(`${this.apiUrl}/${id}/void`, voidData);
  }

  // Get cheque statistics
  getChequeStats(): Observable<ChequeStats> {
    return this.http.get<ChequeStats>(`${this.apiUrl}/stats/overview`);
  }

  // Get next cheque number
  getNextChequeNumber(): Observable<NextChequeNumberResponse> {
    return this.http.get<NextChequeNumberResponse>(`${this.apiUrl}/next-number`);
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
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Get status class for styling
  getStatusClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'status-draft';
      case 'Issued':
        return 'status-issued';
      case 'Cleared':
        return 'status-cleared';
      case 'Cancelled':
        return 'status-cancelled';
      case 'Void':
        return 'status-void';
      default:
        return 'status-default';
    }
  }

  // Get status icon
  getStatusIcon(status: string): string {
    switch (status) {
      case 'Draft':
        return '📝';
      case 'Issued':
        return '✅';
      case 'Cleared':
        return '💰';
      case 'Cancelled':
        return '❌';
      case 'Void':
        return '🚫';
      default:
        return '📄';
    }
  }
} 
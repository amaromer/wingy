import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ReceivedPayment, 
  CreateReceivedPaymentRequest, 
  UpdateReceivedPaymentRequest, 
  ReceivedPaymentListResponse, 
  ReceivedPaymentFilters, 
  ReceivedPaymentStats 
} from '../models/received-payment.model';

@Injectable({
  providedIn: 'root'
})
export class ReceivedPaymentService {

  constructor(private http: HttpClient) { }

  getReceivedPayments(filters?: ReceivedPaymentFilters): Observable<ReceivedPaymentListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ReceivedPaymentFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ReceivedPaymentListResponse>('/api/received-payments', { params });
  }

  getReceivedPayment(id: string): Observable<ReceivedPayment> {
    return this.http.get<ReceivedPayment>(`/api/received-payments/${id}`);
  }

  createReceivedPayment(payment: CreateReceivedPaymentRequest): Observable<ReceivedPayment> {
    const formData = new FormData();
    
    Object.keys(payment).forEach(key => {
      const value = payment[key as keyof CreateReceivedPaymentRequest];
      if (value !== undefined && value !== null) {
        if (key === 'payment_attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<ReceivedPayment>('/api/received-payments', formData);
  }

  updateReceivedPayment(id: string, payment: UpdateReceivedPaymentRequest): Observable<ReceivedPayment> {
    const formData = new FormData();
    
    Object.keys(payment).forEach(key => {
      const value = payment[key as keyof UpdateReceivedPaymentRequest];
      if (value !== undefined && value !== null) {
        if (key === 'payment_attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.put<ReceivedPayment>(`/api/received-payments/${id}`, formData);
  }

  deleteReceivedPayment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/received-payments/${id}`);
  }

  bulkDeleteReceivedPayments(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/received-payments/bulk-delete', { ids });
  }

  getReceivedPaymentStats(): Observable<ReceivedPaymentStats> {
    return this.http.get<ReceivedPaymentStats>('/api/received-payments/stats/overview');
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  calculateVATAmount(amount: number, isVATApplicable: boolean, vatRate: number = 0.05): number {
    if (isVATApplicable) {
      return amount * vatRate;
    } else {
      return 0;
    }
  }

  calculateTotalAmount(amount: number, vatAmount: number): number {
    return amount + vatAmount;
  }
} 
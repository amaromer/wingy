import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, CreatePaymentRequest, UpdatePaymentRequest, PaymentListResponse, PaymentFilters, PaymentStats } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(private http: HttpClient) { }

  getPayments(filters?: PaymentFilters): Observable<PaymentListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof PaymentFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaymentListResponse>('/api/payments', { params });
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`/api/payments/${id}`);
  }

  createPayment(payment: CreatePaymentRequest): Observable<Payment> {
    const formData = new FormData();
    
    Object.keys(payment).forEach(key => {
      const value = payment[key as keyof CreatePaymentRequest];
      if (value !== undefined && value !== null) {
        if (key === 'receipt_attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<Payment>('/api/payments', formData);
  }

  updatePayment(id: string, payment: UpdatePaymentRequest): Observable<Payment> {
    const formData = new FormData();
    
    Object.keys(payment).forEach(key => {
      const value = payment[key as keyof UpdatePaymentRequest];
      if (value !== undefined && value !== null) {
        if (key === 'receipt_attachment' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.put<Payment>(`/api/payments/${id}`, formData);
  }

  deletePayment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/payments/${id}`);
  }

  bulkDeletePayments(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/payments/bulk-delete', { ids });
  }

  getPaymentStats(): Observable<PaymentStats> {
    return this.http.get<PaymentStats>('/api/payments/stats');
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

  calculateVATAmount(amount: number, isVATIncluded: boolean, vatRate: number = 0.05): number {
    if (isVATIncluded) {
      return amount * vatRate / (1 + vatRate);
    } else {
      return amount * vatRate;
    }
  }

  calculateTotalAmount(amount: number, vatAmount: number): number {
    return amount + vatAmount;
  }
} 
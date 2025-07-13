export interface Payment {
  _id?: string;
  date: string;
  invoice_number: string;
  amount: number;
  is_vat_included: boolean;
  vat_amount: number;
  payment_type: 'Bank Transfer' | 'Cheque' | 'Cash';
  receipt_attachment?: string;
  project_id?: string;
  supplier_id?: string;
  description?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  date: string;
  invoice_number: string;
  amount: number;
  is_vat_included: boolean;
  vat_amount: number;
  payment_type: 'Bank Transfer' | 'Cheque' | 'Cash';
  receipt_attachment?: File;
  project_id?: string;
  supplier_id?: string;
  description?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
}

export interface UpdatePaymentRequest {
  date?: string;
  invoice_number?: string;
  amount?: number;
  is_vat_included?: boolean;
  vat_amount?: number;
  payment_type?: 'Bank Transfer' | 'Cheque' | 'Cash';
  receipt_attachment?: File;
  project_id?: string;
  supplier_id?: string;
  description?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  pages: number;
}

export interface PaymentFilters {
  project_id?: string;
  supplier_id?: string;
  payment_type?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  currency?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  vatTotal: number;
  paymentTypeBreakdown: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
} 
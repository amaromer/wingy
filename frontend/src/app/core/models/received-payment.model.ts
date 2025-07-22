export interface ReceivedPayment {
  _id?: string;
  date: string;
  project_id: string | Project;
  invoice_number: string;
  amount: number;
  is_vat_applicable: boolean;
  vat_amount: number;
  payment_method: 'Bank Transfer' | 'Cheque' | 'Cash';
  payment_attachment?: string;
  description?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  client_name?: string;
  reference_number?: string;
  createdAt?: string;
  updatedAt?: string;
  total_amount?: number;
}

export interface CreateReceivedPaymentRequest {
  date: string;
  project_id: string;
  invoice_number: string;
  amount: number;
  is_vat_applicable: boolean;
  vat_amount: number;
  payment_method: 'Bank Transfer' | 'Cheque' | 'Cash';
  payment_attachment?: File;
  description?: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  client_name?: string;
  reference_number?: string;
}

export interface UpdateReceivedPaymentRequest {
  date?: string;
  project_id?: string;
  invoice_number?: string;
  amount?: number;
  is_vat_applicable?: boolean;
  vat_amount?: number;
  payment_method?: 'Bank Transfer' | 'Cheque' | 'Cash';
  payment_attachment?: File;
  description?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  client_name?: string;
  reference_number?: string;
}

export interface ReceivedPaymentListResponse {
  receivedPayments: ReceivedPayment[];
  total: number;
  page: number;
  pages: number;
}

export interface ReceivedPaymentFilters {
  project_id?: string;
  payment_method?: string;
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

export interface ReceivedPaymentStats {
  totalPayments: number;
  totalAmount: number;
  vatTotal: number;
  paymentMethodBreakdown: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
}

// Import Project interface
export interface Project {
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  status: 'Active' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  client_name?: string;
  manager?: string;
  createdAt?: string;
  updatedAt?: string;
} 
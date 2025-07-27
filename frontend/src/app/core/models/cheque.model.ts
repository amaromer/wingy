export interface Cheque {
  _id?: string;
  cheque_number: string;
  payee_name: string;
  amount: number;
  amount_in_words: string;
  currency: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  cheque_date: string;
  issue_date: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  iban: string;
  account_holder: string;
  description?: string;
  project_id?: string | Project;
  supplier_id?: string | Supplier;
  status: 'Draft' | 'Issued' | 'Cleared' | 'Cancelled' | 'Void';
  signature_required: boolean;
  is_void: boolean;
  void_reason?: string;
  created_by: string | User;
  approved_by?: string | User;
  approved_at?: string;
  createdAt?: string;
  updatedAt?: string;
  formattedAmount?: string;
  formattedChequeDate?: string;
  formattedIssueDate?: string;
}

export interface CreateChequeRequest {
  cheque_number: string;
  payee_name: string;
  amount: number;
  currency: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  cheque_date?: string;
  description?: string;
  project_id?: string;
  supplier_id?: string;
  language?: 'en' | 'ar';
}

export interface UpdateChequeRequest {
  cheque_number?: string;
  payee_name?: string;
  amount?: number;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD';
  cheque_date?: string;
  description?: string;
  project_id?: string;
  supplier_id?: string;
  status?: 'Draft' | 'Issued' | 'Cleared' | 'Cancelled' | 'Void';
  language?: 'en' | 'ar';
}

export interface VoidChequeRequest {
  void_reason: string;
}

export interface ChequeListResponse {
  cheques: Cheque[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface ChequeStats {
  overview: {
    totalCheques: number;
    draftCheques: number;
    issuedCheques: number;
    clearedCheques: number;
    voidCheques: number;
    totalAmount: number;
    issuedAmount: number;
    clearedAmount: number;
  };
}

export interface NextChequeNumberResponse {
  next_number: string;
}

// Supporting interfaces
export interface Project {
  _id: string;
  name: string;
}

export interface Supplier {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  name: string;
} 
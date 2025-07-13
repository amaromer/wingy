export interface Supplier {
  _id?: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  vat_enabled?: boolean;
  vat_no?: string;
  payment_terms?: string;
  is_active?: boolean;
  notes?: string;
  main_category_ids?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  vat_enabled?: boolean;
  vat_no?: string;
  payment_terms?: string;
  is_active?: boolean;
  notes?: string;
  main_category_ids?: string[];
} 
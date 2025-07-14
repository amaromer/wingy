export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Accountant' | 'Engineer';
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Accountant' | 'Engineer';
}

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
} 
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getApiUrl } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

export interface UserStats {
  roleBreakdown: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
  totalUsers: number;
  activeUsers: number;
  recentLogins: number;
}

export interface UserFilters {
  search?: string;
  role?: 'Admin' | 'Accountant';
  is_active?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Helper function to get the current API URL
  private getApiUrl(): string {
    return `${getApiUrl()}/users`;
  }

  // Helper function to map backend user to frontend user
  private mapUser(user: any): User {
    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  }

  // Get all users with filters and pagination
  getUsers(filters: UserFilters = {}): Observable<UserListResponse> {
    let params = new HttpParams();
    
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.is_active !== undefined) {
      params = params.set('is_active', filters.is_active.toString());
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.order) {
      params = params.set('order', filters.order);
    }
    if (filters.page) {
      params = params.set('skip', ((filters.page - 1) * (filters.limit || 10)).toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<any>(this.getApiUrl(), { params }).pipe(
      map(response => ({
        users: response.users.map((user: any) => this.mapUser(user)),
        total: response.total,
        page: response.page,
        pages: response.pages
      }))
    );
  }

  // Get user by ID
  getUser(id: string): Observable<User> {
    return this.http.get<any>(`${this.getApiUrl()}/${id}`).pipe(
      map(user => this.mapUser(user))
    );
  }

  // Create new user
  createUser(userData: Partial<User> & { password: string }): Observable<{ message: string; user: User }> {
    return this.http.post<any>(this.getApiUrl(), userData).pipe(
      map(response => ({
        message: response.message,
        user: this.mapUser(response.user)
      }))
    );
  }

  // Update user
  updateUser(id: string, userData: Partial<User> & { password?: string }): Observable<{ message: string; user: User }> {
    return this.http.put<any>(`${this.getApiUrl()}/${id}`, userData).pipe(
      map(response => ({
        message: response.message,
        user: this.mapUser(response.user)
      }))
    );
  }

  // Delete user
  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.getApiUrl()}/${id}`);
  }

  // Toggle user active status
  toggleUserStatus(id: string): Observable<{ message: string; user: User }> {
    return this.http.put<any>(`${this.getApiUrl()}/${id}/toggle-status`, {}).pipe(
      map(response => ({
        message: response.message,
        user: this.mapUser(response.user)
      }))
    );
  }

  // Get user statistics
  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.getApiUrl()}/stats/overview`);
  }
} 
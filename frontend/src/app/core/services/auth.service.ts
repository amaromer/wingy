import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Loading from storage:', { token: !!token, user: !!user });
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // Check if token is expired
        if (this.isTokenExpired()) {
          console.log('Token expired, clearing auth');
          this.clearAuth();
          return;
        }
        this.currentUserSubject.next(userData);
        console.log('User loaded from storage:', userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuth();
      }
    } else {
      console.log('No auth data found in storage');
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('Attempting login with:', credentials);
    return this.http.post<LoginResponse>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          console.log('Login successful:', response);
          this.setAuth(response.token, response.user);
        })
      );
  }

  register(userData: RegisterRequest): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>('/api/auth/register', userData);
  }

  logout(): void {
    console.log('Logging out');
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  updateProfile(data: UpdateProfileRequest): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>('/api/auth/me', data)
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>('/api/auth/me')
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('Auth set:', { token: !!token, user });
  }

  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    console.log('Auth cleared');
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  // Refresh user data
  refreshUser(): void {
    if (this.isAuthenticated() && !this.isTokenExpired()) {
      this.getProfile().subscribe();
    } else {
      this.clearAuth();
      this.router.navigate(['/login']);
    }
  }

  // Method to clear localStorage for testing
  clearStorageForTesting(): void {
    console.log('Clearing storage for testing');
    this.clearAuth();
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainCategory, MainCategoryFormData } from '../models/main-category.model';

@Injectable({
  providedIn: 'root'
})
export class MainCategoryService {

  constructor(private http: HttpClient) { }

  getMainCategories(): Observable<{ mainCategories: MainCategory[] }> {
    return this.http.get<{ mainCategories: MainCategory[] }>('/api/main-categories');
  }

  getMainCategory(id: string): Observable<{ mainCategory: MainCategory }> {
    return this.http.get<{ mainCategory: MainCategory }>(`/api/main-categories/${id}`);
  }

  createMainCategory(data: MainCategoryFormData): Observable<{ message: string; mainCategory: MainCategory }> {
    return this.http.post<{ message: string; mainCategory: MainCategory }>('/api/main-categories', data);
  }

  updateMainCategory(id: string, data: MainCategoryFormData): Observable<{ message: string; mainCategory: MainCategory }> {
    return this.http.put<{ message: string; mainCategory: MainCategory }>(`/api/main-categories/${id}`, data);
  }

  deleteMainCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/main-categories/${id}`);
  }
} 
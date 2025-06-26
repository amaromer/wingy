import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Category, CategoryListResponse } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'name';
  sortOrder = 'asc';
  
  // Search control with debounce
  searchControl = new FormControl('');
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Make Math available in template
  Math = Math;
  
  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  // Sort options
  sortOptions = [
    { value: 'name', label: 'CATEGORIES.SORT.NAME' },
    { value: 'code', label: 'CATEGORIES.SORT.CODE' },
    { value: 'createdAt', label: 'CATEGORIES.SORT.CREATED_DATE' }
  ];

  // Status filter options
  statusOptions = [
    { value: 'all', label: 'CATEGORIES.FILTERS.ALL' },
    { value: 'active', label: 'CATEGORIES.FILTERS.ACTIVE' },
    { value: 'inactive', label: 'CATEGORIES.FILTERS.INACTIVE' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.setupSearch();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.searchTerm = value || '';
        this.applyFilters();
      });
  }

  loadCategories() {
    this.loading = true;
    this.error = '';

    const params = new URLSearchParams({
      search: this.searchTerm,
      sort: this.sortBy,
      order: this.sortOrder,
      limit: this.itemsPerPage.toString(),
      skip: ((this.currentPage - 1) * this.itemsPerPage).toString()
    });

    this.http.get<CategoryListResponse>(`/api/categories?${params}`)
      .subscribe({
        next: (response) => {
          this.categories = response.categories;
          this.filteredCategories = response.categories;
          this.totalItems = response.total;
          this.totalPages = response.pages;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.error = 'CATEGORIES.ERROR.LOAD_FAILED';
          this.loading = false;
        }
      });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadCategories();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCategories();
  }

  onCreateNew() {
    this.router.navigate(['/categories/create']);
  }

  onEdit(category: Category) {
    this.router.navigate(['/categories', category._id, 'edit']);
  }

  onDelete(category: Category) {
    if (confirm(this.translate.instant('CATEGORIES.MESSAGES.DELETE_CONFIRM'))) {
      this.deleteCategory(category._id);
    }
  }

  private deleteCategory(categoryId: string) {
    this.http.delete(`/api/categories/${categoryId}`)
      .subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.error = 'CATEGORIES.ERROR.DELETE_FAILED';
        }
      });
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active' : 'status-inactive';
  }

  getStatusText(status: boolean): string {
    return status ? 'CATEGORIES.STATUS.ACTIVE' : 'CATEGORIES.STATUS.INACTIVE';
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  hasPrevPage(): boolean {
    return this.currentPage > 1;
  }

  // Helper method to check if parent_category is populated object
  isParentCategoryObject(parentCategory: any): boolean {
    return parentCategory && typeof parentCategory === 'object' && parentCategory.name;
  }

  // Helper method to get parent category display text
  getParentCategoryDisplay(parentCategory: any): string {
    if (this.isParentCategoryObject(parentCategory)) {
      return `${parentCategory.name} (${parentCategory.code})`;
    }
    return parentCategory || '-';
  }
} 
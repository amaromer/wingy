import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { MainCategory } from '../../../core/models/main-category.model';
import { MainCategoryService } from '../../../core/services/main-category.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './main-category-list.component.html',
  styleUrls: ['./main-category-list.component.scss']
})
export class MainCategoryListComponent implements OnInit, OnDestroy {
  mainCategories: MainCategory[] = [];
  loading = false;
  error = '';
  success = '';
  searchTerm = '';
  sortBy = 'name';
  sortOrder = 'asc';
  showInactive = false;

  private destroy$ = new Subject<void>();

  constructor(
    private mainCategoryService: MainCategoryService,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.loadMainCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMainCategories() {
    this.loading = true;
    this.error = '';

    this.mainCategoryService.getMainCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mainCategories = response.mainCategories;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading main categories:', err);
          this.error = 'MAIN_CATEGORIES.ERROR.LOAD_FAILED';
          this.loading = false;
        }
      });
  }

  onCreateMainCategory() {
    this.router.navigate(['/main-categories/create']);
  }

  onEditMainCategory(id: string) {
    this.router.navigate(['/main-categories', id, 'edit']);
  }

  onDeleteMainCategory(mainCategory: MainCategory) {
    if (confirm('MAIN_CATEGORIES.MESSAGES.DELETE_CONFIRM')) {
      this.mainCategoryService.deleteMainCategory(mainCategory._id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.success = 'MAIN_CATEGORIES.MESSAGES.DELETE_SUCCESS';
            this.loadMainCategories();
            setTimeout(() => this.success = '', 3000);
          },
          error: (err) => {
            console.error('Error deleting main category:', err);
            this.error = 'MAIN_CATEGORIES.ERROR.DELETE_FAILED';
            setTimeout(() => this.error = '', 5000);
          }
        });
    }
  }

  get filteredMainCategories(): MainCategory[] {
    let filtered = this.mainCategories;

    // Filter by search term
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(search) ||
        (category.description && category.description.toLowerCase().includes(search))
      );
    }

    // Filter by active status
    if (!this.showInactive) {
      filtered = filtered.filter(category => category.is_active !== false);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[this.sortBy as keyof MainCategory];
      let bValue = b[this.sortBy as keyof MainCategory];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue && bValue) {
        if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }

  onSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  clearFilters() {
    this.searchTerm = '';
    this.showInactive = false;
    this.sortBy = 'name';
    this.sortOrder = 'asc';
  }
} 
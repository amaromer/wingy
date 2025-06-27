import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { Expense, ExpenseListResponse, ExpenseFilters, Project, Category, Supplier } from '../../../core/models/expense.model';
import { ExpenseService } from '../../../core/services/expense.service';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  categories: Category[] = [];
  projects: Project[] = [];
  suppliers: Supplier[] = [];
  
  loading = false;
  submitting = false;
  error = '';
  success = '';
  
  // Mobile support
  isMobile = false;
  showFilters = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  
  // Filters
  filterForm: FormGroup;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Sorting
  sortField = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Bulk actions
  selectedExpenses: string[] = [];
  selectAll = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private translateService: TranslateService
  ) {
    this.filterForm = this.fb.group({
      project_id: [''],
      supplier_id: [''],
      category_id: [''],
      date_from: [''],
      date_to: [''],
      amount_min: [''],
      amount_max: [''],
      currency: ['']
    });
    
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    this.loadFilters();
    this.loadExpenses();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Mobile filter toggle
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // Quick expense navigation
  onQuickExpense() {
    this.router.navigate(['/expenses/quick']);
  }

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadExpenses();
    });
  }

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }

  loadFilters() {
    // Load categories
    this.http.get<any>('/api/categories')
      .subscribe({
        next: (response) => {
          console.log('Categories API response:', response);
          this.categories = Array.isArray(response.categories) ? response.categories : [];
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.categories = [];
        }
      });

    // Load projects
    this.http.get<any>('/api/projects')
      .subscribe({
        next: (response) => {
          console.log('Projects API response:', response);
          this.projects = Array.isArray(response.projects) ? response.projects : [];
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.projects = [];
        }
      });

    // Load suppliers
    this.http.get<Supplier[]>('/api/suppliers')
      .subscribe({
        next: (data) => {
          console.log('Suppliers API response:', data);
          this.suppliers = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          console.error('Error loading suppliers:', err);
          this.suppliers = [];
        }
      });
  }

  loadExpenses() {
    this.loading = true;
    this.error = '';

    const filters: ExpenseFilters = {
      ...this.filterForm.value,
      search: this.searchTerm,
      sort: this.sortField,
      order: this.sortOrder,
      limit: this.itemsPerPage,
      skip: (this.currentPage - 1) * this.itemsPerPage
    };

    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ExpenseFilters] === '' || filters[key as keyof ExpenseFilters] === null || filters[key as keyof ExpenseFilters] === undefined) {
        delete filters[key as keyof ExpenseFilters];
      }
    });

    this.expenseService.getExpenses(filters).subscribe({
      next: (response) => {
        console.log('Expense API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response.expenses type:', typeof response.expenses);
        console.log('Response.expenses is array:', Array.isArray(response.expenses));
        
        this.expenses = Array.isArray(response.expenses) ? response.expenses : [];
        this.totalItems = response.total || 0;
        this.totalPages = response.pages || 1;
        this.currentPage = response.page || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading expenses:', err);
        this.error = 'EXPENSE.ERROR.LOAD_FAILED';
        this.expenses = [];
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadExpenses();
  }

  clearFilters() {
    this.filterForm.reset();
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadExpenses();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.loadExpenses();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadExpenses();
  }

  onPageClick(page: number | string) {
    if (typeof page === 'number') {
      this.onPageChange(page);
    }
  }

  onCreateExpense() {
    this.router.navigate(['/expenses/create']);
  }

  onEditExpense(expenseId: string) {
    this.router.navigate(['/expenses', expenseId, 'edit']);
  }

  onViewExpense(expenseId: string) {
    this.router.navigate(['/expenses', expenseId]);
  }

  onDeleteExpense(expenseId: string) {
    if (confirm(this.translateService.instant('EXPENSE.CONFIRM.DELETE_SINGLE'))) {
      this.submitting = true;
      this.expenseService.deleteExpense(expenseId).subscribe({
        next: () => {
          this.success = 'EXPENSE.SUCCESS.DELETED';
          this.loadExpenses();
          this.submitting = false;
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error('Error deleting expense:', err);
          this.error = 'EXPENSE.ERROR.DELETE_FAILED';
          this.submitting = false;
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  // Bulk actions
  onSelectAll() {
    if (this.selectAll) {
      this.selectedExpenses = this.expenses.map(expense => expense.id);
    } else {
      this.selectedExpenses = [];
    }
  }

  onSelectExpense(expenseId: string) {
    const index = this.selectedExpenses.indexOf(expenseId);
    if (index > -1) {
      this.selectedExpenses.splice(index, 1);
    } else {
      this.selectedExpenses.push(expenseId);
    }
    this.selectAll = this.selectedExpenses.length === this.expenses.length;
  }

  onBulkDelete() {
    if (this.selectedExpenses.length === 0) return;
    
    if (confirm(this.translateService.instant('EXPENSE.CONFIRM.DELETE_MULTIPLE', { count: this.selectedExpenses.length }))) {
      this.submitting = true;
      this.expenseService.bulkDeleteExpenses(this.selectedExpenses).subscribe({
        next: () => {
          this.success = 'EXPENSE.SUCCESS.BULK_DELETED';
          this.selectedExpenses = [];
          this.selectAll = false;
          this.loadExpenses();
          this.submitting = false;
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error('Error bulk deleting expenses:', err);
          this.error = 'EXPENSE.ERROR.BULK_DELETE_FAILED';
          this.submitting = false;
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenses.find(expense => expense.id === id);
  }

  getCategoryName(categoryId: string | Category): string {
    if (typeof categoryId === 'string') {
      const category = this.categories.find(cat => cat._id === categoryId || cat.id === categoryId);
      return category ? category.name : this.translateService.instant('EXPENSE.UNKNOWN.CATEGORY');
    }
    return categoryId.name || this.translateService.instant('EXPENSE.UNKNOWN.CATEGORY');
  }

  getProjectName(projectId: string | Project): string {
    if (typeof projectId === 'string') {
      const project = this.projects.find(proj => proj._id === projectId || proj.id === projectId);
      return project ? project.name : this.translateService.instant('EXPENSE.UNKNOWN.PROJECT');
    }
    return projectId.name || this.translateService.instant('EXPENSE.UNKNOWN.PROJECT');
  }

  getSupplierName(supplierId: string | Supplier): string {
    if (typeof supplierId === 'string') {
      const supplier = this.suppliers.find(sup => sup._id === supplierId || sup.id === supplierId);
      return supplier ? supplier.name : this.translateService.instant('EXPENSE.UNKNOWN.SUPPLIER');
    }
    return supplierId.name || this.translateService.instant('EXPENSE.UNKNOWN.SUPPLIER');
  }

  formatCurrency(amount: number, currency: string): string {
    return this.expenseService.formatCurrency(amount, currency);
  }

  formatDate(date: string): string {
    return this.expenseService.formatDate(date);
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  getStatusClass(expense: Expense): string {
    // You can add status logic here based on your business rules
    return 'status-active';
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
} 
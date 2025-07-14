import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { UserService, UserFilters, UserListResponse, UserStats } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  stats: UserStats | null = null;
  loading = false;
  error = '';
  currentUser: User | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  pageSize = 10;
  
  // Filters
  filters: UserFilters = {
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10
  };
  
  searchForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Make Math available in template
  Math = Math;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      role: [''],
      is_active: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
    this.loadStats();
    this.setupSearchListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchListener(): void {
    this.searchForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    const formValue = this.searchForm.value;
    this.filters = {
      ...this.filters,
      search: formValue.search || undefined,
      role: formValue.role || undefined,
      is_active: formValue.is_active === '' ? undefined : formValue.is_active,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.userService.getUsers(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UserListResponse) => {
          this.users = response.users;
          this.totalUsers = response.total;
          this.totalPages = response.pages;
          this.currentPage = response.page;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to load users';
          this.loading = false;
        }
      });
  }

  loadStats(): void {
    this.userService.getUserStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Failed to load user stats:', error);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSort(sort: string): void {
    if (this.filters.sort === sort) {
      this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort = sort;
      this.filters.order = 'desc';
    }
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.currentPage = 1;
    this.filters = {
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 10
    };
    this.loadUsers();
  }

  createUser(): void {
    this.router.navigate(['/users/create']);
  }

  editUser(user: User): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  toggleUserStatus(user: User): void {
    if (user.id === this.currentUser?.id) {
      this.error = 'Cannot deactivate your own account';
      return;
    }

    this.userService.toggleUserStatus(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the user in the list
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = response.user;
          }
          this.loadStats(); // Refresh stats
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to toggle user status';
        }
      });
  }

  deleteUser(user: User): void {
    if (user.id === this.currentUser?.id) {
      this.error = 'Cannot delete your own account';
      return;
    }

    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      this.userService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.totalUsers--;
            this.loadStats(); // Refresh stats
          },
          error: (error) => {
            this.error = error.error?.message || 'Failed to delete user';
          }
        });
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'badge-admin';
      case 'Accountant':
        return 'badge-accountant';
      case 'Engineer':
        return 'badge-engineer';
      default:
        return 'badge-default';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'Admin':
        return 'ROLES.ADMIN';
      case 'Accountant':
        return 'ROLES.ACCOUNTANT';
      case 'Engineer':
        return 'ROLES.ENGINEER';
      default:
        return role;
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getAdminCount(): number {
    if (!this.stats?.roleBreakdown) return 0;
    const adminRole = this.stats.roleBreakdown.find(r => r._id === 'Admin');
    return adminRole?.count || 0;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalUsers);
  }
} 
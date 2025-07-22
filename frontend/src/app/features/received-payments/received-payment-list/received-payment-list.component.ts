import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ReceivedPayment, ReceivedPaymentFilters } from '../../../core/models/received-payment.model';
import { ReceivedPaymentService } from '../../../core/services/received-payment.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-received-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './received-payment-list.component.html',
  styleUrls: ['./received-payment-list.component.scss']
})
export class ReceivedPaymentListComponent implements OnInit {
  receivedPayments: ReceivedPayment[] = [];
  projects: Project[] = [];
  loading = false;
  error = '';
  total = 0;
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;

  // Filters
  filters: ReceivedPaymentFilters = {
    limit: this.itemsPerPage,
    skip: 0,
    sort: 'date',
    order: 'desc'
  };

  // Search and filter states
  searchTerm = '';
  selectedProject = '';
  selectedPaymentMethod = '';
  selectedCurrency = '';
  dateFrom = '';
  dateTo = '';
  amountMin = '';
  amountMax = '';

  constructor(
    private receivedPaymentService: ReceivedPaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadReceivedPayments();
  }

  private loadProjects(): void {
    // Load projects for filter dropdown
    this.receivedPaymentService['http'].get<{ projects: Project[] }>('/api/projects').subscribe({
      next: (response) => {
        this.projects = response.projects;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      }
    });
  }

  private loadReceivedPayments(): void {
    this.loading = true;
    this.error = '';

    this.receivedPaymentService.getReceivedPayments(this.filters).subscribe({
      next: (response) => {
        this.receivedPayments = response.receivedPayments;
        this.total = response.total;
        this.currentPage = response.page;
        this.totalPages = response.pages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading received payments:', error);
        this.error = 'ERROR.LOADING_RECEIVED_PAYMENTS';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.filters.search = this.searchTerm;
    this.filters.skip = 0;
    this.currentPage = 1;
    this.loadReceivedPayments();
  }

  onFilterChange(): void {
    this.filters.project_id = this.selectedProject || undefined;
    this.filters.payment_method = this.selectedPaymentMethod || undefined;
    this.filters.currency = this.selectedCurrency || undefined;
    this.filters.date_from = this.dateFrom || undefined;
    this.filters.date_to = this.dateTo || undefined;
    this.filters.amount_min = this.amountMin ? parseFloat(this.amountMin) : undefined;
    this.filters.amount_max = this.amountMax ? parseFloat(this.amountMax) : undefined;
    this.filters.skip = 0;
    this.currentPage = 1;
    this.loadReceivedPayments();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters.skip = (page - 1) * this.itemsPerPage;
    this.loadReceivedPayments();
  }

  onSort(sortField: string): void {
    if (this.filters.sort === sortField) {
      this.filters.order = this.filters.order === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort = sortField;
      this.filters.order = 'asc';
    }
    this.loadReceivedPayments();
  }

  onCreateNew(): void {
    this.router.navigate(['/received-payments/create']);
  }

  onEdit(receivedPayment: ReceivedPayment): void {
    this.router.navigate(['/received-payments/edit', receivedPayment._id]);
  }

  onDelete(receivedPayment: ReceivedPayment): void {
    if (confirm('Are you sure you want to delete this received payment?')) {
      this.receivedPaymentService.deleteReceivedPayment(receivedPayment._id!).subscribe({
        next: () => {
          this.loadReceivedPayments();
        },
        error: (error) => {
          console.error('Error deleting received payment:', error);
          this.error = 'ERROR.DELETING_RECEIVED_PAYMENT';
        }
      });
    }
  }

  onViewAttachment(receivedPayment: ReceivedPayment): void {
    if (receivedPayment.payment_attachment) {
      window.open(`/uploads/${receivedPayment.payment_attachment}`, '_blank');
    }
  }

  getProjectName(receivedPayment: ReceivedPayment): string {
    if (typeof receivedPayment.project_id === 'object' && receivedPayment.project_id) {
      return receivedPayment.project_id.name;
    }
    return 'Unknown Project';
  }

  formatAmount(amount: number, currency: string): string {
    return this.receivedPaymentService.formatCurrency(amount, currency);
  }

  formatDate(date: string): string {
    return this.receivedPaymentService.formatDate(date);
  }

  getSortIcon(field: string): string {
    if (this.filters.sort === field) {
      return this.filters.order === 'asc' ? '↑' : '↓';
    }
    return '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedProject = '';
    this.selectedPaymentMethod = '';
    this.selectedCurrency = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.amountMin = '';
    this.amountMax = '';
    this.filters = {
      limit: this.itemsPerPage,
      skip: 0,
      sort: 'date',
      order: 'desc'
    };
    this.loadReceivedPayments();
  }

  getPaymentMethodClass(method: string): string {
    switch (method) {
      case 'Bank Transfer':
        return 'badge-bank-transfer';
      case 'Cheque':
        return 'badge-cheque';
      case 'Cash':
        return 'badge-cash';
      default:
        return 'badge-default';
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
} 
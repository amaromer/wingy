import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Cheque } from '../../../core/models/cheque.model';
import { ChequeService } from '../../../core/services/cheque.service';

@Component({
  selector: 'app-cheque-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cheque-list.component.html',
  styleUrls: ['./cheque-list.component.scss']
})
export class ChequeListComponent implements OnInit {
  // Make Math available in template
  Math = Math;
  
  cheques: Cheque[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filter properties
  selectedStatus = '';
  selectedCurrency = '';
  dateFrom = '';
  dateTo = '';
  amountMin = '';
  amountMax = '';

  // Sort properties
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private chequeService: ChequeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCheques();
  }

  async loadCheques(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const filters = {
        payee_name: this.searchTerm || undefined,
        status: this.selectedStatus || undefined,
        currency: this.selectedCurrency || undefined,
        date_from: this.dateFrom || undefined,
        date_to: this.dateTo || undefined
      };

      const sort = {
        sort_by: this.sortBy,
        sort_order: this.sortOrder
      };

      const response = await this.chequeService.getCheques(
        this.currentPage,
        this.itemsPerPage,
        filters,
        sort
      ).toPromise();

      if (response) {
        this.cheques = response.cheques;
        this.totalPages = response.pagination.total_pages;
        this.totalItems = response.pagination.total_items;
        this.currentPage = response.pagination.current_page;
      }
    } catch (error) {
      console.error('Error loading cheques:', error);
      this.error = 'CHEQUE.ERROR.LOADING_CHEQUES';
    } finally {
      this.loading = false;
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCheques();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCheques();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadCheques();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) {
      return '↕️';
    }
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  onClearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCurrency = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.amountMin = '';
    this.amountMax = '';
    this.currentPage = 1;
    this.loadCheques();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCheques();
  }

  onCreateCheque(): void {
    this.router.navigate(['/cheques/create']);
  }

  onViewCheque(cheque: Cheque): void {
    this.router.navigate(['/cheques', cheque._id!]);
  }

  onEditCheque(cheque: Cheque): void {
    this.router.navigate(['/cheques', cheque._id!, 'edit']);
  }

  async onDeleteCheque(cheque: Cheque): Promise<void> {
    if (!confirm('CHEQUE.CONFIRMATIONS.DELETE' as any)) {
      return;
    }

    try {
      await this.chequeService.deleteCheque(cheque._id!).toPromise();
      this.loadCheques();
    } catch (error) {
      console.error('Error deleting cheque:', error);
      this.error = 'CHEQUE.ERROR.DELETING_CHEQUE';
    }
  }

  async onApproveCheque(cheque: Cheque): Promise<void> {
    if (!confirm('CHEQUE.CONFIRMATIONS.APPROVE' as any)) {
      return;
    }

    try {
      await this.chequeService.approveCheque(cheque._id!).toPromise();
      this.loadCheques();
    } catch (error) {
      console.error('Error approving cheque:', error);
      this.error = 'CHEQUE.ERROR.APPROVING_CHEQUE';
    }
  }

  async onVoidCheque(cheque: Cheque): Promise<void> {
    const reason = prompt('CHEQUE.FIELDS.VOID_REASON_PLACEHOLDER' as any);
    if (!reason) {
      return;
    }

    if (!confirm('CHEQUE.CONFIRMATIONS.VOID' as any)) {
      return;
    }

    try {
      await this.chequeService.voidCheque(cheque._id!, { void_reason: reason }).toPromise();
      this.loadCheques();
    } catch (error) {
      console.error('Error voiding cheque:', error);
      this.error = 'CHEQUE.ERROR.VOIDING_CHEQUE';
    }
  }

  // Helper methods
  getStatusClass(status: string): string {
    return this.chequeService.getStatusClass(status);
  }

  getStatusIcon(status: string): string {
    return this.chequeService.getStatusIcon(status);
  }

  formatCurrency(amount: number, currency: string): string {
    return this.chequeService.formatCurrency(amount, currency);
  }

  formatDate(date: string): string {
    return this.chequeService.formatDate(date);
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
} 
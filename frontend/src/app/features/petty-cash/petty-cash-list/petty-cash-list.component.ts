import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { PettyCash } from '../../../core/models/petty-cash.model';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-petty-cash-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './petty-cash-list.component.html',
  styleUrls: ['./petty-cash-list.component.scss']
})
export class PettyCashListComponent implements OnInit {
  transactions: PettyCash[] = [];
  employees: Employee[] = [];
  currentPage = 1;
  totalPages = 1;
  total = 0;
  loading = false;
  
  // Filters
  selectedEmployee: string = '';
  selectedType: string = '';
  selectedReferenceType: string = '';
  
  // Available options
  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' },
    { value: 'transfer_in', label: 'Transfer In' },
    { value: 'transfer_out', label: 'Transfer Out' }
  ];
  
  referenceTypeOptions = [
    { value: '', label: 'All References' },
    { value: 'manual', label: 'Manual' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' }
  ];

  constructor(
    private pettyCashService: PettyCashService,
    private employeeService: EmployeeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadTransactions();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees(1, 100, '', true).subscribe({
      next: (response) => {
        this.employees = response.employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  loadTransactions(): void {
    this.loading = true;
    
    const filters = {
      employee_id: this.selectedEmployee || undefined,
      type: this.selectedType || undefined,
      reference_type: this.selectedReferenceType || undefined
    };

    this.pettyCashService.getTransactions(this.currentPage, 10, filters.employee_id, filters.type, filters.reference_type)
      .subscribe({
        next: (response) => {
          this.transactions = response.transactions;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  addCredit(): void {
    this.router.navigate(['/petty-cash/credit']);
  }

  addDebit(): void {
    this.router.navigate(['/petty-cash/debit']);
  }

  transfer(): void {
    this.router.navigate(['/petty-cash/transfer']);
  }

  viewBalances(): void {
    this.router.navigate(['/petty-cash/balances']);
  }

  deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.pettyCashService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
        }
      });
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'credit':
        return 'badge-success';
      case 'debit':
        return 'badge-danger';
      case 'transfer_in':
        return 'badge-info';
      case 'transfer_out':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getTypeText(type: string): string {
    switch (type) {
      case 'credit':
        return 'Credit';
      case 'debit':
        return 'Debit';
      case 'transfer_in':
        return 'Transfer In';
      case 'transfer_out':
        return 'Transfer Out';
      default:
        return type;
    }
  }

  getReferenceTypeText(referenceType: string): string {
    switch (referenceType) {
      case 'manual':
        return 'Manual';
      case 'expense':
        return 'Expense';
      case 'transfer':
        return 'Transfer';
      default:
        return referenceType;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }

  getTransferInfo(transaction: PettyCash): string {
    if (transaction.type === 'transfer_out' && transaction.transfer_to_employee) {
      return `To: ${transaction.transfer_to_employee.name}`;
    }
    if (transaction.type === 'transfer_in' && transaction.transfer_from_employee) {
      return `From: ${transaction.transfer_from_employee.name}`;
    }
    return '';
  }
} 
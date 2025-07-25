import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PayrollService } from '../../../core/services/payroll.service';
import { Payroll } from '../../../core/models/payroll.model';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payroll-list.component.html',
  styleUrls: ['./payroll-list.component.scss']
})
export class PayrollListComponent implements OnInit {
  payrolls: Payroll[] = [];
  currentPage = 1;
  totalPages = 1;
  total = 0;
  loading = false;
  
  // Filters
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedEmployee: string = '';
  selectedStatus: string = '';
  
  // Available options
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Paid' },
    { value: 'false', label: 'Unpaid' }
  ];

  constructor(
    private payrollService: PayrollService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPayrolls();
  }

  loadPayrolls(): void {
    this.loading = true;
    
    const filters = {
      month: this.selectedMonth,
      year: this.selectedYear,
      employee_id: this.selectedEmployee || undefined,
      is_paid: this.selectedStatus ? this.selectedStatus === 'true' : undefined
    };

    this.payrollService.getPayrolls(this.currentPage, 10, filters.month, filters.year, filters.employee_id, filters.is_paid)
      .subscribe({
        next: (response) => {
          this.payrolls = response.payrolls;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading payrolls:', error);
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPayrolls();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayrolls();
  }

  addPayroll(): void {
    this.router.navigate(['/payroll/create']);
  }

  editPayroll(id: string): void {
    this.router.navigate(['/payroll', id, 'edit']);
  }

  viewPayroll(id: string): void {
    this.router.navigate(['/payroll', id]);
  }

  deletePayroll(id: string): void {
    if (confirm('Are you sure you want to delete this payroll record?')) {
      this.payrollService.deletePayroll(id).subscribe({
        next: () => {
          this.loadPayrolls();
        },
        error: (error) => {
          console.error('Error deleting payroll:', error);
        }
      });
    }
  }

  markAsPaid(id: string): void {
    this.payrollService.markPayrollAsPaid(id).subscribe({
      next: () => {
        this.loadPayrolls();
      },
      error: (error) => {
        console.error('Error marking payroll as paid:', error);
      }
    });
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  getStatusBadgeClass(isPaid: boolean): string {
    return isPaid ? 'badge-success' : 'badge-warning';
  }

  getStatusText(isPaid: boolean): string {
    return isPaid ? 'Paid' : 'Unpaid';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }
} 
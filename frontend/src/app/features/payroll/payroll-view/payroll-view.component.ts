import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PayrollService } from '../../../core/services/payroll.service';
import { Payroll } from '../../../core/models/payroll.model';

@Component({
  selector: 'app-payroll-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './payroll-view.component.html',
  styleUrls: ['./payroll-view.component.scss']
})
export class PayrollViewComponent implements OnInit {
  payroll: Payroll | null = null;
  payrollId: string | null = null;
  loading = false;
  error = '';

  constructor(
    private payrollService: PayrollService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.payrollId = this.route.snapshot.paramMap.get('id');
    if (this.payrollId) {
      this.loadPayroll();
    }
  }

  loadPayroll(): void {
    if (!this.payrollId) return;

    this.loading = true;
    this.error = '';

    this.payrollService.getPayroll(this.payrollId).subscribe({
      next: (payroll) => {
        this.payroll = payroll;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payroll:', error);
        this.error = 'Error loading payroll data';
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.payrollId) {
      this.router.navigate(['/payroll', this.payrollId, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/payroll']);
  }

  onDelete(): void {
    if (!this.payrollId) return;

    if (confirm('Are you sure you want to delete this payroll record?')) {
      this.payrollService.deletePayroll(this.payrollId).subscribe({
        next: () => {
          this.router.navigate(['/payroll']);
        },
        error: (error) => {
          console.error('Error deleting payroll:', error);
        }
      });
    }
  }

  markAsPaid(): void {
    if (!this.payrollId) return;

    this.payrollService.markPayrollAsPaid(this.payrollId).subscribe({
      next: () => {
        this.loadPayroll(); // Reload to get updated status
      },
      error: (error: any) => {
        console.error('Error marking as paid:', error);
      }
    });
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }

  calculateDailyRate(baseSalary: number): number {
    return baseSalary / 30; // Assuming 30 days per month
  }

  calculateAbsentDeduction(dailyRate: number, absentDays: number): number {
    return dailyRate * absentDays;
  }

  calculateOvertimeAmount(dailyRate: number, overtimeDays: number): number {
    return dailyRate * overtimeDays * 1.5; // 1.5x for overtime
  }

  calculateNetSalary(baseSalary: number, absentDeduction: number, overtimeAmount: number, deductions: number, bonuses: number): number {
    return baseSalary - absentDeduction + overtimeAmount + bonuses - deductions;
  }
} 
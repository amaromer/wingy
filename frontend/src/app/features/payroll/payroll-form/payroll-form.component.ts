import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PayrollService } from '../../../core/services/payroll.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Payroll, PayrollFormData } from '../../../core/models/payroll.model';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-payroll-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './payroll-form.component.html',
  styleUrls: ['./payroll-form.component.scss']
})
export class PayrollFormComponent implements OnInit {
  payrollForm: FormGroup;
  isEditMode = false;
  isViewMode = false;
  payrollId: string | null = null;
  loading = false;
  submitting = false;
  employees: Employee[] = [];

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

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.payrollForm = this.fb.group({
      employee_id: ['', [Validators.required]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2030)]],
      absent_days: [0, [Validators.required, Validators.min(0), Validators.max(31)]],
      overtime_days: [0, [Validators.required, Validators.min(0)]],
      deductions: [0, [Validators.required, Validators.min(0)]],
      bonuses: [0, [Validators.required, Validators.min(0)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.payrollId = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.map(segment => segment.path).join('/');
    const isEdit = url.includes('/edit');
    
    if (this.payrollId) {
      this.isEditMode = isEdit;
      this.isViewMode = !isEdit;
    }
    
    // Load employees first, then load payroll data
    this.loadEmployees();
    if (this.payrollId) {
      // Small delay to ensure employees are loaded
      setTimeout(() => {
        this.loadPayroll();
      }, 100);
    }
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

  loadPayroll(): void {
    if (!this.payrollId) return;

    this.loading = true;
    
    this.payrollService.getPayroll(this.payrollId).subscribe({
      next: (payroll) => {
        // Handle employee_id which might be populated or just an ID
        const employeeId = typeof payroll.employee_id === 'object' ? payroll.employee_id._id : payroll.employee_id;
        
        // Ensure all values are properly typed
        const formData = {
          employee_id: employeeId,
          month: Number(payroll.month),
          year: Number(payroll.year),
          absent_days: Number(payroll.absent_days || 0),
          overtime_days: Number(payroll.overtime_days || 0),
          deductions: Number(payroll.deductions || 0),
          bonuses: Number(payroll.bonuses || 0),
          notes: payroll.notes || ''
        };
        
        this.payrollForm.patchValue(formData);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payroll:', error);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.payrollForm.invalid) {
      return;
    }

    this.submitting = true;
    const formData: PayrollFormData = this.payrollForm.value;

    if (this.isEditMode && this.payrollId) {
      this.payrollService.updatePayroll(this.payrollId, formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/payroll']);
        },
        error: (error) => {
          console.error('Error updating payroll:', error);
          this.submitting = false;
        }
      });
    } else {
      this.payrollService.createPayroll(formData).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/payroll']);
        },
        error: (error) => {
          console.error('Error creating payroll:', error);
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/payroll']);
  }

  onEdit(): void {
    this.router.navigate(['/payroll', this.payrollId, 'edit']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.payrollForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors['max'].max}`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find(emp => emp._id === employeeId);
    return employee ? `${employee.name} - ${employee.job}` : '';
  }

  getEmployeeSalary(employeeId: string): number {
    const employee = this.employees.find(emp => emp._id === employeeId);
    return employee ? employee.salary : 0;
  }

  calculateDailyRate(employeeId: string): number {
    const employee = this.employees.find(emp => emp._id === employeeId);
    if (!employee) return 0;
    return employee.salary / 30; // Assuming 30 days per month
  }

  calculateAbsentDeduction(employeeId: string, absentDays: number): number {
    const dailyRate = this.calculateDailyRate(employeeId);
    return dailyRate * absentDays;
  }

  calculateOvertimeAmount(employeeId: string, overtimeHours: number): number {
    const dailyRate = this.calculateDailyRate(employeeId);
    const hourlyRate = dailyRate / 8; // Assuming 8 hours per day
    return hourlyRate * overtimeHours * 1.5; // 1.5x for overtime
  }

  calculateNetSalary(employeeId: string, absentDays: number, overtimeHours: number): number {
    const employee = this.employees.find(emp => emp._id === employeeId);
    if (!employee) return 0;
    
    const basicSalary = employee.salary;
    const absentDeduction = this.calculateAbsentDeduction(employeeId, absentDays);
    const overtimeAmount = this.calculateOvertimeAmount(employeeId, overtimeHours);
    const deductions = this.payrollForm.get('deductions')?.value || 0;
    const bonuses = this.payrollForm.get('bonuses')?.value || 0;
    
    return basicSalary - absentDeduction + overtimeAmount + bonuses - deductions;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-petty-cash-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './petty-cash-transfer.component.html',
  styleUrls: ['./petty-cash-transfer.component.scss']
})
export class PettyCashTransferComponent implements OnInit {
  transferForm: FormGroup;
  employees: Employee[] = [];
  loading = false;
  submitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private pettyCashService: PettyCashService,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.transferForm = this.fb.group({
      from_employee_id: ['', Validators.required],
      to_employee_id: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees(1, 100, '', true).subscribe({
      next: (response) => {
        this.employees = response.employees;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.error = 'Error loading employees';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.transferForm.valid) {
      this.submitting = true;
      this.error = '';

      const formData = this.transferForm.value;
      
      // Check if from and to employees are different
      if (formData.from_employee_id === formData.to_employee_id) {
        this.error = 'Cannot transfer to the same employee';
        this.submitting = false;
        return;
      }
      
      this.pettyCashService.transferBetweenEmployees(
        formData.from_employee_id,
        formData.to_employee_id,
        Number(formData.amount),
        formData.description
      ).subscribe({
        next: () => {
          this.router.navigate(['/petty-cash']);
        },
        error: (error) => {
          console.error('Error transferring amount:', error);
          this.error = error.error?.message || 'Error transferring amount';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/petty-cash']);
  }

  getErrorMessage(field: string): string {
    const control = this.transferForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['min']) return 'Amount must be greater than 0';
      if (control.errors['minlength']) return 'Minimum length not met';
      if (control.errors['maxlength']) return 'Maximum length exceeded';
    }
    return '';
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }
} 
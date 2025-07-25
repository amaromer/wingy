import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-petty-cash-credit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './petty-cash-credit.component.html',
  styleUrls: ['./petty-cash-credit.component.scss']
})
export class PettyCashCreditComponent implements OnInit {
  creditForm: FormGroup;
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
    this.creditForm = this.fb.group({
      employee_id: ['', Validators.required],
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
    if (this.creditForm.valid) {
      this.submitting = true;
      this.error = '';

      const formData = this.creditForm.value;
      
      this.pettyCashService.addCredit(
        formData.employee_id,
        Number(formData.amount),
        formData.description
      ).subscribe({
        next: () => {
          this.router.navigate(['/petty-cash']);
        },
        error: (error) => {
          console.error('Error adding credit:', error);
          this.error = error.error?.message || 'Error adding credit';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/petty-cash']);
  }

  getErrorMessage(field: string): string {
    const control = this.creditForm.get(field);
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Payment, CreatePaymentRequest, UpdatePaymentRequest } from '../../../core/models/payment.model';
import { PaymentService } from '../../../core/services/payment.service';
import { VATCalculator } from '../../../core/utils/vat-calculator';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  paymentForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  paymentId: string | null = null;

  // Data for dropdowns
  projects: any[] = [];
  suppliers: any[] = [];

  // File handling
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      date: ['', [Validators.required]],
      invoice_number: ['', [Validators.required, Validators.maxLength(50)]],
      amount: ['', [Validators.required, Validators.min(0)]],
      is_vat_included: [false],
      vat_amount: [0, [Validators.required, Validators.min(0)]],
      payment_type: ['Cash', [Validators.required]],
      project_id: [''],
      supplier_id: [''],
      description: ['', [Validators.maxLength(500)]],
      currency: ['AED', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadProjects();
    this.loadSuppliers();
    this.setupVATCalculation();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.paymentId = params['id'];
        this.loadPayment();
      }
    });
  }

  loadProjects() {
    this.http.get<any>('/api/projects')
      .subscribe({
        next: (response) => {
          this.projects = Array.isArray(response.projects) ? response.projects : [];
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.projects = [];
        }
      });
  }

  loadSuppliers() {
    this.http.get<any>('/api/suppliers')
      .subscribe({
        next: (response) => {
          this.suppliers = Array.isArray(response) ? response : [];
        },
        error: (err) => {
          console.error('Error loading suppliers:', err);
          this.suppliers = [];
        }
      });
  }

  loadPayment() {
    if (!this.paymentId) return;

    this.loading = true;
    this.error = '';

    this.paymentService.getPayment(this.paymentId)
      .subscribe({
        next: (response) => {
          this.populateForm(response);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading payment:', err);
          this.error = 'PAYMENT.ERROR.NOT_FOUND';
          this.loading = false;
        }
      });
  }

  populateForm(payment: Payment) {
    this.paymentForm.patchValue({
      date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : '',
      invoice_number: payment.invoice_number,
      amount: payment.amount,
      is_vat_included: payment.is_vat_included,
      vat_amount: payment.vat_amount,
      payment_type: payment.payment_type,
      project_id: payment.project_id || '',
      supplier_id: payment.supplier_id || '',
      description: payment.description || '',
      currency: payment.currency
    });
  }

  setupVATCalculation() {
    // Auto-calculate VAT when amount or VAT inclusion changes
    this.paymentForm.get('amount')?.valueChanges.subscribe(() => {
      this.calculateVAT();
    });

    this.paymentForm.get('is_vat_included')?.valueChanges.subscribe(() => {
      this.calculateVAT();
    });
  }

  calculateVAT() {
    const amount = this.paymentForm.get('amount')?.value;
    const isVATIncluded = this.paymentForm.get('is_vat_included')?.value;

    if (amount && amount > 0) {
      const vatAmount = VATCalculator.calculateVATAmount(amount, isVATIncluded);
      this.paymentForm.patchValue({ vat_amount: vatAmount });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.getElementById('receipt_attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    const formData: CreatePaymentRequest = {
      ...this.paymentForm.value,
      receipt_attachment: this.selectedFile || undefined
    };

    const request = this.isEditMode
      ? this.paymentService.updatePayment(this.paymentId!, formData as UpdatePaymentRequest)
      : this.paymentService.createPayment(formData);

    request.subscribe({
      next: (response) => {
        this.submitting = false;
        this.success = this.isEditMode ? 'PAYMENT.MESSAGES.UPDATE_SUCCESS' : 'PAYMENT.MESSAGES.CREATE_SUCCESS';
        
        setTimeout(() => {
          this.router.navigate(['/payments']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving payment:', err);
        this.error = this.isEditMode ? 'PAYMENT.ERROR.UPDATE_FAILED' : 'PAYMENT.ERROR.CREATE_FAILED';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/payments']);
  }

  markFormGroupTouched() {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.paymentForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'FORM.ERROR.REQUIRED';
      }
      if (field.errors?.['minlength']) {
        return 'FORM.ERROR.MIN_LENGTH';
      }
      if (field.errors?.['maxlength']) {
        return 'FORM.ERROR.MAX_LENGTH';
      }
      if (field.errors?.['min']) {
        return 'FORM.ERROR.MIN_VALUE';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return field?.invalid && field?.touched || false;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'PAYMENT.EDIT_TITLE' : 'PAYMENT.CREATE_TITLE';
  }
} 
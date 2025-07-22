import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ReceivedPayment, CreateReceivedPaymentRequest, UpdateReceivedPaymentRequest } from '../../../core/models/received-payment.model';
import { ReceivedPaymentService } from '../../../core/services/received-payment.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-received-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './received-payment-form.component.html',
  styleUrls: ['./received-payment-form.component.scss']
})
export class ReceivedPaymentFormComponent implements OnInit {
  receivedPaymentForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  receivedPaymentId: string | null = null;

  // Data for dropdowns
  projects: Project[] = [];

  // File handling
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private receivedPaymentService: ReceivedPaymentService
  ) {
    this.receivedPaymentForm = this.fb.group({
      date: ['', [Validators.required]],
      project_id: ['', [Validators.required]],
      invoice_number: ['', [Validators.required, Validators.maxLength(50)]],
      amount: ['', [Validators.required, Validators.min(0)]],
      is_vat_applicable: [false],
      vat_amount: [0, [Validators.required, Validators.min(0)]],
      payment_method: ['Cash', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      currency: ['AED', [Validators.required]],
      client_name: ['', [Validators.maxLength(100)]],
      reference_number: ['', [Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.checkEditMode();
    this.setupVATCalculation();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'RECEIVED_PAYMENT.EDIT_TITLE' : 'RECEIVED_PAYMENT.CREATE_TITLE';
  }

  private loadProjects(): void {
    this.http.get<{ projects: Project[] }>('/api/projects').subscribe({
      next: (response) => {
        this.projects = response.projects;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.error = 'ERROR.LOADING_PROJECTS';
      }
    });
  }

  private checkEditMode(): void {
    this.receivedPaymentId = this.route.snapshot.paramMap.get('id');
    if (this.receivedPaymentId) {
      this.isEditMode = true;
      this.loadReceivedPayment();
    }
  }

  private loadReceivedPayment(): void {
    if (!this.receivedPaymentId) return;

    this.loading = true;
    this.receivedPaymentService.getReceivedPayment(this.receivedPaymentId).subscribe({
      next: (receivedPayment) => {
        this.populateForm(receivedPayment);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading received payment:', error);
        this.error = 'ERROR.LOADING_RECEIVED_PAYMENT';
        this.loading = false;
      }
    });
  }

  private setupVATCalculation(): void {
    this.receivedPaymentForm.get('amount')?.valueChanges.subscribe(amount => {
      const isVATApplicable = this.receivedPaymentForm.get('is_vat_applicable')?.value;
      if (amount && isVATApplicable) {
        const vatAmount = this.receivedPaymentService.calculateVATAmount(amount, true);
        this.receivedPaymentForm.patchValue({ vat_amount: vatAmount });
      }
    });

    this.receivedPaymentForm.get('is_vat_applicable')?.valueChanges.subscribe(isVATApplicable => {
      const amount = this.receivedPaymentForm.get('amount')?.value;
      if (amount && isVATApplicable) {
        const vatAmount = this.receivedPaymentService.calculateVATAmount(amount, true);
        this.receivedPaymentForm.patchValue({ vat_amount: vatAmount });
      } else {
        this.receivedPaymentForm.patchValue({ vat_amount: 0 });
      }
    });
  }

  populateForm(receivedPayment: ReceivedPayment): void {
    this.receivedPaymentForm.patchValue({
      date: receivedPayment.date ? new Date(receivedPayment.date).toISOString().split('T')[0] : '',
      project_id: receivedPayment.project_id || '',
      invoice_number: receivedPayment.invoice_number,
      amount: receivedPayment.amount,
      is_vat_applicable: receivedPayment.is_vat_applicable,
      vat_amount: receivedPayment.vat_amount,
      payment_method: receivedPayment.payment_method,
      description: receivedPayment.description || '',
      currency: receivedPayment.currency,
      client_name: receivedPayment.client_name || '',
      reference_number: receivedPayment.reference_number || ''
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.createPreview(file);
    }
  }

  private createPreview(file: File): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.getElementById('payment_attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.receivedPaymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    const formData = this.receivedPaymentForm.value;
    
    if (this.isEditMode && this.receivedPaymentId) {
      const updateRequest: UpdateReceivedPaymentRequest = {
        ...formData,
        payment_attachment: this.selectedFile || undefined
      };

      this.receivedPaymentService.updateReceivedPayment(this.receivedPaymentId, updateRequest).subscribe({
        next: () => {
          this.success = 'RECEIVED_PAYMENT.UPDATE_SUCCESS';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/received-payments']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating received payment:', error);
          this.error = error.error?.message || 'ERROR.UPDATING_RECEIVED_PAYMENT';
          this.submitting = false;
        }
      });
    } else {
      const createRequest: CreateReceivedPaymentRequest = {
        ...formData,
        payment_attachment: this.selectedFile || undefined
      };

      this.receivedPaymentService.createReceivedPayment(createRequest).subscribe({
        next: () => {
          this.success = 'RECEIVED_PAYMENT.CREATE_SUCCESS';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/received-payments']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating received payment:', error);
          this.error = error.error?.message || 'ERROR.CREATING_RECEIVED_PAYMENT';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/received-payments']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.receivedPaymentForm.controls).forEach(key => {
      const control = this.receivedPaymentForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.receivedPaymentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.receivedPaymentForm.get(fieldName);
    if (field && field.errors) {
      const errors = Object.keys(field.errors);
      if (errors.length > 0) {
        return `RECEIVED_PAYMENT.ERRORS.${errors[0].toUpperCase()}`;
      }
    }
    return null;
  }
} 
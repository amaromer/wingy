import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Supplier, SupplierFormData } from '../../../core/models/supplier.model';

// Custom validator for optional email
function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || control.value.trim() === '') {
    return null; // Valid if empty
  }
  return Validators.email(control);
}

// Custom validator for optional phone
function optionalPhoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value || control.value.trim() === '') {
    return null; // Valid if empty
  }
  return Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)(control);
}

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.scss']
})
export class SupplierFormComponent implements OnInit {
  supplierForm: FormGroup;
  loading = false;
  saving = false;
  error = '';
  isEditMode = false;
  supplierId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      contact_person: ['', [Validators.maxLength(100)]],
      email: ['', [optionalEmailValidator]],
      phone: ['', [optionalPhoneValidator]],
      address: ['', [Validators.maxLength(500)]],
      vat_enabled: [false],
      vat_no: ['', [Validators.maxLength(50)]],
      payment_terms: ['', [Validators.maxLength(100)]],
      is_active: [true],
      notes: ['', [Validators.maxLength(1000)]]
    });

    // Add conditional validation for VAT number
    this.supplierForm.get('vat_enabled')?.valueChanges.subscribe(vatEnabled => {
      const vatNoControl = this.supplierForm.get('vat_no');
      if (vatEnabled) {
        vatNoControl?.setValidators([Validators.required, Validators.maxLength(50)]);
      } else {
        vatNoControl?.setValidators([Validators.maxLength(50)]);
        vatNoControl?.setValue('');
      }
      vatNoControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.supplierId = params['id'];
        this.loadSupplier();
      }
    });
  }

  loadSupplier() {
    if (!this.supplierId) return;

    this.loading = true;
    this.error = '';

    this.http.get<Supplier>(`/api/suppliers/${this.supplierId}`)
      .subscribe({
        next: (supplier) => {
          this.populateForm(supplier);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading supplier:', err);
          this.error = 'SUPPLIERS.ERROR.NOT_FOUND';
          this.loading = false;
          // Mock data for demo
          const mockSupplier: Supplier = {
            _id: this.supplierId!,
            name: 'ABC Concrete Co.',
            contact_person: 'John Smith',
            email: 'info@abcconcrete.com',
            phone: '+1-555-0123',
            address: '123 Construction Ave, City Center',
            vat_enabled: true,
            vat_no: 'VAT123456789',
            payment_terms: 'Net 30',
            is_active: true,
            notes: 'Reliable concrete supplier for large projects',
            createdAt: '2024-01-10T00:00:00.000Z'
          };
          this.populateForm(mockSupplier);
        }
      });
  }

  populateForm(supplier: Supplier) {
    this.supplierForm.patchValue({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      payment_terms: supplier.payment_terms || '',
      is_active: supplier.is_active !== undefined ? supplier.is_active : true,
      notes: supplier.notes || '',
      vat_enabled: supplier.vat_enabled || false,
      vat_no: supplier.vat_no || ''
    });
  }

  onSubmit() {
    if (this.supplierForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    const formData: SupplierFormData = this.supplierForm.value;
    console.log('Form data before cleanup:', formData);

    // Clean up empty strings
    Object.keys(formData).forEach(key => {
      const fieldKey = key as keyof SupplierFormData;
      if (formData[fieldKey] === '') {
        (formData as any)[fieldKey] = undefined;
      }
    });

    console.log('Form data after cleanup:', formData);

    const request = this.isEditMode
      ? this.http.put<Supplier>(`/api/suppliers/${this.supplierId}`, formData)
      : this.http.post<Supplier>('/api/suppliers', formData);

    request.subscribe({
      next: (supplier) => {
        this.saving = false;
        const message = this.isEditMode ? 'SUPPLIERS.MESSAGES.UPDATE_SUCCESS' : 'SUPPLIERS.MESSAGES.CREATE_SUCCESS';
        alert(message);
        this.router.navigate(['/suppliers']);
      },
      error: (err) => {
        console.error('Error saving supplier:', err);
        console.error('Error response:', err.error);
        this.error = this.isEditMode ? 'SUPPLIERS.ERROR.UPDATE_FAILED' : 'SUPPLIERS.ERROR.CREATE_FAILED';
        this.saving = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/suppliers']);
  }

  markFormGroupTouched() {
    Object.keys(this.supplierForm.controls).forEach(key => {
      const control = this.supplierForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.supplierForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'FORM.ERROR.REQUIRED';
      }
      if (field.errors?.['email']) {
        return 'FORM.ERROR.INVALID_EMAIL';
      }
      if (field.errors?.['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return requiredLength === 2 ? 'FORM.ERROR.MIN_LENGTH_2' : 'FORM.ERROR.MIN_LENGTH_3';
      }
      if (field.errors?.['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        if (maxLength === 50) return 'FORM.ERROR.MAX_LENGTH_50';
        if (maxLength === 100) return 'FORM.ERROR.MAX_LENGTH_100';
        if (maxLength === 200) return 'FORM.ERROR.MAX_LENGTH_200';
        if (maxLength === 500) return 'FORM.ERROR.MAX_LENGTH_500';
        return 'FORM.ERROR.MAX_LENGTH_100';
      }
      if (field.errors?.['pattern']) {
        return 'FORM.ERROR.INVALID_PHONE';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
} 
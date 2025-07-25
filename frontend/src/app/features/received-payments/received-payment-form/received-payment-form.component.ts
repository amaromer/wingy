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

  // Compression properties
  originalFileSize: number = 0;
  optimizedFileSize: number = 0;
  compressionProgress: number = 0;
  isCompressing: boolean = false;

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
    const vatApplicableControl = this.receivedPaymentForm.get('is_vat_applicable');
    const vatAmountControl = this.receivedPaymentForm.get('vat_amount');
    const amountControl = this.receivedPaymentForm.get('amount');

    if (vatApplicableControl && vatAmountControl && amountControl) {
      vatApplicableControl.valueChanges.subscribe(isApplicable => {
        if (isApplicable) {
          const amount = amountControl.value || 0;
          const vatAmount = amount * 0.05; // 5% VAT
          vatAmountControl.setValue(vatAmount);
        } else {
          vatAmountControl.setValue(0);
        }
      });

      amountControl.valueChanges.subscribe(amount => {
        if (vatApplicableControl.value) {
          const vatAmount = amount * 0.05; // 5% VAT
          vatAmountControl.setValue(vatAmount);
        }
      });
    }
  }

  populateForm(receivedPayment: ReceivedPayment): void {
    this.receivedPaymentForm.patchValue({
      date: this.formatDateForInput(receivedPayment.date),
      project_id: receivedPayment.project_id,
      invoice_number: receivedPayment.invoice_number,
      amount: receivedPayment.amount,
      is_vat_applicable: receivedPayment.is_vat_applicable,
      vat_amount: receivedPayment.vat_amount,
      payment_method: receivedPayment.payment_method,
      description: receivedPayment.description,
      currency: receivedPayment.currency,
      client_name: receivedPayment.client_name,
      reference_number: receivedPayment.reference_number
    });
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'RECEIVED_PAYMENT.ERROR.INVALID_FILE_TYPE';
        return;
      }
      
      this.error = '';
      this.originalFileSize = file.size;
      
      try {
        // Optimize image if it's an image file
        if (file.type.startsWith('image/')) {
          this.selectedFile = await this.optimizeImage(file);
        } else {
          this.selectedFile = file;
          this.optimizedFileSize = file.size;
        }
        
        // Create preview
        if (file.type.startsWith('image/') && this.selectedFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.previewUrl = e.target?.result as string;
          };
          reader.readAsDataURL(this.selectedFile);
        } else {
          this.previewUrl = null;
        }
      } catch (error) {
        console.error('Error optimizing file:', error);
        this.error = 'RECEIVED_PAYMENT.ERROR.FILE_OPTIMIZATION_FAILED';
        this.isCompressing = false;
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.originalFileSize = 0;
    this.optimizedFileSize = 0;
    this.compressionProgress = 0;
    this.isCompressing = false;
    const fileInput = document.getElementById('payment_attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Image optimization methods
  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file); // Return original file for non-images
        return;
      }

      this.isCompressing = true;
      this.compressionProgress = 0;
      this.originalFileSize = file.size;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions (max 1200px width/height)
        const maxDimension = 1200;
        let { width, height } = img;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with optimization
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress with quality settings
        let quality = 0.8;
        let compressedBlob: Blob;

        const compressWithQuality = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                compressedBlob = blob;
                this.optimizedFileSize = blob.size;
                this.compressionProgress = 100;

                // Create new file with optimized data
                const optimizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });

                this.isCompressing = false;
                resolve(optimizedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            quality
          );
        };

        // Progressive compression
        const progressiveCompress = () => {
          if (this.optimizedFileSize > 2 * 1024 * 1024 && quality > 0.3) { // If still > 2MB
            quality -= 0.1;
            this.compressionProgress = Math.min(90, (0.8 - quality) * 100);
            setTimeout(progressiveCompress, 100);
          } else {
            compressWithQuality();
          }
        };

        progressiveCompress();
      };

      img.onerror = () => {
        this.isCompressing = false;
        reject(new Error('Failed to load image'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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
      const errors = field.errors;
      if (errors['required']) return 'VALIDATION.REQUIRED';
      if (errors['min']) return 'VALIDATION.MIN_VALUE';
      if (errors['maxlength']) return 'VALIDATION.MAX_LENGTH';
    }
    return null;
  }

  private formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get compression ratio
  getCompressionRatio(): number {
    if (this.originalFileSize === 0) return 0;
    return Math.round(((this.originalFileSize - this.optimizedFileSize) / this.originalFileSize) * 100);
  }
} 
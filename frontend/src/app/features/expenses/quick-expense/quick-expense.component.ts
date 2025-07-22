import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExpenseService } from '../../../core/services/expense.service';
import { Project, Category, Supplier } from '../../../core/models/expense.model';
import { MainCategory } from '../../../core/models/main-category.model';

@Component({
  selector: 'app-quick-expense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './quick-expense.component.html',
  styleUrls: ['./quick-expense.component.scss']
})
export class QuickExpenseComponent implements OnInit {
  quickExpenseForm: FormGroup;
  loading = false;
  submitting = false;
  success = '';
  error = '';
  
  projects: Project[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  mainCategories: MainCategory[] = [];
  
  // File upload
  selectedFile: File | null = null;
  filePreview: string | null = null;
  originalFileSize: number = 0;
  optimizedFileSize: number = 0;
  compressionProgress: number = 0;
  isCompressing: boolean = false;
  isSupplierOptional: boolean = true;
  
  currencies = [
    { code: 'AED', symbol: 'د.إ' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'AUD', symbol: 'A$' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private expenseService: ExpenseService,
    private router: Router
  ) {
    this.quickExpenseForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['AED', Validators.required],
      date: [this.getTodayDate(), Validators.required],
      project_id: ['', Validators.required],
      category_id: [''],
      supplier_id: ['', Validators.required],
      invoice_number: [''],
      is_vat: [false]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    
    // Load main categories
    this.http.get<any>('/api/main-categories').subscribe({
      next: (response) => {
        this.mainCategories = Array.isArray(response.mainCategories) ? response.mainCategories : [];
      },
      error: (err) => {
        console.error('Error loading main categories:', err);
        this.mainCategories = [];
      }
    });

    // Load categories
    this.http.get<any>('/api/categories').subscribe({
      next: (response) => {
        this.categories = Array.isArray(response.categories) ? response.categories : [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.categories = [];
      }
    });

    // Load projects
    this.http.get<any>('/api/projects').subscribe({
      next: (response) => {
        this.projects = Array.isArray(response.projects) ? response.projects : [];
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.projects = [];
      }
    });

    // Load suppliers
    this.http.get<Supplier[]>('/api/suppliers').subscribe({
      next: (data) => {
        this.suppliers = Array.isArray(data) ? data : [];
        
        // Set default values if available
        if (this.projects.length === 1) {
          this.quickExpenseForm.patchValue({ project_id: this.projects[0]._id });
        }
        if (this.categories.length === 1) {
          this.quickExpenseForm.patchValue({ category_id: this.categories[0]._id });
        }
        if (this.suppliers.length === 1) {
          this.quickExpenseForm.patchValue({ supplier_id: this.suppliers[0]._id });
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.suppliers = [];
        this.loading = false;
      }
    });
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  // File upload methods
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'EXPENSE.ERROR.INVALID_FILE_TYPE';
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
            this.filePreview = e.target?.result as string;
          };
          reader.readAsDataURL(this.selectedFile);
        } else {
          this.filePreview = null;
        }
      } catch (error) {
        console.error('Error optimizing file:', error);
        this.error = 'EXPENSE.ERROR.FILE_OPTIMIZATION_FAILED';
        this.isCompressing = false;
      }
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.filePreview = null;
    this.originalFileSize = 0;
    this.optimizedFileSize = 0;
    this.compressionProgress = 0;
    this.isCompressing = false;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.quickExpenseForm.valid) {
      this.submitting = true;
      this.error = '';
      this.success = '';
      
      const expenseData = this.quickExpenseForm.value;
      
      // Add file to form data if selected
      if (this.selectedFile) {
        expenseData.attachment = this.selectedFile;
      }
      
      console.log('Submitting expense data:', expenseData);
      
      this.expenseService.createExpense(expenseData).subscribe({
        next: (response) => {
          console.log('Expense created successfully:', response);
          this.success = 'EXPENSE.QUICK_CREATE_SUCCESS';
          this.submitting = false;
          
          // Navigate to expense list after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/expenses']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating expense:', error);
          
          // Handle different types of errors
          let errorMessage = 'ERROR.CREATE_EXPENSE';
          
          if (error.status === 0) {
            errorMessage = 'ERROR.NETWORK_ERROR';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'ERROR.INVALID_DATA';
          } else if (error.status === 401) {
            errorMessage = 'ERROR.AUTHENTICATION_REQUIRED';
          } else if (error.status === 403) {
            errorMessage = 'ERROR.ACCESS_DENIED';
          } else if (error.status === 404) {
            errorMessage = 'ERROR.SERVICE_NOT_FOUND';
          } else if (error.status === 429) {
            errorMessage = 'ERROR.TOO_MANY_REQUESTS';
          } else if (error.status >= 500) {
            errorMessage = 'ERROR.SERVER_ERROR';
          } else {
            errorMessage = error.error?.message || 'ERROR.CREATE_EXPENSE';
          }
          
          this.error = errorMessage;
          this.submitting = false;
          
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            if (this.error === errorMessage) {
              this.error = '';
            }
          }, 5000);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.error = 'ERROR.FORM_VALIDATION';
    }
  }

  onCancel(): void {
    this.router.navigate(['/expenses']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.quickExpenseForm.controls).forEach(key => {
      const control = this.quickExpenseForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.quickExpenseForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return 'VALIDATION.REQUIRED';
      }
      if (field.errors?.['minlength']) {
        return 'VALIDATION.MIN_LENGTH';
      }
      if (field.errors?.['min']) {
        return 'VALIDATION.MIN_VALUE';
      }
    }
    return null;
  }

  // Quick actions using main categories
  setQuickExpense(mainCategory: MainCategory): void {
    this.quickExpenseForm.patchValue({
      description: mainCategory.name
    });
    
    // Update supplier validation based on main category setting
    const isSupplierOptional = mainCategory.supplier_optional !== undefined ? mainCategory.supplier_optional : true;
    this.updateSupplierValidation(isSupplierOptional);
    
    // Load suppliers and categories for this main category
    this.loadSuppliersByMainCategory(mainCategory._id!);
    this.loadCategoriesByMainCategory(mainCategory._id!);
  }

  // Load suppliers filtered by main category
  private loadSuppliersByMainCategory(mainCategoryId: string): void {
    this.http.get<Supplier[]>(`/api/expenses/suppliers-by-category/${mainCategoryId}`).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        
        // Auto-select first supplier if available
        if (suppliers.length === 1) {
          this.quickExpenseForm.patchValue({ supplier_id: suppliers[0]._id });
        } else if (suppliers.length > 1) {
          // Clear supplier selection to force user choice
          this.quickExpenseForm.patchValue({ supplier_id: '' });
        }
      },
      error: (err) => {
        console.error('Error loading suppliers by main category:', err);
        // Fallback to all suppliers
        this.loadAllSuppliers();
      }
    });
  }

  // Load all suppliers (fallback)
  private loadAllSuppliers(): void {
    this.http.get<Supplier[]>('/api/suppliers').subscribe({
      next: (data) => {
        this.suppliers = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.suppliers = [];
      }
    });
  }

  // Load categories filtered by main category
  private loadCategoriesByMainCategory(mainCategoryId: string): void {
    this.http.get<Category[]>(`/api/expenses/categories-by-main-category/${mainCategoryId}`).subscribe({
      next: (categories) => {
        this.categories = categories;
        
        // Auto-select first category if available
        if (categories.length === 1) {
          this.quickExpenseForm.patchValue({ category_id: categories[0]._id });
        } else if (categories.length > 1) {
          // Clear category selection to force user choice
          this.quickExpenseForm.patchValue({ category_id: '' });
        }
      },
      error: (err) => {
        console.error('Error loading categories by main category:', err);
        // Fallback to all categories
        this.loadAllCategories();
      }
    });
  }

  // Load all categories (fallback)
  private loadAllCategories(): void {
    this.http.get<any>('/api/categories').subscribe({
      next: (response) => {
        this.categories = Array.isArray(response.categories) ? response.categories : [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.categories = [];
      }
    });
  }

  updateSupplierValidation(isOptional: boolean): void {
    this.isSupplierOptional = isOptional;
    console.log('Quick expense - Updating supplier validation. Is optional:', isOptional);
    const supplierControl = this.quickExpenseForm.get('supplier_id');
    if (supplierControl) {
      if (isOptional) {
        supplierControl.clearValidators();
        console.log('Quick expense - Supplier field is now optional');
      } else {
        supplierControl.setValidators([Validators.required]);
        console.log('Quick expense - Supplier field is now required');
      }
      supplierControl.updateValueAndValidity();
    }
  }

  // Navigate to main categories
  navigateToMainCategories(): void {
    this.router.navigate(['/main-categories']);
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
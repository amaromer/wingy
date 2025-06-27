import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Expense, CreateExpenseRequest, UpdateExpenseRequest, Project, Category, Supplier } from '../../../core/models/expense.model';
import { ExpenseService } from '../../../core/services/expense.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  expenseId?: string;
  
  expenseForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  
  categories: Category[] = [];
  projects: Project[] = [];
  suppliers: Supplier[] = [];
  
  selectedFile: File | null = null;
  filePreview: string | null = null;

  // Currency options
  currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private expenseService: ExpenseService
  ) {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    
    this.expenseForm = this.fb.group({
      project_id: ['', [Validators.required]],
      supplier_id: ['', [Validators.required]],
      category_id: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0)]],
      currency: ['USD', [Validators.required]],
      date: [today, [Validators.required, this.futureDateValidator()]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
      invoice_number: ['']
    });
  }

  ngOnInit() {
    this.expenseId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.expenseId;
    
    this.loadFilters();
    
    if (this.isEditMode) {
      this.loadExpense();
    }
  }

  loadFilters() {
    // Load categories
    this.http.get<any>('/api/categories')
      .subscribe({
        next: (response) => {
          console.log('Categories API response:', response);
          this.categories = Array.isArray(response.categories) ? response.categories : [];
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.categories = [];
        }
      });

    // Load projects
    this.http.get<any>('/api/projects')
      .subscribe({
        next: (response) => {
          console.log('Projects API response:', response);
          this.projects = Array.isArray(response.projects) ? response.projects : [];
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.projects = [];
        }
      });

    // Load suppliers
    this.http.get<Supplier[]>('/api/suppliers')
      .subscribe({
        next: (data) => {
          console.log('Suppliers API response:', data);
          this.suppliers = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          console.error('Error loading suppliers:', err);
          this.suppliers = [];
        }
      });
  }

  loadExpense() {
    if (!this.expenseId) return;
    
    this.loading = true;
    this.expenseService.getExpense(this.expenseId).subscribe({
      next: (expense) => {
        this.expenseForm.patchValue({
          project_id: expense.project_id,
          supplier_id: expense.supplier_id,
          category_id: expense.category_id,
          amount: expense.amount,
          currency: expense.currency,
          date: this.formatDateForInput(expense.date),
          description: expense.description,
          invoice_number: expense.invoice_number || ''
        });
        
        if (expense.attachment_url) {
          this.filePreview = expense.attachment_url;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading expense:', err);
        this.error = 'EXPENSE.ERROR.LOAD_FAILED';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'EXPENSE.ERROR.INVALID_FILE_TYPE';
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'EXPENSE.ERROR.FILE_TOO_LARGE';
        return;
      }
      
      this.selectedFile = file;
      this.error = '';
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreview = null;
      }
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.filePreview = null;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit() {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    const expenseData = this.expenseForm.value;
    
    // Add file if selected
    if (this.selectedFile) {
      expenseData.attachment = this.selectedFile;
    }

    const request = this.isEditMode
      ? this.expenseService.updateExpense(this.expenseId!, expenseData)
      : this.expenseService.createExpense(expenseData);

    request.subscribe({
      next: (expense) => {
        this.success = this.isEditMode ? 'EXPENSE.SUCCESS.UPDATED' : 'EXPENSE.SUCCESS.CREATED';
        this.submitting = false;
        
        setTimeout(() => {
          this.router.navigate(['/expenses']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving expense:', err);
        
        // Handle specific backend validation errors
        if (err.status === 500 && err.error && err.error.message) {
          if (err.error.message.includes('future')) {
            this.error = 'EXPENSE.ERRORS.FUTURE_DATE';
          } else {
            this.error = 'EXPENSE.ERROR.CREATE_FAILED';
          }
        } else {
          this.error = this.isEditMode ? 'EXPENSE.ERROR.UPDATE_FAILED' : 'EXPENSE.ERROR.CREATE_FAILED';
        }
        
        this.submitting = false;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/expenses']);
  }

  private markFormGroupTouched() {
    Object.keys(this.expenseForm.controls).forEach(key => {
      const control = this.expenseForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;
    
    if (errors['required']) {
      return 'COMMON.REQUIRED';
    }
    
    if (errors['minlength']) {
      return 'COMMON.MIN_LENGTH';
    }
    
    if (errors['maxlength']) {
      return 'COMMON.MAX_LENGTH';
    }
    
    if (errors['min']) {
      return 'EXPENSE.ERRORS.AMOUNT_MIN';
    }
    
    if (errors['futureDate']) {
      return 'EXPENSE.ERRORS.FUTURE_DATE';
    }

    return 'COMMON.INVALID';
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  getCurrencySymbol(currencyCode: string): string {
    return this.expenseService.getCurrencySymbol(currencyCode);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(proj => proj.id === projectId);
    return project ? project.name : '';
  }

  getSupplierName(supplierId: string): string {
    const supplier = this.suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : '';
  }

  // Custom validator to prevent future dates
  private futureDateValidator() {
    return (control: any) => {
      if (!control.value) {
        return null;
      }
      
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        return { futureDate: true };
      }
      
      return null;
    };
  }

  // Get maximum date (today) for date input
  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
} 
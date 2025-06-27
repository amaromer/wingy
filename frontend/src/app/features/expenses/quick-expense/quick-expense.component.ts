import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExpenseService } from '../../../core/services/expense.service';
import { Project, Category, Supplier } from '../../../core/models/expense.model';

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
  
  // File upload
  selectedFile: File | null = null;
  filePreview: string | null = null;
  
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
      category_id: ['', Validators.required],
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

  // File upload methods
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
          
          // Reset form for next entry
          setTimeout(() => {
            this.quickExpenseForm.reset({
              currency: 'AED',
              date: this.getTodayDate()
            });
            this.selectedFile = null;
            this.filePreview = null;
            this.success = '';
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

  // Quick actions for common expense types
  setQuickExpense(type: string): void {
    const quickExpenses = {
      'fuel': { description: 'Fuel', category: 'Transportation' },
      'meals': { description: 'Meals', category: 'Food & Beverage' },
      'materials': { description: 'Construction Materials', category: 'Materials' },
      'tools': { description: 'Tools & Equipment', category: 'Equipment' },
      'labor': { description: 'Labor Cost', category: 'Labor' }
    };

    const expense = quickExpenses[type as keyof typeof quickExpenses];
    if (expense) {
      this.quickExpenseForm.patchValue({
        description: expense.description
      });
      
      // Try to find matching category
      const category = this.categories.find(c => 
        c.name.toLowerCase().includes(expense.category.toLowerCase())
      );
      if (category) {
        this.quickExpenseForm.patchValue({ category_id: category._id });
      }
    }
  }
} 
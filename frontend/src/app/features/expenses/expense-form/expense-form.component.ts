import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface Expense {
  _id?: string;
  title: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  project: string;
  supplier: string;
  invoice_number?: string;
  file_url?: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.expenseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', Validators.required],
      category: ['', Validators.required],
      project: ['', Validators.required],
      supplier: ['', Validators.required],
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
    this.http.get<Category[]>('/api/categories')
      .subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error('Error loading categories:', err)
      });

    // Load projects
    this.http.get<Project[]>('/api/projects')
      .subscribe({
        next: (data) => this.projects = data,
        error: (err) => console.error('Error loading projects:', err)
      });

    // Load suppliers
    this.http.get<Supplier[]>('/api/suppliers')
      .subscribe({
        next: (data) => this.suppliers = data,
        error: (err) => console.error('Error loading suppliers:', err)
      });
  }

  loadExpense() {
    if (!this.expenseId) return;
    
    this.loading = true;
    this.http.get<Expense>(`/api/expenses/${this.expenseId}`)
      .subscribe({
        next: (expense) => {
          this.expenseForm.patchValue({
            title: expense.title,
            amount: expense.amount,
            description: expense.description,
            date: expense.date,
            category: expense.category,
            project: expense.project,
            supplier: expense.supplier,
            invoice_number: expense.invoice_number || ''
          });
          
          if (expense.file_url) {
            this.filePreview = expense.file_url;
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

    const formData = new FormData();
    const expenseData = this.expenseForm.value;
    
    // Add form fields to FormData
    Object.keys(expenseData).forEach(key => {
      if (expenseData[key] !== null && expenseData[key] !== undefined) {
        formData.append(key, expenseData[key]);
      }
    });
    
    // Add file if selected
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    const request = this.isEditMode 
      ? this.http.put<Expense>(`/api/expenses/${this.expenseId}`, formData)
      : this.http.post<Expense>('/api/expenses', formData);

    request.subscribe({
      next: (expense) => {
        this.success = this.isEditMode ? 'EXPENSE.SUCCESS.UPDATED' : 'EXPENSE.SUCCESS.CREATED';
        this.submitting = false;
        
        // Redirect after a short delay
        setTimeout(() => {
          this.router.navigate(['/expenses']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving expense:', err);
        this.error = this.isEditMode ? 'EXPENSE.ERROR.UPDATE_FAILED' : 'EXPENSE.ERROR.CREATE_FAILED';
        this.submitting = false;
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
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'FORM.ERROR.REQUIRED';
      if (field.errors['minlength']) return `FORM.ERROR.MIN_LENGTH_${field.errors['minlength'].requiredLength}`;
      if (field.errors['min']) return 'FORM.ERROR.MIN_VALUE';
    }
    return '';
  }
} 
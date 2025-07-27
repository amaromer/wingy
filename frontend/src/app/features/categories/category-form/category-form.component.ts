import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../../core/models/category.model';
import { MainCategory } from '../../../core/models/main-category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  categoryId?: string;
  parentCategories: Category[] = [];
  mainCategories: MainCategory[] = [];
  isArabic = false;

  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();
  
  // Submit subject for debouncing
  private submitSubject = new Subject<void>();
  
  // Track last submission time to prevent rapid successive submissions
  private lastSubmissionTime = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9]*$/)]],
      description: ['', [Validators.maxLength(500)]],
      parent_category: [null],
      main_category_id: [null],
      is_active: [true]
    });

    // Auto-generate code from name
    this.categoryForm.get('name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(name => {
        if (name && !this.isEditMode) {
          const code = this.generateCodeFromName(name);
          const codeControl = this.categoryForm.get('code');
          if (codeControl && !codeControl.touched) {
            codeControl.setValue(code);
          }
        }
      });
      
    // Debounced submit to prevent rapid successive submissions
    this.submitSubject
      .pipe(
        debounceTime(1000), // Increased to 1 second debounce
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.performSubmit();
      });
  }

  ngOnInit() {
    this.isArabic = this.translate.currentLang === 'ar';
    this.loadParentCategories();
    this.loadMainCategories();
    this.checkEditMode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;
    
    // Check if we're in edit mode (has id parameter and URL contains 'edit')
    if (id && url.includes('/edit')) {
      this.isEditMode = true;
      this.categoryId = id;
      this.loadCategory();
    } else {
      // We're in create mode
      this.isEditMode = false;
    }
  }

  private loadParentCategories() {
    this.loading = true;
    this.http.get<{ categories: Category[] }>('/api/categories?limit=100')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Filter out the current category if in edit mode, but include all active categories
          this.parentCategories = response.categories.filter(cat => 
            cat.is_active && (!this.isEditMode || cat._id !== this.categoryId)
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading parent categories:', err);
          this.loading = false;
        }
      });
  }

  private loadMainCategories() {
    this.http.get<{ mainCategories: MainCategory[] }>('/api/main-categories')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.mainCategories = response.mainCategories.filter(mc => mc.is_active);
        },
        error: (err) => {
          console.error('Error loading main categories:', err);
          this.mainCategories = [];
        }
      });
  }

  private loadCategory() {
    if (!this.categoryId) return;

    this.loading = true;
    console.log('Loading category with ID:', this.categoryId);
    
    this.http.get<Category>(`/api/categories/${this.categoryId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          console.log('Received category from backend:', category);
          this.populateForm(category);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading category:', err);
          this.error = 'CATEGORIES.ERROR.NOT_FOUND';
          this.loading = false;
        }
      });
  }

  private populateForm(category: Category) {
    console.log('Populating form with category:', category);
    
    // Handle parent_category - it can be either a string (ID), object (populated data), or null
    let parentCategoryId = null;
    if (category.parent_category) {
      parentCategoryId = typeof category.parent_category === 'object' 
        ? category.parent_category._id 
        : category.parent_category;
    }

    // Handle main_category_id - it can be either a string (ID), object (populated data), or null
    let mainCategoryId = null;
    if (category.main_category_id) {
      mainCategoryId = typeof category.main_category_id === 'object' 
        ? (category.main_category_id as any)._id 
        : category.main_category_id;
    }

    console.log('Parent category ID:', parentCategoryId);
    console.log('Parent category type:', typeof category.parent_category);
    console.log('Main category ID:', mainCategoryId);
    console.log('Main category type:', typeof category.main_category_id);

    const formData = {
      name: category.name,
      code: category.code,
      description: category.description || '',
      parent_category: parentCategoryId,
      main_category_id: mainCategoryId,
      is_active: category.is_active
    };

    console.log('Setting form data:', formData);

    this.categoryForm.patchValue(formData);
    
    console.log('Form values after patch:', this.categoryForm.value);
  }

  onSubmit() {
    console.log('onSubmit called - Form valid:', this.categoryForm.valid, 'Submitting:', this.submitting);
    
    if (this.categoryForm.invalid || this.submitting) {
      console.log('Form submission blocked - invalid or already submitting');
      this.markFormGroupTouched();
      return;
    }

    console.log('Triggering debounced submit');
    // Trigger debounced submit
    this.submitSubject.next();
  }

  private performSubmit() {
    console.log('performSubmit called - Form valid:', this.categoryForm.valid, 'Submitting:', this.submitting);
    
    // Check if we're already submitting or form is invalid
    if (this.categoryForm.invalid || this.submitting) {
      console.log('performSubmit blocked - invalid or already submitting');
      this.markFormGroupTouched();
      return;
    }

    // Check if we've submitted recently (within 2 seconds)
    const now = Date.now();
    if (now - this.lastSubmissionTime < 2000) {
      console.log('performSubmit blocked - too soon since last submission');
      return;
    }

    console.log('Starting form submission');
    this.lastSubmissionTime = now;
    this.submitting = true;
    this.error = '';
    this.success = '';

    const formData = this.categoryForm.value;
    
    // Clean up the data
    const cleanedData: CreateCategoryRequest | UpdateCategoryRequest = {
      name: formData.name.trim(),
      is_active: formData.is_active
    };

    // Only include code if it's provided and not empty
    if (formData.code?.trim()) {
      cleanedData.code = formData.code.trim().toUpperCase();
    }

    if (formData.description?.trim()) {
      cleanedData.description = formData.description.trim();
    }

    // Handle parent_category - convert "null" string to actual null
    if (formData.parent_category && formData.parent_category !== "null") {
      cleanedData.parent_category = formData.parent_category;
    } else {
      cleanedData.parent_category = null; // Explicitly set to null if no parent
    }

    // Handle main_category_id - convert "null" string to actual null
    if (formData.main_category_id && formData.main_category_id !== "null") {
      cleanedData.main_category_id = formData.main_category_id;
    } else {
      cleanedData.main_category_id = null; // Explicitly set to null if no main category
    }

    const request = this.isEditMode 
      ? this.http.put<Category>(`/api/categories/${this.categoryId}`, cleanedData)
      : this.http.post<Category>('/api/categories', cleanedData);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (category) => {
        console.log('Category saved successfully:', category);
        this.success = this.isEditMode ? 'CATEGORIES.MESSAGES.UPDATE_SUCCESS' : 'CATEGORIES.MESSAGES.CREATE_SUCCESS';
        this.submitting = false;
        
        // Reset submission time
        this.lastSubmissionTime = 0;
        
        // Redirect after a short delay
        setTimeout(() => {
          this.router.navigate(['/categories']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving category:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.error?.message || err.message,
          error: err.error
        });
        
        // Show specific error messages based on status code
        if (err.status === 429) {
          this.error = 'COMMON.ERROR.TOO_MANY_REQUESTS';
        } else if (err.error?.errors && Array.isArray(err.error.errors)) {
          const validationErrors = err.error.errors.map((e: any) => `${e.param}: ${e.msg}`).join(', ');
          this.error = `Validation errors: ${validationErrors}`;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = this.isEditMode ? 'CATEGORIES.ERROR.UPDATE_FAILED' : 'CATEGORIES.ERROR.CREATE_FAILED';
        }
        
        this.submitting = false;
        
        // Reset submission time on error
        this.lastSubmissionTime = 0;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/categories']);
  }

  private markFormGroupTouched() {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'FORM.ERROR.REQUIRED';
      if (field.errors['minlength']) return `FORM.ERROR.MIN_LENGTH_${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `FORM.ERROR.MAX_LENGTH_${field.errors['maxlength'].requiredLength}`;
      if (field.errors['pattern']) return 'FORM.ERROR.INVALID_PATTERN';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.categoryForm.valid && !this.submitting;
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'CATEGORIES.ACTIONS.SAVE' : 'CATEGORIES.CREATE_NEW';
  }

  get pageTitle(): string {
    return this.isEditMode ? 'CATEGORIES.EDIT_TITLE' : 'CATEGORIES.CREATE_TITLE';
  }

  // Debug method for checkbox
  onCheckboxChange(event: any) {
    console.log('Checkbox changed:', event.target.checked);
    console.log('Form value:', this.categoryForm.get('is_active')?.value);
  }

  private generateCodeFromName(name: string): string {
    if (!name || name.trim().length === 0) return '';
    
    // Check if the name contains Arabic characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(name);
    
    if (hasArabic) {
      // For Arabic text, generate a numeric code based on character codes
      return this.generateArabicCode(name);
    } else {
      // For English text, use the original logic
      return this.generateEnglishCode(name);
    }
  }

  private generateEnglishCode(name: string): string {
    // Remove special characters and convert to uppercase
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    
    // Split by spaces and take first 2-3 words
    const words = cleanName.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    if (words.length === 1) {
      // Single word: take first 6 characters
      return words[0].substring(0, 6);
    } else if (words.length === 2) {
      // Two words: take first 3 chars of each
      return words[0].substring(0, 3) + words[1].substring(0, 3);
    } else {
      // Multiple words: take first 2 chars of first 3 words
      return words.slice(0, 3).map(word => word.substring(0, 2)).join('');
    }
  }

  private generateArabicCode(name: string): string {
    // Remove extra spaces and get the first few characters
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const words = cleanName.split(' ').filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    // Generate a numeric code based on character codes
    let code = '';
    
    if (words.length === 1) {
      // Single word: use first 3 characters' codes
      const word = words[0];
      for (let i = 0; i < Math.min(3, word.length); i++) {
        const charCode = word.charCodeAt(i);
        // Convert to a 2-digit number (0-99)
        const num = charCode % 100;
        code += num.toString().padStart(2, '0');
      }
    } else {
      // Multiple words: use first character of each word
      for (let i = 0; i < Math.min(3, words.length); i++) {
        const word = words[i];
        if (word.length > 0) {
          const charCode = word.charCodeAt(0);
          const num = charCode % 100;
          code += num.toString().padStart(2, '0');
        }
      }
    }
    
    // Ensure the code is 6 characters long
    if (code.length < 6) {
      // Add some padding based on the name length
      const nameLength = cleanName.length;
      const padding = (nameLength * 7) % 100; // Simple hash
      code += padding.toString().padStart(2, '0');
    }
    
    return code.substring(0, 6);
  }
} 
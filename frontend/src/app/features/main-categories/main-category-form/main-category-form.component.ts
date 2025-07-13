import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MainCategory, MainCategoryFormData } from '../../../core/models/main-category.model';
import { MainCategoryService } from '../../../core/services/main-category.service';

@Component({
  selector: 'app-main-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './main-category-form.component.html',
  styleUrls: ['./main-category-form.component.scss']
})
export class MainCategoryFormComponent implements OnInit {
  mainCategoryForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  mainCategoryId: string | null = null;

  // Icon options for quick selection
  iconOptions = [
    '📁', '🎯', '💰', '⛽', '🍽️', '🧱', '🔧', '👷', '🚗', '🏗️', '📦', '🛠️', '⚡', '🔥', '💡'
  ];

  // Color options for quick selection
  colorOptions = [
    '#6c757d', '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', 
    '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#fd7e14', '#20c997'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private mainCategoryService: MainCategoryService
  ) {
    this.mainCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      icon: ['📁', [Validators.maxLength(50)]],
      color: ['#6c757d', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      is_active: [true],
      sort_order: [0, [Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.mainCategoryId = params['id'];
        this.loadMainCategory();
      }
    });
  }

  loadMainCategory() {
    if (!this.mainCategoryId) return;

    this.loading = true;
    this.error = '';

    this.mainCategoryService.getMainCategory(this.mainCategoryId)
      .subscribe({
        next: (response) => {
          this.populateForm(response.mainCategory);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading main category:', err);
          this.error = 'MAIN_CATEGORIES.ERROR.NOT_FOUND';
          this.loading = false;
        }
      });
  }

  populateForm(mainCategory: MainCategory) {
    this.mainCategoryForm.patchValue({
      name: mainCategory.name,
      description: mainCategory.description || '',
      icon: mainCategory.icon || '📁',
      color: mainCategory.color || '#6c757d',
      is_active: mainCategory.is_active !== undefined ? mainCategory.is_active : true,
      sort_order: mainCategory.sort_order || 0
    });
  }

  onSubmit() {
    if (this.mainCategoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    const formData: MainCategoryFormData = this.mainCategoryForm.value;

    // Clean up empty strings
    Object.keys(formData).forEach(key => {
      const fieldKey = key as keyof MainCategoryFormData;
      if (formData[fieldKey] === '') {
        (formData as any)[fieldKey] = undefined;
      }
    });

    const request = this.isEditMode
      ? this.mainCategoryService.updateMainCategory(this.mainCategoryId!, formData)
      : this.mainCategoryService.createMainCategory(formData);

    request.subscribe({
      next: (response) => {
        this.submitting = false;
        this.success = this.isEditMode ? 'MAIN_CATEGORIES.MESSAGES.UPDATE_SUCCESS' : 'MAIN_CATEGORIES.MESSAGES.CREATE_SUCCESS';
        
        // Redirect after a short delay
        setTimeout(() => {
          this.router.navigate(['/main-categories']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving main category:', err);
        this.error = this.isEditMode ? 'MAIN_CATEGORIES.ERROR.UPDATE_FAILED' : 'MAIN_CATEGORIES.ERROR.CREATE_FAILED';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/main-categories']);
  }

  selectIcon(icon: string) {
    this.mainCategoryForm.patchValue({ icon });
  }

  selectColor(color: string) {
    this.mainCategoryForm.patchValue({ color });
  }

  markFormGroupTouched() {
    Object.keys(this.mainCategoryForm.controls).forEach(key => {
      const control = this.mainCategoryForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.mainCategoryForm.get(fieldName);
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
      if (field.errors?.['pattern']) {
        return 'FORM.ERROR.INVALID_FORMAT';
      }
      if (field.errors?.['min']) {
        return 'FORM.ERROR.MIN_VALUE';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.mainCategoryForm.get(fieldName);
    return field?.invalid && field?.touched || false;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'MAIN_CATEGORIES.EDIT_TITLE' : 'MAIN_CATEGORIES.CREATE_TITLE';
  }
} 
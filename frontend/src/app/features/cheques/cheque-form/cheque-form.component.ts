import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Cheque, CreateChequeRequest, UpdateChequeRequest, Project, Supplier } from '../../../core/models/cheque.model';
import { ChequeService } from '../../../core/services/cheque.service';

@Component({
  selector: 'app-cheque-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './cheque-form.component.html',
  styleUrls: ['./cheque-form.component.scss']
})
export class ChequeFormComponent implements OnInit {
  // Form properties
  chequeForm: FormGroup;
  loading = false;
  submitting = false;
  success = '';
  error = '';
  errorDetails: any = null;
  showErrorDetails = false;
  isEditMode = false;
  isViewMode = false;
  chequeId: string | null = null;
  activeSection = 'basic';

  // Data properties
  projects: Project[] = [];
  suppliers: Supplier[] = [];
  nextChequeNumber = '';
  
  // Amount in words preview
  amountInWords = '';
  amountInWordsArabic = '';
  
  // Currency options
  currencies = [
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatar Riyal' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
    { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial' },
    { code: 'JOD', symbol: 'د.أ', name: 'Jordanian Dinar' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private chequeService: ChequeService,
    private translateService: TranslateService
  ) {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    
    this.chequeForm = this.fb.group({
      cheque_number: ['', [Validators.required, Validators.maxLength(20)]],
      payee_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      currency: ['AED', [Validators.required]],
      cheque_date: [today, [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      project_id: [''],
      supplier_id: ['']
    });

    // Add amount change listener for words conversion
    this.chequeForm.get('amount')?.valueChanges.subscribe(() => {
      this.updateAmountInWords();
    });

    this.chequeForm.get('currency')?.valueChanges.subscribe(() => {
      this.updateAmountInWords();
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkRouteParams();
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    try {
      // Load projects
      const projectsResponse = await this.http.get<any>(`${getApiUrl()}/projects`).toPromise();
      this.projects = projectsResponse.projects || projectsResponse || [];

      // Load suppliers
      const suppliersResponse = await this.http.get<any>(`${getApiUrl()}/suppliers`).toPromise();
      this.suppliers = suppliersResponse.suppliers || suppliersResponse || [];

      // Get next cheque number
      const nextNumberResponse = await this.chequeService.getNextChequeNumber().toPromise();
      this.nextChequeNumber = nextNumberResponse?.next_number || '001';

      // Set default cheque number if not in edit mode
      if (!this.isEditMode) {
        this.chequeForm.patchValue({
          cheque_number: this.nextChequeNumber
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.error = 'ERROR.LOADING_DATA';
    } finally {
      this.loading = false;
    }
  }

  private checkRouteParams(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.chequeId = params['id'];
        this.isEditMode = true;
        this.loadCheque();
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'view') {
        this.isViewMode = true;
        this.chequeForm.disable();
      }
    });
  }

  private async loadCheque(): Promise<void> {
    if (!this.chequeId) return;

    this.loading = true;
    try {
      const cheque = await this.chequeService.getCheque(this.chequeId).toPromise();
      if (cheque) {
        this.populateForm(cheque);
      }
    } catch (error) {
      console.error('Error loading cheque:', error);
      this.error = 'ERROR.LOADING_CHEQUE';
    } finally {
      this.loading = false;
    }
  }

  private populateForm(cheque: Cheque): void {
    this.chequeForm.patchValue({
      cheque_number: cheque.cheque_number,
      payee_name: cheque.payee_name,
      amount: cheque.amount,
      currency: cheque.currency,
      cheque_date: new Date(cheque.cheque_date).toISOString().split('T')[0],
      description: cheque.description || '',
      project_id: cheque.project_id || '',
      supplier_id: cheque.supplier_id || ''
    });

    this.updateAmountInWords();
  }

  private updateAmountInWords(): void {
    const amount = this.chequeForm.get('amount')?.value || 0;
    const currency = this.chequeForm.get('currency')?.value || 'AED';

    if (amount > 0) {
      // Get current language
      const currentLang = this.translateService.currentLang || 'en';
      
      // Update amount in words based on current language
      if (currentLang === 'ar') {
        this.amountInWordsArabic = this.convertAmountToWords(amount, 'ar', currency);
        this.amountInWords = '';
      } else {
        this.amountInWords = this.convertAmountToWords(amount, 'en', currency);
        this.amountInWordsArabic = '';
      }
    } else {
      this.amountInWords = '';
      this.amountInWordsArabic = '';
    }
  }

  private convertAmountToWords(amount: number, language: 'en' | 'ar', currency: string): string {
    // This is a simplified version - in a real app, you'd call the backend API
    // For now, we'll use a basic conversion
    const currencyNames = {
      'AED': { en: 'Dirhams', ar: 'درهم' },
      'USD': { en: 'Dollars', ar: 'دولار' },
      'EUR': { en: 'Euros', ar: 'يورو' },
      'GBP': { en: 'Pounds', ar: 'جنيه' },
      'SAR': { en: 'Riyals', ar: 'ريال' },
      'QAR': { en: 'Qatar Riyals', ar: 'ريال قطري' },
      'KWD': { en: 'Kuwaiti Dinars', ar: 'دينار كويتي' },
      'BHD': { en: 'Bahraini Dinars', ar: 'دينار بحريني' },
      'OMR': { en: 'Omani Rials', ar: 'ريال عماني' },
      'JOD': { en: 'Jordanian Dinars', ar: 'دينار أردني' }
    };

    const currencyName = currencyNames[currency as keyof typeof currencyNames] || currencyNames['AED'];
    
    // Simple number to words conversion (basic implementation)
    const words = this.numberToWords(amount, language);
    return `${words} ${currencyName[language]}`;
  }

  private numberToWords(num: number, language: 'en' | 'ar'): string {
    if (num === 0) return language === 'ar' ? 'صفر' : 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const arabicTens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const arabicTeens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num % 1) * 100);

    let result = '';
    
    if (language === 'ar') {
      result = this.convertToArabicWords(integerPart);
    } else {
      result = this.convertToEnglishWords(integerPart);
    }

    if (decimalPart > 0) {
      const decimalWords = language === 'ar' 
        ? this.convertToArabicWords(decimalPart) 
        : this.convertToEnglishWords(decimalPart);
      result += language === 'ar' ? ' و' + decimalWords + ' هللة' : ' and ' + decimalWords + ' cents';
    }

    return result;
  }

  private convertToEnglishWords(num: number): string {
    if (num === 0) return '';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num < 10) {
      return ones[num];
    }
    if (num < 20) {
      return teens[num - 10];
    }
    if (num < 100) {
      const onesDigit = num % 10;
      const tensDigit = Math.floor(num / 10);
      return tens[tensDigit] + (onesDigit > 0 ? '-' + ones[onesDigit] : '');
    }
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      let result = ones[hundreds] + ' Hundred';
      if (remainder > 0) {
        result += ' and ' + this.convertToEnglishWords(remainder);
      }
      return result;
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = this.convertToEnglishWords(thousands) + ' Thousand';
      if (remainder > 0) {
        if (remainder < 100) {
          result += ' and ' + this.convertToEnglishWords(remainder);
        } else {
          result += ', ' + this.convertToEnglishWords(remainder);
        }
      }
      return result;
    }
    if (num < 1000000000) {
      const millions = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      let result = this.convertToEnglishWords(millions) + ' Million';
      if (remainder > 0) {
        result += ', ' + this.convertToEnglishWords(remainder);
      }
      return result;
    }
    return 'Number too large';
  }

  private convertToArabicWords(num: number): string {
    if (num === 0) return '';
    
    const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const arabicTens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const arabicTeens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    
    if (num < 10) {
      return arabicOnes[num];
    }
    if (num < 20) {
      return arabicTeens[num - 10];
    }
    if (num < 100) {
      const onesDigit = num % 10;
      const tensDigit = Math.floor(num / 10);
      if (onesDigit === 0) {
        return arabicTens[tensDigit];
      } else {
        return arabicOnes[onesDigit] + ' و' + arabicTens[tensDigit];
      }
    }
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      let result = '';
      if (hundreds === 1) {
        result = 'مائة';
      } else if (hundreds === 2) {
        result = 'مئتان';
      } else {
        result = arabicOnes[hundreds] + ' مائة';
      }
      if (remainder > 0) {
        result += ' و' + this.convertToArabicWords(remainder);
      }
      return result;
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = '';
      if (thousands === 1) {
        result = 'ألف';
      } else if (thousands === 2) {
        result = 'ألفان';
      } else if (thousands < 11) {
        result = arabicOnes[thousands] + ' آلاف';
      } else {
        result = this.convertToArabicWords(thousands) + ' ألف';
      }
      if (remainder > 0) {
        result += ' و' + this.convertToArabicWords(remainder);
      }
      return result;
    }
    return 'رقم كبير جداً';
  }

  async onSubmit(): Promise<void> {
    if (this.chequeForm.invalid || this.submitting) return;

    this.submitting = true;
    this.error = '';
    this.success = '';

    try {
      const formData = this.chequeForm.value;
      const currentLang = this.translateService.currentLang || 'en';

      if (this.isEditMode && this.chequeId) {
        const updateData: UpdateChequeRequest = {
          ...formData,
          language: currentLang as 'en' | 'ar'
        };
        await this.chequeService.updateCheque(this.chequeId, updateData).toPromise();
        this.success = 'CHEQUE.UPDATE_SUCCESS';
      } else {
        const createData: CreateChequeRequest = {
          ...formData,
          language: currentLang as 'en' | 'ar'
        };
        await this.chequeService.createCheque(createData).toPromise();
        this.success = 'CHEQUE.CREATE_SUCCESS';
      }

      // Redirect after successful submission
      setTimeout(() => {
        this.router.navigate(['/cheques']);
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting cheque:', error);
      this.error = error.error?.message || 'ERROR.SUBMISSION_FAILED';
      this.errorDetails = error.error;
      this.showErrorDetails = true;
    } finally {
      this.submitting = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/cheques']);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.chequeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.chequeForm.get(fieldName);
    if (field && field.errors && field.touched) {
      const errors = field.errors;
      if (errors['required']) return 'ERROR.REQUIRED';
      if (errors['minlength']) return 'ERROR.MIN_LENGTH';
      if (errors['maxlength']) return 'ERROR.MAX_LENGTH';
      if (errors['min']) return 'ERROR.MIN_VALUE';
    }
    return null;
  }

  // Navigation helpers
  onCreateCheque(): void {
    this.router.navigate(['/cheques/create']);
  }

  onViewCheque(id: string): void {
    this.router.navigate(['/cheques', id], { queryParams: { mode: 'view' } });
  }

  onEditCheque(id: string): void {
    this.router.navigate(['/cheques', id, 'edit']);
  }
}

// Import environment
import { environment, getApiUrl } from '../../../../environments/environment'; 
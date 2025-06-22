import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<Language>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(private translate: TranslateService) {
    console.log('TranslationService constructor called');
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    console.log('TranslationService - Initializing language...');
    
    // Set available languages
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');

    // Get saved language from localStorage or use browser language
    const savedLanguage = localStorage.getItem('language') as Language;
    const browserLanguage = this.translate.getBrowserLang();
    
    console.log('TranslationService - Saved language:', savedLanguage);
    console.log('TranslationService - Browser language:', browserLanguage);
    
    let languageToUse: Language = 'en';
    
    if (savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
      languageToUse = savedLanguage;
    } else if (browserLanguage === 'ar') {
      languageToUse = 'ar';
    }

    console.log('TranslationService - Language to use:', languageToUse);
    this.setLanguage(languageToUse);
  }

  setLanguage(language: Language): void {
    console.log('TranslationService - Setting language to:', language);
    console.log('TranslationService - Previous language was:', this.currentLanguageSubject.value);
    
    this.translate.use(language);
    this.currentLanguageSubject.next(language);
    localStorage.setItem('language', language);
    
    // Set document direction for RTL support
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    console.log('TranslationService - Document direction set to:', document.documentElement.dir);
    console.log('TranslationService - Document language set to:', document.documentElement.lang);
    
    // Add/remove RTL class for styling
    if (language === 'ar') {
      document.body.classList.add('rtl');
      console.log('TranslationService - Added RTL class to body');
      console.log('TranslationService - Body classes:', document.body.classList.toString());
    } else {
      document.body.classList.remove('rtl');
      console.log('TranslationService - Removed RTL class from body');
      console.log('TranslationService - Body classes:', document.body.classList.toString());
    }
    
    console.log('TranslationService - Language change completed. Current language:', this.currentLanguageSubject.value);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }

  getLanguageName(language: Language): string {
    return language === 'en' ? 'English' : 'العربية';
  }
} 
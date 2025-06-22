import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService, Language } from '../../../core/services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="language-switcher">
      <div class="language-label">Language:</div>
      <button 
        class="language-btn" 
        [class.active]="currentLanguage === 'en'"
        (click)="switchLanguage('en')"
        [attr.aria-label]="'LANGUAGE.ENGLISH' | translate">
        EN
      </button>
      <button 
        class="language-btn" 
        [class.active]="currentLanguage === 'ar'"
        (click)="switchLanguage('ar')"
        [attr.aria-label]="'LANGUAGE.ARABIC' | translate">
        عربي
      </button>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex !important;
      gap: 0.5rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      border: 2px solid var(--primary-color);
      z-index: 1000;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .language-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-right: 0.25rem;
    }

    .language-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 60px;
      text-align: center;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .language-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--primary-color);
      transform: translateY(-1px);
    }

    .language-btn.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* RTL Support */
    .rtl .language-switcher {
      flex-direction: row-reverse;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .language-switcher {
        gap: 0.25rem;
        padding: 0.25rem;
        z-index: 997; /* Lower than mobile menu toggle */
      }

      .language-label {
        font-size: 0.7rem;
      }

      .language-btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        min-width: 50px;
        min-height: 32px;
      }
    }

    /* Touch-friendly improvements */
    @media (hover: none) and (pointer: coarse) {
      .language-btn {
        min-height: 44px;
        padding: 0.6rem 1rem;
      }
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  currentLanguage: Language = 'en';
  @Output() languageChange = new EventEmitter<Language>();

  constructor(private translationService: TranslationService) {
    console.log('LanguageSwitcherComponent constructor called');
  }

  ngOnInit() {
    console.log('LanguageSwitcherComponent ngOnInit called');
    this.translationService.currentLanguage$.subscribe(lang => {
      console.log('Language changed to:', lang);
      this.currentLanguage = lang;
    });
  }

  switchLanguage(language: Language): void {
    console.log('Switching language to:', language);
    this.translationService.setLanguage(language);
    this.languageChange.emit(language);
  }
}
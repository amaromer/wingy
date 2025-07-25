import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { LanguageSwitcherComponent } from './shared/components/language-switcher/language-switcher.component';
import { TranslationService } from './core/services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  isMobile = false;
  isArabic = false;
  private subscription: Subscription;

  constructor(public authService: AuthService, public translationService: TranslationService, private changeDetectorRef: ChangeDetectorRef) {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    
    // Subscribe to language changes
    this.subscription = this.translationService.currentLanguage$.subscribe({
      next: (lang) => {
        // Immediately update isArabic
        this.isArabic = lang === 'ar';
        
        // Defer change detection to next tick to avoid assertion errors
        setTimeout(() => {
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (error) => {
        console.error('App component - Error in language subscription:', error);
      }
    });
  }
  
  ngOnInit() {
    // Set initial isArabic value
    this.isArabic = this.translationService.getCurrentLanguage() === 'ar';
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.sidebarOpen = false;
    }
  }
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  closeSidebar() {
    this.sidebarOpen = false;
  }
  
  logout() {
    this.authService.logout();
  }
  
  getPageTitle(): string {
    // Get the current route to determine the page title
    const currentRoute = window.location.pathname;
    
    switch (currentRoute) {
      case '/dashboard':
        return 'DASHBOARD.TITLE';
      case '/projects':
        return 'NAVIGATION.PROJECTS';
      case '/suppliers':
        return 'NAVIGATION.SUPPLIERS';
      case '/categories':
        return 'NAVIGATION.CATEGORIES';
      case '/expenses':
        return 'NAVIGATION.EXPENSES';
      case '/users':
        return 'NAVIGATION.USERS';
      case '/profile':
        return 'NAVIGATION.PROFILE';
              case '/employees':
          return 'NAVIGATION.EMPLOYEES';
        case '/payroll':
        case '/payroll/create':
          return 'NAVIGATION.PAYROLL';
        case '/overtime':
          return 'NAVIGATION.OVERTIME';
        case '/petty-cash':
          return 'NAVIGATION.PETTY_CASH';
      default:
        return 'DASHBOARD.TITLE';
    }
  }

  getContainerClasses(): string {
    const classes = this.isArabic ? 'app-container rtl' : 'app-container';
    return classes;
  }

  toggleLayout() {
    // Get the current language and set isArabic accordingly
    const currentLang = this.translationService.getCurrentLanguage();
    this.isArabic = currentLang === 'ar';
    
    // Defer change detection to next tick to avoid assertion errors
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    });
  }

  // Public method to be called directly from language switcher
  public onLanguageSwitch(lang: string) {
    // Update isArabic based on the new language
    this.isArabic = lang === 'ar';
    
    // Force change detection immediately
    this.changeDetectorRef.markForCheck();
    
    // Defer change detection to next tick to avoid assertion errors
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    });
  }

  getContainerStyles(): any {
    if (this.isArabic) {
      return {
        'flex-direction': 'row-reverse',
        'direction': 'rtl'
      };
    }
    return {};
  }

  getSidebarStyles(): any {
    if (this.isArabic) {
      return {
        'border-right': 'none',
        'border-left': '1px solid var(--border-color)',
        'order': '2'
      };
    }
    return {};
  }

  getMainContentStyles(): any {
    if (this.isArabic) {
      return {
        'order': '1'
      };
    }
    return {};
  }

  getRoleDisplayName(role: string | undefined): string {
    if (!role) return '';
    
    switch (role) {
      case 'Admin':
        return 'ROLES.ADMIN';
      case 'Accountant':
        return 'ROLES.ACCOUNTANT';
      case 'Engineer':
        return 'ROLES.ENGINEER';
      default:
        return role;
    }
  }
} 
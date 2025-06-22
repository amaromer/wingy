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
  template: `
    <div [class]="getContainerClasses()" 
         [ngStyle]="getContainerStyles()" 
         *ngIf="authService.isAuthenticated()">
      
      <!-- Mobile Menu Toggle -->
      <button class="mobile-menu-toggle" (click)="toggleSidebar()" *ngIf="isMobile">
        <span class="hamburger" [class.active]="sidebarOpen">☰</span>
      </button>
      
      <!-- Mobile Overlay -->
      <div class="mobile-overlay" *ngIf="isMobile && sidebarOpen" (click)="closeSidebar()"></div>
      
      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen" [ngStyle]="getSidebarStyles()">
        <div class="sidebar-header">
          <h2>{{ 'NAVIGATION.CONSTRUCTION_ERP' | translate }}</h2>
          <button class="close-sidebar" (click)="closeSidebar()" *ngIf="isMobile">✕</button>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">📊</span>
            {{ 'NAVIGATION.DASHBOARD' | translate }}
          </a>
          
          <a routerLink="/projects" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">🏗️</span>
            {{ 'NAVIGATION.PROJECTS' | translate }}
          </a>
          
          <a routerLink="/suppliers" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">🏢</span>
            {{ 'NAVIGATION.SUPPLIERS' | translate }}
          </a>
          
          <a routerLink="/categories" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">📂</span>
            {{ 'NAVIGATION.CATEGORIES' | translate }}
          </a>
          
          <a routerLink="/expenses" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">💰</span>
            {{ 'NAVIGATION.EXPENSES' | translate }}
          </a>
          
          <a routerLink="/users" routerLinkActive="active" class="nav-item" *ngIf="authService.hasRole('Admin')" (click)="closeSidebar()">
            <span class="nav-icon">👥</span>
            {{ 'NAVIGATION.USERS' | translate }}
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/profile" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">👤</span>
            {{ 'NAVIGATION.PROFILE' | translate }}
          </a>
          <button (click)="logout()" class="nav-item logout-btn">
            <span class="nav-icon">🚪</span>
            {{ 'AUTH.LOGOUT' | translate }}
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content" [ngStyle]="getMainContentStyles()">
        <header class="main-header">
          <div class="header-content" [class.rtl-header]="isArabic">
            <h1 class="page-title" [class.rtl-title]="isArabic">{{ getPageTitle() | translate }}</h1>
            <div class="header-center" [class.rtl-center]="isArabic">
              <app-language-switcher (languageChange)="onLanguageSwitch($event)"></app-language-switcher>
            </div>
            <div class="header-right" [class.rtl-right]="isArabic">
              <div class="user-info">
                <span class="user-name" [class.rtl-name]="isArabic">{{ authService.getCurrentUser()?.name }}</span>
                <span class="user-role">{{ authService.getCurrentUser()?.role }}</span>
              </div>
            </div>
          </div>
        </header>
        
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
    
    <!-- Login page -->
    <router-outlet *ngIf="!authService.isAuthenticated()"></router-outlet>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      position: relative;
    }
    
    /* RTL Layout for Arabic - More specific selectors */
    .app-container.rtl {
      flex-direction: row-reverse !important;
    }
    
    .app-container.rtl .sidebar {
      border-right: none !important;
      border-left: 1px solid var(--border-color) !important;
      order: 2 !important;
    }
    
    .app-container.rtl .main-content {
      order: 1 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    
    .app-container.rtl .mobile-menu-toggle {
      left: auto !important;
      right: 1rem !important;
    }
    
    .app-container.rtl .main-header {
      padding-left: var(--spacing-lg) !important;
      padding-right: var(--spacing-lg) !important;
    }
    
    /* RTL Navigation Items */
    .app-container.rtl .nav-item {
      text-align: right !important;
      flex-direction: row-reverse !important;
    }
    
    .app-container.rtl .nav-item .nav-icon {
      margin-right: 0 !important;
      margin-left: var(--spacing-md) !important;
    }
    
    /* Fix text direction for navigation items in RTL mode */
    .app-container.rtl .nav-item {
      direction: ltr !important;
    }
    
    .app-container.rtl .nav-item span {
      direction: ltr !important;
    }
    
    /* Even more specific selectors to override global styles */
    div.app-container.rtl {
      flex-direction: row-reverse !important;
    }
    
    div.app-container.rtl > aside.sidebar {
      border-right: none !important;
      border-left: 1px solid var(--border-color) !important;
      order: 2 !important;
    }
    
    div.app-container.rtl > main.main-content {
      order: 1 !important;
    }
    
    /* Ultra-specific selectors to override everything */
    body div.app-container.rtl {
      flex-direction: row-reverse !important;
    }
    
    body div.app-container.rtl > aside.sidebar {
      border-right: none !important;
      border-left: 1px solid var(--border-color) !important;
      order: 2 !important;
    }
    
    body div.app-container.rtl > main.main-content {
      order: 1 !important;
    }
    
    /* Force RTL with maximum specificity */
    html body div.app-container.rtl {
      flex-direction: row-reverse !important;
    }
    
    html body div.app-container.rtl > aside.sidebar {
      border-right: none !important;
      border-left: 1px solid var(--border-color) !important;
      order: 2 !important;
    }
    
    html body div.app-container.rtl > main.main-content {
      order: 1 !important;
    }
    
    .mobile-menu-toggle {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1001;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.5rem;
      cursor: pointer;
      display: none;
      box-shadow: var(--shadow-md);
      height: 40px;
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hamburger {
      font-size: 1.2rem;
      transition: transform 0.3s ease;
      
      &.active {
        transform: rotate(90deg);
      }
    }
    
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }
    
    .sidebar {
      width: 280px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
      transition: transform 0.3s ease;
      height: 100vh;
      position: relative;
      flex-shrink: 0;
    }
    
    .sidebar-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      
      h2 {
        color: var(--primary-color);
        font-weight: 700;
        margin: 0;
        font-size: 1.25rem;
      }
    }
    
    .close-sidebar {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }
    
    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-md) 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-lg);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 14px;
      cursor: pointer;
      min-height: 48px; /* Touch-friendly height */
      
      &:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      &.active {
        background-color: var(--primary-color);
        color: white;
      }
      
      .nav-icon {
        margin-right: var(--spacing-md);
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
    }
    
    .sidebar-footer {
      padding: var(--spacing-md) 0;
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
      background: var(--bg-primary);
    }
    
    .logout-btn {
      color: var(--danger-color) !important;
      
      &:hover {
        background-color: #fee2e2 !important;
        color: var(--danger-color) !important;
      }
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-secondary);
      min-width: 0; /* Prevent flex item from overflowing */
      margin-left: 0; /* Remove default margin */
      transition: margin 0.3s ease;
    }
    
    .main-header {
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
      min-height: 60px;
      display: flex;
      align-items: center;
    }
    
    .header-content {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center;
      gap: var(--spacing-sm);
      width: 100%;
      
      .page-title {
        font-size: 1.25rem;
        margin: 0;
        white-space: nowrap !important;
        order: 1;
      }
    }
    
    .header-center {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      order: 2;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      order: 3;
    }
    
    .user-name {
      font-size: 14px;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      background-color: var(--primary-color);
      color: white;
      border: 1px solid var(--border-color);
      font-weight: 500;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }
    
    .user-role {
      background: linear-gradient(135deg, var(--success-color), #059669);
      color: white;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #059669;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
      position: relative;
      overflow: hidden;
    }
    
    .user-role::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    
    .user-role:hover::before {
      left: 100%;
    }
    
    /* RTL Header Classes */
    .rtl-header {
      flex-direction: row-reverse !important;
    }
    
    .rtl-title {
      order: 3 !important;
      text-align: right !important;
    }
    
    .rtl-center {
      order: 2 !important;
    }
    
    .rtl-right {
      order: 1 !important;
      text-align: left !important;
    }
    
    .rtl-name {
      direction: rtl !important;
      text-align: right !important;
    }
    
    .rtl .user-info {
      flex-direction: row-reverse !important;
    }
    
    .rtl .user-role {
      direction: ltr !important; /* Keep role in LTR for consistency */
    }
    
    /* Mobile RTL Header Layout */
    @media (max-width: 768px) {
      .rtl-header {
        flex-direction: column !important;
        gap: var(--spacing-sm) !important;
      }
      
      .rtl-title {
        order: 1 !important;
        text-align: center !important;
      }
      
      .rtl-center {
        order: 2 !important;
        justify-content: center !important;
      }
      
      .rtl-right {
        order: 3 !important;
        text-align: center !important;
      }
      
      .rtl-name {
        direction: rtl !important;
        text-align: center !important;
        position: static !important;
      }
      
      .rtl .user-info {
        flex-direction: row-reverse !important; /* Reverse order for RTL */
        gap: var(--spacing-xs) !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
      }
    }
    
    .content-area {
      flex: 1;
      padding: var(--spacing-md);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
      width: 100%;
      box-sizing: border-box;
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .mobile-menu-toggle {
        display: flex;
        top: 0.75rem;
        left: 0.75rem;
        z-index: 1002; /* Higher than language switcher */
        height: 36px;
        width: 36px;
        padding: 0.4rem;
      }
      
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 1000;
        transform: translateX(-100%);
        width: 280px;
        order: 1;
        
        &.open {
          transform: translateX(0);
        }
      }
      
      .sidebar-header {
        padding-top: 4rem; /* Add top padding to avoid menu button overlap */
        flex-shrink: 0;
      }
      
      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        max-height: calc(100vh - 200px); /* Reserve space for header and footer */
      }
      
      .sidebar-footer {
        flex-shrink: 0;
        position: sticky;
        bottom: 0;
        background: var(--bg-primary);
        border-top: 1px solid var(--border-color);
      }
      
      .main-content {
        margin-left: 0;
        width: 100%;
        order: 2;
      }
      
      .main-header {
        padding: var(--spacing-md);
        padding-left: 4rem; /* Add left padding to avoid button overlap */
        min-height: 56px;
        z-index: 999; /* Lower than mobile menu toggle */
      }
      
      /* Mobile Header Layout - Works for both English and Arabic */
      .header-content {
        flex-direction: column !important; /* Stack elements vertically on mobile */
        align-items: flex-start !important;
        gap: var(--spacing-sm);
        
        h1 {
          font-size: 1.25rem;
          margin: 0;
          order: 1;
          text-align: center;
          width: 100%;
        }
      }
      
      .header-center {
        order: 2;
        width: 100%;
        justify-content: center;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }
      
      .header-right {
        order: 3;
        width: 100%;
        justify-content: center;
        display: flex;
        align-items: center;
      }
      
      .user-info {
        flex-direction: row !important; /* Keep horizontal layout on mobile */
        gap: var(--spacing-xs) !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
      }
      
      .user-name {
        position: static !important; /* Remove absolute positioning */
        transform: none !important;
        text-align: center;
        font-size: 14px;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        background-color: var(--primary-color);
        color: white;
        border: 1px solid var(--border-color);
        font-weight: 500;
      }
      
      .user-role {
        font-size: 10px !important;
        padding: var(--spacing-xs) var(--spacing-sm) !important;
      }
      
      /* RTL Mobile adjustments */
      .app-container.rtl .user-name {
        right: auto !important;
        left: auto !important;
        position: static !important;
        transform: none !important;
      }
      
      .content-area {
        padding: var(--spacing-sm);
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
      }
    }
    
    /* Small mobile devices */
    @media (max-width: 480px) {
      .mobile-menu-toggle {
        top: 0.5rem;
        left: 0.5rem;
        padding: 0.35rem;
        height: 32px;
        width: 32px;
      }
      
      .sidebar {
        width: 100%;
        max-width: 300px;
      }
      
      .sidebar-header {
        padding-top: 3.5rem; /* Slightly less padding for smaller screens */
      }
      
      .sidebar-nav {
        max-height: calc(100vh - 180px); /* Slightly less space for smaller screens */
      }
      
      .main-header {
        padding: var(--spacing-sm) var(--spacing-md);
        padding-left: 3.5rem; /* Slightly less padding for smaller screens */
        min-height: 52px;
      }
      
      .header-content {
        h1 {
          font-size: 1.1rem;
        }
      }
      
      .content-area {
        padding: var(--spacing-xs);
        width: 100%;
        max-width: 100%;
      }
    }
    
    /* Landscape orientation on mobile */
    @media (max-width: 768px) and (orientation: landscape) {
      .sidebar {
        width: 250px;
      }
      
      .main-header {
        padding: var(--spacing-sm) var(--spacing-md);
      }
      
      .header-content h1 {
        font-size: 1.1rem;
      }
    }
  `]
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
} 
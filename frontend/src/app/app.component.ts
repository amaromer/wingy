import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container" *ngIf="authService.isAuthenticated()">
      <!-- Mobile Menu Toggle -->
      <button class="mobile-menu-toggle" (click)="toggleSidebar()" *ngIf="isMobile">
        <span class="hamburger" [class.active]="sidebarOpen">☰</span>
      </button>
      
      <!-- Mobile Overlay -->
      <div class="mobile-overlay" *ngIf="isMobile && sidebarOpen" (click)="closeSidebar()"></div>
      
      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-header">
          <h2>Construction ERP</h2>
          <button class="close-sidebar" (click)="closeSidebar()" *ngIf="isMobile">✕</button>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">📊</span>
            Dashboard
          </a>
          
          <a routerLink="/projects" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">🏗️</span>
            Projects
          </a>
          
          <a routerLink="/suppliers" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">🏢</span>
            Suppliers
          </a>
          
          <a routerLink="/categories" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">📂</span>
            Categories
          </a>
          
          <a routerLink="/expenses" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">💰</span>
            Expenses
          </a>
          
          <a routerLink="/users" routerLinkActive="active" class="nav-item" *ngIf="authService.hasRole('Admin')" (click)="closeSidebar()">
            <span class="nav-icon">👥</span>
            Users
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/profile" class="nav-item" (click)="closeSidebar()">
            <span class="nav-icon">👤</span>
            Profile
          </a>
          <button (click)="logout()" class="nav-item logout-btn">
            <span class="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <header class="main-header">
          <div class="header-content">
            <h1>{{ getPageTitle() }}</h1>
            <div class="user-info">
              <span class="user-name">{{ authService.getCurrentUser()?.name }}</span>
              <span class="user-role">{{ authService.getCurrentUser()?.role }}</span>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      
      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .user-role {
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
    }
    
    .content-area {
      flex: 1;
      padding: var(--spacing-lg);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .mobile-menu-toggle {
        display: flex;
        top: 0.75rem;
        left: 0.75rem;
        z-index: 1001;
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
      }
      
      .main-header {
        padding: var(--spacing-md);
        padding-left: 4rem; /* Add left padding to avoid button overlap */
        min-height: 56px;
      }
      
      .header-content {
        flex-direction: row; /* Keep horizontal layout on mobile */
        align-items: center;
        gap: var(--spacing-sm);
        
        h1 {
          font-size: 1.25rem;
          margin-left: 0; /* Ensure no left margin */
        }
      }
      
      .user-info {
        width: auto;
        justify-content: flex-end;
      }
      
      .content-area {
        padding: var(--spacing-md);
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
        padding: var(--spacing-sm);
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
export class AppComponent {
  sidebarOpen = false;
  isMobile = false;

  constructor(public authService: AuthService) {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
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
    // This would be implemented to get the current page title
    return 'Dashboard';
  }
} 
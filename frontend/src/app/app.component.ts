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
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>Construction ERP</h2>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            Dashboard
          </a>
          
          <a routerLink="/projects" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏗️</span>
            Projects
          </a>
          
          <a routerLink="/suppliers" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏢</span>
            Suppliers
          </a>
          
          <a routerLink="/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📂</span>
            Categories
          </a>
          
          <a routerLink="/expenses" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💰</span>
            Expenses
          </a>
          
          <a routerLink="/users" routerLinkActive="active" class="nav-item" *ngIf="authService.hasRole('Admin')">
            <span class="nav-icon">👥</span>
            Users
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/profile" class="nav-item">
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
              <span>{{ authService.getCurrentUser()?.name }}</span>
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
    }
    
    .sidebar {
      width: 280px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }
    
    .sidebar-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        color: var(--primary-color);
        font-weight: 700;
        margin: 0;
      }
    }
    
    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-md) 0;
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
      }
    }
    
    .sidebar-footer {
      padding: var(--spacing-md) 0;
      border-top: 1px solid var(--border-color);
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
    }
    
    .main-header {
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h1 {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
      .user-role {
        background-color: var(--bg-secondary);
        color: var(--text-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .content-area {
      flex: 1;
      padding: var(--spacing-lg);
      overflow-y: auto;
    }
    
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        height: 100vh;
        z-index: 1000;
        transition: left 0.3s ease;
        
        &.open {
          left: 0;
        }
      }
      
      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}
  
  logout() {
    this.authService.logout();
  }
  
  getPageTitle(): string {
    // This would be implemented to get the current page title
    return 'Dashboard';
  }
} 
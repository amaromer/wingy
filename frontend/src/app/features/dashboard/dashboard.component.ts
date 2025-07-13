import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { VATCalculator } from '../../core/utils/vat-calculator';

interface StatItem {
  icon: string;
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = false;

  constructor(
    private dashboardService: DashboardService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = false;
    
    this.dashboardService.getDashboardStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboard:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getStats(): StatItem[] {
    if (!this.stats) return [];
    
    return [
      {
        icon: '🏗️',
        value: this.stats.overview.totalProjects,
        label: 'DASHBOARD.TOTAL_PROJECTS'
      },
      {
        icon: '💰',
        value: '$' + this.stats.overview.totalExpenses.toLocaleString(),
        label: 'DASHBOARD.TOTAL_EXPENSES'
      },
      {
        icon: '📊',
        value: this.stats.overview.totalExpenseCount,
        label: 'DASHBOARD.EXPENSE_COUNT'
      },
      {
        icon: '🏢',
        value: this.stats.overview.totalSuppliers,
        label: 'DASHBOARD.SUPPLIERS'
      },
      {
        icon: '📂',
        value: this.stats.overview.totalCategories,
        label: 'DASHBOARD.CATEGORIES'
      },
      {
        icon: '👥',
        value: this.stats.overview.totalUsers,
        label: 'DASHBOARD.ACTIVE_USERS'
      },
      {
        icon: '🧾',
        value: VATCalculator.formatVATAmount(this.stats.overview.totalVAT || 0),
        label: 'DASHBOARD.TOTAL_VAT'
      },
      {
        icon: '💳',
        value: '$' + (this.stats.overview.totalPayments || 0).toLocaleString(),
        label: 'DASHBOARD.TOTAL_PAYMENTS'
      }
    ];
  }

  getCurrentTaxCycle(): string {
    return VATCalculator.getCurrentTaxCycle().period;
  }

  getVATNetAmount(): string {
    if (!this.stats) return '$0.00';
    const netVAT = this.stats.overview.netVAT || 0;
    return VATCalculator.formatVATAmount(netVAT);
  }
} 
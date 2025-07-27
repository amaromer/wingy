import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, DashboardStats, ProjectExpense, CategoryExpense, MonthlyTrend, TopSupplier, RecentActivity } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { VatCalculator } from '../../core/utils/vat-calculator';

interface StatItem {
  icon: string;
  value: string | number;
  label: string;
  route?: string;
  trend?: number;
  trendIcon?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = false;
  
  // Analytics data
  projectExpenses: ProjectExpense[] = [];
  categoryExpenses: CategoryExpense[] = [];
  monthlyTrend: MonthlyTrend[] = [];
  topSuppliers: TopSupplier[] = [];
  recentActivity: RecentActivity[] = [];
  
  // Date filters
  dateFrom: string = '';
  dateTo: string = '';
  
  // Loading states
  analyticsLoading = false;

  constructor(
    private dashboardService: DashboardService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.loadAnalytics();
  }

  loadDashboard() {
    this.loading = true;
    this.error = false;
    
    this.dashboardService.getDashboardStats(this.dateFrom, this.dateTo).subscribe({
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

  loadAnalytics() {
    this.analyticsLoading = true;
    
    Promise.all([
      this.dashboardService.getExpensesByProject(this.dateFrom, this.dateTo).toPromise(),
      this.dashboardService.getExpensesByCategory(this.dateFrom, this.dateTo).toPromise(),
      this.dashboardService.getMonthlyTrend(12, this.dateFrom, this.dateTo).toPromise(),
      this.dashboardService.getTopSuppliers(this.dateFrom, this.dateTo).toPromise(),
      this.dashboardService.getRecentActivity().toPromise()
    ]).then(([projects, categories, monthly, suppliers, activity]) => {
      this.projectExpenses = projects || [];
      this.categoryExpenses = categories || [];
      this.monthlyTrend = monthly || [];
      this.topSuppliers = suppliers || [];
      this.recentActivity = activity || [];
      this.analyticsLoading = false;
    }).catch(error => {
      console.error('Error loading analytics:', error);
      this.analyticsLoading = false;
    });
  }

  onDateFilterChange() {
    this.loadDashboard();
    this.loadAnalytics();
  }

  getStats(): StatItem[] {
    if (!this.stats) return [];
    
    return [
      {
        icon: '🏗️',
        value: this.stats.overview.totalProjects,
        label: 'DASHBOARD.TOTAL_PROJECTS',
        route: '/projects'
      },
      {
        icon: '💰',
        value: '$' + this.stats.overview.totalExpenses.toLocaleString(),
        label: 'DASHBOARD.TOTAL_EXPENSES',
        route: '/expenses'
      },
      {
        icon: '📊',
        value: this.stats.overview.totalExpenseCount,
        label: 'DASHBOARD.EXPENSE_COUNT',
        route: '/expenses'
      },
      {
        icon: '🏢',
        value: this.stats.overview.totalSuppliers,
        label: 'DASHBOARD.SUPPLIERS',
        route: '/suppliers'
      },
      {
        icon: '📂',
        value: this.stats.overview.totalCategories,
        label: 'DASHBOARD.CATEGORIES',
        route: '/categories'
      },
      {
        icon: '👥',
        value: this.stats.overview.totalUsers,
        label: 'DASHBOARD.ACTIVE_USERS',
        route: '/users'
      },
      {
        icon: '🧾',
        value: VatCalculator.formatVatAmount(this.stats.overview.totalVAT || 0),
        label: 'DASHBOARD.TOTAL_VAT',
        route: '/expenses'
      },
      {
        icon: '💳',
        value: '$' + (this.stats.overview.totalPayments || 0).toLocaleString(),
        label: 'DASHBOARD.TOTAL_PAYMENTS',
        route: '/payments'
      }
    ];
  }

  onStatCardClick(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getCurrentTaxCycle(): string {
    return 'Current Period'; // Simplified for now
  }

  getVATNetAmount(): string {
    const netVAT = this.stats?.overview?.netVAT || 0;
    return VatCalculator.formatVatAmount(netVAT);
  }

  getNetVATDisplay(): string {
    const netVAT = this.stats?.overview?.netVAT || 0;
    return VatCalculator.formatVatAmount(netVAT);
  }

  getTotalVATDisplay(): string {
    const totalVAT = this.stats?.overview?.totalVAT || 0;
    return VatCalculator.formatVatAmount(totalVAT);
  }

  getExpensesVATDisplay(): string {
    const expensesVAT = this.stats?.vatStats?.expensesVAT || 0;
    return VatCalculator.formatVatAmount(expensesVAT);
  }

  getPaymentsVATDisplay(): string {
    const paymentsVAT = this.stats?.vatStats?.paymentsVAT || 0;
    return VatCalculator.formatVatAmount(paymentsVAT);
  }

  getActivityIcon(type: string): string {
    return type === 'expense' ? '💰' : '🏗️';
  }

  getActivityColor(type: string): string {
    return type === 'expense' ? 'var(--primary-color)' : 'var(--accent-color)';
  }

  // Simple data display methods for analytics
  getMonthlyTrendData(): any[] {
    return this.monthlyTrend.slice(0, 6).map(item => ({
      period: item.period,
      total: item.total,
      formattedTotal: '$' + item.total.toLocaleString()
    }));
  }

  getTopProjectsData(): any[] {
    return this.projectExpenses.slice(0, 5).map(item => ({
      name: item.projectName,
      total: item.total,
      formattedTotal: '$' + item.total.toLocaleString(),
      count: item.count
    }));
  }

  getTopCategoriesData(): any[] {
    return this.categoryExpenses.slice(0, 5).map(item => ({
      name: item.categoryName,
      total: item.total,
      formattedTotal: '$' + item.total.toLocaleString(),
      count: item.count
    }));
  }
} 
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
  type?: string; // Add type to identify specific stat cards
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
    this.setDefaultDateFilter();
  }

  setDefaultDateFilter() {
    // Get the first expense date and set default filter
    this.dashboardService.getFirstExpenseDate().subscribe({
      next: (response: { firstExpenseDate: string | null }) => {
        if (response.firstExpenseDate) {
          this.dateFrom = response.firstExpenseDate;
          this.dateTo = new Date().toISOString().split('T')[0]; // Today
          console.log('Default date filter set:', { from: this.dateFrom, to: this.dateTo });
        } else {
          // If no expenses, set to last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
          this.dateTo = new Date().toISOString().split('T')[0];
          console.log('No expenses found, using last 30 days:', { from: this.dateFrom, to: this.dateTo });
        }
        
        // Reload dashboard data with the new date filter
        this.loadDashboard();
        this.loadAnalytics();
      },
      error: (error: any) => {
        console.error('Error getting first expense date:', error);
        // Fallback to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        this.dateTo = new Date().toISOString().split('T')[0];
        
        // Reload dashboard data with fallback filter
        this.loadDashboard();
        this.loadAnalytics();
      }
    });
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
        route: '/expenses',
        type: 'vat'
      },
      {
        icon: '💳',
        value: '$' + (this.stats.overview.totalPayments || 0).toLocaleString(),
        label: 'DASHBOARD.TOTAL_PAYMENTS',
        route: '/payments'
      }
    ];
  }

  onStatCardClick(route: string, statItem?: StatItem) {
    if (route) {
      // Special handling for VAT stat card
      if (statItem?.type === 'vat') {
        this.onVATCardClick('total');
      } else {
        this.router.navigate([route]);
      }
    }
  }

  onVATCardClick(type: 'total' | 'expenses' | 'payments' | 'net') {
    // Navigate to expense list with VAT filter enabled
    const queryParams: any = {
      is_vat: 'true'
    };
    
    // Add date range if set
    if (this.dateFrom && this.dateTo) {
      queryParams.date_from = this.dateFrom;
      queryParams.date_to = this.dateTo;
    }
    
    this.router.navigate(['/expenses'], { queryParams });
  }

  getFormattedDateRange(): string {
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(this.dateFrom).toLocaleDateString();
      const toDate = new Date(this.dateTo).toLocaleDateString();
      return `${fromDate} - ${toDate}`;
    }
    return 'All Time';
  }

  getCurrentTaxCycle(): string {
    return 'Current Period'; // Simplified for now
  }

  setDateRange(range: string): void {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (range) {
      case 'today':
        this.dateFrom = todayStr;
        this.dateTo = todayStr;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.dateFrom = yesterday.toISOString().split('T')[0];
        this.dateTo = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        this.dateFrom = weekAgo.toISOString().split('T')[0];
        this.dateTo = todayStr;
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        this.dateFrom = monthAgo.toISOString().split('T')[0];
        this.dateTo = todayStr;
        break;
      case 'quarter':
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        this.dateFrom = quarterAgo.toISOString().split('T')[0];
        this.dateTo = todayStr;
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        this.dateFrom = yearAgo.toISOString().split('T')[0];
        this.dateTo = todayStr;
        break;
    }
    
    this.loadDashboard();
    this.loadAnalytics();
  }

  isTodayRange(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.dateFrom === today && this.dateTo === today;
  }

  isYesterdayRange(): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return this.dateFrom === yesterdayStr && this.dateTo === yesterdayStr;
  }

  isWeekRange(): boolean {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return this.dateFrom === weekAgoStr && this.dateTo === today;
  }

  isMonthRange(): boolean {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return this.dateFrom === monthAgoStr && this.dateTo === today;
  }

  isQuarterRange(): boolean {
    const quarterAgo = new Date();
    quarterAgo.setMonth(quarterAgo.getMonth() - 3);
    const quarterAgoStr = quarterAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return this.dateFrom === quarterAgoStr && this.dateTo === today;
  }

  isYearRange(): boolean {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const yearAgoStr = yearAgo.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return this.dateFrom === yearAgoStr && this.dateTo === today;
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  overview: {
    totalExpenses: number;
    totalExpenseCount: number;
    totalProjects: number;
    totalSuppliers: number;
    totalCategories: number;
    totalUsers: number;
  };
  expenseStats: Array<{
    period: string;
    total: number;
    count: number;
  }>;
  projectStats: Array<{
    _id: string;
    count: number;
  }>;
  recentExpenses: Array<any>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = '';
    
    console.log('Loading dashboard data...');
    
    this.http.get<DashboardStats>('/api/dashboard/overview').subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        console.log('Dashboard data loaded:', data);
      },
      error: (error) => {
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loading = false;
        console.error('Dashboard error:', error);
      }
    });
  }
} 
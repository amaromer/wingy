import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import { EmployeeBalance } from '../../../core/models/petty-cash.model';

@Component({
  selector: 'app-petty-cash-balances',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './petty-cash-balances.component.html',
  styleUrls: ['./petty-cash-balances.component.scss']
})
export class PettyCashBalancesComponent implements OnInit {
  balances: EmployeeBalance[] = [];
  loading = false;
  error = '';

  // Computed properties for summary calculations
  get totalCredits(): number {
    return this.balances
      .filter(b => b.currentBalance > 0)
      .reduce((sum, b) => sum + b.currentBalance, 0);
  }

  get totalDebits(): number {
    return Math.abs(this.balances
      .filter(b => b.currentBalance < 0)
      .reduce((sum, b) => sum + b.currentBalance, 0));
  }

  get netBalance(): number {
    return this.balances.reduce((sum, b) => sum + b.currentBalance, 0);
  }

  constructor(
    private pettyCashService: PettyCashService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBalances();
  }

  loadBalances(): void {
    this.loading = true;
    this.error = '';

    this.pettyCashService.getAllEmployeeBalances().subscribe({
      next: (balances) => {
        console.log('Received balances:', balances);
        this.balances = balances;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading balances:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        
        if (error.status === 401) {
          this.error = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'Access denied. You do not have permission to view petty cash balances.';
        } else if (error.status === 404) {
          this.error = 'Petty cash balances endpoint not found.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          this.error = `Error loading employee balances: ${error.message || 'Unknown error'}`;
        }
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/petty-cash']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }

  getEmployeeJob(employee: any): string {
    if (typeof employee === 'string') return '';
    return employee && employee.job ? employee.job : '';
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'zero';
  }

  getBalanceLabel(balance: number): string {
    if (balance > 0) return 'Credit';
    if (balance < 0) return 'Debit';
    return 'Zero';
  }

  getTransactionSymbol(type: string): string {
    switch (type) {
      case 'credit': return '+';
      case 'debit': return '-';
      default: return '↔';
    }
  }

  hasRecentTransactions(balance: EmployeeBalance): boolean {
    return balance.recentTransactions && balance.recentTransactions.length > 0;
  }

  getRecentTransactions(balance: EmployeeBalance): any[] {
    return balance.recentTransactions ? balance.recentTransactions.slice(0, 3) : [];
  }

  getDifferenceClass(difference: number): string {
    if (difference > 0) return 'negative'; // Employee owes money
    if (difference < 0) return 'positive'; // Employee has surplus
    return 'zero';
  }

  getDifferenceStatus(difference: number): string {
    if (difference > 0) return 'Owed';
    if (difference < 0) return 'Surplus';
    return 'Balanced';
  }
} 
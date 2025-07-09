import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Expense, Project, Category, Supplier } from '../../../core/models/expense.model';
import { ExpenseService } from '../../../core/services/expense.service';

@Component({
  selector: 'app-expense-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './expense-view.component.html',
  styleUrls: ['./expense-view.component.scss']
})
export class ExpenseViewComponent implements OnInit {
  expenseId?: string;
  expense?: Expense;
  
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService
  ) {}

  ngOnInit() {
    this.expenseId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.expenseId) {
      this.loadExpense();
    }
  }

  loadExpense() {
    if (!this.expenseId) return;
    
    this.loading = true;
    this.expenseService.getExpense(this.expenseId).subscribe({
      next: (expense) => {
        this.expense = expense;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading expense:', err);
        this.error = 'EXPENSE.ERROR.LOAD_FAILED';
        this.loading = false;
      }
    });
  }

  viewAttachment(attachmentUrl: string) {
    if (attachmentUrl) {
      // Get the backend base URL based on current hostname
      const hostname = window.location.hostname;
      let backendBaseUrl: string;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        backendBaseUrl = 'http://localhost:3000';
      } else if (hostname === 'winjyerp.com' || hostname === 'www.winjyerp.com') {
        backendBaseUrl = `https://${hostname}`;
      } else {
        // For mobile/network access, use the same protocol and hostname
        backendBaseUrl = `${window.location.protocol}//${hostname}`;
      }
      
      const fullUrl = `${backendBaseUrl}${attachmentUrl}`;
      
      console.log('Viewing attachment from expense view:', {
        originalUrl: attachmentUrl,
        hostname: hostname,
        backendBaseUrl: backendBaseUrl,
        fullUrl: fullUrl
      });
      
      // Test if the file exists before opening
      fetch(fullUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // File exists, open it
            window.open(fullUrl, '_blank');
          } else {
            console.error('Attachment not found:', fullUrl);
            alert('Attachment not found. The file may have been deleted or moved.');
          }
        })
        .catch(error => {
          console.error('Error checking attachment:', error);
          alert('Unable to access attachment. Please check your connection and try again.');
        });
    } else {
      console.log('No attachment URL provided in expense view');
    }
  }

  onEdit() {
    if (this.expenseId) {
      this.router.navigate(['/expenses', this.expenseId, 'edit']);
    }
  }

  onBack() {
    this.router.navigate(['/expenses']);
  }

  getProjectName(projectId: string | Project): string {
    if (typeof projectId === 'object' && projectId !== null) {
      return projectId.name;
    }
    return 'Unknown Project';
  }

  getCategoryName(categoryId: string | Category): string {
    if (typeof categoryId === 'object' && categoryId !== null) {
      return categoryId.name;
    }
    return 'Unknown Category';
  }

  getSupplierName(supplierId: string | Supplier): string {
    if (typeof supplierId === 'object' && supplierId !== null) {
      return supplierId.name;
    }
    return 'Unknown Supplier';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatAmount(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  getFileType(attachmentUrl: string): string {
    const extension = attachmentUrl.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'document';
  }

  getAttachmentUrl(attachmentUrl: string): string {
    if (!attachmentUrl) return '';
    
    // Get the backend base URL based on current hostname
    const hostname = window.location.hostname;
    let backendBaseUrl: string;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      backendBaseUrl = 'http://localhost:3000';
    } else if (hostname === 'winjyerp.com' || hostname === 'www.winjyerp.com') {
      backendBaseUrl = `https://${hostname}`;
    } else {
      // For mobile/network access, use the same protocol and hostname
      backendBaseUrl = `${window.location.protocol}//${hostname}`;
    }
    
    return `${backendBaseUrl}${attachmentUrl}`;
  }
} 
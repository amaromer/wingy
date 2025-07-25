import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OvertimeService } from '../../../core/services/overtime.service';
import { Overtime } from '../../../core/models/overtime.model';

@Component({
  selector: 'app-overtime-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './overtime-list.component.html',
  styleUrls: ['./overtime-list.component.scss']
})
export class OvertimeListComponent implements OnInit {
  overtimes: Overtime[] = [];
  currentPage = 1;
  totalPages = 1;
  total = 0;
  loading = false;
  
  // Filters
  selectedEmployee: string = '';
  selectedStatus: string = '';
  selectedDate: string = '';
  
  // Available options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Approved' },
    { value: 'false', label: 'Pending' }
  ];

  constructor(
    private overtimeService: OvertimeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOvertimes();
  }

  loadOvertimes(): void {
    this.loading = true;
    
    const filters = {
      employee_id: this.selectedEmployee || undefined,
      is_approved: this.selectedStatus ? this.selectedStatus === 'true' : undefined,
      date: this.selectedDate || undefined
    };

    this.overtimeService.getOvertimes(this.currentPage, 10, filters.employee_id, filters.is_approved, undefined, filters.date)
      .subscribe({
        next: (response) => {
          this.overtimes = response.overtimes;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading overtimes:', error);
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadOvertimes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOvertimes();
  }

  addOvertime(): void {
    this.router.navigate(['/overtime/create']);
  }

  editOvertime(id: string): void {
    this.router.navigate(['/overtime', id, 'edit']);
  }

  viewOvertime(id: string): void {
    this.router.navigate(['/overtime', id]);
  }

  deleteOvertime(id: string): void {
    if (confirm('Are you sure you want to delete this overtime record?')) {
      this.overtimeService.deleteOvertime(id).subscribe({
        next: () => {
          this.loadOvertimes();
        },
        error: (error) => {
          console.error('Error deleting overtime:', error);
        }
      });
    }
  }

  approveOvertime(id: string): void {
    this.overtimeService.approveOvertime(id).subscribe({
      next: () => {
        this.loadOvertimes();
      },
      error: (error) => {
        console.error('Error approving overtime:', error);
      }
    });
  }

  rejectOvertime(id: string): void {
    this.overtimeService.rejectOvertime(id).subscribe({
      next: () => {
        this.loadOvertimes();
      },
      error: (error) => {
        console.error('Error rejecting overtime:', error);
      }
    });
  }

  getStatusBadgeClass(isApproved: boolean): string {
    return isApproved ? 'badge-success' : 'badge-warning';
  }

  getStatusText(isApproved: boolean): string {
    return isApproved ? 'Approved' : 'Pending';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getEmployeeName(employee: any): string {
    if (typeof employee === 'string') return employee;
    return employee ? `${employee.name} - ${employee.job}` : 'N/A';
  }
} 
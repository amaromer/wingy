import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  currentPage = 1;
  totalPages = 1;
  total = 0;
  searchTerm = '';
  activeFilter = true;
  loading = false;

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.getEmployees(this.currentPage, 10, this.searchTerm, this.activeFilter)
      .subscribe({
        next: (response) => {
          this.employees = response.employees;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading employees:', error);
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEmployees();
  }

  addEmployee(): void {
    this.router.navigate(['/employees/create']);
  }

  editEmployee(id: string): void {
    this.router.navigate(['/employees', id, 'edit']);
  }

  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
        }
      });
    }
  }

  viewEmployee(id: string): void {
    this.router.navigate(['/employees', id]);
  }
} 
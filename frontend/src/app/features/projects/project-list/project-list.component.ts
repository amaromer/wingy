import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Project } from '../../../core/models/project.model';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = true;
  error: string | null = null;
  deletingProjectId: string | null = null;

  // Search and filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedLocation = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Debounce for search
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Filter options
  statusOptions = [
    { value: '', label: 'COMMON.ALL' },
    { value: 'Active', label: 'PROJECT.STATUS.ACTIVE' },
    { value: 'Completed', label: 'PROJECT.STATUS.COMPLETED' },
    { value: 'On Hold', label: 'PROJECT.STATUS.ON_HOLD' }
  ];

  sortOptions = [
    { value: 'name', label: 'PROJECT.SORT.NAME' },
    { value: 'status', label: 'PROJECT.SORT.STATUS' },
    { value: 'start_date', label: 'PROJECT.SORT.START_DATE' },
    { value: 'budget', label: 'PROJECT.SORT.BUDGET' },
    { value: 'location', label: 'PROJECT.SORT.LOCATION' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    this.loading = true;
    this.error = null;
    console.log('Loading projects...');
    
    this.http.get<any>('/api/projects')
      .subscribe({
        next: (response) => {
          // Handle the response format from backend
          this.projects = response.projects || response;
          this.applyFilters();
          this.loading = false;
          console.log('Projects loaded:', this.projects);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.error = 'PROJECT.ERROR.LOAD_FAILED';
          this.loading = false;
          // Mock data for demo
          this.projects = [
            {
              _id: '1',
              name: 'Downtown Office Complex',
              description: 'Modern office building with 20 floors',
              status: 'Active',
              start_date: '2024-01-15',
              budget: 5000000,
              location: 'Downtown, City Center',
              client_name: 'ABC Corporation',
              manager: 'John Smith',
              createdAt: '2024-01-10',
              progress: 65,
              expenses: 3250000
            },
            {
              _id: '2',
              name: 'Residential Tower A',
              description: 'Luxury residential complex with 150 units',
              status: 'Active',
              start_date: '2024-02-01',
              budget: 3500000,
              location: 'Riverside District',
              client_name: 'XYZ Developers',
              manager: 'Sarah Johnson',
              createdAt: '2024-01-20',
              progress: 45,
              expenses: 1575000
            }
          ];
          this.applyFilters();
        }
      });
  }

  // Filter and search methods
  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onClearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedLocation = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.projects];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(search) ||
        (project.description?.toLowerCase().includes(search) || false) ||
        (project.location?.toLowerCase().includes(search) || false) ||
        (project.client_name?.toLowerCase().includes(search) || false) ||
        (project.manager?.toLowerCase().includes(search) || false)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(project => project.status === this.selectedStatus);
    }

    // Location filter
    if (this.selectedLocation.trim()) {
      const location = this.selectedLocation.toLowerCase();
      filtered = filtered.filter(project =>
        project.location?.toLowerCase().includes(location) || false
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Project];
      let bValue: any = b[this.sortBy as keyof Project];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredProjects = filtered;
  }

  // Navigation methods
  onCreateProject() {
    this.router.navigate(['/projects/create']);
  }

  onViewProject(id: string) {
    this.router.navigate(['/projects', id]);
  }

  onEditProject(id: string) {
    this.router.navigate(['/projects', id, 'edit']);
  }

  onDeleteProject(id: string) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.deletingProjectId = id;
      this.http.delete(`/api/projects/${id}`)
        .subscribe({
          next: () => {
            this.projects = this.projects.filter(p => p._id !== id);
            this.applyFilters();
            this.deletingProjectId = null;
          },
          error: (err) => {
            console.error('Error deleting project:', err);
            this.error = 'PROJECT.ERROR.DELETE_FAILED';
            this.deletingProjectId = null;
          }
        });
    }
  }

  // Utility methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Completed': return 'status-completed';
      case 'On Hold': return 'status-on-hold';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active': return '🟢';
      case 'Completed': return '✅';
      case 'On Hold': return '⏸️';
      default: return '⚪';
    }
  }

  getProgressClass(progress: number): string {
    if (progress >= 80) return 'progress-excellent';
    if (progress >= 60) return 'progress-good';
    if (progress >= 40) return 'progress-average';
    return 'progress-poor';
  }

  getBudgetUtilization(project: Project): number {
    if (!project.expenses || !project.budget) return 0;
    return Math.round((project.expenses / project.budget) * 100);
  }

  getBudgetClass(utilization: number): string {
    if (utilization >= 90) return 'budget-critical';
    if (utilization >= 75) return 'budget-warning';
    return 'budget-good';
  }
} 
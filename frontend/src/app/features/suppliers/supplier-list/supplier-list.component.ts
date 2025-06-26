import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Supplier } from '../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss']
})
export class SupplierListComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  loading = true;
  error = '';
  deletingSupplierId: string | null = null;

  // Search and filtering
  searchTerm = '';
  selectedStatus = 'all';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Sorting
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Options for filters and sorting
  statusOptions = [
    { value: 'all', label: 'SUPPLIERS.FILTERS.ALL' },
    { value: 'active', label: 'SUPPLIERS.FILTERS.ACTIVE' },
    { value: 'inactive', label: 'SUPPLIERS.FILTERS.INACTIVE' }
  ];

  sortOptions = [
    { value: 'name', label: 'SUPPLIERS.SORT.NAME' },
    { value: 'contact_person', label: 'SUPPLIERS.SORT.CONTACT_PERSON' },
    { value: 'email', label: 'SUPPLIERS.SORT.EMAIL' },
    { value: 'createdAt', label: 'SUPPLIERS.SORT.CREATED_DATE' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSuppliers() {
    this.loading = true;
    this.error = '';
    
    console.log('Loading suppliers...');
    this.http.get<Supplier[]>('/api/suppliers')
      .subscribe({
        next: (data) => {
          console.log('Suppliers received from API:', data);
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          this.suppliers = data || [];
          console.log('Suppliers after assignment:', this.suppliers);
          this.applyFilters();
          console.log('Filtered suppliers:', this.filteredSuppliers);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading suppliers:', err);
          this.error = 'SUPPLIERS.ERROR.LOAD_FAILED';
          this.loading = false;
          // Mock data for demo
          this.suppliers = [
            {
              _id: '1',
              name: 'ABC Concrete Co.',
              contact_person: 'John Smith',
              email: 'info@abcconcrete.com',
              phone: '+1-555-0123',
              address: '123 Construction Ave, City Center',
              payment_terms: 'Net 30',
              is_active: true,
              notes: 'Reliable concrete supplier for large projects',
              createdAt: '2024-01-10T00:00:00.000Z'
            },
            {
              _id: '2',
              name: 'SteelCorp Industries',
              contact_person: 'Sarah Johnson',
              email: 'contact@steelcorp.com',
              phone: '+1-555-0456',
              address: '456 Industrial Blvd, Business District',
              payment_terms: 'Net 60',
              is_active: true,
              notes: 'Premium steel supplier with fast delivery',
              createdAt: '2024-01-15T00:00:00.000Z'
            },
            {
              _id: '3',
              name: 'LumberMax Supplies',
              contact_person: 'Mike Wilson',
              email: 'sales@lumbermax.com',
              phone: '+1-555-0789',
              address: '789 Wood Street, Industrial Zone',
              payment_terms: 'Net 30',
              is_active: false,
              notes: 'Temporarily inactive due to supply issues',
              createdAt: '2024-01-20T00:00:00.000Z'
            }
          ];
          this.applyFilters();
        }
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    // Ensure suppliers is always an array
    if (!Array.isArray(this.suppliers)) {
      this.suppliers = [];
    }
    
    let filtered = [...this.suppliers];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contact_person.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(supplier => supplier.is_active === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Supplier];
      let bValue: any = b[this.sortBy as keyof Supplier];

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.filteredSuppliers = filtered;
  }

  onCreateSupplier() {
    this.router.navigate(['/suppliers/create']);
  }

  onEditSupplier(supplierId: string) {
    if (supplierId) {
      this.router.navigate(['/suppliers', supplierId, 'edit']);
    }
  }

  onDeleteSupplier(supplierId: string) {
    if (!supplierId) return;
    
    if (confirm('SUPPLIERS.MESSAGES.DELETE_CONFIRM')) {
      this.deletingSupplierId = supplierId;
      
      this.http.delete(`/api/suppliers/${supplierId}`)
        .subscribe({
          next: () => {
            this.suppliers = this.suppliers.filter(s => s._id !== supplierId);
            this.applyFilters();
            this.deletingSupplierId = null;
          },
          error: (err) => {
            console.error('Error deleting supplier:', err);
            this.deletingSupplierId = null;
            alert('SUPPLIERS.ERROR.DELETE_FAILED');
          }
        });
    }
  }

  getStatusClass(isActive: boolean | undefined): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(isActive: boolean | undefined): string {
    return isActive ? '✅' : '❌';
  }
} 
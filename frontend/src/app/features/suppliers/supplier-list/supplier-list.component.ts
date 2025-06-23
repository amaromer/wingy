import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  tax_number?: string;
  created_at: string;
}

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss']
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  loading = true;
  error = '';
  deletingSupplierId: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.error = '';
    
    this.http.get<Supplier[]>('/api/suppliers')
      .subscribe({
        next: (data) => {
          this.suppliers = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading suppliers:', err);
          this.error = 'SUPPLIER.ERROR.LOAD_FAILED';
          this.loading = false;
          // Mock data for demo
          this.suppliers = [
            {
              _id: '1',
              name: 'ABC Concrete Co.',
              email: 'info@abcconcrete.com',
              phone: '+1-555-0123',
              address: '123 Construction Ave, City Center',
              contact_person: 'John Smith',
              tax_number: 'TAX123456',
              created_at: '2024-01-10'
            },
            {
              _id: '2',
              name: 'SteelCorp Industries',
              email: 'contact@steelcorp.com',
              phone: '+1-555-0456',
              address: '456 Industrial Blvd, Business District',
              contact_person: 'Sarah Johnson',
              tax_number: 'TAX789012',
              created_at: '2024-01-15'
            }
          ];
        }
      });
  }

  onCreateSupplier() {
    this.router.navigate(['/suppliers/create']);
  }

  onEditSupplier(supplierId: string) {
    this.router.navigate(['/suppliers', supplierId, 'edit']);
  }

  onDeleteSupplier(supplierId: string) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.deletingSupplierId = supplierId;
      
      this.http.delete(`/api/suppliers/${supplierId}`)
        .subscribe({
          next: () => {
            this.suppliers = this.suppliers.filter(s => s._id !== supplierId);
            this.deletingSupplierId = null;
          },
          error: (err) => {
            console.error('Error deleting supplier:', err);
            this.deletingSupplierId = null;
            alert('Failed to delete supplier. Please try again.');
          }
        });
    }
  }
} 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="supplier-list"><h2>Suppliers</h2><p>Supplier list will be implemented here</p></div>`,
  styles: [`.supplier-list { padding: 2rem; }`]
})
export class SupplierListComponent {} 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="supplier-form"><h2>Supplier Form</h2><p>Supplier form will be implemented here</p></div>`,
  styles: [`.supplier-form { padding: 2rem; }`]
})
export class SupplierFormComponent {} 
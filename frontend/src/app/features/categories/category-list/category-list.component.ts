import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="category-list"><h2>Categories</h2><p>Category list will be implemented here</p></div>`,
  styles: [`.category-list { padding: 2rem; }`]
})
export class CategoryListComponent {} 
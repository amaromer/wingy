import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="category-form"><h2>Category Form</h2><p>Category form will be implemented here</p></div>`,
  styles: [`.category-form { padding: 2rem; }`]
})
export class CategoryFormComponent {} 
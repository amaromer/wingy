import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="expense-list"><h2>Expenses</h2><p>Expense list will be implemented here</p></div>`,
  styles: [`.expense-list { padding: 2rem; }`]
})
export class ExpenseListComponent {} 
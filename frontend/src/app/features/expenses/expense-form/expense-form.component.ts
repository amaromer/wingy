import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="expense-form"><h2>Expense Form</h2><p>Expense form will be implemented here</p></div>`,
  styles: [`.expense-form { padding: 2rem; }`]
})
export class ExpenseFormComponent {} 
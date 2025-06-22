import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="user-list"><h2>Users</h2><p>User list will be implemented here</p></div>`,
  styles: [`.user-list { padding: 2rem; }`]
})
export class UserListComponent {} 
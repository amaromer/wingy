import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="profile"><h2>Profile</h2><p>User profile will be implemented here</p></div>`,
  styles: [`.profile { padding: 2rem; }`]
})
export class ProfileComponent {} 
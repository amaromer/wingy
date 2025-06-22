import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="project-list"><h2>Projects</h2><p>Project list will be implemented here</p></div>`,
  styles: [`.project-list { padding: 2rem; }`]
})
export class ProjectListComponent {} 
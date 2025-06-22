import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="project-form"><h2>Project Form</h2><p>Project form will be implemented here</p></div>`,
  styles: [`.project-form { padding: 2rem; }`]
})
export class ProjectFormComponent {} 
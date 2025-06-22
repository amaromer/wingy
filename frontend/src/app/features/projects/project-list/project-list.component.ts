import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'Active' | 'Completed' | 'On Hold';
  start_date: string;
  end_date?: string;
  budget: number;
  location: string;
  created_at: string;
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    console.log('Loading projects...');
    
    this.http.get<Project[]>('/api/projects')
      .subscribe({
        next: (data) => {
          this.projects = data;
          this.loading = false;
          console.log('Projects loaded:', data);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.loading = false;
          // Mock data for demo
          this.projects = [
            {
              _id: '1',
              name: 'Downtown Office Complex',
              description: 'Modern office building with 20 floors',
              status: 'Active',
              start_date: '2024-01-15',
              budget: 5000000,
              location: 'Downtown, City Center',
              created_at: '2024-01-10'
            },
            {
              _id: '2',
              name: 'Residential Tower A',
              description: 'Luxury residential complex with 150 units',
              status: 'Active',
              start_date: '2024-02-01',
              budget: 3500000,
              location: 'Riverside District',
              created_at: '2024-01-20'
            }
          ];
        }
      });
  }
} 
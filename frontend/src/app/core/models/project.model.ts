export interface Project {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes?: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectRequest {
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  code?: string;
  start_date?: string;
  end_date?: string;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  pages: number;
}

export interface ProjectStats {
  statusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  totalProjects: number;
  activeProjects: number;
} 
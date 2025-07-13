// Updated Project interface with all required fields
export interface Project {
  _id?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  status: 'Active' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  client_name?: string;
  manager?: string;
  phases?: ProjectPhase[];
  team_members?: TeamMember[];
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  total_expenses?: number;
  total_payments?: number;
}

export interface ProjectPhase {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status?: 'Active' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  client_name?: string;
  project_manager?: string;
  phases?: ProjectPhase[];
  team_members?: TeamMember[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status?: 'Active' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: string;
  client_name?: string;
  project_manager?: string;
  phases?: ProjectPhase[];
  team_members?: TeamMember[];
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
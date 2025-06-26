import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Project, ProjectPhase, TeamMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {
  projectForm: FormGroup;
  loading = false;
  submitting = false;
  error = '';
  success = '';
  isEditMode = false;
  projectId?: string;

  statusOptions = [
    { value: 'Active', label: 'PROJECT.STATUS.ACTIVE' },
    { value: 'Completed', label: 'PROJECT.STATUS.COMPLETED' },
    { value: 'On Hold', label: 'PROJECT.STATUS.ON_HOLD' }
  ];

  priorityOptions = [
    { value: 'Low', label: 'PROJECT.PRIORITY.LOW' },
    { value: 'Medium', label: 'PROJECT.PRIORITY.MEDIUM' },
    { value: 'High', label: 'PROJECT.PRIORITY.HIGH' },
    { value: 'Critical', label: 'PROJECT.PRIORITY.CRITICAL' }
  ];

  roleOptions = [
    { value: 'Project Manager', label: 'PROJECT.ROLES.PROJECT_MANAGER' },
    { value: 'Architect', label: 'PROJECT.ROLES.ARCHITECT' },
    { value: 'Engineer', label: 'PROJECT.ROLES.ENGINEER' },
    { value: 'Contractor', label: 'PROJECT.ROLES.CONTRACTOR' },
    { value: 'Supervisor', label: 'PROJECT.ROLES.SUPERVISOR' },
    { value: 'Worker', label: 'PROJECT.ROLES.WORKER' }
  ];

  phaseStatusOptions = [
    { value: 'Not Started', label: 'PROJECT.PHASE_STATUS.NOT_STARTED' },
    { value: 'In Progress', label: 'PROJECT.PHASE_STATUS.IN_PROGRESS' },
    { value: 'Completed', label: 'PROJECT.PHASE_STATUS.COMPLETED' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.minLength(10), Validators.maxLength(500)]],
      status: ['Active'],
      priority: ['Medium'],
      start_date: [''],
      end_date: [''],
      budget: [0, [Validators.min(0), Validators.max(999999999)]],
      location: ['', [Validators.minLength(3), Validators.maxLength(200)]],
      client_name: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      project_manager: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      phases: this.fb.array([]),
      team_members: this.fb.array([])
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.projectId;
    
    if (this.isEditMode) {
      this.loadProject();
    }
  }

  get phases() {
    return this.projectForm.get('phases') as FormArray;
  }

  get teamMembers() {
    return this.projectForm.get('team_members') as FormArray;
  }

  loadProject() {
    if (!this.projectId) return;
    
    this.loading = true;
    this.http.get<Project>(`/api/projects/${this.projectId}`)
      .subscribe({
        next: (project) => {
          // Clear existing arrays
          while (this.phases.length) {
            this.phases.removeAt(0);
          }
          while (this.teamMembers.length) {
            this.teamMembers.removeAt(0);
          }

          // Add phases
          if (project.phases && project.phases.length > 0) {
            project.phases.forEach(phase => this.addPhase(phase));
          }

          // Add team members
          if (project.team_members && project.team_members.length > 0) {
            project.team_members.forEach(member => this.addTeamMember(member));
          }

          this.projectForm.patchValue({
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority || 'Medium',
            start_date: project.start_date,
            end_date: project.end_date || '',
            budget: project.budget,
            location: project.location,
            client_name: project.client_name || '',
            project_manager: project.manager || ''
          });
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading project:', err);
          this.error = 'PROJECT.ERROR.LOAD_FAILED';
          this.loading = false;
        }
      });
  }

  addPhase(phase?: ProjectPhase) {
    const phaseForm = this.fb.group({
      name: [phase?.name || '', [Validators.minLength(2), Validators.maxLength(50)]],
      description: [phase?.description || '', [Validators.minLength(5), Validators.maxLength(200)]],
      start_date: [phase?.start_date || ''],
      end_date: [phase?.end_date || ''],
      budget: [phase?.budget || 0, [Validators.min(0)]],
      status: [phase?.status || 'Not Started']
    });
    this.phases.push(phaseForm);
  }

  removePhase(index: number) {
    this.phases.removeAt(index);
  }

  addTeamMember(member?: TeamMember) {
    const memberForm = this.fb.group({
      name: [member?.name || '', [Validators.minLength(2), Validators.maxLength(50)]],
      role: [member?.role || ''],
      email: [member?.email || '', [Validators.email]],
      phone: [member?.phone || '', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]]
    });
    this.teamMembers.push(memberForm);
  }

  removeTeamMember(index: number) {
    this.teamMembers.removeAt(index);
  }

  onSubmit() {
    // Remove form validation check since fields are no longer required
    // if (this.projectForm.invalid) {
    //   this.markFormGroupTouched();
    //   return;
    // }

    // Validate phase dates only if phases exist
    if (this.phases.length > 0 && !this.validatePhaseDates()) {
      this.error = 'PROJECT.ERROR.INVALID_PHASE_DATES';
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    const projectData = this.projectForm.value;
    
    console.log('Submitting project data:', projectData);
    
    // Clean up the data - remove empty strings and undefined values
    const cleanedData: any = {};
    
    Object.keys(projectData).forEach(key => {
      const value = projectData[key];
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'start_date' || key === 'end_date') {
          // Only include dates if they have valid values
          if (value) {
            cleanedData[key] = new Date(value).toISOString().split('T')[0];
          }
        } else if (key === 'phases' && Array.isArray(value) && value.length > 0) {
          // Clean up phases data
          cleanedData[key] = value.map((phase: any) => {
            const cleanedPhase: any = {};
            Object.keys(phase).forEach(phaseKey => {
              const phaseValue = phase[phaseKey];
              if (phaseValue !== '' && phaseValue !== null && phaseValue !== undefined) {
                if (phaseKey === 'start_date' || phaseKey === 'end_date') {
                  if (phaseValue) {
                    cleanedPhase[phaseKey] = new Date(phaseValue).toISOString().split('T')[0];
                  }
                } else {
                  cleanedPhase[phaseKey] = phaseValue;
                }
              }
            });
            return cleanedPhase;
          });
        } else if (key === 'team_members' && Array.isArray(value) && value.length > 0) {
          // Clean up team members data
          cleanedData[key] = value.map((member: any) => {
            const cleanedMember: any = {};
            Object.keys(member).forEach(memberKey => {
              const memberValue = member[memberKey];
              if (memberValue !== '' && memberValue !== null && memberValue !== undefined) {
                cleanedMember[memberKey] = memberValue;
              }
            });
            return cleanedMember;
          });
        } else {
          cleanedData[key] = value;
        }
      }
    });

    console.log('Formatted project data:', cleanedData);

    const request = this.isEditMode 
      ? this.http.put<Project>(`/api/projects/${this.projectId}`, cleanedData)
      : this.http.post<Project>('/api/projects', cleanedData);

    request.subscribe({
      next: (project) => {
        console.log('Project created/updated successfully:', project);
        this.success = this.isEditMode ? 'PROJECT.SUCCESS.UPDATED' : 'PROJECT.SUCCESS.CREATED';
        this.submitting = false;
        
        // Redirect after a short delay
        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error saving project:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.error?.message || err.message,
          error: err.error
        });
        
        // Show specific validation errors if available
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          const validationErrors = err.error.errors.map((e: any) => `${e.param}: ${e.msg}`).join(', ');
          this.error = `Validation errors: ${validationErrors}`;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = this.isEditMode ? 'PROJECT.ERROR.UPDATE_FAILED' : 'PROJECT.ERROR.CREATE_FAILED';
        }
        
        this.submitting = false;
      }
    });
  }

  validatePhaseDates(): boolean {
    const phases = this.phases.value;
    const projectStartDate = this.projectForm.get('start_date')?.value ? new Date(this.projectForm.get('start_date')?.value) : null;
    const projectEndDate = this.projectForm.get('end_date')?.value ? new Date(this.projectForm.get('end_date')?.value) : null;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      
      // Skip validation if phase doesn't have dates
      if (!phase.start_date || !phase.end_date) {
        continue;
      }
      
      const phaseStartDate = new Date(phase.start_date);
      const phaseEndDate = new Date(phase.end_date);

      // Check if phase end date is after start date
      if (phaseEndDate <= phaseStartDate) {
        return false;
      }

      // Check if phase dates are within project dates (only if project dates exist)
      if (projectStartDate && phaseStartDate < projectStartDate) {
        return false;
      }

      if (projectEndDate && phaseEndDate > projectEndDate) {
        return false;
      }

      // Check for overlapping phases
      for (let j = i + 1; j < phases.length; j++) {
        const otherPhase = phases[j];
        
        // Skip if other phase doesn't have dates
        if (!otherPhase.start_date || !otherPhase.end_date) {
          continue;
        }
        
        const otherPhaseStartDate = new Date(otherPhase.start_date);
        const otherPhaseEndDate = new Date(otherPhase.end_date);

        if (phaseStartDate < otherPhaseEndDate && phaseEndDate > otherPhaseStartDate) {
          return false;
        }
      }
    }

    return true;
  }

  onCancel() {
    this.router.navigate(['/projects']);
  }

  private markFormGroupTouched() {
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach((ctrl: any) => {
          Object.keys(ctrl.controls).forEach(subKey => {
            ctrl.get(subKey)?.markAsTouched();
          });
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'FORM.ERROR.REQUIRED';
      if (field.errors['minlength']) return `FORM.ERROR.MIN_LENGTH_${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `FORM.ERROR.MAX_LENGTH_${field.errors['maxlength'].requiredLength}`;
      if (field.errors['min']) return 'FORM.ERROR.MIN_VALUE';
      if (field.errors['max']) return 'FORM.ERROR.MAX_VALUE';
      if (field.errors['email']) return 'FORM.ERROR.INVALID_EMAIL';
      if (field.errors['pattern']) return 'FORM.ERROR.INVALID_PHONE';
    }
    return '';
  }

  getPhaseFieldError(phaseIndex: number, fieldName: string): string {
    const phase = this.phases.at(phaseIndex);
    const field = phase.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'FORM.ERROR.REQUIRED';
      if (field.errors['minlength']) return `FORM.ERROR.MIN_LENGTH_${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `FORM.ERROR.MAX_LENGTH_${field.errors['maxlength'].requiredLength}`;
      if (field.errors['min']) return 'FORM.ERROR.MIN_VALUE';
    }
    return '';
  }

  getMemberFieldError(memberIndex: number, fieldName: string): string {
    const member = this.teamMembers.at(memberIndex);
    const field = member.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'FORM.ERROR.REQUIRED';
      if (field.errors['minlength']) return `FORM.ERROR.MIN_LENGTH_${field.errors['minlength'].requiredLength}`;
      if (field.errors['maxlength']) return `FORM.ERROR.MAX_LENGTH_${field.errors['maxlength'].requiredLength}`;
      if (field.errors['email']) return 'FORM.ERROR.INVALID_EMAIL';
      if (field.errors['pattern']) return 'FORM.ERROR.INVALID_PHONE';
    }
    return '';
  }

  calculateTotalPhaseBudget(): number {
    return this.phases.value.reduce((total: number, phase: any) => total + (phase.budget || 0), 0);
  }

  getBudgetDifference(): number {
    const totalBudget = this.projectForm.get('budget')?.value || 0;
    const phaseBudget = this.calculateTotalPhaseBudget();
    return totalBudget - phaseBudget;
  }

  getBudgetStatus(): string {
    const difference = this.getBudgetDifference();
    if (difference < 0) return 'over';
    if (difference === 0) return 'exact';
    return 'under';
  }
} 
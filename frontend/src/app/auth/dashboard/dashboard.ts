import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterviewService, InterviewSession } from '../../service/interview.service';
import { AuthService } from '../../service/auth-service';
import { ResumeService, Resume } from '../../service/resume.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  user: any = null;
  sessions: InterviewSession[] = [];
  loading: boolean = true;
  error: string = '';

  // Resume management
  resumes: Resume[] = [];
  resumesLoading: boolean = false;
  selectedFile: File | null = null;
  uploadingResume: boolean = false;
  newResumeName: string = '';
  newResumeCategory: string = 'other';
  editingResumeId: string | null = null;
  editResumeName: string = '';
  editResumeCategory: string = '';

  // View tabs
  activeTab: 'interviews' | 'resumes' = 'interviews';

  // Statistics
  totalInterviews: number = 0;
  completedInterviews: number = 0;
  averageScore: number = 0;
  latestSession: InterviewSession | null = null;

  constructor(
    private interviewService: InterviewService,
    private authService: AuthService,
    private resumeService: ResumeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSessions();
    this.loadResumes();
  }

  loadUserProfile(): void {
    this.authService.getUserProfile().subscribe({
      next: (res) => {
        if (res.status === 'Success') {
          this.user = res.user;
        }
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
      }
    });
  }

  loadSessions(): void {
    this.loading = true;
    
    this.interviewService.getSessions().subscribe({
      next: (response) => {
        try {
          if (response.success && response.data) {
            this.sessions = response.data;
            this.calculateStatistics();
            this.loading = false;
            this.cdr.detectChanges();
          } else {
            console.error('Dashboard: Invalid response structure', response);
            this.error = 'Invalid response from server';
            this.loading = false;
            this.cdr.detectChanges();
          }
        } catch (err) {
          console.error('Dashboard: Error processing response', err);
          this.error = 'Error processing interview data';
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Dashboard: Failed to load sessions', err);
        this.error = 'Failed to load interview history. Please try logging in again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStatistics(): void {
    this.totalInterviews = this.sessions.length;
    this.completedInterviews = this.sessions.filter(s => s.status === 'completed').length;
    
    // Get latest session (first one since they're sorted by createdAt desc)
    this.latestSession = this.sessions.length > 0 ? this.sessions[0] : null;
    
    // Calculate average score from completed interviews
    const completedSessions = this.sessions.filter(s => s.status === 'completed');
    if (completedSessions.length > 0) {
      const totalScore = completedSessions.reduce((sum, s) => sum + (s.evaluation?.overallScore || 0), 0);
      this.averageScore = Math.round(totalScore / completedSessions.length);
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#ff9800';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewSession(sessionId: string | undefined): void {
    if (sessionId) {
      this.router.navigate(['/interview'], { queryParams: { sessionId } });
    }
  }

  startNewInterview(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Tab navigation
  switchTab(tab: 'interviews' | 'resumes'): void {
    this.activeTab = tab;
  }

  // Resume Management Methods
  loadResumes(): void {
    this.resumesLoading = true;
    this.resumeService.getResumes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resumes = response.data;
        }
        this.resumesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load resumes', err);
        this.resumesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF and Word documents are allowed');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      this.selectedFile = file;
      // Auto-fill resume name from filename
      if (!this.newResumeName) {
        this.newResumeName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      }
    }
  }

  uploadResume(): void {
    if (!this.selectedFile) {
      alert('Please select a file');
      return;
    }

    this.uploadingResume = true;
    const displayName = this.newResumeName || this.selectedFile.name;

    this.resumeService.uploadResume(this.selectedFile, displayName, this.newResumeCategory).subscribe({
      next: (response) => {
        if (response.success) {
          alert(response.msg || 'Resume uploaded successfully!');
          this.loadResumes(); // Reload list
          this.resetUploadForm();
        } else {
          alert('Upload failed: ' + (response.msg || 'Unknown error'));
        }
        this.uploadingResume = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Upload error:', err);
        alert('Failed to upload resume');
        this.uploadingResume = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetUploadForm(): void {
    this.selectedFile = null;
    this.newResumeName = '';
    this.newResumeCategory = 'other';
    // Reset file input
    const fileInput = document.getElementById('resumeFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  startEditResume(resume: Resume): void {
    this.editingResumeId = resume._id;
    this.editResumeName = resume.displayName;
    this.editResumeCategory = resume.category;
  }

  cancelEditResume(): void {
    this.editingResumeId = null;
    this.editResumeName = '';
    this.editResumeCategory = '';
  }

  saveResumeEdit(resumeId: string): void {
    this.resumeService.updateResume(resumeId, {
      displayName: this.editResumeName,
      category: this.editResumeCategory
    }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Resume updated successfully!');
          this.loadResumes();
          this.cancelEditResume();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        alert('Failed to update resume');
        this.cdr.detectChanges();
      }
    });
  }

  deleteResume(resumeId: string, resumeName: string): void {
    if (confirm(`Are you sure you want to delete "${resumeName}"? This action cannot be undone.`)) {
      this.resumeService.deleteResume(resumeId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Resume deleted successfully!');
            this.loadResumes();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Delete error:', err);
          alert('Failed to delete resume');
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    return this.resumeService.formatFileSize(bytes);
  }

  getCategoryDisplay(category: string): string {
    return this.resumeService.getCategoryDisplayName(category);
  }

  formatResumeDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

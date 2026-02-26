import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InterviewService, InterviewSession } from '../../service/interview.service';
import { AuthService } from '../../service/auth-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  user: any = null;
  sessions: InterviewSession[] = [];
  loading: boolean = true;
  error: string = '';

  // Statistics
  totalInterviews: number = 0;
  completedInterviews: number = 0;
  averageScore: number = 0;
  latestSession: InterviewSession | null = null;

  constructor(
    private interviewService: InterviewService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSessions();
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
}

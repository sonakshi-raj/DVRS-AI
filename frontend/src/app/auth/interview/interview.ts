import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InterviewService, InterviewSession } from '../../service/interview.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interview',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './interview.html',
  styleUrl: './interview.scss',
})
export class Interview implements OnInit {
  sessionId: string = '';
  session: InterviewSession | null = null;
  loading: boolean = true;
  error: string = '';
  currentAnswer: string = '';
  currentQuestionIndex: number = 0;
  submitting: boolean = false;

  // Sample questions - in real app, these would come from backend
  questions: string[] = [
    'Tell us about a challenging project you worked on.',
    'What is your experience with databases and data modeling?',
    'Describe a situation where you had to debug a complex issue.',
    'How do you approach learning new technologies?',
    'What are your career goals for the next 2-3 years?'
  ];

  get showContent(): boolean {
    return !this.loading && !this.error && this.session !== null;
  }

  constructor(
    private interviewService: InterviewService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        // Reset all state for new interview
        this.sessionId = params['sessionId'];
        this.session = null;
        this.currentQuestionIndex = 0;
        this.currentAnswer = '';
        this.submitting = false;
        this.error = '';
        this.loading = true;
        
        this.loadSession(this.sessionId);
      } else {
        this.loading = false;
        this.error = 'No session ID found. Please start from home page.';
      }
    });
  }

  loadSession(sessionId: string): void {
    this.loading = true;
    this.error = '';
    console.log('Loading state:', this.loading);

    this.interviewService.getSessionById(sessionId).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response.success && response.data) {
          this.session = response.data;
          console.log('Session loaded', this.session);
          this.loading = false;
          console.log('Loading state after setting false:', this.loading);
          console.log('Session exists?', !!this.session);
          console.log('Error?', this.error);
          this.cdr.detectChanges(); // Force change detection
        } else {
          console.error('Invalid response structure', response);
          this.error = 'Failed to load session data.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load interview session.';
        console.error('Error loading session', err);
        this.cdr.detectChanges();
      }
    });
  }

  submitAnswer(): void {
    if (!this.currentAnswer.trim()) {
      alert('Please enter an answer');
      return;
    }

    if (!this.sessionId) {
      alert('No session found');
      return;
    }

    this.submitting = true;
    const currentQuestion = this.questions[this.currentQuestionIndex];
    console.log('Submitting answer for question', this.currentQuestionIndex + 1);

    this.interviewService.addQuestionAnswer(
      this.sessionId,
      currentQuestion,
      this.currentAnswer
    ).subscribe({
      next: (response) => {
        console.log('Answer saved successfully', response);
        
        if (response.success) {
          this.session = response.data || this.session;
          
          // Check if this was the last question
          if (this.currentQuestionIndex >= this.questions.length - 1) {
            console.log('Last question - completing interview');
            // Keep submitting true while completing
            this.completeInterview();
          } else {
            console.log('Moving to next question');
            // Move to next question first
            this.nextQuestion();
            // Then reset submitting flag
            this.submitting = false;
            this.cdr.detectChanges(); // Force UI update
          }
        } else {
          console.error('Response success was false', response);
          this.submitting = false;
          this.cdr.detectChanges();
          alert('Failed to save answer. Please try again.');
        }
      },
      error: (err) => {
        console.error('Error saving answer', err);
        this.submitting = false;
        this.cdr.detectChanges();
        alert('Failed to save answer. Please try again.');
      }
    });
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentAnswer = '';
      console.log('Now on question', this.currentQuestionIndex + 1);
    }
  }

  completeInterview(): void {
    if (!this.sessionId) return;

    this.interviewService.completeSession(this.sessionId).subscribe({
      next: (response) => {
        this.submitting = false;
        this.cdr.detectChanges();
        if (response.success) {
          alert('Interview completed successfully! 🎉');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.cdr.detectChanges();
        console.error('Failed to complete session', err);
        alert('Interview answers saved, but failed to mark as complete.');
      }
    });
  }

  get currentQuestion(): string {
    return this.questions[this.currentQuestionIndex];
  }

  get progressPercentage(): number {
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }
}

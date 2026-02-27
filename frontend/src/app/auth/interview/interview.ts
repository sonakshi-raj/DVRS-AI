import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
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
export class Interview implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  
  sessionId: string = '';
  session: InterviewSession | null = null;
  loading: boolean = true;
  error: string = '';
  currentAnswer: string = '';
  currentQuestionIndex: number = 0;
  submitting: boolean = false;

  // AI-generated question data
  currentQuestionData: {
    question: string;
    difficulty: string;
    category: string;
  } | null = null;
  fetchingQuestion: boolean = false;

  // Video recording
  mediaStream: MediaStream | null = null;
  videoElement: HTMLVideoElement | null = null;
  cameraError: string = '';
  
  // Recording controls
  mediaRecorder: MediaRecorder | null = null;
  isRecording: boolean = false;
  recordedChunks: Blob[] = [];
  recordedVideoBlob: Blob | null = null;

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

    this.interviewService.getSessionById(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.session = response.data;
          this.loading = false;
          
          // Fetch first AI-generated question
          this.fetchNextQuestion();
          
          this.cdr.detectChanges();
          
          // Initialize camera after content is rendered
          setTimeout(() => this.initializeCamera(), 500);
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

  fetchNextQuestion(): void {
    if (!this.sessionId) return;
    
    this.fetchingQuestion = true;
    this.interviewService.getNextQuestion(this.sessionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentQuestionData = response.data;
        } else {
          this.error = 'Failed to generate question. Please try again.';
        }
        this.fetchingQuestion = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching question:', err);
        this.error = 'Failed to generate question. Please try again.';
        this.fetchingQuestion = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitAnswer(): void {
    if (!this.currentAnswer.trim()) {
      alert('Please enter an answer');
      return;
    }

    if (!this.sessionId || !this.currentQuestionData) {
      alert('No question or session found');
      return;
    }

    this.submitting = true;
    const currentQuestion = this.currentQuestionData.question;

    this.interviewService.addQuestionAnswer(
      this.sessionId,
      currentQuestion,
      this.currentAnswer
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.session = response.data;
          
          // Check if interview is complete (based on state)
          if (this.session.currentState === 'end' || this.session.currentState === 'closing') {
            this.completeInterview();
          } else {
            this.currentQuestionIndex++;
            this.currentAnswer = '';
            this.submitting = false;
            // Fetch next AI question
            this.fetchNextQuestion();
            this.cdr.detectChanges();
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
    // Not needed anymore - questions are fetched dynamically
    this.currentAnswer = '';
  }

  completeInterview(): void {
    if (!this.sessionId) return;

    this.submitting = true; // Lock all buttons
    this.cdr.detectChanges();

    // Stop recording before completing
    if (this.isRecording) {
      this.stopRecording();
      
      // Wait for blob to be created, then upload
      setTimeout(() => {
        this.uploadVideoAndComplete();
      }, 500);
    } else {
      // No recording, just complete
      this.finalizeCompletion();
    }
  }

  uploadVideoAndComplete(): void {
    if (!this.sessionId || !this.recordedVideoBlob) {
      this.finalizeCompletion();
      return;
    }
    
    this.interviewService.uploadVideo(this.sessionId, this.recordedVideoBlob).subscribe({
      next: (response) => {
        this.finalizeCompletion();
      },
      error: (err) => {
        console.error('Failed to upload video:', err);
        alert('Warning: Video upload failed, but interview will be saved.');
        this.finalizeCompletion();
      }
    });
  }

  finalizeCompletion(): void {
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
    return this.currentQuestionData?.question || 'Loading question...';
  }

  get currentDifficulty(): string {
    return this.currentQuestionData?.difficulty || 'medium';
  }

  get currentCategory(): string {
    return this.currentQuestionData?.category || 'general';
  }

  get progressPercentage(): number {
    // Estimate based on interview state
    const stateProgress: { [key: string]: number } = {
      'introduction': 20,
      'resume-based': 40,
      'follow-up': 60,
      'deep-dive': 80,
      'closing': 95,
      'end': 100
    };
    return stateProgress[this.session?.currentState || 'introduction'] || 0;
  }

  get isLastQuestion(): boolean {
    return this.session?.currentState === 'closing' || this.session?.currentState === 'end';
  }

  async initializeCamera(): Promise<void> {
    try {
      // Request camera access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });

      // Connect stream to video element (with retry if not ready)
      const attachStream = () => {
        if (this.videoElementRef?.nativeElement) {
          this.videoElementRef.nativeElement.srcObject = this.mediaStream;
          this.cameraError = '';
          this.cdr.detectChanges();
          
          // Auto-start recording for the interview
          setTimeout(() => this.startRecording(), 500);
        } else {
          setTimeout(attachStream, 200);
        }
      };
      
      attachStream();

    } catch (err: any) {
      console.error('Camera access error:', err);
      this.cameraError = err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions in your browser settings.'
        : 'Unable to access camera. Please check your camera settings.';
      this.cdr.detectChanges();
    }
  }

  startRecording(): void {
    if (!this.mediaStream) {
      alert('Camera not initialized. Please refresh the page.');
      return;
    }

    try {
      // Create MediaRecorder with the camera stream
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      // Collect video data as it's recorded
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.recordedVideoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.cdr.detectChanges();

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording. Your browser may not support this feature.');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    // Clean up camera stream when component is destroyed
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
  }
}

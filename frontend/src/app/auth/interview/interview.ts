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
  audioRecorder: MediaRecorder | null = null;
  isRecording: boolean = false;
  recordedChunks: Blob[] = [];
  recordedAudioChunks: Blob[] = [];
  recordedVideoBlob: Blob | null = null;
  recordedAudioBlob: Blob | null = null;
  recordingDuration: number = 0;
  recordingTimer: any = null;

  // Transcription and evaluation
  isTranscribing: boolean = false;
  lastTranscript: string = '';
  lastEvaluation: {
    score: number;
    signal: string;
    feedback: string;
  } | null = null;

  // View mode for completed interviews
  isViewMode: boolean = false;
  
  // Analysis state
  isAnalyzing: boolean = false;

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
          
          // Check if interview is completed - show in view mode
          if (this.session.status === 'completed') {
            this.isViewMode = true;
            // Automatically analyze if not already analyzed
            if (!this.session.analysis?.analyzedAt) {
              setTimeout(() => this.analyzeInterview(), 500);
            }
          } else {
            // Active interview - fetch next question and start recording
            this.fetchNextQuestion();
            // Initialize camera after content is rendered
            setTimeout(() => this.initializeCamera(), 500);
          }
          
          this.cdr.detectChanges();
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
    if (!this.isRecording) {
      alert('No recording found. Please start recording your answer.');
      return;
    }

    if (!this.sessionId || !this.currentQuestionData) {
      alert('No question or session found');
      return;
    }

    // Stop recording and submit video
    this.stopRecording();
    
    // Wait for blob to be created, then submit
    setTimeout(() => {
      this.submitVideoAnswer();
    }, 500);
  }

  submitVideoAnswer(): void {
    if (!this.recordedVideoBlob || !this.recordedAudioBlob) {
      alert('No video or audio recorded. Please try again.');
      // Restart recording
      this.startRecording();
      return;
    }

    if (!this.sessionId || !this.currentQuestionData) {
      alert('No question or session found');
      return;
    }

    this.submitting = true;
    this.isTranscribing = true;
    const currentQuestion = this.currentQuestionData.question;

    console.log('📹 Submitting video answer...');
    console.log(`   Video size: ${(this.recordedVideoBlob.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Audio size: ${(this.recordedAudioBlob.size / 1024).toFixed(2)} KB`);
    
    // Convert audio to WAV format (Whisper can process WAV without FFmpeg)
    this.convertAudioToWav(this.recordedAudioBlob).then(wavBlob => {
      console.log(`   WAV size: ${(wavBlob.size / 1024).toFixed(2)} KB`);
      
      this.interviewService.addVideoQuestionAnswer(
        this.sessionId,
        currentQuestion,
        this.recordedVideoBlob!,
        wavBlob
      ).subscribe({
        next: (response) => {
          console.log('✅ Video answer processed:', response);
          
          if (response.success && response.data) {
            // Update session
            this.session = response.data;
            
            // Store transcript and evaluation for display (they're at root level)
            this.lastTranscript = response.transcript || '';
            this.lastEvaluation = response.evaluation || null;
            
            console.log(`📝 Transcript: "${this.lastTranscript}"`);
            console.log(`📊 Score: ${this.lastEvaluation?.score}/10, Signal: ${this.lastEvaluation?.signal}`);
            
            this.isTranscribing = false;
            this.submitting = false;
            
            // Check if interview is complete
            if (response.nextState === 'end' || response.nextState === 'closing') {
              this.completeInterview();
            } else {
              // Move to next question
              this.currentQuestionIndex++;
              this.recordedVideoBlob = null;
              this.recordedAudioBlob = null;
              this.recordingDuration = 0;
              
              // Fetch next question
              this.fetchNextQuestion();
              
              // Start recording for next answer after a short delay
              setTimeout(() => {
                this.lastTranscript = '';
                this.lastEvaluation = null;
                this.startRecording();
              }, 2000);
            }
            
            this.cdr.detectChanges();
          } else {
            console.error('Response success was false', response);
            this.submitting = false;
            this.isTranscribing = false;
            this.cdr.detectChanges();
            alert('Failed to process video answer. Please try again.');
            // Restart recording
            this.startRecording();
          }
        },
        error: (err) => {
          console.error('❌ Error processing video answer:', err);
          this.submitting = false;
          this.isTranscribing = false;
          this.cdr.detectChanges();
          alert('Failed to process video answer. Please try again.');
          // Restart recording
          this.startRecording();
        }
      });
    }).catch(err => {
      console.error('❌ Error converting audio to WAV:', err);
      this.submitting = false;
      this.isTranscribing = false;
      this.cdr.detectChanges();
      alert('Failed to convert audio. Please try again.');
      this.startRecording();
    });
  }

  async convertAudioToWav(audioBlob: Blob): Promise<Blob> {
    // Create audio context
    const audioContext = new AudioContext();
    
    // Decode the audio data
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to WAV format
    const wavBuffer = this.audioBufferToWav(audioBuffer);
    
    // Create blob from WAV buffer
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return buffer;
  }

  nextQuestion(): void {
    // Not needed anymore - questions are fetched dynamically
    this.currentAnswer = '';
  }

  completeInterview(): void {
    if (!this.sessionId) return;

    this.submitting = true;
    this.cdr.detectChanges();

    // Stop recording if still active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Complete the session (videos already uploaded per question)
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

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async initializeCamera(): Promise<void> {
    try {
      // Request camera and microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true  // Enable audio for transcription
      });

      // Connect stream to video element (with retry if not ready)
      const attachStream = () => {
        if (this.videoElementRef?.nativeElement) {
          const videoTracks = this.mediaStream!.getVideoTracks();
          const videoOnlyStream = new MediaStream(videoTracks);

          this.videoElementRef.nativeElement.srcObject = videoOnlyStream;
          this.videoElementRef.nativeElement.muted = true;
          this.cameraError = '';
          this.cdr.detectChanges();
          
          // Auto-start recording for the first question
          setTimeout(() => this.startRecording(), 500);
        } else {
          setTimeout(attachStream, 200);
        }
      };
      
      attachStream();

    } catch (err: any) {
      console.error('Camera access error:', err);
      this.cameraError = err.name === 'NotAllowedError' 
        ? 'Camera/microphone access denied. Please allow permissions in your browser settings.'
        : 'Unable to access camera/microphone. Please check your device settings.';
      this.cdr.detectChanges();
    }
  }

  startRecording(): void {
    if (!this.mediaStream) {
      alert('Camera not initialized. Please refresh the page.');
      return;
    }

    try {
      // Reset for new recording
      this.recordedChunks = [];
      this.recordedAudioChunks = [];
      this.recordedVideoBlob = null;
      this.recordedAudioBlob = null;
      this.recordingDuration = 0;
      
      // Recorder 1: Video + Audio (for storage)
      let videoMimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(videoMimeType)) {
        videoMimeType = 'video/webm';
      }
      
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: videoMimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.recordedVideoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        console.log(`🎬 Video recording stopped. Size: ${(this.recordedVideoBlob.size / 1024 / 1024).toFixed(2)} MB`);
      };

      // Recorder 2: Audio-only (for transcription - simpler format)
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioStream = new MediaStream([audioTrack]);
        
        // Use audio/webm with opus codec (Whisper can handle this without FFmpeg)
        let audioMimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(audioMimeType)) {
          audioMimeType = 'audio/webm';
        }
        
        this.audioRecorder = new MediaRecorder(audioStream, { mimeType: audioMimeType });
        
        this.audioRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedAudioChunks.push(event.data);
          }
        };
        
        this.audioRecorder.onstop = () => {
          this.recordedAudioBlob = new Blob(this.recordedAudioChunks, { type: 'audio/webm' });
          console.log(`🎤 Audio recording stopped. Size: ${(this.recordedAudioBlob.size / 1024).toFixed(2)} KB`);
        };
        
        this.audioRecorder.start();
      }

      // Start video recording
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Start timer
      this.recordingTimer = setInterval(() => {
        this.recordingDuration++;
        this.cdr.detectChanges();
      }, 1000);
      
      this.cdr.detectChanges();
      console.log('🔴 Recording started (video + audio)');

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording. Your browser may not support this feature.');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      if (this.audioRecorder) {
        this.audioRecorder.stop();
      }
      this.isRecording = false;
      
      // Clear timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      this.cdr.detectChanges();
      console.log('⏹️ Recording stopped by user');
    }
  }

  formatRecordingTime(): string {
    const minutes = Math.floor(this.recordingDuration / 60);
    const seconds = this.recordingDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  analyzeInterview(): void {
    if (!this.sessionId) {
      alert('Session ID not found');
      return;
    }

    console.log('Starting analysis for session:', this.sessionId);
    this.isAnalyzing = true;
    this.interviewService.analyzeInterview(this.sessionId).subscribe({
      next: (response) => {
        console.log('Analysis complete:', response.data);
        this.isAnalyzing = false;
        if (response.success && response.data) {
          // Update the session with analysis data
          if (this.session) {
            this.session.analysis = response.data;
          }
        }
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isAnalyzing = false;
        console.error('Analysis failed:', err);
        this.cdr.detectChanges();
        alert('Failed to analyze interview. Please try again.');
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up camera stream when component is destroyed
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    // Clear recording timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
    
    // Stop recording if active
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.audioRecorder) {
      this.audioRecorder.stop();
    }
  }
}

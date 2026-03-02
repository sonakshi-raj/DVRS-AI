import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* =======================
   INTERFACES
======================= */

export interface InterviewSession {
  _id?: string;
  userId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  resumeId?: string;
  jobDescription?: string;
  currentState: 'introduction' | 'resume-based' | 'follow-up' | 'deep-dive' | 'closing' | 'end';
  questions: Array<{
  question: string;
  answer: string;
  timestamp: Date;

  transcript?: string;

  evaluation?: {
    technical_accuracy: number;
    depth: number;
    clarity: number;
    relevance: number;
    final_score: number;
    signal: string;
    feedback: string;
  };
}>;
  evaluation?: {
    overallScore: number;
    confidenceLevel: number;
    dsaLevel: number;
    feedback: string;
  };
  analysis?: {
    facialConfidence: number;
    voiceClarity: number;
    eyeContact: number;
    speechPace: number;
    overallConfidence: number;
    feedback: string;
    analyzedAt: Date;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

/* =======================
   SERVICE
======================= */

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private baseUrl = 'http://localhost:5002/api/interview';

  constructor(private http: HttpClient) { }

  /* =======================
     SESSION APIs
  ======================= */

  createSession(
    sessionData: { resumeId?: string; jobDescription?: string }
  ): Observable<ApiResponse<InterviewSession>> {
    return this.http.post<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session`,
      sessionData,
      { withCredentials: true }
    );
  }

  getSessions(): Observable<ApiResponse<InterviewSession[]>> {
    return this.http.get<ApiResponse<InterviewSession[]>>(
      `${this.baseUrl}/sessions`,
      { withCredentials: true }
    );
  }

  getSessionById(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.get<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}`,
      { withCredentials: true }
    );
  }

  updateSession(
    id: string,
    updateData: Partial<InterviewSession>
  ): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}`,
      updateData,
      { withCredentials: true }
    );
  }

  startSession(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/start`,
      {},
      { withCredentials: true }
    );
  }

  completeSession(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/complete`,
      {},
      { withCredentials: true }
    );
  }

  /* =======================
     QUESTION APIs
  ======================= */

  addQuestionAnswer(
    id: string,
    question: string,
    answer: string
  ): Observable<ApiResponse<InterviewSession>> {
    return this.http.post<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/qa`,
      { question, answer },
      { withCredentials: true }
    );
  }

  /* =======================
     VIDEO + AUDIO + AI EVAL
  ======================= */

  addVideoQuestionAnswer(
    id: string,
    question: string,
    videoBlob: Blob,
    audioBlob: Blob
  ): Observable<{
    success: boolean;
    nextState: string;
    transcript: string;
    evaluation: {
      technical_accuracy: number;
      depth: number;
      clarity: number;
      relevance: number;
      final_score: number;
      signal: string;
      feedback: string;
    };
    videoPath: string;
    language: string;
    data: InterviewSession;
  }> {
    const formData = new FormData();
    formData.append('video', videoBlob, `answer-${Date.now()}.webm`);
    formData.append('audio', audioBlob, `audio-${Date.now()}.wav`);
    formData.append('question', question);

    return this.http.post<{
      success: boolean;
      nextState: string;
      transcript: string;
      evaluation: {
        technical_accuracy: number;
        depth: number;
        clarity: number;
        relevance: number;
        final_score: number;
        signal: string;
        feedback: string;
      };
      videoPath: string;
      language: string;
      data: InterviewSession;
    }>(
      `${this.baseUrl}/session/${id}/qa-video`,
      formData,
      { withCredentials: true }
    );
  }

  /* =======================
     AI QUESTION GENERATION
  ======================= */

  getNextQuestion(
    id: string
  ): Observable<ApiResponse<{
    question: string;
    difficulty: string;
    category: string;
  }>> {
    return this.http.get<ApiResponse<{
      question: string;
      difficulty: string;
      category: string;
    }>>(
      `${this.baseUrl}/session/${id}/next-question`,
      { withCredentials: true }
    );
  }

  /* =======================
     ANALYSIS
  ======================= */

  analyzeInterview(
    id: string
  ): Observable<ApiResponse<{
    facialConfidence: number;
    voiceClarity: number;
    eyeContact: number;
    speechPace: number;
    overallConfidence: number;
    feedback: string;
    analyzedAt: Date;
  }>> {
    return this.http.post<ApiResponse<{
      facialConfidence: number;
      voiceClarity: number;
      eyeContact: number;
      speechPace: number;
      overallConfidence: number;
      feedback: string;
      analyzedAt: Date;
    }>>(
      `${this.baseUrl}/session/${id}/analyze`,
      {},
      { withCredentials: true }
    );
  }

  /* =======================
     DELETE
  ======================= */

  deleteSession(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/session/${id}`,
      { withCredentials: true }
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InterviewSession {
  _id?: string;
  userId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  resumeId?: string;
  jobDescription?: string;
  currentState: 'introduction' | 'resume-based' | 'follow-up' | 'deep-dive' | 'closing';
  questions: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  evaluation: {
    overallScore: number;
    confidenceLevel: number;
    dsaLevel: number;
    feedback: string;
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

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private baseUrl = 'http://localhost:5002/api/interview';

  constructor(private http: HttpClient) {}

  // Create a new interview session
  createSession(sessionData: { resumeId?: string; jobDescription?: string }): Observable<ApiResponse<InterviewSession>> {
    return this.http.post<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session`,
      sessionData,
      { withCredentials: true }
    );
  }

  // Get all interview sessions for logged-in user
  getSessions(): Observable<ApiResponse<InterviewSession[]>> {
    console.log('InterviewService: Fetching sessions from', `${this.baseUrl}/sessions`);
    return this.http.get<ApiResponse<InterviewSession[]>>(
      `${this.baseUrl}/sessions`,
      { withCredentials: true }
    );
  }

  // Get single interview session by ID
  getSessionById(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.get<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}`,
      { withCredentials: true }
    );
  }

  // Update interview session
  updateSession(id: string, updateData: Partial<InterviewSession>): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}`,
      updateData,
      { withCredentials: true }
    );
  }

  // Start interview session
  startSession(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/start`,
      {},
      { withCredentials: true }
    );
  }

  // Complete interview session
  completeSession(id: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.put<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/complete`,
      {},
      { withCredentials: true }
    );
  }

  // Add question and answer to session
  addQuestionAnswer(id: string, question: string, answer: string): Observable<ApiResponse<InterviewSession>> {
    return this.http.post<ApiResponse<InterviewSession>>(
      `${this.baseUrl}/session/${id}/qa`,
      { question, answer },
      { withCredentials: true }
    );
  }

  // Delete interview session
  deleteSession(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/session/${id}`,
      { withCredentials: true }
    );
  }
}

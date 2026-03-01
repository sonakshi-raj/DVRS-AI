import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Resume {
  _id: string;
  userId: string;
  displayName: string;
  category: 'technical' | 'management' | 'sales' | 'design' | 'other';
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  parsedData?: any;
  isParsed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  msg?: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private baseUrl = 'http://localhost:5002/api/resume';

  constructor(private http: HttpClient) {}

  // Get all resumes for logged-in user
  getResumes(): Observable<ApiResponse<Resume[]>> {
    return this.http.get<ApiResponse<Resume[]>>(
      `${this.baseUrl}/list`,
      { withCredentials: true }
    );
  }

  // Get single resume by ID
  getResumeById(id: string): Observable<ApiResponse<Resume>> {
    return this.http.get<ApiResponse<Resume>>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  // Upload resume
  uploadResume(file: File, displayName?: string, category?: string): Observable<ApiResponse<Resume>> {
    const formData = new FormData();
    formData.append('resume', file);
    if (displayName) {
      formData.append('displayName', displayName);
    }
    if (category) {
      formData.append('category', category);
    }

    return this.http.post<ApiResponse<Resume>>(
      `${this.baseUrl}/upload`,
      formData,
      { withCredentials: true }
    );
  }

  // Update resume (name, category)
  updateResume(id: string, updates: { displayName?: string; category?: string }): Observable<ApiResponse<Resume>> {
    return this.http.put<ApiResponse<Resume>>(
      `${this.baseUrl}/${id}`,
      updates,
      { withCredentials: true }
    );
  }

  // Delete resume
  deleteResume(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    );
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Get category display name
  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'technical': 'Technical',
      'management': 'Management',
      'sales': 'Sales',
      'design': 'Design',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  }
}

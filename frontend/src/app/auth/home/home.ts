// import { Component } from '@angular/core';
// import { AuthService } from '../../service/auth-service';
// import { Router, RouterModule } from '@angular/router';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './home.html',
//   styleUrl: './home.scss',
// })
// export class Home {
//   user: any = null;
//   constructor(private authService: AuthService, private router: Router) {
//   }
//   ngOnInit() {
//     this.authService.getUserProfile().subscribe({
//       next: (res) => {
//         if (res.status === 'Success') {
//           this.user = res.user; // ✅ FIX
//           console.log('User profile fetched', this.user);
//         }
//       },
//       error: (err) => {
//         console.error('Failed to get user profile', err);
//         this.router.navigate(['/auth/login']);
//       }
//     });
//   }
//   logout() {
//     this.authService.logout().subscribe({
//       next: (res) => {
//         console.log("Logout successful", res);
//         this.router.navigate(['/auth/login']);
//       },
//       error: (err) => {
//         console.error("Logout failed", err);
//       }
//     });
//   }
// }
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth-service';
import { InterviewService } from '../../service/interview.service';
import { ResumeService, Resume } from '../../service/resume.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  user: any = null;
  resumes: Resume[] = [];
  loadingResumes: boolean = true;
  
  // Resume selection: 'existing' or 'new'
  resumeMode: 'existing' | 'new' = 'existing';
  selectedResumeId: string = '';
  
  // For new resume upload
  selectedFile: File | null = null;
  newResumeName: string = '';
  newResumeCategory: string = 'technical';
  
  isUploading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private interviewService: InterviewService,
    private resumeService: ResumeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (res) => {
        if (res.status === 'Success') {
          this.user = res.user;
          this.loadResumes();
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  loadResumes() {
    this.loadingResumes = true;
    this.resumeService.getResumes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resumes = response.data;
          // Auto-select first resume if available
          if (this.resumes.length > 0) {
            this.selectedResumeId = this.resumes[0]._id;
            this.resumeMode = 'existing';
          } else {
            this.resumeMode = 'new';
          }
        }
        this.loadingResumes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load resumes', err);
        this.loadingResumes = false;
        this.resumeMode = 'new';
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ REQUIRED
  onFileSelected(event: any) {
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
        this.newResumeName = file.name.replace(/\.[^/.]+$/, "");
      }
      console.log('Selected file:', file.name);
    }
  }

  switchMode(mode: 'existing' | 'new') {
    this.resumeMode = mode;
    // Reset selections
    if (mode === 'existing' && this.resumes.length > 0) {
      this.selectedResumeId = this.resumes[0]._id;
    } else {
      this.selectedFile = null;
      this.newResumeName = '';
    }
    this.cdr.detectChanges();
  }

  startInterview() {
    if (this.resumeMode === 'existing') {
      this.startInterviewWithExistingResume();
    } else {
      this.startInterviewWithNewResume();
    }
  }

  startInterviewWithExistingResume() {
    if (!this.selectedResumeId) {
      alert('Please select a resume');
      return;
    }

    this.isUploading = true;

    // Create interview session with selected resume
    const sessionData = {
      resumeId: this.selectedResumeId
    };

    this.interviewService.createSession(sessionData).subscribe({
      next: (sessionResponse) => {
        this.isUploading = false;
        if (sessionResponse.success && sessionResponse.data) {
          console.log('Session created', sessionResponse.data);
          // Navigate to interview page with session ID
          this.router.navigate(['/interview'], {
            queryParams: { sessionId: sessionResponse.data._id }
          });
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Failed to create session', err);
        alert('Failed to create interview session. Please try again.');
      }
    });
  }

  startInterviewWithNewResume() {
    if (!this.selectedFile) {
      alert('Please upload a resume first');
      return;
    }

    this.isUploading = true;

    // Step 1: Upload resume
    this.resumeService.uploadResume(
      this.selectedFile, 
      this.newResumeName || this.selectedFile.name,
      this.newResumeCategory
    ).subscribe({
      next: (uploadResponse) => {
        console.log('Resume uploaded successfully', uploadResponse);
        
        if (uploadResponse.success && uploadResponse.data) {
          // Step 2: Create interview session with uploaded resume ID
          const sessionData = {
            resumeId: uploadResponse.data._id
          };

          this.interviewService.createSession(sessionData).subscribe({
            next: (sessionResponse) => {
              this.isUploading = false;
              if (sessionResponse.success && sessionResponse.data) {
                console.log('Session created', sessionResponse.data);
                // Navigate to interview page with session ID
                this.router.navigate(['/interview'], {
                  queryParams: { sessionId: sessionResponse.data._id }
                });
              }
            },
            error: (err) => {
              this.isUploading = false;
              console.error('Failed to create session', err);
              alert('Failed to create interview session. Please try again.');
            }
          });
        } else {
          this.isUploading = false;
          alert('Resume upload failed. Please try again.');
        }
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
        alert('Failed to upload resume. Please try again.');
      }
    });
  }


  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  formatFileSize(bytes: number): string {
    return this.resumeService.formatFileSize(bytes);
  }

  getCategoryDisplay(category: string): string {
    return this.resumeService.getCategoryDisplayName(category);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}


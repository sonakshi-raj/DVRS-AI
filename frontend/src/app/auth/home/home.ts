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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../service/auth-service';
import { InterviewService } from '../../service/interview.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  user: any = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private interviewService: InterviewService
  ) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (res) => {
        if (res.status === 'Success') {
          this.user = res.user;
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  // ✅ REQUIRED
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Selected file:', file.name);
    }
  }

  startInterview() {
    if (!this.selectedFile) {
      alert('Please upload a resume first');
      return;
    }

    this.isUploading = true;
    const formData = new FormData();
    formData.append('resume', this.selectedFile);

    // Step 1: Upload resume
    this.http.post<any>(
      'http://localhost:5002/api/resume/upload',
      formData,
      { withCredentials: true }
    ).subscribe({
      next: (uploadResponse) => {
        console.log('Resume uploaded successfully', uploadResponse);
        
        // Step 2: Create interview session with uploaded resume filename
        const sessionData = {
          resumeId: uploadResponse.file
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
}


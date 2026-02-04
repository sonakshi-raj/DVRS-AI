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
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../service/auth-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  user: any = null;
  selectedFile: File | null = null;   // ✅ REQUIRED

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
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

  // ✅ REQUIRED
startInterview() {
  if (!this.selectedFile) {
    alert('Please upload a resume first');
    return;
  }

  const formData = new FormData();
  formData.append('resume', this.selectedFile);

  this.http.post(
    'http://localhost:5002/api/resume/upload',
    formData,
    { withCredentials: true }
  ).subscribe({
    next: () => {
      this.router.navigate(['/interview']);
    },
    error: (err) => {
      console.error('Upload failed', err);
    }
  });
}


  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}


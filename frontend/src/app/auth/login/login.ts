import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';  
import { AuthService } from '../../service/auth-service';

@Component({
  selector: 'app-login',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private cdr : ChangeDetectorRef) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]]
    });
  }
  onSubmit() {
    console.log(this.loginForm.value);
    this.errorMessage = '';
    // Implement login logic here
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log("Login successful", res);
        if (res.status === 'Success') {
          this.router.navigate(['/home']);
        }

      },
      error: (err) => {
        console.error("Login failed", err);
  
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 400 || err.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (err.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }
}
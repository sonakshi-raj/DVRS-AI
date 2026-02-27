import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registerForm: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.registerForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      mobile: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }
  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.errorMessage = '';
    this.isSubmitting = true;
    
    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert('Registration successful! Please login with your credentials.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error("Registration failed", err);
        
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 400) {
          this.errorMessage = 'This email is already registered. Please use a different email or login.';
        } else if (err.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin() {
  this.router.navigate(['/login']);
  }

}

import { Component } from '@angular/core';
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

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      mobile: ["", [Validators.required, Validators.maxLength(10), Validators.minLength(10)]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }
  onSubmit() {
    console.log(this.registerForm.value);
    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        console.log("Registration successful", res);
      },
      error: (err) => {
        console.error("Registration failed", err);
      }
    });
  }
  goToLogin() {
  this.router.navigate(['/login']);
  }

}

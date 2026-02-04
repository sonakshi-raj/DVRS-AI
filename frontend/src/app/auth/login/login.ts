import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]]
    });
  }
  onSubmit() {
    console.log(this.loginForm.value);
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
      }
    });
  }
}
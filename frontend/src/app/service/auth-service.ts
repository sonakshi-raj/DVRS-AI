import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:5002/api';

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }
  login(credentials: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/login`,
      credentials,
      { withCredentials: true }
    );
  }
  getUserProfile():Observable<any> {
    return this.http.get(
      `${this.baseUrl}/user`,
      { withCredentials: true }
    );
  }
  logout(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/logout`,
      { withCredentials: true }
    );
  }
}

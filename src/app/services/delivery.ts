import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Helper to get headers with Token
  private getHeaders() {
    const token = localStorage.getItem('agent_token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // 1. Agent Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/delivery-app/login`, credentials);
  }

  // 2. Get Assigned Orders
  getMyTasks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-app/my-orders`, this.getHeaders());
  }

  // 3. Start Delivery (Triggers SMS/OTP)
  startDelivery(orderId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/delivery-app/start-delivery`,
      { orderId },
      this.getHeaders(),
    );
  }

  completeDelivery(orderId: number, paymentMode: string) {
    return this.http.post<any>(
      `${this.apiUrl}/delivery-app/complete-delivery`,
      { orderId, paymentMode },
      this.getHeaders(),
    );
  }

  // Logout
  logout() {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_data');
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-app/stats`, this.getHeaders());
  }

  cancelAssignment(orderId: number, reason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/delivery-app/cancel-assignment`,
      { orderId, reason },
      this.getHeaders(),
    );
  }

  sendOTP(orderId: number) {
    return this.http.post<any>(
      `${this.apiUrl}/delivery-app/send-otp`,
      { orderId },
      this.getHeaders(),
    );
  }

  verifyOTP(orderId: number, otp: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/delivery-app/verify-otp`,
      { orderId, otp },
      this.getHeaders(),
    );
  }


getHistory(page: number = 1): Observable<any> {
  // Pass the page number as a query parameter
  return this.http.get(`${this.apiUrl}/delivery-app/history?page=${page}`, this.getHeaders());
}

 getEarningsDetails(page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/delivery-app/earnings-summary?page=${page}`, this.getHeaders());
  }

// Add this method to your DeliveryService class
getPageContent(key: string): Observable<any> {
  // We hardcode 'AGENT_APP' as the target app for this portal
  return this.http.get(`${this.apiUrl}/admin/public/page?key=${key}&app=AGENT_APP`);
}

}

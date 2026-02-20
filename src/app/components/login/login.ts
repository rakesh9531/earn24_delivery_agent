import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginData = {
    phoneNumber: '',
    password: ''
  };
  isLoading = false;

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  onLogin() {
    if (!this.loginData.phoneNumber || !this.loginData.password) {
      Swal.fire('Error', 'Please enter both phone number and password', 'warning');
      return;
    }

    this.isLoading = true;
    this.deliveryService.login(this.loginData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status) {
          localStorage.setItem('agent_token', res.token);
          localStorage.setItem('agent_data', JSON.stringify(res.agent));
          
          Swal.fire({
            icon: 'success',
            title: 'Welcome!',
            text: `Logged in as ${res.agent.name}`,
            timer: 2000,
            showConfirmButton: false
          });

          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Login Failed', err.error?.message || 'Invalid credentials', 'error');
      }
    });
  }
}
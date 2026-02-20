import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  agentName = '';
  agentPhone = '';
  agentID = '';

  constructor(private deliveryService: DeliveryService, private router: Router) {}

  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem('agent_data') || '{}');
    this.agentName = data.name || 'Agent Name';
    this.agentPhone = data.phoneNumber || 'Not Available';
    this.agentID = data.id ? `AG-${data.id}` : 'N/A';
  }

  logout() {
    this.deliveryService.logout();
    this.router.navigate(['/login']);
  }
}
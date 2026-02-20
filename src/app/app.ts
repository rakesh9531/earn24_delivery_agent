import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { DeliveryService } from './services/delivery';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './components/dashboard/dashboard.css' 
})
export class AppComponent implements OnInit {
  isSidebarOpen = false;
  agentName = '';
  agentID = '';
  showSidebar = false;

  constructor(private deliveryService: DeliveryService, private router: Router) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      this.showSidebar = !event.url.includes('/login') && event.url !== '/';
      if (this.showSidebar) {
        const data = JSON.parse(localStorage.getItem('agent_data') || '{}');
        this.agentName = data.name || 'Agent';
        this.agentID = data.id ? `ID: AG-${data.id}` : '';
      }
    });
  }

  ngOnInit() {}
  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  logout() { this.deliveryService.logout(); this.isSidebarOpen = false; this.router.navigate(['/login']); }
}
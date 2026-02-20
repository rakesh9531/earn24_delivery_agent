import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../services/delivery';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './earnings.html',
  styleUrl: './earnings.css'
})
export class Earnings implements OnInit {
  summary: any = { lifetime: {}, thisMonth: {} };
  dailyStats: any[] = [];
  isLoading = true;

  currentPage = 1;
  totalPages = 1;

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.loadEarnings(1);
  }

  loadEarnings(page: number) {
    this.isLoading = true;
    this.deliveryService.getEarningsDetails(page).subscribe({
      next: (res) => {
        if (res.status) {
          this.summary = res.summary;
          this.dailyStats = res.dailyStats || [];
          this.currentPage = res.pagination.currentPage;
          this.totalPages = res.pagination.totalPages;
        }
        this.isLoading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => this.isLoading = false
    });
  }

  nextPage() { if (this.currentPage < this.totalPages) this.loadEarnings(this.currentPage + 1); }
  prevPage() { if (this.currentPage > 1) this.loadEarnings(this.currentPage - 1); }
}
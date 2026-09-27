import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../services/delivery';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History implements OnInit {
  // Data Properties
  history: any[] = [];
  isLoading = true;

  // Pagination Properties
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.loadHistory(1);
  }

  loadHistory(page: number) {
    this.isLoading = true;
    this.deliveryService.getHistory(page).subscribe({
      next: (res) => {
        if (res.status) {
          this.history = res.data || [];
          // Map backend pagination data
          this.currentPage = res.pagination.currentPage;
          this.totalPages = res.pagination.totalPages;
          this.totalItems = res.pagination.totalItems;
        }
        this.isLoading = false;
        // Scroll to top of container when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error("History Load Error:", err);
        this.isLoading = false;
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.loadHistory(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadHistory(this.currentPage - 1);
    }
  }

  // Journey Details Modal State
  selectedJourney: any = null;
  isJourneyLoading = false;

  openJourneyModal(item: any): void {
    this.selectedJourney = { order: item, milestones: [], isLoading: true };
    this.isJourneyLoading = true;
    this.deliveryService.getOrderJourneyDetails(item.id || item.order_number).subscribe({
      next: (res) => {
        this.isJourneyLoading = false;
        if (res.status) {
          this.selectedJourney = res;
        }
      },
      error: (err) => {
        console.error("Failed to load journey:", err);
        this.isJourneyLoading = false;
      }
    });
  }

  closeJourneyModal(): void {
    this.selectedJourney = null;
    this.isJourneyLoading = false;
  }
}
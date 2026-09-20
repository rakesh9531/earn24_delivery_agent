import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../services/delivery';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './earnings.html',
  styleUrl: './earnings.css'
})
export class Earnings implements OnInit {
  activeTab: 'PENDING' | 'DONE' = 'PENDING';
  isLoading = true;
  isSubmitting = false;

  summary: any = {
    cash_collection: 0,
    online_collection: 0,
    total_collection: 0,
    pending_count: 0,
    settled_count: 0
  };

  pendingOrders: any[] = [];
  settledOrders: any[] = [];

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.loadSettlements();
  }

  loadSettlements(): void {
    this.isLoading = true;
    this.deliveryService.getSettlementOverview().subscribe({
      next: (res) => {
        if (res.status) {
          this.summary = res.summary || this.summary;
          this.pendingOrders = res.pendingOrders || [];
          this.settledOrders = res.settledOrders || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load settlements:', err);
        this.isLoading = false;
      }
    });
  }

  setTab(tab: 'PENDING' | 'DONE'): void {
    this.activeTab = tab;
  }

  onRequestSettlement(order?: any): void {
    const isSingle = !!order;
    const amount = isSingle ? (order.delivery_amount_collected || order.total_amount) : this.summary.total_collection;
    const countText = isSingle ? `Order #${order.order_number}` : `all ${this.summary.pending_count} pending orders`;

    Swal.fire({
      title: 'Request Settlement?',
      html: `
        <div style="font-size: 14px; text-align: left; padding: 10px 0;">
          <p>You are requesting settlement for <strong>${countText}</strong>.</p>
          <p style="margin-top: 8px; font-size: 16px;"><strong>Amount: ₹${amount}</strong></p>
          <small style="color: #666;">Admin will verify the deposited amount and approve settlement.</small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0CA201',
      confirmButtonText: 'Submit Request',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSubmitting = true;
        const orderIds = isSingle ? [order.id] : undefined;

        this.deliveryService.requestSettlement(orderIds).subscribe({
          next: (res) => {
            this.isSubmitting = false;
            Swal.fire({
              icon: 'success',
              title: 'Request Sent!',
              text: res.message || 'Settlement request submitted successfully.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadSettlements();
          },
          error: (err) => {
            this.isSubmitting = false;
            Swal.fire('Error', err?.error?.message || 'Failed to submit request.', 'error');
          }
        });
      }
    });
  }
}
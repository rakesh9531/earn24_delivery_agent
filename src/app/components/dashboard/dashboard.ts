import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../services/delivery';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  // 1. Data Properties
  activeTab: 'deliveries' | 'pickups' = 'deliveries';
  tasks: any[] = [];
  pickupTasks: any[] = [];
  stats: any = { delivered_count: 0, cash_collected: 0, online_collected: 0 };
  isLoading = true;
  agentName = '';
  isSidebarOpen = false;
  private socketSubscriptions: Subscription[] = [];
  private autoRefreshTimer: any = null;

  constructor(
    private deliveryService: DeliveryService, 
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const agentData = JSON.parse(localStorage.getItem('agent_data') || '{}');
    this.agentName = agentData.name || 'Agent';
    this.loadAllData();
    this.setupSocketListeners();
    this.startAutoRefresh();
  }

  setPaymentMode(order: any, mode: 'COD' | 'ONLINE') {
    order.finalMode = mode;
  }

  getCheckoutUrl(order: any): string {
    return `https://newapi.earn24.in/api/delivery-app/orders/${order.id}/payu-checkout`;
  }

  getQrCodeUrl(order: any): string {
    const checkoutUrl = this.getCheckoutUrl(order);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkoutUrl)}`;
  }

  checkPaymentStatus(order: any) {
    order.checkingStatus = true;
    this.deliveryService.getOrderPaymentStatus(order.id).subscribe({
      next: (res) => {
        order.checkingStatus = false;
        if (res.status && res.isPaid) {
          order.is_paid = 1;
          order.payment_status = 'PAID';
          order.payment_method = res.paymentMethod || 'PAYU';
          order.finalMode = 'ONLINE';
          Swal.fire({
            icon: 'success',
            title: 'Payment Verified! ✅',
            text: `₹${res.amount} received via PayU Gateway. You can now complete the delivery.`,
            confirmButtonColor: '#16a34a'
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Payment Pending',
            text: 'Customer has not completed the PayU payment yet. Please ask them to complete it or pay via Cash.',
            confirmButtonColor: '#2563eb'
          });
        }
      },
      error: (err) => {
        order.checkingStatus = false;
        console.error('Error checking payment status:', err);
        Swal.fire({
          icon: 'error',
          title: 'Status Check Failed',
          text: 'Unable to check status. Please check your network.'
        });
      }
    });
  }

  shareWhatsAppLink(order: any) {
    const url = this.getCheckoutUrl(order);
    const amount = Number(order.collectable_amount || order.total_amount || 0).toFixed(2);
    const orderNo = order.order_number || order.id;
    const phone = (order.customer_phone || order.phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello! Here is your Earn24 payment link of ₹${amount} for Order #${orderNo}: ${url}\n\nYou can pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, NetBanking or Cards.`
    );
    const waUrl = phone && phone.length >= 10 
      ? `https://wa.me/91${phone.slice(-10)}?text=${text}` 
      : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  }

  setupSocketListeners() {
    // 1. Order Assigned Socket Event
    const orderAssignedSub = this.socketService.onEvent('order_assigned').subscribe({
      next: (data) => {
        console.log('Realtime socket event: order_assigned received', data);
        Swal.fire({
          icon: 'info',
          title: 'New Order Assigned!',
          text: data.message || 'You have been assigned a new delivery task.',
          timer: 3500,
          showConfirmButton: true
        });
        this.loadAllData();
      }
    });

    // 2. Order Cancelled Socket Event
    const orderCancelledSub = this.socketService.onEvent('order_cancelled').subscribe({
      next: (data) => {
        console.log('Realtime socket event: order_cancelled received', data);
        Swal.fire({
          icon: 'warning',
          title: 'Order Cancelled by Admin ⚠️',
          text: data.message || `Order #${data.orderNumber} has been cancelled by Admin.`,
          showConfirmButton: true
        });
        this.loadAllData();
      }
    });

    // 3. Pickup Assigned Socket Event
    const pickupAssignedSub = this.socketService.onEvent('pickup_assigned').subscribe({
      next: (data) => {
        console.log('Realtime socket event: pickup_assigned received', data);
        Swal.fire({
          icon: 'info',
          title: 'New Pickup Assigned! 📦',
          text: data.message || 'You have been assigned a new reverse pickup task.',
          timer: 3500,
          showConfirmButton: true
        });
        this.loadAllData();
      }
    });

    // 4. PayU Doorstep Payment Received Socket Event
    const paymentReceivedSub = this.socketService.onEvent('order_payment_received').subscribe({
      next: (data) => {
        console.log('Realtime socket event: order_payment_received', data);
        if (data && data.orderId) {
          const target = this.tasks.find(o => o.id === data.orderId);
          if (target) {
            target.is_paid = 1;
            target.payment_status = 'PAID';
            target.payment_method = 'PAYU';
            target.finalMode = 'ONLINE';
          }
          Swal.fire({
            icon: 'success',
            title: 'Payment Received! 🎉',
            text: `₹${data.amount || ''} paid successfully via PayU for Order #${data.orderId}.`,
            timer: 4500,
            showConfirmButton: true
          });
          this.loadStats();
        }
      }
    });

    this.socketSubscriptions.push(orderAssignedSub, orderCancelledSub, pickupAssignedSub, paymentReceivedSub);
  }

  startAutoRefresh() {
    // Periodically poll active tasks and pickups every 10 seconds to auto-update
    this.autoRefreshTimer = setInterval(() => {
      this.loadTasksSilent();
      this.loadStats();
      this.loadPickupTasks();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  // 2. Fetching Logic
  loadAllData() {
    this.isLoading = true;
    this.loadStats();
    this.loadTasks();
    this.loadPickupTasks();
  }

  loadPickupTasks() {
    this.deliveryService.getPickupTasks().subscribe({
      next: (res) => {
        this.pickupTasks = (res.data || []).map((req: any) => ({
          ...req,
          inputOtp: ''
        }));
      },
      error: (err) => console.error('Pickup tasks error:', err)
    });
  }

  completePickup(task: any) {
    if (!task.inputOtp) {
      Swal.fire('Required', 'Please enter customer Pickup OTP.', 'warning');
      return;
    }
    this.deliveryService.completeReversePickup(task.request_id, task.inputOtp).subscribe({
      next: (res) => {
        Swal.fire('Pickup Completed!', res.message || 'Defective item collected.', 'success');
        this.loadAllData();
      },
      error: (err) => Swal.fire('Error', err.error?.message || 'Pickup OTP verification failed.', 'error')
    });
  }

  loadStats() {
    this.deliveryService.getStats().subscribe({
      next: (res) => (this.stats = res.data || this.stats),
      error: (err) => console.error('Stats Error:', err)
    });
  }

  loadTasks() {
    this.deliveryService.getMyTasks().subscribe({
      next: (res) => {
        // Map the API data to include local UI state flags
        this.tasks = (res.data || []).map((order: any) => {
          const isPaid = (order.is_paid === 1 || order.payment_status === 'PAID' || order.payment_status === 'COMPLETED');
          return {
            ...order,
            is_paid: isPaid ? 1 : 0,
            inputOtp: '',
            finalMode: isPaid ? 'ONLINE' : (order.payment_method === 'COD' ? 'COD' : 'ONLINE'), 
            isOtpRequested: false, 
            isOtpVerified: false   
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Tasks Error:', err);
      }
    });
  }

  loadTasksSilent() {
    this.deliveryService.getMyTasks().subscribe({
      next: (res) => {
        const fetchedOrders = res.data || [];
        // Preserve local state (inputOtp, isOtpRequested, isOtpVerified) if order still exists
        this.tasks = fetchedOrders.map((newOrder: any) => {
          const existing = this.tasks.find(t => t.id === newOrder.id);
          const isPaid = (newOrder.is_paid === 1 || newOrder.payment_status === 'PAID' || newOrder.payment_status === 'COMPLETED' || (existing && existing.is_paid === 1));
          return {
            ...newOrder,
            is_paid: isPaid ? 1 : 0,
            payment_status: isPaid ? 'PAID' : newOrder.payment_status,
            inputOtp: existing ? existing.inputOtp : '',
            finalMode: existing ? existing.finalMode : (isPaid ? 'ONLINE' : 'COD'),
            isOtpRequested: existing ? existing.isOtpRequested : false,
            isOtpVerified: existing ? existing.isOtpVerified : false
          };
        });
      },
      error: (err) => console.error('Silent refresh tasks error:', err)
    });
  }

  // 3. UI Interactions
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  handleCancellationError(err: any) {
    const errorMsg = err.error?.message || 'Action failed.';
    Swal.fire('Order Cancelled / Error', errorMsg, 'error');
    this.loadAllData();
  }

  // PHASE 1: Notified Trip Start
  startOrder(order: any) {
    this.deliveryService.startDelivery(order.id).subscribe({
      next: () => {
        order.order_status = 'OUT_FOR_DELIVERY';
        Swal.fire({ icon: 'success', title: 'Trip Started', text: 'On my way!', timer: 1500, showConfirmButton: false });
      },
      error: (err) => this.handleCancellationError(err)
    });
  }

  // PHASE 2: Reached and sending OTP
  sendOTP(order: any) {
    this.deliveryService.sendOTP(order.id).subscribe({
      next: (res) => {
        order.isOtpRequested = true;
        Swal.fire('OTP Sent', 'The 6-digit code was sent to the customer.', 'info');
      },
      error: (err) => this.handleCancellationError(err)
    });
  }

  // PHASE 3: OTP Verification
  onVerifyOtp(order: any) {
    if (!order.inputOtp || order.inputOtp.length !== 6) {
      Swal.fire('Required', 'Please enter a valid 6-digit OTP.', 'warning');
      return;
    }

    this.deliveryService.verifyOTP(order.id, order.inputOtp).subscribe({
      next: (res) => {
        order.isOtpVerified = true;
        Swal.fire({ icon: 'success', title: 'Verified', text: 'OTP correct. Proceed to payment.', timer: 1500, showConfirmButton: false });
      },
      error: (err) => this.handleCancellationError(err)
    });
  }

  // PHASE 4: Payment and Final Completion
  onComplete(order: any) {
    const finalMode = (order.is_paid === 1 || order.payment_status === 'PAID') 
      ? (order.payment_method || 'PAYU') 
      : (order.finalMode || 'COD');
    this.deliveryService.completeDelivery(order.id, finalMode).subscribe({
      next: () => {
        Swal.fire('Delivered!', 'Order closed successfully.', 'success');
        this.loadAllData(); // Refresh list and stats
      },
      error: (err) => this.handleCancellationError(err)
    });
  }

  // Cancel / Reject Assignment
  cancelOrder(order: any) {
    Swal.fire({
      title: 'Reject Assignment?',
      text: "Order will return to Admin pool.",
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'Reason for cancellation',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, Return'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deliveryService.cancelAssignment(order.id, result.value).subscribe({
          next: (res) => {
            Swal.fire('Returned', res.message, 'success');
            this.loadAllData();
          },
          error: (err) => Swal.fire('Error', err.error?.message, 'error')
        });
      }
    });
  }

  logout() {
    this.deliveryService.logout();
    this.router.navigate(['/login']);
  }
}
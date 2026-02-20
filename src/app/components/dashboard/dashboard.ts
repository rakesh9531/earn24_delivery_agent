// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { DeliveryService } from '../../services/delivery';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './dashboard.html',
//   styleUrl: './dashboard.css',
// })
// export class Dashboard implements OnInit {
//   // 1. Data Properties
//   tasks: any[] = [];
//   stats: any = { delivered_count: 0, cash_collected: 0, online_collected: 0 };
//   isLoading = true;
//   agentName = '';
//   isSidebarOpen = false;

//   constructor(private deliveryService: DeliveryService, private router: Router) {}

//   ngOnInit(): void {
//     const agentData = JSON.parse(localStorage.getItem('agent_data') || '{}');
//     this.agentName = agentData.name || 'Agent';
//     this.loadAllData();
//   }

//   // 2. Fetching Logic
//   loadAllData() {
//     this.isLoading = true;
//     this.loadStats();
//     this.loadTasks();
//   }

//   loadStats() {
//     this.deliveryService.getStats().subscribe({
//       next: (res) => (this.stats = res.data || this.stats),
//       error: (err) => console.error('Stats Error:', err)
//     });
//   }

//   loadTasks() {
//     this.deliveryService.getMyTasks().subscribe({
//       next: (res) => {
//         // Map the API data to include local UI state flags
//         this.tasks = (res.data || []).map((order: any) => ({
//           ...order,
//           inputOtp: '',
//           finalMode: 'COD', // Default payment selection
//           isOtpRequested: false, // Controls Phase 2 vs Phase 3
//           isOtpVerified: false   // Controls Phase 3 vs Phase 4
//         }));
//         this.isLoading = false;
//       },
//       error: (err) => {
//         this.isLoading = false;
//         console.error('Tasks Error:', err);
//       }
//     });
//   }

//   // 3. UI Interactions
//   toggleSidebar() {
//     this.isSidebarOpen = !this.isSidebarOpen;
//   }

//   // PHASE 1: Notified Trip Start
//   startOrder(order: any) {
//     this.deliveryService.startDelivery(order.id).subscribe({
//       next: () => {
//         order.order_status = 'OUT_FOR_DELIVERY';
//         Swal.fire({ icon: 'success', title: 'Trip Started', text: 'Customer has been notified.', timer: 1500, showConfirmButton: false });
//       },
//       error: (err) => Swal.fire('Error', err.error?.message || 'Failed to start.', 'error')
//     });
//   }

//   // PHASE 2: Reached and sending OTP
//   onRequestOtp(order: any) {
//     this.deliveryService.sendOTP(order.id).subscribe({
//       next: (res) => {
//         order.isOtpRequested = true;
//         Swal.fire('OTP Sent', 'The 6-digit code was sent to the customer.', 'info');
//       },
//       error: (err) => Swal.fire('Error', 'Could not send OTP.', 'error')
//     });
//   }

//   // PHASE 3: OTP Verification
//   onVerifyOtp(order: any) {
//     if (!order.inputOtp || order.inputOtp.length !== 6) {
//       Swal.fire('Required', 'Please enter a valid 6-digit OTP.', 'warning');
//       return;
//     }

//     this.deliveryService.verifyOTP(order.id, order.inputOtp).subscribe({
//       next: (res) => {
//         order.isOtpVerified = true;
//         Swal.fire({ icon: 'success', title: 'Verified', text: 'OTP correct. Proceed to payment.', timer: 1500, showConfirmButton: false });
//       },
//       error: (err) => Swal.fire('Error', err.error?.message || 'Invalid OTP code.', 'error')
//     });
//   }

//   // PHASE 4: Payment and Final Completion
//   onComplete(order: any) {
//     this.deliveryService.completeDelivery(order.id, order.finalMode).subscribe({
//       next: () => {
//         Swal.fire('Delivered!', 'Order closed and cash hand updated.', 'success');
//         this.loadAllData(); // Refresh list and stats
//       },
//       error: (err) => Swal.fire('Error', 'Handshake failed during completion.', 'error')
//     });
//   }

//   // Cancel / Reject Assignment
//   cancelOrder(order: any) {
//     Swal.fire({
//       title: 'Reject Assignment?',
//       text: "This will return the order to the Admin pool.",
//       icon: 'warning',
//       input: 'text',
//       inputPlaceholder: 'Reason (e.g., Bike issues)',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       confirmButtonText: 'Yes, Return'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.deliveryService.cancelAssignment(order.id, result.value).subscribe({
//           next: (res) => {
//             Swal.fire('Order Returned', res.message, 'success');
//             this.loadAllData();
//           },
//           error: (err) => Swal.fire('Error', err.error?.message, 'error')
//         });
//       }
//     });
//   }

//   logout() {
//     this.deliveryService.logout();
//     this.router.navigate(['/login']);
//   }
// }










import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../services/delivery';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // 1. Data Properties
  tasks: any[] = [];
  stats: any = { delivered_count: 0, cash_collected: 0, online_collected: 0 };
  isLoading = true;
  agentName = '';
  isSidebarOpen = false;

  constructor(private deliveryService: DeliveryService, private router: Router) {}

  ngOnInit(): void {
    const agentData = JSON.parse(localStorage.getItem('agent_data') || '{}');
    this.agentName = agentData.name || 'Agent';
    this.loadAllData();
  }

  // 2. Fetching Logic
  loadAllData() {
    this.isLoading = true;
    this.loadStats();
    this.loadTasks();
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
        this.tasks = (res.data || []).map((order: any) => ({
          ...order,
          inputOtp: '',
          finalMode: 'COD', 
          isOtpRequested: false, 
          isOtpVerified: false   
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Tasks Error:', err);
      }
    });
  }

  // 3. UI Interactions
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // PHASE 1: Notified Trip Start
  startOrder(order: any) {
    this.deliveryService.startDelivery(order.id).subscribe({
      next: () => {
        order.order_status = 'OUT_FOR_DELIVERY';
        Swal.fire({ icon: 'success', title: 'Trip Started', text: 'On my way!', timer: 1500, showConfirmButton: false });
      },
      error: (err) => Swal.fire('Error', err.error?.message || 'Failed to start.', 'error')
    });
  }

  // PHASE 2: Reached and sending OTP (RENAMED FROM onRequestOtp)
  sendOTP(order: any) {
    this.deliveryService.sendOTP(order.id).subscribe({
      next: (res) => {
        order.isOtpRequested = true;
        Swal.fire('OTP Sent', 'The 6-digit code was sent to the customer.', 'info');
      },
      error: (err) => Swal.fire('Error', 'Could not send OTP.', 'error')
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
      error: (err) => Swal.fire('Error', err.error?.message || 'Invalid OTP code.', 'error')
    });
  }

  // PHASE 4: Payment and Final Completion
  onComplete(order: any) {
    this.deliveryService.completeDelivery(order.id, order.finalMode).subscribe({
      next: () => {
        Swal.fire('Delivered!', 'Order closed successfully.', 'success');
        this.loadAllData(); // Refresh list and stats
      },
      error: (err) => Swal.fire('Error', 'Handshake failed.', 'error')
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
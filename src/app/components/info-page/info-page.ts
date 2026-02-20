import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../services/delivery';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-page.html',
  styleUrl: './info-page.css'
})
export class InfoPage implements OnInit {
  pageData: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    // We subscribe to paramMap so if the user clicks a different link 
    // in the sidebar, the content updates immediately.
    this.route.paramMap.subscribe(params => {
      const key = params.get('key');
      if (key) {
        this.fetchContent(key);
      }
    });
  }

  fetchContent(key: string) {
    this.isLoading = true;
    this.deliveryService.getPageContent(key).subscribe({
      next: (res) => {
        this.pageData = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.pageData = { title: 'Not Found', content: '<p>The requested page could not be found.</p>' };
        this.isLoading = false;
      }
    });
  }
}
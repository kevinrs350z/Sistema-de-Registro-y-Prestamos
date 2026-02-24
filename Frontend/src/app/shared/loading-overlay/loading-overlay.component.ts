import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="loading$ | async">
      <div class="loader-wrap">
        <svg class="dot-arc" width="180" height="48" viewBox="0 0 180 48" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6"   cy="4"   r="3" style="animation-delay:0s"/>
          <circle cx="14"  cy="9"   r="3" style="animation-delay:-0.1s"/>
          <circle cx="22"  cy="15"  r="3" style="animation-delay:-0.2s"/>
          <circle cx="30"  cy="20"  r="3" style="animation-delay:-0.3s"/>
          <circle cx="38"  cy="25"  r="3" style="animation-delay:-0.4s"/>
          <circle cx="46"  cy="29"  r="3" style="animation-delay:-0.5s"/>
          <circle cx="54"  cy="33"  r="3" style="animation-delay:-0.6s"/>
          <circle cx="62"  cy="36"  r="3" style="animation-delay:-0.7s"/>
          <circle cx="70"  cy="38"  r="3" style="animation-delay:-0.8s"/>
          <circle cx="78"  cy="40"  r="3" style="animation-delay:-0.9s"/>
          <circle cx="86"  cy="40"  r="3" style="animation-delay:-1.0s"/>
          <circle cx="94"  cy="40"  r="3" style="animation-delay:-1.1s"/>
          <circle cx="102" cy="40"  r="3" style="animation-delay:-1.2s"/>
          <circle cx="110" cy="38"  r="3" style="animation-delay:-1.3s"/>
          <circle cx="118" cy="36"  r="3" style="animation-delay:-1.4s"/>
          <circle cx="126" cy="33"  r="3" style="animation-delay:-1.5s"/>
          <circle cx="134" cy="29"  r="3" style="animation-delay:-1.6s"/>
          <circle cx="142" cy="25"  r="3" style="animation-delay:-1.7s"/>
          <circle cx="150" cy="20"  r="3" style="animation-delay:-1.8s"/>
          <circle cx="158" cy="15"  r="3" style="animation-delay:-1.9s"/>
          <circle cx="166" cy="9"   r="3" style="animation-delay:-2.0s"/>
          <circle cx="174" cy="4"   r="3" style="animation-delay:-2.1s"/>
        </svg>
        <span class="loader-text">loading</span>
      </div>
    </div>
  `,
  styleUrls: ['./loading-overlay.component.css']
})
export class LoadingOverlayComponent {

  loading$!: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}

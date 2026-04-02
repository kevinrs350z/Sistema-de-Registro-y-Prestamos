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
      <div class="logo-wrap">
        <svg class="logo-svg" viewBox="0 0 170 100" xmlns="http://www.w3.org/2000/svg">
          <path class="dm-stroke"
                d="M 30,74
                   C 14,66 8,42 20,28
                   C 32,14 52,22 54,42
                   C 55,50 52,64 44,74
                   L 54,42
                   L 54,12
                   C 54,8 56,8 56,12
                   L 56,78
                   C 62,50 74,36 88,36
                   C 102,36 104,54 102,78
                   C 106,50 116,36 130,36
                   C 144,36 146,54 142,78"
                pathLength="1" />
        </svg>
        <span class="logo-text">Diseño Multimedia</span>
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

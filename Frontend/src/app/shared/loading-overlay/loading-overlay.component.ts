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
      <div class="loop-box">
        <svg class="loader-svg" viewBox="0 0 240 120" aria-hidden="true">
          <defs>
            <path id="inf" d="M 40 60 C 40 20, 80 20, 120 60 C 160 100, 200 100, 200 60 C 200 20, 160 20, 120 60 C 80 100, 40 100, 40 60 Z" />
          </defs>
          <circle r="4"><animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.12s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.24s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.36s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.48s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.60s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.72s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.84s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="0.96s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.08s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.20s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.32s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.44s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.56s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.68s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.80s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="1.92s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="2.04s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="2.16s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
          <circle r="4"><animateMotion dur="2.4s" begin="2.28s" repeatCount="indefinite"><mpath href="#inf"/></animateMotion></circle>
        </svg>
        <p>loading</p>
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

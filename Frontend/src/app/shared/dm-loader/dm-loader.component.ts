import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dm-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dm-loader.component.html',
  styleUrls: ['./dm-loader.component.css']
})
export class DmLoaderComponent {
  /** sm = inline compacto · md = tarjeta · lg = sección completa */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}

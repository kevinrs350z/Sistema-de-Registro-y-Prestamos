import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  type: AlertType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notification = signal<Notification | null>(null);

  notification = this._notification.asReadonly();

  show(type: AlertType, message: string) {
    this._notification.set({ type, message });

    // Auto cerrar
    setTimeout(() => this.clear(), 5000);
  }

  clear() {
    this._notification.set(null);
  }

  success(msg: string) { this.show('success', msg); }
  error(msg: string)   { this.show('error', msg); }
  warning(msg: string) { this.show('warning', msg); }
  info(msg: string)    { this.show('info', msg); }
}

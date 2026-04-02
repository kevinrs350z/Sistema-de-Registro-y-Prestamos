import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService, AdminUser } from '../../../services/admin-users.service';

@Component({
  selector: 'app-user-search-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search-autocomplete.component.html',
  styleUrls: ['./user-search-autocomplete.component.css']
})
export class UserSearchAutocompleteComponent {
  query = '';
  loading = false;
  error: string | null = null;
  results: AdminUser[] = [];

  @Output() selected = new EventEmitter<AdminUser>();

  constructor(private adminUsers: AdminUsersService) {}

  search() {
    this.error = null;
    if (!this.query || this.query.trim().length < 2) {
      this.results = [];
      return;
    }
    this.loading = true;
    this.adminUsers.search(this.query.trim(), 8).subscribe({
      next: (resp) => {
        this.results = resp || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al buscar usuarios';
        this.loading = false;
      }
    });
  }

  choose(user: AdminUser) {
    this.selected.emit(user);
    this.results = [];
    this.query = '';
  }
}

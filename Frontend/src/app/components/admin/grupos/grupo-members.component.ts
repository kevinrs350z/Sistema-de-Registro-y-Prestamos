import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrupoIntegrante } from '../../../models/grupo.model';
import { UserSearchAutocompleteComponent } from './user-search-autocomplete.component';

@Component({
  selector: 'app-grupo-members',
  standalone: true,
  imports: [CommonModule, UserSearchAutocompleteComponent],
  templateUrl: './grupo-members.component.html',
  styleUrls: ['./grupo-members.component.css']
})
export class GrupoMembersComponent {
  @Input() integrantes: GrupoIntegrante[] = [];
  @Input() estado: 'ACTIVO' | 'CERRADO' | undefined;
  @Input() loading = false;

  @Output() addMember = new EventEmitter<any>();
  @Output() removeMember = new EventEmitter<GrupoIntegrante>();

  confirmRemove(user: GrupoIntegrante) {
    const ok = confirm(`Quitar a ${user.nombre}?`);
    if (ok) this.removeMember.emit(user);
  }

  onSelectUser(user: any) {
    this.addMember.emit(user);
  }
}

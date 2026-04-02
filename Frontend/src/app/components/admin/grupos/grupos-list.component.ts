import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Grupo } from '../../../models/grupo.model';

@Component({
  selector: 'app-grupos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupos-list.component.html',
  styleUrls: ['./grupos-list.component.css']
})
export class GruposListComponent {
  @Input() grupos: Grupo[] = [];
  @Input() selectedId: number | null = null;
  @Input() loading = false;

  @Output() select = new EventEmitter<Grupo>();
  @Output() filtersChange = new EventEmitter<{ q?: string; anio?: string; semestre?: string; asignatura?: string; estado?: string }>();
  @Output() create = new EventEmitter<void>();

  search = '';
  filtroAnio = '';
  filtroSemestre = '';
  filtroAsignatura = '';
  filtroEstado = '';

  onSelect(grupo: Grupo) {
    this.select.emit(grupo);
  }

  onFilterChange() {
    this.filtersChange.emit({
      q: this.search,
      anio: this.filtroAnio,
      semestre: this.filtroSemestre,
      asignatura: this.filtroAsignatura,
      estado: this.filtroEstado
    });
  }

  nuevoGrupo() {
    this.create.emit();
  }
}

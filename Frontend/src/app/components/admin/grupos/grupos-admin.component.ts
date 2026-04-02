import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Grupo, GrupoIntegrante } from '../../../models/grupo.model';
import { AdminGrupoService, GrupoFilters } from '../../../services/admin-grupo.service';
import { NotificationService } from '../../../services/notification.service';
import { GruposListComponent } from './grupos-list.component';
import { GrupoDetailComponent } from './grupo-detail.component';

@Component({
  selector: 'app-grupos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, GruposListComponent, GrupoDetailComponent],
  templateUrl: './grupos-admin.component.html',
  styleUrls: ['./grupos-admin.component.css']
})
export class GruposAdminComponent implements OnInit {
  grupos: Grupo[] = [];
  selected: Grupo | null = null;
  loadingList = false;
  loadingDetail = false;
  saving = false;
  filters: GrupoFilters = { per_page: 20 };

  constructor(
    private gruposService: AdminGrupoService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadGrupos();
  }

  loadGrupos() {
    this.loadingList = true;
    this.gruposService.getGrupos(this.filters).subscribe({
      next: (resp) => {
        this.grupos = resp?.data || [];
        this.loadingList = false;
      },
      error: () => {
        this.notify.error('No se pudieron cargar los grupos');
        this.loadingList = false;
      }
    });
  }

  onFiltersChange(filters: any) {
    this.filters = { ...this.filters, ...filters };
    this.loadGrupos();
  }

  onSelect(grupo: Grupo) {
    if (!grupo.id) return;
    this.loadingDetail = true;
    this.gruposService.getGrupo(grupo.id).subscribe({
      next: (g) => {
        this.selected = g;
        this.loadingDetail = false;
      },
      error: () => {
        this.notify.error('No se pudo cargar el grupo');
        this.loadingDetail = false;
      }
    });
  }

  onCreate() {
    this.selected = {
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO',
      integrantes: [],
      integrantes_count: 0,
      anio: new Date().getFullYear()
    } as Grupo;
  }

  onSave(grupo: Grupo) {
    if (!grupo.nombre || !grupo.asignatura_id || !grupo.bloque_id) {
      this.notify.info('Completa nombre, asignatura y bloque.');
      return;
    }
    this.saving = true;
    const req = grupo.id
      ? this.gruposService.updateGrupo(grupo.id, grupo)
      : this.gruposService.createGrupo(grupo);

    req.subscribe({
      next: (g) => {
        this.notify.success('Grupo guardado');
        this.selected = g;
        this.loadGrupos();
        this.saving = false;
      },
      error: () => {
        this.notify.error('No se pudo guardar el grupo');
        this.saving = false;
      }
    });
  }

  onChangeEstado(estado: 'ACTIVO' | 'CERRADO') {
    if (!this.selected?.id) return;
    this.gruposService.actualizarEstado(this.selected.id, estado).subscribe({
      next: () => {
        this.notify.success('Estado actualizado');
        if (this.selected) this.selected.estado = estado;
        this.loadGrupos();
      },
      error: () => this.notify.error('No se pudo actualizar el estado')
    });
  }

  onAddMember(user: any) {
    if (!this.selected?.id) return;
    const existing = this.selected.integrantes?.some(i => i.id === user.id);
    if (existing) {
      this.notify.info('Ese estudiante ya está en el grupo');
      return;
    }
    this.gruposService.addIntegrantes(this.selected.id, [user.id]).subscribe({
      next: () => {
        this.notify.success('Integrante agregado');
        const nuevo: GrupoIntegrante = {
          id: user.id,
          nombre: user.nombre || user.name,
          rut: user.rut || user.Rut,
          email: user.email || user.Email,
          agregado_en: new Date().toISOString()
        };
        this.selected!.integrantes = [...(this.selected?.integrantes || []), nuevo];
        if (this.selected) this.selected.integrantes_count = (this.selected.integrantes?.length || 0);
        this.loadGrupos();
      },
      error: () => this.notify.error('No se pudo agregar integrante')
    });
  }

  onRemoveMember(user: GrupoIntegrante) {
    if (!this.selected?.id) return;
    this.gruposService.removeIntegrante(this.selected.id, user.id).subscribe({
      next: () => {
        this.notify.success('Integrante removido');
        this.selected!.integrantes = (this.selected?.integrantes || []).filter(i => i.id !== user.id);
        if (this.selected) this.selected.integrantes_count = (this.selected.integrantes?.length || 0);
        this.loadGrupos();
      },
      error: () => this.notify.error('No se pudo quitar integrante')
    });
  }
}

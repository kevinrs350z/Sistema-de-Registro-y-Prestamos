import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Grupo, GrupoIntegrante } from '../../../models/grupo.model';
import { GrupoMembersComponent } from './grupo-members.component';
import { AsignaturasService } from '../../../services/asignaturas.service';
import { AuthService } from '../../../services/auth.service';

interface Asignatura {
  idAsignatura: number;
  nombre: string;
}

interface Bloque {
  idBloque: number;
  nombre: string;
  hora_inicio?: string;
  hora_fin?: string;
}

@Component({
  selector: 'app-grupo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, GrupoMembersComponent],
  templateUrl: './grupo-detail.component.html',
  styleUrls: ['./grupo-detail.component.css']
})
export class GrupoDetailComponent implements OnInit {
  @Input() grupo: Grupo | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<Grupo>();
  @Output() changeEstado = new EventEmitter<'ACTIVO' | 'CERRADO'>();
  @Output() addMember = new EventEmitter<any>();
  @Output() removeMember = new EventEmitter<GrupoIntegrante>();

  tab: 'resumen' | 'integrantes' | 'reglas' | 'historial' = 'resumen';
  
  asignaturas: Asignatura[] = [];
  bloques: Bloque[] = [];
  loadingCatalogs = false;

  constructor(
    private asignaturasService: AsignaturasService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCatalogs();
  }

  loadCatalogs() {
    this.loadingCatalogs = true;
    const token = localStorage.getItem('token') || '';
    
    this.asignaturasService.getAsignaturas().subscribe({
      next: (data) => this.asignaturas = data || [],
      error: () => this.asignaturas = []
    });

    this.authService.getBloques(token).subscribe({
      next: (data) => {
        this.bloques = data || [];
        this.loadingCatalogs = false;
      },
      error: () => {
        this.bloques = [];
        this.loadingCatalogs = false;
      }
    });
  }

  onSave() {
    if (this.grupo) this.save.emit(this.grupo);
  }

  toggleEstado() {
    if (!this.grupo) return;
    const nuevo = this.grupo.estado === 'ACTIVO' ? 'CERRADO' : 'ACTIVO';
    this.changeEstado.emit(nuevo);
  }

  selectTab(t: 'resumen' | 'integrantes' | 'reglas' | 'historial') {
    this.tab = t;
  }

  onAsignaturaChange(id: number) {
    if (!this.grupo) return;
    this.grupo.asignatura_id = id;
    const found = this.asignaturas.find(a => a.idAsignatura === id);
    this.grupo.asignatura_nombre = found?.nombre || '';
  }

  onBloqueChange(id: number) {
    if (!this.grupo) return;
    this.grupo.bloque_id = id;
    const found = this.bloques.find(b => b.idBloque === id);
    this.grupo.bloque_label = found ? `${found.nombre} (${found.hora_inicio || ''}-${found.hora_fin || ''})` : '';
  }
}

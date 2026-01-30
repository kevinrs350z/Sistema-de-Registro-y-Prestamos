import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoService } from '../../../services/grupo.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { Grupo } from '../../../models/grupo.model';

@Component({
  selector: 'app-gestionar-integrantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-integrantes.component.html',
  styleUrls: ['./gestionar-integrantes.component.css']
})
export class GestionarIntegrantesComponent {
  grupos: Grupo[] = [];
  grupoSeleccionado: Grupo | null = null;
  integrantes: any[] = [];
  nombreGrupo = '';
  usuariosDisponibles: any[] = [];

  constructor(private grupoService: GrupoService, private usuariosService: UsuariosService) {
    this.cargarGrupos();
    this.cargarUsuarios();
  }

  cargarGrupos() {
    this.grupoService.getGrupos().subscribe((grupos: Grupo[]) => {
      this.grupos = grupos;
    });
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuariosPorEstado(1, 'ACTIVO').subscribe({
      next: resp => {
        this.usuariosDisponibles = resp?.data ?? [];
      },
      error: err => console.error('Error cargando usuarios', err)
    });
  }

  seleccionarGrupo(grupo: Grupo) {
    this.grupoSeleccionado = grupo;
    this.integrantes = grupo.usuarios || [];
  }

  crearGrupo() {
    if (!this.nombreGrupo.trim() || this.integrantes.length === 0) return;
    this.grupoService.createGrupo({ nombre: this.nombreGrupo, usuarios: this.integrantes.map(u => u.id) }).subscribe((grupo: Grupo) => {
      this.grupos.push(grupo);
      this.nombreGrupo = '';
      this.integrantes = [];
    });
  }

  agregarIntegrante(usuario: any) {
    if (!this.integrantes.some(u => u.id === usuario.id)) {
      this.integrantes.push(usuario);
    }
  }

  quitarIntegrante(usuario: any) {
    this.integrantes = this.integrantes.filter(u => u.id !== usuario.id);
  }
}

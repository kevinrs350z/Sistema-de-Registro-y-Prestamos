import { Component, OnInit } from '@angular/core';
import { GrupoService } from '../../../services/grupo.service';
import { Grupo } from '../../../models/grupo.model';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-grupo-prestamo',
  templateUrl: './grupo-prestamo.component.html',
  styleUrls: ['./grupo-prestamo.component.css']
})
export class GrupoPrestamoComponent implements OnInit {
  grupos: Grupo[] = [];
  selectedGrupo: Grupo | null = null;
  grupoForm: FormGroup;
  integrantes: any[] = [];

  constructor(
    private grupoService: GrupoService,
    private fb: FormBuilder
  ) {
    this.grupoForm = this.fb.group({
      grupo: [null],
      integrantes: [[]]
    });
  }

  ngOnInit(): void {
    this.grupoService.getGrupos().subscribe((grupos: Grupo[]) => {
      this.grupos = grupos;
    });
  }

  onGrupoChange(grupoId: number): void {
    this.selectedGrupo = this.grupos.find((g: Grupo) => g.id === grupoId) || null;
    if (this.selectedGrupo) {
      this.integrantes = this.selectedGrupo.usuarios || [];
      this.grupoForm.patchValue({ integrantes: this.integrantes });
    } else {
      this.integrantes = [];
      this.grupoForm.patchValue({ integrantes: [] });
    }
  }

  // Para crear un nuevo grupo desde el formulario
  crearGrupo(nombre: string, usuarios: any[]): void {
    this.grupoService.createGrupo({ nombre, usuarios }).subscribe((grupo: Grupo) => {
      this.grupos.push(grupo);
    });
  }
}

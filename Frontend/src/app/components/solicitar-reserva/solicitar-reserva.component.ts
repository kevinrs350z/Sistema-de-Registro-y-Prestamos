import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ReservasService } from './reservas.service';
import { Equipo, Pack, PrestamoDraft, TipoPrestamo, User } from '../../shared/models';

function rangoFechasValido(ctrl: AbstractControl) {
  const i = ctrl.get('fecha_inicio')?.value;
  const f = ctrl.get('fecha_fin')?.value;
  return (i && f && new Date(i) > new Date(f)) ? { rangoInvalido: true } : null;
}

@Component({
  selector: 'app-solicitar-reserva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitar-reserva.component.html',
  styleUrls: ['./solicitar-reserva.component.css']
})
export class SolicitarReservaComponent {
  private fb = inject(FormBuilder);
  private reservas = inject(ReservasService);

  usuarios: User[] = [];
  equipos: Equipo[] = [];
  packs: Pack[] = [];

  bloques = [
    { id: 1, texto: 'Bloque 1 (08:15 – 09:45)' },
    { id: 2, texto: 'Bloque 2 (09:55 – 11:25)' },
    { id: 3, texto: 'Bloque 3 (11:35 – 13:05)' },
    { id: 4, texto: 'Bloque 4 (14:30 – 16:00)' },
    { id: 5, texto: 'Bloque 5 (16:10 – 17:40)' }
  ];

  tipoSeleccionado = signal<TipoPrestamo>('INDIVIDUAL');

  form = this.fb.group({
    idUser: [null as number | null, Validators.required],
    nombre: [{ value: '', disabled: true }],
    rut: [{ value: '', disabled: true }],
    telefono: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    tipo: ['INDIVIDUAL' as TipoPrestamo, Validators.required],
    equipos: [[] as number[]],
    idPack: [null as number | null],
    fecha_inicio: ['', Validators.required],
    fecha_fin: ['', Validators.required],
    bloque: [null as number | null, Validators.required],
    observacion: ['']
  }, { validators: rangoFechasValido });

  get f() { return this.form.controls; }
  get mostrarEquipos() { return this.tipoSeleccionado() === 'INDIVIDUAL'; }
  get mostrarPack() { return this.tipoSeleccionado() === 'PACK'; }

  resumen = computed(() => {
    const v = this.form.value;
    const usuario = this.usuarios.find(u => u.idUser === (v.idUser ?? -1))?.nombre ?? '—';
    const tipo = v.tipo ?? '—';
    const cantidadEquipos = (v.equipos ?? []).length;
    const pack = this.packs.find(p => p.idPack === (v.idPack ?? -1))?.nombre ?? '—';
    const periodo = (v.fecha_inicio && v.fecha_fin) ? `${v.fecha_inicio} → ${v.fecha_fin}` : '—';
    const bloqueTxt = this.bloques.find(b => b.id === (v.bloque ?? -1))?.texto ?? '—';
    return { usuario, tipo, cantidadEquipos, pack, periodo, bloqueTxt };
  });

  equiposSeleccionados = computed(() =>
    this.equipos.filter(e => this.form.get('equipos')!.value?.includes(e.idEquipo))
  );

  ngOnInit() {
    this.usuarios = this.reservas.getUsuarios();
    this.equipos = this.reservas.getEquiposDisponibles();
    this.packs = this.reservas.getPacksActivos();

    // Simulación de usuario logueado
    const usuarioActivo = (this.reservas as any).getUsuarioActual?.() ?? this.usuarios[0] ?? null;
    if (usuarioActivo) {
      this.form.patchValue({
        idUser: usuarioActivo.idUser,
        nombre: usuarioActivo.nombre ?? '',
        rut: (usuarioActivo as any).rut ?? '',
        telefono: (usuarioActivo as any).telefono ?? '',
        email: usuarioActivo.email ?? ''
      });
    }

    // Verificar si vienen equipos desde el "carrito"
    const equipoIds = history.state['equiposSeleccionados'] ?? [];
    if (equipoIds.length > 0) {
      this.form.patchValue({ equipos: equipoIds });
    }

    // Reglas dinámicas según tipo (INDIVIDUAL vs PACK)
    this.form.get('tipo')!.valueChanges.subscribe(t => {
      this.tipoSeleccionado.set(t as TipoPrestamo);
      if (t === 'INDIVIDUAL') {
        this.f.equipos.addValidators(Validators.required);
        this.f.idPack.clearValidators();
        this.f.idPack.setValue(null);
      } else {
        this.f.idPack.addValidators(Validators.required);
        this.f.equipos.clearValidators();
        this.f.equipos.setValue([]);
      }
      this.f.equipos.updateValueAndValidity();
      this.f.idPack.updateValueAndValidity();
    });
  }

  onEquipoChange(checked: boolean, idEquipo: number) {
    const arr = this.form.get('equipos')!.value ?? [];
    if (checked) {
      if (!arr.includes(idEquipo)) this.form.get('equipos')!.setValue([...arr, idEquipo]);
    } else {
      this.form.get('equipos')!.setValue(arr.filter(x => x !== idEquipo));
    }
    this.form.get('equipos')!.markAsDirty();
    this.form.get('equipos')!.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const payload: PrestamoDraft = {
      idUser: this.form.get('idUser')!.value ?? 0,
      tipo: this.form.get('tipo')!.value ?? 'INDIVIDUAL',
      equipos: this.form.get('equipos')!.value ?? [],
      idPack: this.form.get('idPack')!.value ?? 0,
      fecha_inicio: this.form.get('fecha_inicio')!.value ?? '',
      fecha_fin: this.form.get('fecha_fin')!.value ?? '',
      bloque: this.form.get('bloque')!.value ?? 0,
      observacion: this.form.get('observacion')!.value ?? '',
      estado: 'Pendiente'
    };



    this.reservas.crearBorrador(payload);
    alert('✅ Solicitud guardada localmente (mock).');
    this.form.reset({ tipo: 'INDIVIDUAL' });
    this.tipoSeleccionado.set('INDIVIDUAL');
  }

  limpiar() {
    this.form.reset({ tipo: 'INDIVIDUAL' });
    this.tipoSeleccionado.set('INDIVIDUAL');
  }
}

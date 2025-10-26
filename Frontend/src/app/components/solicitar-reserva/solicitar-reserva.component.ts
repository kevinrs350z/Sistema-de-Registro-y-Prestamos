import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ReservasService } from './reservas.service';
import { Equipo, PrestamoDraft, User } from '../../shared/models';

/** Validador: fecha fin debe ser >= fecha inicio */
function rangoFechasValido(ctrl: AbstractControl) {
  const i = ctrl.get('fecha_inicio')?.value;
  const f = ctrl.get('fecha_fin')?.value;
  return i && f && new Date(i) > new Date(f) ? { rangoInvalido: true } : null;
}

/** Suma días hábiles (omite sábados y domingos) */
function sumarDiasHabiles(fecha: Date, dias: number): Date {
  const result = new Date(fecha);
  let agregados = 0;
  while (agregados < dias) {
    result.setDate(result.getDate() + 1);
    const d = result.getDay(); // 0 = dom, 6 = sáb
    if (d !== 0 && d !== 6) agregados++;
  }
  return result;
}

/** Si cae en fin de semana, adelanta a lunes */
function ajustarSiFinDeSemana(fecha: Date): Date {
  const d = fecha.getDay();
  if (d === 6) fecha.setDate(fecha.getDate() + 2); // sáb -> lun
  if (d === 0) fecha.setDate(fecha.getDate() + 1); // dom -> lun
  return fecha;
}

@Component({
  selector: 'app-solicitar-reserva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitar-reserva.component.html',
  styleUrls: ['./solicitar-reserva.component.css'],
})
export class SolicitarReservaComponent {
  private fb = inject(FormBuilder);
  private reservas = inject(ReservasService);

  usuarios: User[] = [];
  equipos: Equipo[] = [];

  // Bloques disponibles
  bloques = [
    { id: 1, texto: 'Bloque 1 (08:15 – 09:45)' },
    { id: 2, texto: 'Bloque 2 (09:55 – 11:25)' },
    { id: 3, texto: 'Bloque 3 (11:35 – 13:05)' },
    { id: 4, texto: 'Bloque 4 (14:30 – 16:00)' },
    { id: 5, texto: 'Bloque 5 (16:10 – 17:40)' },
  ];

  tipoSolicitud = signal<'DENTRO' | 'FUERA'>('DENTRO');

  form = this.fb.group(
    {
      idUser: [null as number | null, Validators.required],
      nombre: [{ value: '', disabled: true }],
      rut: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],

      tipo_solicitud: ['DENTRO' as 'DENTRO' | 'FUERA', Validators.required],

      // comunes
      equipos: [[] as number[]],
      observacion: [''],

      // solo "FUERA"
      fecha_inicio: [''],
      fecha_fin: [''],

      // solo "DENTRO"
      bloques: [[] as number[]],
    },
    { validators: rangoFechasValido }
  );

  get f() { return this.form.controls; }

  esDentro = () => this.tipoSolicitud() === 'DENTRO';
  esFuera  = () => this.tipoSolicitud() === 'FUERA';

  /** Fecha mínima dinámica según el tipo */
  minFechaInicio = this.calcularMinFecha('DENTRO');

  calcularMinFecha(tipo: 'DENTRO' | 'FUERA'): string {
    const hoy = new Date();
    let fechaMin =
      tipo === 'FUERA'
        ? sumarDiasHabiles(hoy, 2) // 2 días hábiles
        : new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 días corridos

    fechaMin = ajustarSiFinDeSemana(fechaMin);
    return fechaMin.toISOString().split('T')[0];
  }

  // Resumen lateral reactivo
  resumen = computed(() => {
    const v = this.form.getRawValue();
    const usuario = this.usuarios.find(u => u.idUser === (v.idUser ?? -1))?.nombre ?? '—';
    const tipo = v.tipo_solicitud ?? '—';
    const cantidadEquipos = (v.equipos ?? []).length;

    const periodo = v.fecha_inicio && v.fecha_fin ? `${v.fecha_inicio} → ${v.fecha_fin}` : '—';

    const bloquesTxt = this.bloques
      .filter(b => (v.bloques ?? []).includes(b.id))
      .map(b => b.texto)
      .join(', ');

    return { usuario, tipo, cantidadEquipos, periodo, bloquesTxt };
  });

  equiposSeleccionados = computed(() =>
    this.equipos.filter(e => this.form.get('equipos')!.value?.includes(e.idEquipo))
  );

  ngOnInit() {
    this.usuarios = this.reservas.getUsuarios();
    this.equipos = this.reservas.getEquiposDisponibles();

    // equipos que vienen del catálogo
    const state = history.state as { equiposSeleccionados?: number[] };
    if (state?.equiposSeleccionados?.length) {
      this.form.patchValue({ equipos: state.equiposSeleccionados });
    }

    // usuario activo simulado
    const usuarioActivo = this.reservas.getUsuarioActual?.() ?? this.usuarios[0] ?? null;
    if (usuarioActivo) {
      this.form.patchValue({
        idUser: usuarioActivo.idUser,
        nombre: usuarioActivo.nombre ?? '',
        rut: (usuarioActivo as any).rut ?? '',
        telefono: (usuarioActivo as any).telefono ?? '',
        email: usuarioActivo.email ?? '',
      });
    }

    // Reaccionar al cambio de tipo: recalcular minFecha y ajustar campos
    this.form.get('tipo_solicitud')!.valueChanges.subscribe((tipo) => {
      const valor = (tipo ?? 'DENTRO') as 'DENTRO' | 'FUERA';
      this.tipoSolicitud.set(valor);
      this.minFechaInicio = this.calcularMinFecha(valor);

      if (valor === 'DENTRO') {
        // Limpia fechas y validadores
        this.f.fecha_inicio.clearValidators();
        this.f.fecha_fin.clearValidators();
        this.form.patchValue({ fecha_inicio: '', fecha_fin: '' });

        // Exigir al menos 1 bloque
        this.f.bloques.setValidators([Validators.required, (c) => (c.value?.length ? null : { requerido: true })]);
      } else {
        // Limpia bloques y validador
        this.f.bloques.clearValidators();
        this.form.patchValue({ bloques: [] });

        // Exigir fechas
        this.f.fecha_inicio.setValidators([Validators.required]);
        this.f.fecha_fin.setValidators([Validators.required, rangoFechasValido]);
      }

      this.f.fecha_inicio.updateValueAndValidity();
      this.f.fecha_fin.updateValueAndValidity();
      this.f.bloques.updateValueAndValidity();
    });
  }

  onBloqueChange(event: Event, id: number) {
    const target = event.target as HTMLInputElement;
    const arr: number[] = this.form.get('bloques')!.value ?? [];
    if (target.checked) {
      if (!arr.includes(id)) this.form.get('bloques')!.setValue([...arr, id]);
    } else {
      this.form.get('bloques')!.setValue(arr.filter(x => x !== id));
    }
    this.form.get('bloques')!.markAsDirty();
    this.form.get('bloques')!.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    // 1) Tomamos los IDs de bloques y los convertimos a texto legible
    const ids: number[] = this.form.get('bloques')!.value ?? [];
    const bloquesTxt = this.bloques
      .filter(b => ids.includes(b.id))
      .map(b => b.texto)
      .join(', ');

    // 2) Armamos el payload. En "DENTRO" guardamos los bloques legibles.
    const payload: PrestamoDraft = {
      idUser: this.form.get('idUser')!.value ?? 0,
      tipo: (this.form.get('tipo_solicitud')!.value ?? 'DENTRO') as 'DENTRO' | 'FUERA',
      equipos: this.form.get('equipos')!.value ?? [],
      fecha_inicio: this.form.get('fecha_inicio')!.value ?? '',
      fecha_fin: this.form.get('fecha_fin')!.value ?? '',
      bloque: this.tipoSolicitud() === 'DENTRO' ? (bloquesTxt || '—') : '—',
      observacion: this.form.get('observacion')!.value ?? '',
      estado: 'Pendiente',
    };

    this.reservas.crearBorrador(payload);
    alert('✅ Solicitud guardada localmente (mock).');

    // reset amable
    this.form.reset({ tipo_solicitud: 'DENTRO', equipos: [], bloques: [] });
    this.tipoSolicitud.set('DENTRO');
    this.minFechaInicio = this.calcularMinFecha('DENTRO');
  }

  limpiar() {
    this.form.reset({ tipo_solicitud: 'DENTRO', equipos: [], bloques: [], fecha_inicio: '', fecha_fin: '', observacion: '' });
    this.tipoSolicitud.set('DENTRO');
    this.minFechaInicio = this.calcularMinFecha('DENTRO');
  }
}

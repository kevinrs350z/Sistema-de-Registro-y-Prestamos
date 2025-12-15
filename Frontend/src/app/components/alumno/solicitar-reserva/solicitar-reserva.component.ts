import { Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

/* =========================
   HELPERS
========================= */

function rangoFechasValido(ctrl: AbstractControl) {
  const i = ctrl.get('fecha_inicio')?.value;
  const f = ctrl.get('fecha_fin')?.value;
  return i && f && new Date(i) > new Date(f) ? { rangoInvalido: true } : null;
}

function sumarDiasHabiles(fecha: Date, dias: number): Date {
  const result = new Date(fecha);
  let agregados = 0;
  while (agregados < dias) {
    result.setDate(result.getDate() + 1);
    const d = result.getDay();
    if (d !== 0 && d !== 6) agregados++;
  }
  return result;
}

function ajustarSiFinDeSemana(fecha: Date): Date {
  const d = fecha.getDay();
  if (d === 6) fecha.setDate(fecha.getDate() + 2);
  if (d === 0) fecha.setDate(fecha.getDate() + 1);
  return fecha;
}

function cortarHora(hora: string): string {
  return hora ? hora.substring(0, 5) : '';
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
  private api = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  usuarioActivo: any = null;

  equipos = signal<Equipo[]>([]);
  carrito: CarritoItem[] = [];

  asignaturas: any[] = [];
  bloques: { id: number; texto: string }[] = [];

  tipoSolicitud = signal<'DENTRO' | 'FUERA'>('DENTRO');
  mostrarMotivo = false;

  mostrarResumenMobile = signal(false);

  abrirResumenMobile() {
    this.mostrarResumenMobile.set(true);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  cerrarResumenMobile() {
    this.mostrarResumenMobile.set(false);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /* =========================
     FORM
  ========================= */
  form = this.fb.group(
    {
      idUser: [null as number | null, Validators.required],
      nombre: [{ value: '', disabled: true }],
      rut: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],

      tipo_solicitud: ['DENTRO', Validators.required],
      asignatura: ['', Validators.required],
      motivo: [''],

      observacion: [''],
      fecha_inicio: [''],
      fecha_fin: [''],
      bloques: [[] as number[]],
    },
    { validators: rangoFechasValido }
  );

  get f() {
    return this.form.controls;
  }

  /* =========================
     FECHAS
  ========================= */
  minFechaInicio = this.calcularMinFecha('DENTRO');

  calcularMinFecha(tipo: 'DENTRO' | 'FUERA'): string {
    const hoy = new Date();
    let fechaMin =
      tipo === 'FUERA'
        ? sumarDiasHabiles(hoy, 2)
        : new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000);

    fechaMin = ajustarSiFinDeSemana(fechaMin);
    return fechaMin.toISOString().split('T')[0];
  }

  esDentro = () => this.tipoSolicitud() === 'DENTRO';
  esFuera = () => this.tipoSolicitud() === 'FUERA';

  formValueSig = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );

  asignaturaSeleccionada = computed(() => {
    const id = this.form.get('asignatura')?.value;
    if (!id) return '—';
    if (id === 'OTROS') return 'OTROS';
    return this.asignaturas.find(a => Number(a.idAsignatura) === Number(id))?.nombre || '—';
  });

  equiposSeleccionados = computed(() => {
    const lista: any[] = [];
    for (const item of this.carrito) {
      if (item.modo === 'cualquiera') {
        const ejemplo = this.equipos().find(e => e.tipo_equipo_id === item.idTipoEquipo);
        if (ejemplo) {
          lista.push({
            nombre: ejemplo.nombre,
            categoria: ejemplo.categoria,
            codigo: `x${item.cantidad} (cualquier unidad)`
          });
        }
      } else {
        for (const id of item.equiposSeleccionados) {
          const eq = this.equipos().find(e => e.idEquipo === id);
          if (eq) lista.push(eq);
        }
      }
    }
    return lista;
  });

  resumen = computed(() => {
    const v = this.formValueSig();
    return {
      usuario: this.usuarioActivo?.persona?.Nombre ?? '—',
      tipo: v.tipo_solicitud ?? '—',
      cantidadEquipos: this.equiposSeleccionados().length,
      periodo:
        v.tipo_solicitud === 'FUERA' && v.fecha_inicio && v.fecha_fin
          ? `${v.fecha_inicio} → ${v.fecha_fin}`
          : '—',
      bloquesTxt:
        v.tipo_solicitud === 'DENTRO'
          ? this.bloques
              .filter(b => (v.bloques ?? []).includes(b.id))
              .map(b => b.texto)
              .join(', ')
          : '—',
    };
  });

  ngOnInit() {
    const token = localStorage.getItem('token') ?? '';

    this.api.getUsuario(token).subscribe(data => {
      this.usuarioActivo = data;
      this.form.patchValue({
        idUser: data.idUser,
        nombre: data.persona?.Nombre,
        rut: data.persona?.Rut,
        telefono: data.persona?.telefono,
        email: data.Email,
      });
    });

    this.api.getEquipos(token).subscribe(data => {
      this.equipos.set(data);
      const state = history.state as { carrito?: CarritoItem[] };
      if (state?.carrito) this.carrito = state.carrito;
      this.cdr.detectChanges();
    });

    this.api.getAsignaturas(token).subscribe(data => {
      this.asignaturas = [
        ...data.map(a => ({ idAsignatura: a.id, nombre: a.nombre })),
        { idAsignatura: 'OTROS', nombre: 'OTROS' }
      ];
    });

    this.api.getBloques(token).subscribe(data => {
      this.bloques = data
        .filter(b => b.idBloque <= 5)
        .map(b => ({
          id: b.idBloque,
          texto: `Bloque ${b.idBloque} (${cortarHora(b.hora_inicio)} – ${cortarHora(b.hora_fin)})`
        }));
    });

    this.form.get('asignatura')!.valueChanges.subscribe(v => this.onAsignaturaChange(v));
    this.form.get('tipo_solicitud')!.valueChanges.subscribe(v => {
      this.tipoSolicitud.set(v as any);
      this.minFechaInicio = this.calcularMinFecha(v as any);
    });
  }

  onAsignaturaChange(valor: any) {
    this.mostrarMotivo = valor === 'OTROS';
    if (this.mostrarMotivo) {
      this.f.motivo.setValidators([Validators.required]);
    } else {
      this.f.motivo.clearValidators();
      this.form.patchValue({ motivo: '' });
    }
    this.f.motivo.updateValueAndValidity();
  }

  onBloqueChange(event: Event, id: number) {
    const target = event.target as HTMLInputElement;
    const arr: number[] = this.f.bloques.value ?? [];
    target.checked
      ? this.f.bloques.setValue([...new Set([...arr, id])])
      : this.f.bloques.setValue(arr.filter(x => x !== id));
  }

  /* =========================
     SUBMIT (🔥 FIX DEFINITIVO)
  ========================= */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Completa todos los campos.');
      return;
    }

    const asignaturaSel = this.f.asignatura.value;

    if (!asignaturaSel) {
      alert('Debes seleccionar una asignatura.');
      return;
    }

    const payload = {
      idUser: this.f.idUser.value,
      tipo: this.f.tipo_solicitud.value,

      /** 🔥 CLAVE */
      idAsignatura:
        asignaturaSel === 'OTROS'
          ? null
          : Number(asignaturaSel),

      motivo: asignaturaSel === 'OTROS' ? this.f.motivo.value : '',
      observacion: this.f.observacion.value,
      fecha_inicio: this.f.fecha_inicio.value,
      fecha_fin: this.f.fecha_fin.value,
      bloques: this.f.bloques.value,

      equipos: this.carrito.map(c => ({
        idTipoEquipo: Number(c.idTipoEquipo),
        cantidad: c.modo === 'especifico'
          ? c.equiposSeleccionados.length
          : Number(c.cantidad),
        modo: c.modo,
        equiposSeleccionados: c.equiposSeleccionados ?? []
      }))
    };

    const token = localStorage.getItem('token') ?? '';
    this.api.crearPrestamo(payload, token).subscribe(() => {
      alert('Solicitud enviada.');
      this.limpiar();
    });
  }

  limpiar() {
    this.form.reset({
      tipo_solicitud: 'DENTRO',
      asignatura: '',
      motivo: '',
      fecha_inicio: '',
      fecha_fin: '',
      bloques: [],
      observacion: '',
    });
    this.tipoSolicitud.set('DENTRO');
    this.carrito = [];
  }
}

/* =========================
   INTERFACES
========================= */
interface Equipo {
  idEquipo: number;
  nombre: string;
  categoria: string;
  codigo: string;
  tipo_equipo_id: number;
}

interface CarritoItem {
  idTipoEquipo: number;
  cantidad: number;
  modo: 'cualquiera' | 'especifico';
  equiposSeleccionados: number[];
}

import { Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { CarritoItem } from '../catalogo-equipos/carrito-item.model';
import { CarritoService } from '../../../services/carrito.service';

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

  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private api = inject(AuthService);
  private carritoSrv = inject(CarritoService);
  private cdr = inject(ChangeDetectorRef);

  usuarioActivo: any = null;
  bloqueado = false;
  bloqueadoMotivo: string | null = null;
  bloqueadoFecha: string | null = null;

  equipos = signal<Equipo[]>([]);
  carrito: CarritoItem[] = [];

  asignaturas = signal<{ idAsignatura: number; nombre: string }[]>([]);
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

      // ✅ ahora es number | null
      asignatura: [null as number | null, Validators.required],

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

  // ✅ señal reactiva del formulario
  formValueSig = toSignal(
    this.form.valueChanges.pipe(
      startWith(this.form.getRawValue()),
      map(v => ({ ...v }))
    ),
    { initialValue: { ...this.form.getRawValue() } }
  );

  // ✅ ya no existe "OTROS" string. OTROS será null desde el select.
  asignaturaSeleccionada = computed(() => {
    const id = this.formValueSig().asignatura;

    if (id === null) return 'OTROS';
    if (id === undefined) return '—';

    return this.asignaturas().find(a => a.idAsignatura === id)?.nombre ?? '—';
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

  equiposResumen = computed(() => {
    return this.carrito.map(item => ({
      nombre: item.nombre ?? 'Equipo',
      categoria: item.categoria ?? '',
      cantidad: item.cantidad
    }));
  });

  totalUnidades = computed(() =>
    this.equiposResumen().reduce((acc, e) => acc + e.cantidad, 0)
  );

  resumen = computed(() => {
    const v = this.formValueSig();
    return {
      usuario: this.usuarioActivo?.persona?.Nombre ?? '—',
      tipo: v.tipo_solicitud ?? '—',
      cantidadEquipos: this.equiposResumen().length,

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
    this.carrito = this.carritoSrv.getCarrito();
    console.log('🛒 carrito desde servicio:', this.carrito);

    // ✅ debug para confirmar que el select cambia de verdad
    this.form.get('asignatura')!.valueChanges.subscribe(v => {
      console.log('🎓 asignatura REAL:', v, typeof v);
      this.onAsignaturaChange(v);
    });

    this.api.getUsuario(token).subscribe(data => {
      this.usuarioActivo = data;
      this.bloqueado = !!data?.bloqueado;
      this.bloqueadoMotivo = data?.bloqueado_motivo ?? null;
      this.bloqueadoFecha = data?.bloqueado_fecha ?? null;
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
      this.cdr.detectChanges();
    });

    this.api.getAsignaturas(token).subscribe(data => {
      // ✅ OJO: tu backend devuelve {idAsignatura, nombre}
      // por eso tomamos idAsignatura, NO "id"
      const normalizadas = (data ?? []).map((a: any) => ({
        idAsignatura: Number(a.idAsignatura),
        nombre: a.nombre
      }));
      this.asignaturas.set(normalizadas);
    });

    this.api.getBloques(token).subscribe(data => {
      this.bloques = data
        .filter((b: any) => b.idBloque <= 5)
        .map((b: any) => ({
          id: b.idBloque,
          texto: `Bloque ${b.idBloque} (${cortarHora(b.hora_inicio)} – ${cortarHora(b.hora_fin)})`
        }));
    });

    this.form.get('tipo_solicitud')!.valueChanges.subscribe(v => {
      this.tipoSolicitud.set(v as any);
      this.minFechaInicio = this.calcularMinFecha(v as any);
    });
  }

  // ✅ ahora OTROS es null
  onAsignaturaChange(valor: number | null) {
    this.mostrarMotivo = valor === null;

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
     SUBMIT
  ========================= */
  submit() {
    if (this.bloqueado) {
      this.notify.error('Tu cuenta está bloqueada. No puedes solicitar equipos.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Completa todos los campos obligatorios.');
      return;
    }

    const asignaturaSel = this.f.asignatura.value; // number | null

    // ✅ ahora null significa OTROS
    if (asignaturaSel === undefined) {
      this.notify.warning('Debes seleccionar una asignatura.');
      return;
    }

    const payload = {
      // OJO: el backend usa Auth::user() para idUser; no necesitamos mandarlo.
      tipo: this.f.tipo_solicitud.value,

      // Backend espera la key "asignatura" (nullable) para DENTRO
      asignatura: asignaturaSel, // number | null

      motivo: asignaturaSel === null ? this.f.motivo.value : '',
      observacion: this.f.observacion.value,
      fecha_inicio: this.f.fecha_inicio.value,
      fecha_fin: this.f.fecha_fin.value,
      bloques: this.f.bloques.value,

      equipos: this.carrito.map(c => {
        if (c.tipo === 'pack') {
          return {
            idPack: c.idPack, // ✅ Enviar ID del pack
            cantidad: 1       // Packs son únicos
          };
        }
        return {
          idTipoEquipo: Number(c.idTipoEquipo),
          cantidad: c.modo === 'especifico'
            ? c.equiposSeleccionados.length
            : Number(c.cantidad),
          modo: c.modo,
          equiposSeleccionados: c.equiposSeleccionados ?? []
        };
      })
    };

    const token = localStorage.getItem('token') ?? '';
    this.api.crearPrestamo(payload, token).subscribe({
      next: () => {
        this.notify.success('Solicitud enviada correctamente.');
        this.limpiar();
        // Limpiar también el carrito global para que el catálogo quede en blanco
        this.carritoSrv.limpiar();
      },
      error: err => {
        if (err?.status === 403) {
          this.notify.error(
            err?.error?.message || 'Tu cuenta está bloqueada.'
          );
          this.bloqueado = true;
          this.bloqueadoMotivo = err?.error?.motivo ?? null;
          this.bloqueadoFecha = err?.error?.fecha ?? null;
          return;
        }
        this.notify.error(err?.error?.error || 'Ocurrió un error al enviar la solicitud.');
      }
    });
  }

  limpiar() {
    this.form.reset({
      tipo_solicitud: 'DENTRO',
      asignatura: null,
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

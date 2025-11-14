import { Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Equipo, User } from '../../../shared/models';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

/** Validador: fecha fin >= fecha inicio */
function rangoFechasValido(ctrl: AbstractControl) {
  const i = ctrl.get('fecha_inicio')?.value;
  const f = ctrl.get('fecha_fin')?.value;
  return i && f && new Date(i) > new Date(f) ? { rangoInvalido: true } : null;
}

/** Suma días hábiles */
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

/** Si cae en fin de semana, adelanta a lunes */
function ajustarSiFinDeSemana(fecha: Date): Date {
  const d = fecha.getDay();
  if (d === 6) fecha.setDate(fecha.getDate() + 2);
  if (d === 0) fecha.setDate(fecha.getDate() + 1);
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
  private api = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);


  usuarioActivo: any = null;
  equipos = signal<Equipo[]>([]);

  asignaturas: any[] = [];
  bloques: any[] = [];

  tipoSolicitud = signal<'DENTRO' | 'FUERA'>('DENTRO');
  mostrarMotivo = false;

  form = this.fb.group(
    {
      idUser: [null as number | null, Validators.required],
      nombre: [{ value: '', disabled: true }],
      rut: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],

      tipo_solicitud: ['DENTRO' as 'DENTRO' | 'FUERA', Validators.required],
      asignatura: ['', Validators.required],
      motivo: [''],

      equipos: [[] as number[]],
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

  esDentro = () => this.tipoSolicitud() === 'DENTRO';
  esFuera = () => this.tipoSolicitud() === 'FUERA';

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

  // Señal reactiva del formulario
  formValueSig = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() }
  );
  asignaturaSeleccionada = computed(() => {
   const id = this.form.get('asignatura')?.value;
   return this.asignaturas.find(a => a.idAsignatura == id)?.nombre || '—';
  });


  resumen = computed(() => {
    const v = this.formValueSig();
    const usuario = this.usuarioActivo?.persona?.Nombre ?? '—';
    const tipo = v.tipo_solicitud ?? '—';
    const cantidadEquipos = (v.equipos ?? []).length;

    const periodo =
      tipo === 'FUERA' && v.fecha_inicio && v.fecha_fin
        ? `${v.fecha_inicio} → ${v.fecha_fin}`
        : '—';

    const bloquesTxt =
      tipo === 'DENTRO'
        ? this.bloques
            .filter((b) => (v.bloques ?? []).includes(b.id))
            .map((b) => b.texto)
            .join(', ')
        : '—';

    return { usuario, tipo, cantidadEquipos, periodo, bloquesTxt };
  });

  equiposSeleccionados = computed(() => {
    const v = this.formValueSig();                  // 👈 signal, dispara recalculo
    const seleccionados: number[] = v.equipos ?? [];
    const todos = this.equipos();                   // 👈 signal, dispara recalculo

    const filtrados = todos.filter((e) =>
      seleccionados.includes(e.idEquipo)
    );

    console.log('🎯 Equipos visibles en HTML:', {
      seleccionados,
      todos,
      filtrados
    });

    return filtrados;
  });





 ngOnInit() {
  const token = localStorage.getItem('token') ?? '';
  if (!token) {
    alert('⚠️ No se encontró token. Inicia sesión.');
    return;
  }

  // 🔹 Usuario autenticado
  this.api.getUsuario(token).subscribe({
    next: (data) => {
      if (!data) {
        console.error('⚠️ Usuario vacío:', data);
        return;
      }

      this.usuarioActivo = data;
      this.form.patchValue({
        idUser: data.idUser,
        nombre: data.persona?.Nombre ?? '',
        rut: data.persona?.Rut ?? '',
        telefono: data.persona?.telefono ?? '',
        email: data.Email ?? '',
      });
    },
    error: (err) => {
      console.error('❌ Error al obtener usuario:', err);
      alert('Error al cargar datos del usuario.');
    },
  });

 
  
// 🔹 Traer equipos (protegidos)
  this.api.getEquipos(token).subscribe({
    next: (data) => {
      this.equipos.set(data);                    // 👈 antes era: this.equipos = [...data]
      console.log('📦 Equipos desde backend:', this.equipos());
      
      const state = history.state as { equiposSeleccionados?: number[] };
      if (state?.equiposSeleccionados?.length) {
        this.form.patchValue({ equipos: state.equiposSeleccionados });
        console.log('🧩 Equipos seleccionados restaurados:', state.equiposSeleccionados);
      }

      // Ya no hace falta el setTimeout ni reasignar this.equipos
      this.form.updateValueAndValidity();
      this.cdr.detectChanges();
    },
    error: (err) => console.error('❌ Error al cargar equipos:', err),
  });







  // 🔹 Traer asignaturas desde el backend
  this.api.getAsignaturas(token).subscribe({
    next: (data) => {
      this.asignaturas = [...data, { idAsignatura: 'OTROS', nombre: 'OTROS' }];
      console.log('📚 Asignaturas cargadas:', this.asignaturas);
    },
    error: (err) => {
      console.error('❌ Error al cargar asignaturas:', err);
    },
  });

  // 🔹 Cargar bloques desde backend
  this.api.getBloques(token).subscribe({
    next: (data) => {
      this.bloques = data.map((b) => ({
        id: b.idBloque,
        texto: `Bloque ${b.idBloque} (${b.hora_inicio} – ${b.hora_fin})`,
      }));
      console.log('⏰ Bloques cargados:', this.bloques);
    },
    error: (err) => console.error('❌ Error al cargar bloques:', err),
  });

  // 🔹 Cambios tipo solicitud
  this.form.get('tipo_solicitud')!.valueChanges.subscribe((tipo) => {
    const valor = (tipo ?? 'DENTRO') as 'DENTRO' | 'FUERA';
    this.tipoSolicitud.set(valor);
    this.minFechaInicio = this.calcularMinFecha(valor);
  });

  // 🔹 Cambios de asignatura
  this.form.get('asignatura')!.valueChanges.subscribe((valor) => {
    if (valor === 'OTROS') {
      this.mostrarMotivo = true;
      this.f.motivo.setValidators([Validators.required]);
    } else {
      this.mostrarMotivo = false;
      this.f.motivo.clearValidators();
      this.form.patchValue({ motivo: '' });
    }
    this.f.motivo.updateValueAndValidity();
  });
}


  onBloqueChange(event: Event, id: number) {
    const target = event.target as HTMLInputElement;
    const arr: number[] = this.form.get('bloques')!.value ?? [];
    if (target.checked) {
      if (!arr.includes(id)) this.form.get('bloques')!.setValue([...arr, id]);
    } else {
      this.form.get('bloques')!.setValue(arr.filter((x) => x !== id));
    }
    this.form.get('bloques')!.updateValueAndValidity();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

  const asignaturaSel = this.form.get('asignatura')!.value;
const motivoSel = this.form.get('motivo')!.value;

const payload = {
  idUser: this.form.get('idUser')!.value,
  equipos: this.form.get('equipos')!.value ?? [],
  tipo: this.form.get('tipo_solicitud')!.value ?? 'DENTRO',

  // si asignatura = OTROS, enviamos null
  asignatura: asignaturaSel === 'OTROS' ? null : asignaturaSel,

  // si asignatura = OTROS → enviamos motivoSel
  // si asignatura ≠ OTROS → enviamos ''
  motivo: asignaturaSel === 'OTROS' ? motivoSel : '',

  observacion: this.form.get('observacion')!.value ?? '',
  fecha_inicio: this.form.get('fecha_inicio')!.value ?? '',
  fecha_fin: this.form.get('fecha_fin')!.value ?? '',
  bloques: this.form.get('bloques')!.value ?? [],
};


    const token = localStorage.getItem('token') ?? '';
    this.api.crearPrestamo(payload, token).subscribe({
      next: (resp) => {
        console.log('✅ Préstamo creado:', resp);
        alert('✅ Solicitud enviada correctamente al backend.');
        this.limpiar();
      },
      error: (err) => {
        console.error('❌ Error al crear préstamo:', err);
        alert('Error al crear préstamo. Revisa consola.');
      },
    });
  }
    onAsignaturaChange(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.mostrarMotivo = valor === 'OTROS';

    if (this.mostrarMotivo) {
      this.f.motivo.setValidators([Validators.required]);
    } else {
      this.f.motivo.clearValidators();
      this.form.patchValue({ motivo: '' });
    }
    this.f.motivo.updateValueAndValidity();
  }


  limpiar() {
    this.form.reset({
      tipo_solicitud: 'DENTRO',
      equipos: [],
      bloques: [],
      fecha_inicio: '',
      fecha_fin: '',
      asignatura: '',
      motivo: '',
      observacion: '',
    });
    this.tipoSolicitud.set('DENTRO');
    this.minFechaInicio = this.calcularMinFecha('DENTRO');
    this.mostrarMotivo = false;
  }
}

import { Component, computed, inject, signal, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { CarritoItem } from '../catalogo-equipos/carrito-item.model';
import { CarritoService } from '../../../services/carrito.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { GrupoService } from '../../../services/grupo.service';
import { Grupo } from '../../../models/grupo.model';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './solicitar-reserva.component.html',
  styleUrls: ['./solicitar-reserva.component.css'],
})
export class SolicitarReservaComponent {

  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private api = inject(AuthService);
  private carritoSrv = inject(CarritoService);
  private cdr = inject(ChangeDetectorRef);
  private usuariosSrv = inject(UsuariosService);
  private grupoSrv = inject(GrupoService);

  usuarioActivo: any = null;
  bloqueado = false;
  bloqueadoMotivo: string | null = null;
  bloqueadoFecha: string | null = null;

  // Términos y condiciones
  aceptaTerminos = false;

  equipos = signal<Equipo[]>([]);
  carrito: CarritoItem[] = [];

  asignaturas = signal<{ nombre: string }[]>([
    { nombre: 'Taller de fotografía Digital' },
    { nombre: 'Taller de fotografía Publicitaria' },
    { nombre: 'Taller de Producción Multimedia I' },
    { nombre: 'Taller de Video Digital' },
    { nombre: 'Taller de Medios de Comunicación' },
    { nombre: 'Taller de Música y Sonido' },
    { nombre: 'Laboratorio de Video Digital' },
    { nombre: 'Practica Laboral Segundo año' },
    { nombre: 'Practica Profesional Cuarto año' }
  ]);
  bloques: { id: number; texto: string }[] = [];

  integrantes = signal<any[]>([]);
  integrantesSeleccionados = signal<number[]>([]);
  bloqueosIntegrantes: Record<number, string> = {};

  // Búsqueda de integrantes
  busquedaIntegrante = signal('');

  // Integrantes filtrados por búsqueda (máximo 3)
  integrantesFiltrados = computed(() => {
    const texto = this.busquedaIntegrante().toLowerCase().trim();
    const todos = this.integrantes();
    const seleccionados = this.integrantesSeleccionados();

    // Si no hay búsqueda, no mostrar lista (solo los seleccionados)
    if (!texto) return [];

    return todos
      .filter(u => !seleccionados.includes(u.id)) // excluir ya seleccionados
      .filter(u =>
        u.nombre.toLowerCase().includes(texto) ||
        u.email.toLowerCase().includes(texto)
      )
      .slice(0, 3); // máximo 3 resultados
  });

  // Integrantes ya seleccionados (para mostrar chips)
  integrantesSeleccionadosData = computed(() => {
    const todos = this.integrantes();
    const seleccionados = this.integrantesSeleccionados();
    return todos.filter(u => seleccionados.includes(u.id));
  });

  proyectoHabilitado = false;
  grupoProyectoSeleccionado = 'nuevo';

  grupos = signal<Grupo[]>([]);
  grupoSeleccionado: Grupo | null = null;

  tipoSolicitud = signal<'DENTRO' | 'FUERA'>('DENTRO');
  mostrarMotivo = false;

  mostrarResumenMobile = signal(false);
  equiposSeleccionadosCount = computed(() => this.equiposResumen().length);
  mostrarProtocolo = false;

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

  abrirProtocolo() {
    this.mostrarProtocolo = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  cerrarProtocolo() {
    this.mostrarProtocolo = false;
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

      // ✅ ahora es string | null
      asignatura: [null as string | null, Validators.required],

      motivo: [''],

      observacion: [''],
      fecha_inicio: [''],
      fecha_fin: [''],
      bloques: [[] as number[]],
      nombre_proyecto: [''],
    },
    { validators: rangoFechasValido }
  );

  private proyectoAutoResetEffect = effect(() => {
    if (this.equiposSeleccionadosCount() === 0 && this.proyectoHabilitado) {
      this.proyectoHabilitado = false;
      this.onProyectoToggle();
    }
  });

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

  asignaturaSeleccionada = computed(() => {
    const valor = this.formValueSig().asignatura;
    const motivo = this.formValueSig().motivo;

    if (!valor) return '—';
    if (valor === 'OTROS') return motivo ? `OTROS: ${motivo}` : 'OTROS';

    return this.asignaturas().find(a => a.nombre === valor)?.nombre ?? String(valor);
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

      this.cargarIntegrantes();
      this.cargarGrupos();
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

    this.grupoProyectoSeleccionado = 'nuevo'; // Ensure project dropdown resets
    this.f.nombre_proyecto.disable({ emitEvent: false });
  }

  cargarGrupos(): void {
    this.grupoSrv.getGrupos().subscribe({
      next: (grupos: Grupo[]) => {
        this.grupos.set(grupos);
      },
      error: (err: any) => console.error('Error cargando grupos', err)
    });
  }

  onGrupoChange(grupoId: string): void {
    this.grupoProyectoSeleccionado = grupoId || 'nuevo';

    if (!this.proyectoHabilitado) {
      this.grupoSeleccionado = null;
      this.integrantesSeleccionados.set([]);
      this.actualizarBloqueosIntegrantes();
      return;
    }

    if (!grupoId || grupoId === 'nuevo') {
      this.grupoSeleccionado = null;
      this.integrantesSeleccionados.set([]);
      this.actualizarBloqueosIntegrantes();
      return;
    }
    const grupo = this.grupos().find((g: Grupo) => g.id === +grupoId);
    if (grupo) {
      this.grupoSeleccionado = grupo;
      this.integrantesSeleccionados.set((grupo.usuarios || []).map((u: any) => u.id));
      this.actualizarBloqueosIntegrantes();
    }
  }

  onAsignaturaChange(valor: string | null) {
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
    
    if (target.checked) {
      // Agregar bloque
      const nuevoArr = [...new Set([...arr, id])].sort((a, b) => a - b);
      
      // Verificar si el nuevo conjunto es continuo
      if (this.sonBloquesContinuos(nuevoArr)) {
        this.f.bloques.setValue(nuevoArr);
      } else {
        // No permitir, revertir el checkbox
        target.checked = false;
        this.notify.warning('Solo puedes seleccionar bloques continuos (horarios consecutivos).');
      }
    } else {
      // Quitar bloque
      const nuevoArr = arr.filter(x => x !== id);
      
      // Si quedan bloques, verificar que sigan siendo continuos
      if (nuevoArr.length === 0 || this.sonBloquesContinuos(nuevoArr)) {
        this.f.bloques.setValue(nuevoArr);
      } else {
        // No permitir quitar si rompe la continuidad
        target.checked = true;
        this.notify.warning('No puedes quitar este bloque porque dejaría huecos en el horario.');
      }
    }
  }

  // Verifica si un array de IDs de bloques son continuos (consecutivos)
  sonBloquesContinuos(bloques: number[]): boolean {
    if (bloques.length <= 1) return true;
    
    const ordenados = [...bloques].sort((a, b) => a - b);
    for (let i = 1; i < ordenados.length; i++) {
      if (ordenados[i] - ordenados[i - 1] !== 1) {
        return false;
      }
    }
    return true;
  }

  // Verifica si un bloque puede ser seleccionado (es adyacente a los ya seleccionados)
  puedeSeleccionarBloque(id: number): boolean {
    const seleccionados: number[] = this.f.bloques.value ?? [];
    
    // Si no hay bloques seleccionados, cualquiera puede seleccionarse
    if (seleccionados.length === 0) return true;
    
    // Si ya está seleccionado, siempre se puede "deseleccionar" (la lógica de quitar valida después)
    if (seleccionados.includes(id)) return true;
    
    // Verificar si es adyacente al rango actual
    const min = Math.min(...seleccionados);
    const max = Math.max(...seleccionados);
    
    return id === min - 1 || id === max + 1;
  }

  toggleIntegrante(id: number) {
    if (!this.proyectoHabilitado) {
      return;
    }

    if (this.bloqueosIntegrantes[id]) {
      this.notify.warning(this.bloqueosIntegrantes[id]);
      return;
    }

    if (this.integrantesSeleccionados().includes(id)) {
      this.integrantesSeleccionados.set(this.integrantesSeleccionados().filter(x => x !== id));
    } else {
      this.integrantesSeleccionados.set([...this.integrantesSeleccionados(), id]);
      this.busquedaIntegrante.set(''); // Limpiar búsqueda al agregar
    }

    this.actualizarBloqueosIntegrantes();
    this.grupoSeleccionado = null; // Si el usuario edita manualmente, deselecciona grupo
  }

  quitarIntegrante(id: number) {
    this.integrantesSeleccionados.set(this.integrantesSeleccionados().filter(x => x !== id));
    this.actualizarBloqueosIntegrantes();
    this.grupoSeleccionado = null;
  }

  onBusquedaIntegranteChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.busquedaIntegrante.set(valor);
  }

  private cargarIntegrantes() {
    this.usuariosSrv.obtenerUsuariosPorEstado(1, 'ACTIVO').subscribe({
      next: resp => {
        const lista = resp?.data ?? [];
        const filtrados = lista
          .filter((u: any) => String(u.rol || '').toUpperCase() === 'ALUMNO')
          .filter((u: any) => u.id !== this.usuarioActivo?.idUser)
          .map((u: any) => ({
            id: u.id,
            nombre: `${u.nombre} ${u.apellido1 ?? ''} ${u.apellido2 ?? ''}`.trim(),
            email: u.email,
          }));
        this.integrantes.set(filtrados);
      },
      error: err => console.error('Error cargando integrantes', err)
    });
  }

  private buildEquiposPayload() {
    return this.carrito.map(c => {
      if (c.tipo === 'pack') {
        return {
          idPack: c.idPack,
          cantidad: 1
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
    });
  }

  private aplicarBloqueos(bloqueos: Record<number, any[]>) {
    const map: Record<number, string> = {};
    Object.keys(bloqueos || {}).forEach(id => {
      const info = (bloqueos as any)[id];
      map[Number(id)] = info?.usuario?.nombre
        ? `${info.usuario.nombre} tiene el límite alcanzado para este tipo de equipo.`
        : 'Límite alcanzado para este tipo de equipo.';
    });
    this.bloqueosIntegrantes = map;
  }

  private actualizarBloqueosIntegrantes() {
    if (!this.proyectoHabilitado || !this.integrantesSeleccionados().length) {
      this.bloqueosIntegrantes = {};
      return;
    }

    this.api.validarMaximoPrestamo({
      equipos: this.buildEquiposPayload(),
      integrantes: this.integrantesSeleccionados()
    }).subscribe({
      next: res => this.aplicarBloqueos(res?.bloqueos || {}),
      error: err => console.error('Error validando máximos', err)
    });
  }

  onProyectoToggle(): void {
    if (!this.proyectoHabilitado) {
      this.integrantesSeleccionados.set([]);
      this.bloqueosIntegrantes = {};
      this.grupoSeleccionado = null;
      this.grupoProyectoSeleccionado = 'nuevo'; // Reset project dropdown state
      this.busquedaIntegrante.set(''); // Limpiar búsqueda
      this.f.nombre_proyecto.disable({ emitEvent: false });
      this.f.nombre_proyecto.setValue('', { emitEvent: false });
    } else {
      this.f.nombre_proyecto.enable({ emitEvent: false });
      this.actualizarBloqueosIntegrantes();
    }
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

    const asignaturaSel = this.f.asignatura.value; // string | null

    if (!asignaturaSel) {
      this.notify.warning('Debes seleccionar una asignatura.');
      return;
    }

    const payload: any = {
      // OJO: el backend usa Auth::user() para idUser; no necesitamos mandarlo.
      tipo: this.f.tipo_solicitud.value,
      asignatura: asignaturaSel, // string
      motivo: asignaturaSel === 'OTROS' ? this.f.motivo.value : '',
      observacion: this.f.observacion.value,
      fecha_inicio: this.f.fecha_inicio.value,
      fecha_fin: this.f.fecha_fin.value,
      bloques: this.f.bloques.value,
      equipos: this.buildEquiposPayload(),
      integrantes: this.proyectoHabilitado ? this.integrantesSeleccionados() : []
    };
    if (this.grupoSeleccionado && this.grupoSeleccionado.id) {
      payload.grupo_id = this.grupoSeleccionado.id;
    }

    const token = localStorage.getItem('token') ?? '';
    this.api.validarMaximoPrestamo({
      equipos: payload.equipos,
      integrantes: payload.integrantes
    }).subscribe({
      next: res => {
        const bloqueos = res?.bloqueos || {};
        if (Object.keys(bloqueos).length > 0) {
          this.aplicarBloqueos(bloqueos);
          this.notify.error('Hay integrantes bloqueados por límite de préstamos.');
          return;
        }

        this.api.crearPrestamo(payload, token).subscribe({
          next: () => {
            this.notify.success('Solicitud enviada correctamente.');
            this.limpiar();
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
            if (err?.status === 422 && err?.error?.bloqueos) {
              this.aplicarBloqueos(err.error.bloqueos);
              this.notify.error('Hay integrantes bloqueados por límite de préstamos.');
              return;
            }
            this.notify.error(err?.error?.error || 'Ocurrió un error al enviar la solicitud.');
          }
        });
      },
      error: () => this.notify.error('No se pudo validar el máximo de préstamos.')
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
    this.integrantesSeleccionados.set([]);
    this.bloqueosIntegrantes = {};
    this.proyectoHabilitado = false;
    this.aceptaTerminos = false;
    this.grupoSeleccionado = null;
    this.grupoProyectoSeleccionado = 'nuevo';
    this.busquedaIntegrante.set(''); // Limpiar búsqueda
    this.f.nombre_proyecto.disable({ emitEvent: false });
    this.f.nombre_proyecto.setValue('', { emitEvent: false });
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

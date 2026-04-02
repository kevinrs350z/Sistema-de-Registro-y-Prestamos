@component('mail::message')

# Entrega de Prestamo Confirmada
**Departamento de Diseno Multimedia – Universidad de Tarapaca**

@if($destinatario === 'alumno')
Estimado(a) **{{ $nombreAlumno }}**,
Le informamos que los equipos de su prestamo han sido **entregados** exitosamente.
@else
Se ha realizado la entrega fisica del prestamo al alumno **{{ $nombreAlumno }}**.
@endif

---

## Detalles del Prestamo
- **Codigo de Prestamo:** {{ $idPrestamo }}
- **Fecha de Solicitud:** {{ $fechaSolicitud }}
- **Tipo:** {{ $tipo }}
- **Fecha de Entrega:** {{ $fechaEntrega }}
- **Entregado por:** {{ $nombreAdmin }}
@if($fechaInicio)
- **Fecha Inicio:** {{ $fechaInicio }}
@endif
@if($fechaFin)
- **Fecha Fin:** {{ $fechaFin }}
@endif

@if(!empty($equipos))
## Equipos Entregados
@foreach($equipos as $eq)
- **{{ $eq['nombre'] }}** (Codigo: {{ $eq['codigo'] }})
@endforeach
@endif

---

@if($destinatario === 'alumno')
Le recordamos que debe devolver el equipamiento en optimas condiciones y dentro del plazo establecido.
@else
Los equipos han sido entregados al alumno. Queda pendiente la devolucion.
@endif

Atentamente,
**Unidad de Prestamos de Equipamiento Docente**
Universidad de Tarapaca
@endcomponent

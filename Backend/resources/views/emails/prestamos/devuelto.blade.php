@component('mail::message')

# Devolucion de Prestamo Confirmada
**Departamento de Diseno Multimedia – Universidad de Tarapaca**

@if($destinatario === 'alumno')
Estimado(a) **{{ $nombreAlumno }}**,
Le informamos que la devolucion de su prestamo ha sido registrada exitosamente.
@else
El alumno **{{ $nombreAlumno }}** ha devuelto los equipos del prestamo.
@endif

---

## Detalles del Prestamo
- **Codigo de Prestamo:** {{ $idPrestamo }}
- **Fecha de Solicitud:** {{ $fechaSolicitud }}
- **Tipo:** {{ $tipo }}
- **Fecha de Devolucion:** {{ $fechaDevolucion }}
@if($fechaInicio)
- **Fecha Inicio:** {{ $fechaInicio }}
@endif
@if($fechaFin)
- **Fecha Fin:** {{ $fechaFin }}
@endif

@if(!empty($equipos))
## Equipos Devueltos
@foreach($equipos as $eq)
- **{{ $eq['nombre'] }}** (Codigo: {{ $eq['codigo'] }})
@endforeach
@endif

@if($motivo)
---

**Observacion de devolucion:**
> {{ $motivo }}
@endif

---

@if($destinatario === 'alumno')
Gracias por utilizar el servicio de prestamos. Los equipos han sido recibidos correctamente.
@else
Los equipos han sido reingresados al inventario.
@endif

Atentamente,
**Unidad de Prestamos de Equipamiento Docente**
Universidad de Tarapaca
@endcomponent

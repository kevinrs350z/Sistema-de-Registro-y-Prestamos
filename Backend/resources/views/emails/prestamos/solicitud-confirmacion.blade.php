@component('mail::message')

# Confirmacion de Solicitud de Prestamo
**Departamento de Diseno Multimedia – Universidad de Tarapaca**

Estimado(a) **{{ $nombreAlumno }}**,
Le informamos que su solicitud de prestamo ha sido registrada exitosamente y se encuentra **pendiente de revision**.

---

## Detalles de la Solicitud
- **Codigo de Prestamo:** {{ $idPrestamo }}
- **Fecha de Solicitud:** {{ $fechaSolicitud }}
- **Tipo:** {{ $tipo }}
@if($fechaInicio)
- **Fecha Inicio:** {{ $fechaInicio }}
@endif
@if($fechaFin)
- **Fecha Fin:** {{ $fechaFin }}
@endif

@if(!empty($equipos))
## Equipos Solicitados
@foreach($equipos as $eq)
- **{{ $eq['nombre'] }}** (Codigo: {{ $eq['codigo'] }})
@endforeach
@endif

@if($observacion)
---

**Observacion:**
> {{ $observacion }}
@endif

---

Un encargado revisara su solicitud a la brevedad. Recibira una notificacion cuando sea aprobada o rechazada.

Atentamente,
**Unidad de Prestamos de Equipamiento Docente**
Universidad de Tarapaca
@endcomponent

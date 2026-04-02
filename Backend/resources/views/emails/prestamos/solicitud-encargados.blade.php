@component('mail::message')

# Nueva Solicitud de Prestamo
**Departamento de Diseno Multimedia – Universidad de Tarapaca**

Se ha registrado una nueva solicitud de prestamo que requiere revision.

---

## Detalles de la Solicitud
- **Codigo de Prestamo:** {{ $idPrestamo }}
- **Solicitante:** {{ $nombreAlumno ?: 'Sin nombre' }}
- **Fecha de Solicitud:** {{ $fechaSolicitud }}
- **Tipo:** {{ $tipo }}
@if($fechaInicio)
- **Fecha Inicio:** {{ $fechaInicio }}
@endif
@if($fechaFin)
- **Fecha Fin:** {{ $fechaFin }}
@endif

@if(!empty($categorias))
## Categorias Involucradas
@foreach($categorias as $cat)
- {{ $cat }}
@endforeach
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

Atentamente,  
**Unidad de Prestamos de Equipamiento Docente**  
Universidad de Tarapaca  
@endcomponent

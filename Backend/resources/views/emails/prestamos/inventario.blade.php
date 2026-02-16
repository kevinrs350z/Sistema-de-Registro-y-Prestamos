@component('mail::message')

# Notificacion de Inventario - Prestamo Externo
**Departamento de Diseno Multimedia – Universidad de Tarapaca**

@php
$estadoTexto = match($estado) {
    'PENDIENTE' => 'NUEVA SOLICITUD DE SALIDA',
    'APROBADO' => 'SALIDA APROBADA',
    'ENTREGADO' => 'EQUIPOS ENTREGADOS - SALIDA EFECTIVA',
    'DEVUELTO' => 'EQUIPOS DEVUELTOS - REINGRESO',
    default => 'ACTUALIZACION',
};
@endphp

## {{ $estadoTexto }}

Se notifica que un prestamo de tipo **EXTERNO (fuera de la universidad)** ha cambiado al estado **{{ $estado }}**.
Esto implica que equipos del departamento salen o reingresan a las dependencias de la UTA.

---

## Detalles del Prestamo
- **Codigo de Prestamo:** {{ $idPrestamo }}
- **Solicitante:** {{ $nombreAlumno ?: 'Sin nombre' }}
- **Fecha de Solicitud:** {{ $fechaSolicitud }}
- **Estado Actual:** {{ $estado }}
- **Fecha de este evento:** {{ $fechaEvento }}
@if($fechaInicio)
- **Fecha Inicio Prestamo:** {{ $fechaInicio }}
@endif
@if($fechaFin)
- **Fecha Fin Prestamo:** {{ $fechaFin }}
@endif

@if(!empty($equipos))
## Equipos Involucrados
| Equipo | Codigo |
|--------|--------|
@foreach($equipos as $eq)
| {{ $eq['nombre'] }} | {{ $eq['codigo'] }} |
@endforeach
@endif

@if($observacion)
---

**Observacion:**
> {{ $observacion }}
@endif

---

Esta notificacion se genera automaticamente para fines de control de inventario.
Los equipos que salen de la universidad deben ser rendidos ante la unidad correspondiente.

Atentamente,
**Unidad de Prestamos de Equipamiento Docente**
Universidad de Tarapaca
@endcomponent

<?php
namespace App\Services\Reportes;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardOperationalService
{
    /**
     * KPIs OPERATIVOS PRINCIPALES
     * - Préstamos activos (estado APROBADO)
     * - Préstamos próximos a vencer (3 días)
     * - Préstamos vencidos (fecha_fin < hoy)
     * - Equipos disponibles
     */
    public function getKPIsOperativos()
    {
        $hoy = Carbon::now();
        $en3Dias = Carbon::now()->addDays(3);

        // Préstamos activos (APROBADO)
        $activosCount = DB::table('prestamos')
            ->where('estado', 'APROBADO')
            ->count();

        // Préstamos próximos a vencer (fecha_fin entre hoy y +3 días)
        $proximosAVencerCount = DB::table('prestamos')
            ->where('estado', 'APROBADO')
            ->whereNotNull('fecha_fin')
            ->whereBetween('fecha_fin', [$hoy, $en3Dias])
            ->count();

        // Préstamos vencidos (fecha_fin < hoy)
        $vencidosCount = DB::table('prestamos')
            ->where('estado', 'APROBADO')
            ->whereNotNull('fecha_fin')
            ->where('fecha_fin', '<', $hoy)
            ->count();

        // Equipos disponibles
        $disponiblesCount = DB::table('equipos')
            ->where('estado', 'DISPONIBLE')
            ->count();

        // Total de equipos
        $totalEquipos = DB::table('equipos')->count();

        // Porcentaje de disponibilidad
        $porcentajeDisponible = $totalEquipos > 0 
            ? round(($disponiblesCount / $totalEquipos) * 100, 1)
            : 0;

        return [
            'prestamosActivos' => $activosCount,
            'prestamosProximosAVencer' => $proximosAVencerCount,
            'prestamosVencidos' => $vencidosCount,
            'equiposDisponibles' => $disponiblesCount,
            'equiposTotales' => $totalEquipos,
            'porcentajeDisponibilidad' => $porcentajeDisponible,
        ];
    }

    /**
     * ESTADO DE INVENTARIO
     * Distribución de equipos por estado (DISPONIBLE, PRESTADO, MANTENIMIENTO, BAJA)
     */
    public function getEstadoInventario()
    {
        return DB::table('equipos')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get()
            ->map(function($item) {
                return [
                    'estado' => strtoupper($item->estado),
                    'total' => $item->total
                ];
            });
    }

    /**
     * DISPONIBILIDAD INMEDIATA
     */
    public function getDisponibilidadEquipos()
    {
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->select('e.id as id', 'e.codigo', 'te.nombre as tipo', 'e.estado', 'e.ubicacion', 'e.updated_at as ultimo_evento')
            ->orderByRaw("FIELD(estado, 'DISPONIBLE','PRESTADO','MANTENIMIENTO','BAJA')")
            ->get();
    }

    /**
     * EQUIPOS CRÍTICOS / BLOQUEADOS
     */
    public function getEquiposCriticos()
    {
        // Consideramos críticos los que están en MANTENIMIENTO o BAJA o con observación que indique bloqueo
        return DB::table('equipos as e')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->select('e.id as id', 'e.codigo', 'te.nombre as tipo', 'e.estado', 'e.observacion', 'e.updated_at')
            ->whereIn('estado', ['MANTENIMIENTO', 'BAJA'])
            ->orWhere('observacion', 'like', '%bloque%')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * ÚLTIMO EVENTO DEL EQUIPO
     */
    public function getEquipoUltimoEvento(int $idEquipo)
    {
        // Buscar el último préstamo / devolución asociado al equipo
        $evento = DB::table('prestamo_equipo as pe')
            ->join('prestamos as p', 'p.idPrestamo', '=', 'pe.idPrestamo')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->where('pe.idEquipo', $idEquipo)
            ->selectRaw("p.idPrestamo as prestamoId, p.estado as tipo_evento, p.created_at as fecha, CONCAT(per.Nombre,' ',per.apellido1) as usuario, p.observacion as nota")
            ->orderBy('p.created_at', 'desc')
            ->first();

        return $evento;
    }

    /**
     * PRÉSTAMOS ACTIVOS POR PROFESOR
     */
    public function getPrestamosActivosPorProfesor(int $idUser)
    {
        return DB::table('prestamos')
            ->where('idUser', $idUser)
            ->where('estado', 'APROBADO')
            ->select('idPrestamo as idPrestamo', 'tipo', 'fecha_inicio', 'fecha_fin')
            ->get();
    }

    /**
     * PRÉSTAMOS PRÓXIMOS A VENCER (3 días)
     */
    public function getPrestamosProximosPorProfesor(int $idUser)
    {
        $hoy = Carbon::now();
        $en3 = Carbon::now()->addDays(3);

        return DB::table('prestamos')
            ->where('idUser', $idUser)
            ->where('estado', 'APROBADO')
            ->whereNotNull('fecha_fin')
            ->whereBetween('fecha_fin', [$hoy, $en3])
            ->select('idPrestamo as idPrestamo', 'tipo', 'fecha_inicio', 'fecha_fin')
            ->get();
    }

    /**
     * RIESGOS OPERATIVOS PARA PROFESOR
     */
    public function getRiesgosPorProfesor(int $idUser)
    {
        // conteo de equipos críticos bajo su responsabilidad y préstamos próximos
        $equiposCriticos = DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.idEquipo', '=', 'pe.idEquipo')
            ->where('p.idUser', $idUser)
            ->whereIn('e.estado', ['MANTENIMIENTO', 'BAJA'])
            ->count();

        $proximos = $this->getPrestamosProximosPorProfesor($idUser)->count();

        // score simple
        $score = max(0, 100 - ($equiposCriticos * 20) - ($proximos * 10));

        return [
            'equiposCriticos' => $equiposCriticos,
            'prestamosProximos' => $proximos,
            'scoreRiesgo' => $score,
        ];
    }

    /**
     * RESPONSABILIDAD ACTUAL – equipos asociados al profesor (préstamos aprobados)
     */
    public function getResponsabilidadPorProfesor(int $idUser)
    {
        return DB::table('prestamos as p')
            ->join('prestamo_equipo as pe', 'pe.idPrestamo', '=', 'p.idPrestamo')
            ->join('equipos as e', 'e.id', '=', 'pe.idEquipo')
            ->join('tipo_equipos as te', 'te.id', '=', 'e.tipo_equipo_id')
            ->where('p.idUser', $idUser)
            ->where('p.estado', 'APROBADO')
            ->select('e.id as id', 'e.codigo', 'te.nombre as tipo', 'e.estado', 'p.fecha_fin as fecha_asignacion')
            ->get();
    }

    /**
     * ALERTAS PARA PROFESOR (vencimientos próximos y sanciones)
     */
    public function getAlertasPorProfesor(int $idUser)
    {
        $hoy = Carbon::now();
        $en3 = Carbon::now()->addDays(3);

        $vencimientos = DB::table('prestamos')
            ->where('idUser', $idUser)
            ->where('estado', 'APROBADO')
            ->whereNotNull('fecha_fin')
            ->whereBetween('fecha_fin', [$hoy, $en3])
            ->select('idPrestamo as prestamoId', 'fecha_fin')
            ->get();

        $sanciones = DB::table('user_sancion as us')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->where('us.idUser', $idUser)
            ->where('s.estado', 'ACTIVA')
            ->select('s.idSancion as sancionId', 's.nivel', 's.fecha_fin')
            ->get();

        return [
            'vencimientos' => $vencimientos,
            'sanciones' => $sanciones
        ];
    }

    /**
     * ALERTAS CRÍTICAS
     * Usuarios con más retrasos, sanciones activas, equipos con problemas
     */
    public function getAlertasCriticas()
    {
        // Usuarios con más préstamos vencidos
        $retrasos = DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->where('p.estado', 'APROBADO')
            ->whereNotNull('p.fecha_fin')
            ->where('p.fecha_fin', '<', Carbon::now())
            ->selectRaw("
                CONCAT(per.Nombre,' ',per.apellido1) as nombre,
                u.Email as email,
                COUNT(*) as retrasos
            ")
            ->groupBy('u.idUser', 'per.Nombre', 'per.apellido1', 'u.Email')
            ->orderByDesc('retrasos')
            ->take(5)
            ->get();

        // Sanciones activas
        $sanciones = DB::table('user_sancion as us')
            ->join('users as u', 'u.idUser', '=', 'us.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->join('sancions as s', 's.idSancion', '=', 'us.idSancion')
            ->where('s.estado', 'ACTIVA')
            ->selectRaw("
                CONCAT(per.Nombre,' ',per.apellido1) as nombre,
                u.Email as email,
                s.nivel as nivel_sancion,
                s.fecha_fin as fecha_vencimiento
            ")
            ->orderBy('s.fecha_fin')
            ->take(5)
            ->get();

        return [
            'retrasos' => $retrasos,
            'sanciones' => $sanciones,
            'totalRetrasos' => DB::table('prestamos')
                ->where('estado', 'APROBADO')
                ->whereNotNull('fecha_fin')
                ->where('fecha_fin', '<', Carbon::now())
                ->count(),
            'totalSanciones' => DB::table('sancions')
                ->where('estado', 'ACTIVA')
                ->count(),
        ];
    }

    /**
     * ACTIVIDAD RECIENTE
     * Últimos préstamos y devoluciones
     */
    public function getActividadReciente()
    {
        return DB::table('prestamos as p')
            ->join('users as u', 'u.idUser', '=', 'p.idUser')
            ->join('persona as per', 'per.idPersona', '=', 'u.idPersona')
            ->selectRaw("
                CONCAT(per.Nombre,' ',per.apellido1) as usuario,
                p.estado as estado_prestamo,
                p.tipo as tipo_prestamo,
                p.created_at as fecha_solicitud,
                p.fecha_fin as fecha_vencimiento,
                CASE 
                    WHEN p.estado = 'APROBADO' AND p.fecha_fin < NOW() THEN 'Vencido'
                    WHEN p.estado = 'DEVUELTO' THEN 'Devuelto'
                    WHEN p.estado = 'APROBADO' THEN 'Activo'
                    WHEN p.estado = 'PENDIENTE' THEN 'Pendiente'
                    ELSE 'Otro'
                END as estado_actual
            ")
            ->orderBy('p.created_at', 'desc')
            ->take(8)
            ->get();
    }

    /**
     * SALUD DEL SISTEMA
     * Indicador general de la salud operativa
     */
    public function getSaludSistema()
    {
        $kpis = $this->getKPIsOperativos();
        
        // Calcular score de salud (0-100)
        $score = 100;
        
        // Penalizar por vencidos
        $score -= $kpis['prestamosVencidos'] * 5;
        
        // Penalizar por baja disponibilidad
        if ($kpis['porcentajeDisponibilidad'] < 30) {
            $score -= 20;
        } elseif ($kpis['porcentajeDisponibilidad'] < 50) {
            $score -= 10;
        }
        
        // Penalizar por sanciones activas
        $sancionesActivas = DB::table('sancions')
            ->where('estado', 'ACTIVA')
            ->count();
        $score -= $sancionesActivas * 2;
        
        // Asegurar que no baje de 0 ni suba de 100
        $score = max(0, min(100, $score));
        
        // Determinar estado
        if ($score >= 80) {
            $estado = 'Excelente';
            $color = 'success';
        } elseif ($score >= 60) {
            $estado = 'Bueno';
            $color = 'info';
        } elseif ($score >= 40) {
            $estado = 'Advertencia';
            $color = 'warning';
        } else {
            $estado = 'Crítico';
            $color = 'danger';
        }

        return [
            'score' => $score,
            'estado' => $estado,
            'color' => $color,
        ];
    }
}

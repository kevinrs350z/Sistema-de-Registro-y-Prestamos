<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migración principal:  sistema de sanciones v2.
 *
 * — Añade campos individuales a user_sancion (cada registro es una sanción única)
 * — Crea tabla historial_sanciones (log inmutable)
 * — Crea tabla configuracion_sanciones (parámetros configurables)
 * — Agrega nivel GRAVISIMA al catálogo
 * — Amplía el enum estado en sancions
 */
return new class extends Migration {

    public function up(): void
    {
        // ────────────────────────────────────────────────────
        // 1. Ampliar user_sancion con campos individuales
        // ────────────────────────────────────────────────────
        Schema::table('user_sancion', function (Blueprint $table) {
            $table->string('nivel', 20)->nullable()->after('idSancion');
            $table->string('estado_sancion', 30)->default('ACTIVA')->after('nivel');
            $table->string('categoria_falta', 40)->nullable()->after('estado_sancion');
            $table->date('fecha_inicio')->nullable()->after('categoria_falta');
            $table->date('fecha_fin')->nullable()->after('fecha_inicio');
            $table->unsignedBigInteger('escalada_desde_id')->nullable()->after('prestamo_id');
            $table->string('periodo_academico', 10)->nullable()->after('escalada_desde_id');

            $table->index('estado_sancion');
            $table->index('nivel');
            $table->index('categoria_falta');
            $table->index('periodo_academico');
        });

        // ────────────────────────────────────────────────────
        // 2. Tabla historial_sanciones
        // ────────────────────────────────────────────────────
        Schema::create('historial_sanciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_sancion_id');
            $table->string('accion', 30);          // ASIGNACION, AMPLIACION, ESCALAMIENTO, etc.
            $table->string('estado_anterior', 30)->nullable();
            $table->string('estado_nuevo', 30)->nullable();
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('ejecutado_por')->nullable();
            $table->boolean('es_automatico')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_sancion_id')->references('id')->on('user_sancion')->onDelete('cascade');
            $table->foreign('ejecutado_por')->references('idUser')->on('users')->onDelete('set null');
            $table->index(['user_sancion_id', 'created_at']);
        });

        // ────────────────────────────────────────────────────
        // 3. Tabla configuracion_sanciones
        // ────────────────────────────────────────────────────
        Schema::create('configuracion_sanciones', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 60)->unique();
            $table->string('valor', 255);
            $table->text('descripcion')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
        });

        // Seed configuración por defecto
        DB::table('configuracion_sanciones')->insert([
            ['clave' => 'escalamiento_leve_limite',  'valor' => '3', 'descripcion' => 'Cuántas LEVES → 1 MEDIA'],
            ['clave' => 'escalamiento_media_limite',  'valor' => '2', 'descripcion' => 'Cuántas MEDIAS → 1 GRAVE'],
            ['clave' => 'escalamiento_grave_limite',  'valor' => '2', 'descripcion' => 'Cuántas GRAVES → 1 GRAVISIMA'],
            ['clave' => 'ventana_reincidencia_dias',  'valor' => '180', 'descripcion' => 'Días de la ventana deslizante (~1 semestre)'],
            ['clave' => 'duracion_leve_dias',         'valor' => '5',   'descripcion' => 'Duración base sanción LEVE'],
            ['clave' => 'duracion_media_dias',        'valor' => '10',  'descripcion' => 'Duración base sanción MEDIA'],
            ['clave' => 'duracion_grave_dias',        'valor' => '21',  'descripcion' => 'Duración base sanción GRAVE'],
            ['clave' => 'duracion_gravisima_dias',    'valor' => '60',  'descripcion' => 'Duración base sanción GRAVISIMA'],
            ['clave' => 'ampliacion_dias_default',    'valor' => '7',   'descripcion' => 'Días de ampliación estándar'],
        ]);

        // ────────────────────────────────────────────────────
        // 4. Agregar GRAVISIMA al catálogo de sanciones
        // ────────────────────────────────────────────────────
        $existe = DB::table('sancions')
            ->whereRaw("UPPER(nivel) = 'GRAVISIMA'")
            ->exists();

        if (! $existe) {
            DB::table('sancions')->insert([
                'nivel'        => 'GRAVISIMA',
                'descripcion'  => 'Bloqueo total — derivación a comité e instancias superiores',
                'estado'       => 'ACTIVA',
                'fecha_inicio' => now()->toDateString(),
                'fecha_fin'    => now()->addDays(60)->toDateString(),
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        // ────────────────────────────────────────────────────
        // 5. Ampliar enum estado en sancions
        //    MySQL requiere ALTER COLUMN para cambiar ENUM.
        // ────────────────────────────────────────────────────
        DB::statement("ALTER TABLE sancions MODIFY COLUMN estado VARCHAR(30) DEFAULT 'ACTIVA'");

        // ────────────────────────────────────────────────────
        // 6. Rellenar user_sancion existentes con datos del catálogo
        // ────────────────────────────────────────────────────
        DB::statement("
            UPDATE user_sancion us
            JOIN sancions s ON s.idSancion = us.idSancion
            SET us.nivel          = s.nivel,
                us.estado_sancion = COALESCE(s.estado, 'ACTIVA'),
                us.fecha_inicio   = s.fecha_inicio,
                us.fecha_fin      = s.fecha_fin
            WHERE us.nivel IS NULL
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_sanciones');
        Schema::dropIfExists('configuracion_sanciones');

        Schema::table('user_sancion', function (Blueprint $table) {
            $table->dropIndex(['estado_sancion']);
            $table->dropIndex(['nivel']);
            $table->dropIndex(['categoria_falta']);
            $table->dropIndex(['periodo_academico']);
            $table->dropColumn([
                'nivel', 'estado_sancion', 'categoria_falta',
                'fecha_inicio', 'fecha_fin', 'escalada_desde_id', 'periodo_academico'
            ]);
        });

        DB::table('sancions')->whereRaw("UPPER(nivel) = 'GRAVISIMA'")->delete();
        DB::statement("ALTER TABLE sancions MODIFY COLUMN estado ENUM('ACTIVA','EXPIRADA') DEFAULT 'ACTIVA'");
    }
};

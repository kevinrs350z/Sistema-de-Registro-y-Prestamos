<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;
use App\Models\Categoria;

class User extends Authenticatable implements CanResetPasswordContract
{
    use HasApiTokens, HasFactory, Notifiable, CanResetPassword;

     protected $table = 'users'; 
     protected $primaryKey = 'idUser'; 
     // ISO 27001 — A.14.2.5: Solo $fillable define campos asignables masivamente
     // protected $guarded = []; // REMOVIDO — $fillable ya restringe los campos
     protected $password = 'Contrasena'; 
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'idPersona',
        'Contrasena',
        'estadoSancion',
        'Email',
        'estado',
        'bloqueado',
        'bloqueado_motivo',
        'bloqueado_fecha',
        'bloqueado_por',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'Contrasena',
        'remember_token',
    ];
    public function getAuthPassword()
    {
        return $this->Contrasena;
    }
    public function getAuthIdentifierName()
    {
        return 'idUser';
    }
    public function getAuthIdentifier()
    {
        return $this->{$this->getAuthIdentifierName()};
    }
        
    public function getRememberToken()
    {
        return $this->{$this->getRememberTokenName()};
    }

    public function setRememberToken($value)
    {
        $this->{$this->getRememberTokenName()} = $value;
    }

    public function getRememberTokenName()
    {
        return 'remember_token';
    }
    public function persona()
    {
        // belongsTo(Modelo, clave_foranea_local, clave_primaria_remota)
        return $this->belongsTo(Persona::class, 'idPersona', 'idPersona');
    }
        public function roles()
    {
        // belongsToMany(Modelo, tabla_pivote, clave_local, clave_relacionada)
        return $this->belongsToMany(Rol::class, 'rol_user', 'idUser', 'idRol');
    }
    public function sanciones()
    {
        return $this->belongsToMany(Sancion::class, 'user_sancion', 'idUser', 'idSancion')
            ->withPivot([
                'id', 'assigned_by', 'prestamo_id', 'descripcion', 'accion',
                'nivel', 'estado_sancion', 'categoria_falta',
                'fecha_inicio', 'fecha_fin', 'escalada_desde_id', 'periodo_academico',
                'created_at',
            ])
            ->withTimestamps();
    }

    /** Registros individuales de sanciones (relación directa al pivot). */
    public function sancionesIndividuales()
    {
        return $this->hasMany(\App\Models\UserSancion::class, 'idUser', 'idUser');
    }

     // Verifica si el usuario tiene un rol específico
    public function hasRole($rolNombre)
    {
        return $this->roles()
                    ->whereRaw('LOWER(nombre) = ?', [strtolower($rolNombre)])
                    ->exists();
    }

    //Verifica si el usuario es ADMIN
    public function isAdmin()
    {
        return $this->hasRole('ADMIN');
    }

    public function isAdminOrSuper(): bool
    {
        return $this->hasRole('ADMIN') || $this->hasRole('SUPER_USUARIO');
    }

    /**
     * Categorias donde el usuario es encargado.
     */
    public function categoriasEncargadas()
    {
        return $this->belongsToMany(
            Categoria::class,
            'categoria_encargado',
            'user_id',
            'categoria_id',
            'idUser',
            'id'
        )->withTimestamps();
    }

    /**
     * Historial de cambios de estado que este usuario registró.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function historialCambiosPrestamo()
    {
        return $this->hasMany(PrestamoHistorial::class, 'idUser', 'idUser');
    }

   
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'bloqueado' => 'boolean',
        'bloqueado_fecha' => 'datetime',
    ];

}

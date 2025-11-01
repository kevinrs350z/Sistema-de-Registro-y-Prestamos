<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;

class User extends Authenticatable implements CanResetPasswordContract
{
    use HasApiTokens, HasFactory, Notifiable, CanResetPassword;

     protected $table = 'users'; 
     protected $primaryKey = 'idUser'; 
     protected $guarded = [];
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
        return $this->belongsToMany(Sancion::class, 'user_sancion', 'idUser', 'idSancion');
    }

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

}

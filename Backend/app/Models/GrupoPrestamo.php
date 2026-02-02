<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrupoPrestamo extends Model
{
    use HasFactory;
    protected $table = 'grupo_prestamo';
    protected $fillable = ['grupo_id', 'prestamo_id'];
}

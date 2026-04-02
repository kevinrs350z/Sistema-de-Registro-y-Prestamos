<?php

namespace App\Http\Controllers;

use App\Models\MotivoRechazo;
use Illuminate\Http\Request;

class MotivoRechazoController extends Controller
{
    public function index()
    {
        $motivos = MotivoRechazo::all();
        return response()->json($motivos);
    }
}

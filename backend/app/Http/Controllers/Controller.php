<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Gate;

abstract class Controller
{
    public function authorize(mixed $ability, mixed $arguments = []): mixed
    {
        return Gate::authorize($ability, $arguments);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Authorize a given action for the current user.
     * Compatible with Laravel 11/12/13 and standalone execution.
     */
    public function authorize(mixed $ability, mixed $arguments = []): mixed
    {
        if (class_exists(\Illuminate\Support\Facades\Gate::class)) {
            return \Illuminate\Support\Facades\Gate::authorize($ability, $arguments);
        }

        return true;
    }
}

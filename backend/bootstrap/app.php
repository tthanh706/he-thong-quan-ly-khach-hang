<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [HandleCors::class]);
        $middleware->alias([
            'session.auth' => \App\Http\Middleware\CheckSession::class,
            'admin.role' => \App\Http\Middleware\RequireAdminRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API exceptions use Laravel's default JSON negotiation.
    })->create();

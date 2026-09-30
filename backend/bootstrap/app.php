<?php

use App\Http\Middleware\ResolveDataScope;
use App\Support\AccessDenied;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'scope' => ResolveDataScope::class,
        ]);

        // API khong can CSRF, nhan JSON
        $middleware->validateCsrfTokens(except: ['api/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Loi phan quyen tra ve 403 kem thong diep tieng Viet
        $exceptions->render(function (AccessDenied $e, Request $request) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'AccessDeniedError',
                'entity' => $e->entity,
                'record_id' => $e->recordId,
                'scope' => $e->scope->value,
                'action' => $e->action,
            ], 403);
        });
    })
    ->create();

<?php

namespace App\Exceptions;

use App\Services\ErrorActionResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Có thể tích hợp Sentry/Flare tại đây.
        });
    }

    public function render($request, Throwable $e): Response|JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        $statusCode = $this->resolveStatusCode($e);

        if ($statusCode === null) {
            return parent::render($request, $e);
        }

        if ($request->expectsJson()) {
            return $this->renderJson($request, $statusCode);
        }

        return $this->renderWeb($request, $statusCode);
    }

    private function resolveStatusCode(Throwable $e): ?int
    {
        return match (true) {
            $e instanceof ValidationException => null,
            $e instanceof AuthenticationException => 401,
            $e instanceof AuthorizationException => 403,
            $e instanceof ModelNotFoundException => 404,
            $e instanceof TokenMismatchException => 419,
            $e instanceof HttpExceptionInterface => match ($e->getStatusCode()) {
                401, 403, 404, 419, 500 => $e->getStatusCode(),
                default => null,
            },
            default => 500,
        };
    }

    private function renderWeb(Request $request, int $statusCode): Response
    {
        $action = app(ErrorActionResolver::class)->resolve($statusCode, $request);

        return response()->view('errors.show', [
            'statusCode' => $statusCode,
            'action' => $action,
        ], $statusCode);
    }

    private function renderJson(Request $request, int $statusCode): JsonResponse
    {
        $action = app(ErrorActionResolver::class)->resolve($statusCode, $request);

        return response()->json([
            'success' => false,
            'error' => [
                'status_code' => $statusCode,
                'title' => $action['title'],
                'message' => $action['message'],
                'primary_action' => $action['primary_action'],
                'secondary_action' => $action['secondary_action'],
            ],
        ], $statusCode);
    }
}

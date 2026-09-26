<?php

namespace App\Exceptions;

use App\Services\ErrorActionResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
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
            //
        });
    }

    /**
     * Ghi đè render() để mọi lỗi 401/403/404/419/500 đều đi qua
     * trang lỗi dùng chung (SCRUM-91) thay vì trang trắng mặc định
     * của Laravel, kèm theo hành động gợi ý tiếp theo.
     */
    public function render($request, Throwable $e)
    {
        $statusCode = $this->resolveStatusCode($e);

        if ($statusCode === null) {
            return parent::render($request, $e);
        }

        // API request -> trả JSON có cấu trúc, FE tự render UI
        if ($request->expectsJson()) {
            return $this->renderJson($request, $statusCode, $e);
        }

        // Web request -> render Blade view dùng chung errors.show
        return $this->renderWeb($request, $statusCode);
    }

    private function resolveStatusCode(Throwable $e): ?int
    {
        return match (true) {
            $e instanceof AuthenticationException => 401,
            $e instanceof AuthorizationException   => 403,
            $e instanceof ModelNotFoundException    => 404,
            $e instanceof TokenMismatchException    => 419,
            $e instanceof HttpExceptionInterface    => match ($e->getStatusCode()) {
                401, 403, 404, 419, 500 => $e->getStatusCode(),
                default => null,
            },
            default => null,
        };
    }

    private function renderWeb(Request $request, int $statusCode)
    {
        $action = app(ErrorActionResolver::class)->resolve($statusCode, $request);

        return response()
            ->view('errors.show', [
                'statusCode' => $statusCode,
                'action'     => $action,
            ], $statusCode);
    }

    private function renderJson(Request $request, int $statusCode, Throwable $e)
    {
        $action = app(ErrorActionResolver::class)->resolve($statusCode, $request);

        return response()->json([
            'success' => false,
            'error'   => [
                'status_code'      => $statusCode,
                'title'            => $action['title'],
                'message'          => $action['message'],
                'primary_action'   => $action['primary_action'],
                'secondary_action' => $action['secondary_action'],
            ],
        ], $statusCode);
    }
}

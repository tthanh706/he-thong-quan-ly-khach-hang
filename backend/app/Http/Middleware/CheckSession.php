<?php

namespace App\Http\Middleware;

use App\Services\SessionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSession
{
    public function __construct(private SessionService $sessionService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $session = $token ? $this->sessionService->validate($token) : null;

        if (!$session) {
            return response()->json([
                'success' => false,
                'code' => 'SESSION_EXPIRED',
                'message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
            ], 401);
        }

        $this->sessionService->refresh($session);
        $request->attributes->set('current_session', $session);
        $request->attributes->set('current_user', $session->user);
        auth()->setUser($session->user);
        $request->setUserResolver(fn () => $session->user);

        return $next($request);
    }
}

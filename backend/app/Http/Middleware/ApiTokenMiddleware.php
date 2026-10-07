<?php
namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');
        if (!preg_match('/^Bearer\\s+(.+)$/i', $header, $matches)) {
            return response()->json(['status' => 'error', 'message' => 'Chưa xác thực.'], 401);
        }
        $token = $matches[1];
        $record = ApiToken::with(['user.businessGroup', 'user.permissions'])
            ->where('token_hash', hash('sha256', $token))->first();
        if (!$record || ($record->expires_at && $record->expires_at->isPast())) {
            return response()->json(['status' => 'error', 'message' => 'Token không hợp lệ hoặc đã hết hạn.'], 401);
        }
        $request->setUserResolver(fn () => $record->user);
        return $next($request);
    }
}

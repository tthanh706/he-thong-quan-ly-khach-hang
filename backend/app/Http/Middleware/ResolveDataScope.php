<?php

namespace App\Http\Middleware;

use App\Support\PermissionMatrix;
use App\Support\ScopeResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Doc pham vi du lieu nguoi dung chon (header `X-Data-Scope` hoac query `scope`)
 * va gan vao request de cac controller khong phai tu xu ly lai.
 *
 * Pham vi vuot quyen se bi ha ve pham vi mac dinh cua vai tro (chong nang quyen).
 */
class ResolveDataScope
{
    public function __construct(private readonly ScopeResolver $resolver) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $requested = $request->header('X-Data-Scope') ?? $request->query('scope');

        $scope = $this->resolver->currentScope($user, $requested);

        $request->attributes->set('scope', $scope->value);
        $request->attributes->set('scope_label', $scope->label());
        $request->attributes->set('scope_is_default', $requested === null || $requested === $scope->value);

        // Front-end can biet pham vi thuc su duoc ap dung de hien thi canh bao
        $request->attributes->set('permissions', PermissionMatrix::describe($user->role));

        return $next($request);
    }
}

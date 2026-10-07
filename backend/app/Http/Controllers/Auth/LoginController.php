<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LoginController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * Hiển thị form đăng nhập.
     */
    public function showLoginForm(Request $request): View
    {
        return view('auth.login', [
            'redirect' => $request->query('redirect', route('dashboard')),
        ]);
    }

    /**
     * Xử lý đăng nhập.
     * Nếu sai thông tin -> AuthenticationException -> Handler -> 401.
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $user = $this->authService->login($request->validated());

        $redirect = $request->input('redirect', route('dashboard'));

        return redirect()->intended($redirect)
                         ->with('success', "Chào mừng, {$user->name}!");
    }

    /**
     * Đăng xuất.
     */
    public function logout(Request $request): RedirectResponse
    {
        $this->authService->logout();

        return redirect()->route('login')->with('info', 'Bạn đã đăng xuất.');
    }
}

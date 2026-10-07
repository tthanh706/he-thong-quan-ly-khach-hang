<?php

use Illuminate\Support\Facades\Route;

// Ví dụ: route chỉ dành cho user có quyền 'manage-users'
// Nếu không đủ quyền -> CheckPermission ném AuthorizationException
// -> Handler::render() bắt -> hiển thị trang errors.show (403)
Route::middleware(['auth', 'permission:manage-users'])->group(function () {
    Route::get('/admin/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])
        ->name('admin.users.index');
});

// Route đăng nhập dùng làm đích chuyển hướng khi gặp 401
Route::get('/login', [\App\Http\Controllers\Auth\LoginController::class, 'showLoginForm'])
    ->name('login');

Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->name('dashboard');

<?php

use App\Http\Controllers\Auth\ForgotPasswordController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - AUTH-102 Password Reset Flow
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('password.request');
});

// Mock Login route for redirect after reset
Route::get('/login', function () {
    return '<h1>Màn Hình Đăng Nhập</h1><p>' . session('status') . '</p>';
})->name('login');

// 1. Quên mật khẩu - Xem form nhập email
Route::get('/forgot-password', [ForgotPasswordController::class, 'showLinkRequestForm'])
    ->middleware('guest')
    ->name('password.request');

// 2. Quên mật khẩu - Gửi email (Áp dụng Rate Limit 3 lần / 10 phút)
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])
    ->middleware(['guest', 'throttle:3,10'])
    ->name('password.email');

// 3. Đặt lại mật khẩu - Form đổi mật khẩu mới qua token 30m
Route::get('/reset-password/{token}', [ForgotPasswordController::class, 'showResetForm'])
    ->middleware('guest')
    ->name('password.reset');

// 4. Đặt lại mật khẩu - Xử lý lưu mật khẩu mới
Route::post('/reset-password', [ForgotPasswordController::class, 'reset'])
    ->middleware('guest')
    ->name('password.update');

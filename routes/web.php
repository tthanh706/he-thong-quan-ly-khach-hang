<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

// Trang đăng nhập
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');

// Xử lý đăng nhập
Route::post('/login', [AuthController::class, 'login']);

// Đăng xuất
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

// Trang Admin
Route::get('/admin', function () {
    return view('admin');
})->middleware('auth');

// Trang Dashboard
Route::get('/dashboard', function () {
    return 'Chào mừng bạn đến CRM!';
})->middleware('auth');

// Khóa tài khoản và bàn giao dữ liệu
Route::post('/api/users/{user}/lock', [UserManagementController::class, 'lock'])
    ->middleware('auth');

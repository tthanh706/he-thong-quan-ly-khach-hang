<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\MenuController;

// Trang đăng nhập
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');

// Xử lý đăng nhập
Route::post('/login', [AuthController::class, 'login']);

// Đăng xuất
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

// Trang Admin
Route::get('/admin', function () {
    return redirect('/dashboard');
})->middleware(['auth', 'role:admin']);

// Trang Dashboard
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'role:admin,sales,manager']);

Route::get('/api/me', [MenuController::class, 'me'])->middleware('auth');

Route::view('/customers', 'dashboard')->middleware(['auth', 'role:admin,sales,manager']);
Route::view('/opportunities', 'dashboard')->middleware(['auth', 'role:admin,sales,manager']);
Route::view('/reports', 'dashboard')->middleware(['auth', 'role:admin,manager']);
Route::view('/admin/users', 'dashboard')->middleware(['auth', 'role:admin']);

// Khóa tài khoản và bàn giao dữ liệu
Route::post('/api/users/{user}/lock', [UserManagementController::class, 'lock'])
    ->middleware('auth');
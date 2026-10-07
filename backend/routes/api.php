<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\V1\AvatarController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\UserImportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\HandoverLogController;
use App\Http\Controllers\OpportunityController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('session.auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('admin.role')->group(function (): void {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts/{user}/lock', [AccountController::class, 'lock']);
        Route::get('/handover-logs', [HandoverLogController::class, 'index']);
    });

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/opportunities', [OpportunityController::class, 'index']);
});

/*
| Sprint 2 – API chuẩn /api/v1 (Convention mục 7)
*/
Route::prefix('v1')->middleware('session.auth')->group(function (): void {
    // S2-02: Hồ sơ cá nhân & chữ ký email
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);

    // S2-03: Ảnh đại diện
    Route::post('/profile/avatar', [AvatarController::class, 'store']);
    Route::delete('/profile/avatar', [AvatarController::class, 'destroy']);

    // S2-01: Nhập người dùng hàng loạt (chỉ quản trị hệ thống)
    Route::middleware('admin.role')->group(function (): void {
        Route::get('/users/import/template', [UserImportController::class, 'template']);
        Route::post('/users/import', [UserImportController::class, 'store']);
    });
});

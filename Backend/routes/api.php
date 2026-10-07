<?php

use App\Http\Controllers\Api\V1\SalesTargetController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

// Đăng nhập
Route::post('/login', [AuthController::class, 'login']);

// Các API yêu cầu phiên đăng nhập hợp lệ
Route::middleware('session.auth')->group(function () {
    // Kiểm tra phiên và lấy thông tin user hiện tại
    Route::get('/me', [SessionController::class, 'me']);

    // Đăng xuất
    Route::post('/logout', [SessionController::class, 'logout']);

    // Xem và lọc Audit Log
    Route::get(
        '/v1/audit-logs',
        [AuditLogController::class, 'index']
    );
    Route::patch(
        '/v1/users/{user}/role',
        [UserController::class, 'updateRole']
    );
    Route::patch(
        '/v1/customers/{customer}/owner',
        [CustomerController::class, 'updateOwner']
    );
    Route::patch(
        '/v1/quotes/{quote}/discount',
        [QuoteController::class, 'updateDiscount']
    );
    Route::patch(
        '/v1/sales-targets/{salesTarget}',
        [SalesTargetController::class, 'update']
    );
});
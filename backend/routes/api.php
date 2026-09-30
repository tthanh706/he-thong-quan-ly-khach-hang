<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OpportunityController;
use App\Http\Controllers\Api\QuoteController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'scope'])->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    /**
     * 4 module cung mot bo API: xem / them / sua / xoa / xuat Excel.
     * Moi route deu nhan `X-Data-Scope` de ap dung pham vi du lieu cua nguoi dang nhap.
     */
    $modules = [
        'customers' => CustomerController::class,
        'opportunities' => OpportunityController::class,
        'activities' => ActivityController::class,
        'quotes' => QuoteController::class,
    ];

    foreach ($modules as $uri => $controller) {
        // Export khai bao truoc route {id} de tranh bi Route::get('/{id}') an
        Route::get("/{$uri}/export", [$controller, 'export']);
        Route::get("/{$uri}", [$controller, 'index']);
        Route::post("/{$uri}", [$controller, 'store']);
        Route::get("/{$uri}/{id}", [$controller, 'show'])->whereNumber('id');
        Route::match(['put', 'patch'], "/{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
        Route::delete("/{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
    }
});

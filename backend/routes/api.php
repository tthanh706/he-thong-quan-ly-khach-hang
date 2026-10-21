<?php

use App\Http\Controllers\Api\V1\CustomerImportController;
use App\Http\Controllers\Api\V1\PeriodicCareController;
use App\Http\Controllers\Api\V1\SupportRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - CRM System
| Base: /api/v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

    // ============================================================
    // US-06: API Nhập Excel khách hàng
    // ============================================================
    Route::prefix('customers/import')->group(function () {
        Route::get('/template', [CustomerImportController::class, 'downloadTemplate'])
            ->name('customers.import.template');

        Route::post('/preview', [CustomerImportController::class, 'preview'])
            ->name('customers.import.preview');

        Route::post('/confirm', [CustomerImportController::class, 'confirm'])
            ->name('customers.import.confirm');
    });

    // ============================================================
    // US-08: API Yêu cầu hỗ trợ + Cảnh báo
    // ============================================================
    Route::prefix('support-requests')->group(function () {
        // Đặt /warnings trước /{id} để tránh conflict
        Route::get('/warnings', [SupportRequestController::class, 'warnings'])
            ->name('support-requests.warnings');

        Route::get('/', [SupportRequestController::class, 'index'])
            ->name('support-requests.index');

        Route::post('/', [SupportRequestController::class, 'store'])
            ->name('support-requests.store');

        Route::get('/{id}', [SupportRequestController::class, 'show'])
            ->name('support-requests.show')
            ->whereNumber('id');

        Route::patch('/{id}', [SupportRequestController::class, 'update'])
            ->name('support-requests.update')
            ->whereNumber('id');

        Route::post('/{id}/assign', [SupportRequestController::class, 'assign'])
            ->name('support-requests.assign')
            ->whereNumber('id');

        Route::delete('/{id}', [SupportRequestController::class, 'destroy'])
            ->name('support-requests.destroy')
            ->whereNumber('id');
    });

    // ============================================================
    // US-09: API Chăm sóc định kỳ + Cảnh báo
    // ============================================================
    Route::prefix('periodic-cares')->group(function () {
        // Phải đặt /warnings trước /{id} để tránh conflict
        Route::get('/warnings', [PeriodicCareController::class, 'warnings'])
            ->name('periodic-cares.warnings');

        Route::get('/', [PeriodicCareController::class, 'index'])
            ->name('periodic-cares.index');

        Route::post('/', [PeriodicCareController::class, 'store'])
            ->name('periodic-cares.store');

        Route::get('/{id}', [PeriodicCareController::class, 'show'])
            ->name('periodic-cares.show')
            ->whereNumber('id');

        Route::patch('/{id}', [PeriodicCareController::class, 'update'])
            ->name('periodic-cares.update')
            ->whereNumber('id');

        Route::post('/{id}/mark-done', [PeriodicCareController::class, 'markDone'])
            ->name('periodic-cares.mark-done')
            ->whereNumber('id');

        Route::delete('/{id}', [PeriodicCareController::class, 'destroy'])
            ->name('periodic-cares.destroy')
            ->whereNumber('id');
    });
});

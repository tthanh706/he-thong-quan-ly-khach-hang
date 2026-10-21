<?php

use App\Http\Controllers\Api\V1\WebFormController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes cho S4-01: Thu thập Lead từ biểu mẫu nhúng trên website
|--------------------------------------------------------------------------
*/

// Public Web Form Endpoints (Không cần đăng nhập, bảo vệ bởi Honeypot & IP Rate Limit)
Route::prefix('v1/public')->group(function (): void {
    Route::get('/web-forms/{token}', [WebFormController::class, 'getPublicForm']);
    Route::post('/web-forms/{token}/submit', [WebFormController::class, 'submitPublicForm']);
});

// Authenticated Routes (Quản lý cấu hình biểu mẫu và sinh mã nhúng)
Route::middleware('session.auth')->prefix('v1')->group(function (): void {
    Route::get('/web-forms', [WebFormController::class, 'index']);
    Route::post('/web-forms', [WebFormController::class, 'store']);
    Route::get('/web-forms/{id}', [WebFormController::class, 'show'])->whereNumber('id');
    Route::put('/web-forms/{id}', [WebFormController::class, 'update'])->whereNumber('id');
    Route::delete('/web-forms/{id}', [WebFormController::class, 'destroy'])->whereNumber('id');
    Route::get('/web-forms/{id}/embed-code', [WebFormController::class, 'getEmbedCode'])->whereNumber('id');
});

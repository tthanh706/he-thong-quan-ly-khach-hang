<?php

use App\Http\Controllers\Api\V1\SalesOpportunityController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes cho S5-01: Tạo và quản lý Cơ hội bán hàng
|--------------------------------------------------------------------------
*/

Route::middleware('session.auth')->prefix('v1')->group(function (): void {
    Route::get('/sales-opportunities', [SalesOpportunityController::class, 'index']);
    Route::post('/sales-opportunities', [SalesOpportunityController::class, 'store']);
    Route::get('/sales-opportunities/stages', [SalesOpportunityController::class, 'getStages']);
    Route::get('/sales-opportunities/options', [SalesOpportunityController::class, 'getFormOptions']);
    Route::get('/sales-opportunities/{id}', [SalesOpportunityController::class, 'show'])->whereNumber('id');
    Route::put('/sales-opportunities/{id}', [SalesOpportunityController::class, 'update'])->whereNumber('id');
});

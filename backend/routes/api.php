<?php

use App\Http\Controllers\Api\V1\SalesOpportunityController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes cho S6-01: Lịch sử thay đổi cơ hội bán hàng (Audit Log)
|--------------------------------------------------------------------------
*/

Route::middleware('session.auth')->prefix('v1')->group(function (): void {
    // Cập nhật cơ hội và tự động ghi log thay đổi
    Route::put('/sales-opportunities/{id}', [SalesOpportunityController::class, 'update'])->whereNumber('id');
    
    // Xem toàn bộ timeline lịch sử thay đổi của cơ hội
    Route::get('/sales-opportunities/{id}/histories', [SalesOpportunityController::class, 'histories'])->whereNumber('id');
});

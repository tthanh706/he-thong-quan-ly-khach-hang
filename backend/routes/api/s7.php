<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CommonCategoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| S7: Common Category Routes
|--------------------------------------------------------------------------
| Bao gồm các API liên quan đến Common Categories (Danh mục dùng chung).
|
*/

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::apiResource('common-categories', CommonCategoryController::class);
});

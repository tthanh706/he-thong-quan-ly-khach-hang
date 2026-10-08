<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CommonCategoryController;
use App\Http\Controllers\Api\V1\PriceListController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum'])->group(function (): void {
    Route::apiResource('products', ProductController::class);
    Route::apiResource('price-lists', PriceListController::class);
    Route::post('price-lists/{price_list}/items', [PriceListController::class, 'upsertItem'])->name('price-lists.items.store');
    Route::delete('price-lists/{price_list}/items/{item}', [PriceListController::class, 'destroyItem'])->name('price-lists.items.destroy');
    Route::apiResource('common-categories', CommonCategoryController::class);
});

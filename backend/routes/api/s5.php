<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\PriceListController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| S5: Product & Pricing Routes
|--------------------------------------------------------------------------
| Bao gồm các API liên quan đến Products, Price Lists và Price List Items.
|
*/

Route::middleware(['auth:sanctum'])->group(function (): void {
    // Products
    Route::apiResource('products', ProductController::class);

    // Price Lists
    Route::apiResource('price-lists', PriceListController::class);
    Route::post('price-lists/{priceList}/items', [PriceListController::class, 'upsertItem']);
    Route::delete('price-lists/{priceList}/items/{item}', [PriceListController::class, 'destroyItem']);
});

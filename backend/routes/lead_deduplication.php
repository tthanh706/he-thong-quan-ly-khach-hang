<?php

use App\Http\Controllers\Api\LeadDeduplicationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Lead Deduplication API Routes
|--------------------------------------------------------------------------
| These routes should be included in your main api.php route file:
|   require __DIR__ . '/lead_deduplication.php';
|
| All routes are prefixed with /api and require auth:sanctum middleware.
*/

Route::middleware(['auth:sanctum'])->prefix('leads')->group(function () {
    // CRUD
    Route::get('/', [LeadDeduplicationController::class, 'index']);
    Route::post('/', [LeadDeduplicationController::class, 'store']);
    Route::get('/{lead}', [LeadDeduplicationController::class, 'show']);

    // Deduplication
    Route::get('/{lead}/check-duplicates', [LeadDeduplicationController::class, 'checkDuplicates']);
    Route::post('/merge', [LeadDeduplicationController::class, 'merge']);
    Route::post('/{lead}/link-customer', [LeadDeduplicationController::class, 'linkToCustomer']);
});

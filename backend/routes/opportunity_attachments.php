<?php

use App\Http\Controllers\Api\OpportunityAttachmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Opportunity Attachments API Routes
|--------------------------------------------------------------------------
| Include in routes/api.php:
|   require __DIR__ . '/opportunity_attachments.php';
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Attachments per opportunity
    Route::get('/opportunities/{opportunity}/attachments', [OpportunityAttachmentController::class, 'index']);
    Route::post('/opportunities/{opportunity}/attachments', [OpportunityAttachmentController::class, 'store']);

    // Single attachment operations
    Route::get('/attachments/{attachment}/download', [OpportunityAttachmentController::class, 'download'])
        ->name('attachments.download');
    Route::delete('/attachments/{attachment}', [OpportunityAttachmentController::class, 'destroy']);
});

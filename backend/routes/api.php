use App\Http\Controllers\Api\V1\OpportunityController;

Route::prefix('v1/opportunities')->middleware(['auth:sanctum'])->group(function () {
    Route::post('{opportunity}/close-won', [OpportunityController::class, 'closeWon']);
    Route::post('{opportunity}/close-lost', [OpportunityController::class, 'closeLost']);
    Route::post('{opportunity}/reopen', [OpportunityController::class, 'reopen']);
});
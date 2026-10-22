use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadScoringController;

Route::prefix('v1')->group(function () {
    Route::get('/leads', [LeadController::class, 'index']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);

    Route::get('/lead-scoring/config', [LeadScoringController::class, 'getConfig']);
    Route::post('/lead-scoring/config', [LeadScoringController::class, 'updateConfig']);
});
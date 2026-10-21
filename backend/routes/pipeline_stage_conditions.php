<?php

use App\Http\Controllers\Api\PipelineStageConditionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Pipeline Stage Conditions API Routes
|--------------------------------------------------------------------------
| Include in routes/api.php:
|   require __DIR__ . '/pipeline_stage_conditions.php';
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Pipeline stages with conditions
    Route::get('/pipelines/{pipelineId}/stages', [PipelineStageConditionController::class, 'index']);

    // Condition management (CRUD)
    Route::post('/stages/{stage}/conditions', [PipelineStageConditionController::class, 'storeCondition']);
    Route::put('/conditions/{condition}', [PipelineStageConditionController::class, 'updateCondition']);
    Route::delete('/conditions/{condition}', [PipelineStageConditionController::class, 'deleteCondition']);

    // Opportunity stage transitions
    Route::post('/opportunities/{opportunity}/validate-transition', [PipelineStageConditionController::class, 'validateTransition']);
    Route::post('/opportunities/{opportunity}/transition', [PipelineStageConditionController::class, 'transition']);
});

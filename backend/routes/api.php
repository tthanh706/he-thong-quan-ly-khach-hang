Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // ... các route khác

    // Opportunity Members & Ownership
    Route::get('opportunities/{opportunity}/members', [OpportunityMemberController::class, 'index']);
    Route::post('opportunities/{opportunity}/members', [OpportunityMemberController::class, 'store']);
    Route::delete('opportunities/{opportunity}/members/{userId}', [OpportunityMemberController::class, 'destroy']);
    Route::post('opportunities/{opportunity}/transfer-ownership', [OpportunityMemberController::class, 'transferOwnership']);
    Route::get('opportunities/{opportunity}/ownership-logs', [OpportunityMemberController::class, 'ownershipLogs']);
});
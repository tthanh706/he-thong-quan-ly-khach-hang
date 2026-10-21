// Trong nhóm auth + prefix v1
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Campaigns
    Route::get('campaigns/performance', [CampaignController::class, 'performance']);
    Route::apiResource('campaigns', CampaignController::class);

    // Khi tạo/cập nhật Lead & Opportunity cần hỗ trợ campaign_id
    // (đã có sẵn trong LeadController / OpportunityController, chỉ cần thêm field vào Request)
});
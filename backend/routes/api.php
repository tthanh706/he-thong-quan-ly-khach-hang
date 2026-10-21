<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AvatarController;
use App\Http\Controllers\Api\V1\CommonCategoryController;
use App\Http\Controllers\Api\V1\CustomFieldController;
use App\Http\Controllers\Api\V1\CustomFieldValueController;
use App\Http\Controllers\Api\V1\CustomerController as V1CustomerController;
use App\Http\Controllers\Api\V1\PriceListController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\SalesTargetController;
use App\Http\Controllers\Api\V1\UserController as V1UserController;
use App\Http\Controllers\Api\V1\CustomerImportController;
use App\Http\Controllers\Api\V1\PeriodicCareController;
use App\Http\Controllers\Api\V1\SupportRequestController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CompanyHierarchyController;
use App\Http\Controllers\Api\V1\UserImportController;
use App\Http\Controllers\Api\V1\LeadAssignmentController;
use App\Http\Controllers\Api\V1\OpportunityStagnationController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\ContractRenewalController;
use App\Http\Controllers\Api\V1\TeamPerformanceController;
use App\Http\Controllers\Api\V1\OpportunityExportController;
use App\Http\Controllers\Api\V1\WebFormController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\V1\ActivityTimelineController;
use App\Http\Controllers\Api\V1\SalesOpportunityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\HandoverLogController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\ScopedResourceController;
use App\Http\Controllers\UserAssignmentController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// S4-01 Public Web Form endpoints (No authentication required, rate-limited + honeypot protected)
Route::prefix('v1/public')->group(function (): void {
    Route::get('/web-forms/{token}', [WebFormController::class, 'getPublicForm']);
    Route::post('/web-forms/{token}/submit', [WebFormController::class, 'submitPublicForm']);
});

Route::middleware('session.auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    Route::middleware('admin.role')->group(function (): void {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts', [AccountController::class, 'store']);
        Route::post('/accounts/bulk-delete', [AccountController::class, 'bulkDestroy']);
        Route::delete('/accounts/{user}', [AccountController::class, 'destroy']);
        Route::post('/accounts/{user}/lock', [AccountController::class, 'lock']);
        Route::post('/accounts/{user}/unlock', [AccountController::class, 'unlock']);
        Route::patch('/accounts/{user}/role', [AccountController::class, 'updateRole']);
        Route::get('/handover-logs', [HandoverLogController::class, 'index']);

        Route::prefix('admin')->group(function (): void {
            Route::get('/users/assignments', [UserAssignmentController::class, 'index']);
            Route::get('/users/assignment-options', [UserAssignmentController::class, 'options']);
            Route::put('/users/{user}/assignments', [UserAssignmentController::class, 'update']);
        });
    });

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [ScopedResourceController::class, 'customer']);
    Route::get('/opportunities', [OpportunityController::class, 'index']);
    Route::get('/opportunities/{id}', [ScopedResourceController::class, 'opportunity']);
    Route::get('/handover-logs', [HandoverLogController::class, 'index']);
    Route::get('/v1/handover-logs', [HandoverLogController::class, 'index']);

    /*
    | Sprint 2 – API chuẩn /api/v1 (Convention mục 7)
    */
    Route::prefix('v1')->group(function (): void {
        // S2-02: Hồ sơ cá nhân & chữ ký email
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);

        // S2-03: Ảnh đại diện
        Route::post('/profile/avatar', [AvatarController::class, 'store']);
        Route::delete('/profile/avatar', [AvatarController::class, 'destroy']);

        // S2-01: Nhập người dùng hàng loạt (chỉ quản trị hệ thống)
        Route::middleware('admin.role')->group(function (): void {
            Route::get('/users/import/template', [UserImportController::class, 'template']);
            Route::post('/users/import', [UserImportController::class, 'store']);
        });

        // S2-04: Nhật ký thay đổi (Audit Log) & cập nhật nhạy cảm
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::patch('/users/{user}/role', [V1UserController::class, 'updateRole']);
        Route::patch('/customers/{customer}/owner', [V1CustomerController::class, 'updateOwner']);
        Route::patch('/quotes/{quote}/discount', [QuoteController::class, 'updateDiscount']);
        Route::patch('/sales-targets/{salesTarget}', [SalesTargetController::class, 'update']);

        // S3-01 / S3-03 / S3-04 / S3-07: Hồ sơ khách hàng, 360, Tìm kiếm lọc, Trùng & Gộp
        Route::get('/customers/filter-options', [V1CustomerController::class, 'filterOptions']);
        Route::get('/customers/saved-filters', [V1CustomerController::class, 'savedFilters']);
        Route::post('/customers/saved-filters', [V1CustomerController::class, 'storeSavedFilter']);
        Route::delete('/customers/saved-filters/{id}', [V1CustomerController::class, 'destroySavedFilter'])->whereNumber('id');
        Route::get('/customers/duplicates', [V1CustomerController::class, 'duplicates']);
        Route::post('/customers/merge', [V1CustomerController::class, 'merge']);
        Route::get('/customers/{id}/360', [V1CustomerController::class, 'show360'])->whereNumber('id');
        Route::get('/customers', [V1CustomerController::class, 'index']);
        Route::post('/customers', [V1CustomerController::class, 'store']);
        Route::get('/customers/{id}', [V1CustomerController::class, 'show'])->whereNumber('id');
        Route::patch('/customers/{id}', [V1CustomerController::class, 'update'])->whereNumber('id');
        Route::put('/customers/{id}', [V1CustomerController::class, 'update'])->whereNumber('id');
        Route::delete('/customers/{id}', [V1CustomerController::class, 'destroy'])->whereNumber('id');

        // S2-08: Quản lý trường tùy chỉnh (Custom Fields)
        Route::get('/custom-fields', [CustomFieldController::class, 'index']);
        Route::post('/custom-fields', [CustomFieldController::class, 'store']);
        Route::patch('/custom-fields/{customField}', [CustomFieldController::class, 'update']);
        Route::delete('/custom-fields/{customField}', [CustomFieldController::class, 'destroy']);
        Route::get('/custom-field-values/{module}/{entityId}', [CustomFieldValueController::class, 'show']);
        Route::put('/custom-field-values/{module}/{entityId}', [CustomFieldValueController::class, 'update']);
        Route::get('/custom-field-entities/{module}', [CustomFieldValueController::class, 'entities']);
        Route::get('/custom-field-exports/{module}', [CustomFieldValueController::class, 'export']);

        // S2-05: Quản lý sản phẩm & Bảng giá
        Route::apiResource('products', ProductController::class);
        Route::apiResource('price-lists', PriceListController::class);
        Route::post('price-lists/{price_list}/items', [PriceListController::class, 'upsertItem'])->name('price-lists.items.store');
        Route::delete('price-lists/{price_list}/items/{item}', [PriceListController::class, 'destroyItem'])->name('price-lists.items.destroy');

        // S2-07: Quản lý danh mục dùng chung
        Route::apiResource('common-categories', CommonCategoryController::class);

        // S3-06: API Nhập Excel khách hàng
        Route::prefix('customers/import')->group(function () {
            Route::get('/template', [CustomerImportController::class, 'downloadTemplate'])
                ->name('customers.import.template');
            Route::post('/preview', [CustomerImportController::class, 'preview'])
                ->name('customers.import.preview');
            Route::post('/confirm', [CustomerImportController::class, 'confirm'])
                ->name('customers.import.confirm');
        });

        // S3-08: API Yêu cầu hỗ trợ + Cảnh báo
        Route::prefix('support-requests')->group(function () {
            Route::get('/warnings', [SupportRequestController::class, 'warnings'])
                ->name('support-requests.warnings');
            Route::get('/', [SupportRequestController::class, 'index'])
                ->name('support-requests.index');
            Route::post('/', [SupportRequestController::class, 'store'])
                ->name('support-requests.store');
            Route::get('/{id}', [SupportRequestController::class, 'show'])
                ->name('support-requests.show')
                ->whereNumber('id');
            Route::patch('/{id}', [SupportRequestController::class, 'update'])
                ->name('support-requests.update')
                ->whereNumber('id');
            Route::post('/{id}/assign', [SupportRequestController::class, 'assign'])
                ->name('support-requests.assign')
                ->whereNumber('id');
            Route::delete('/{id}', [SupportRequestController::class, 'destroy'])
                ->name('support-requests.destroy')
                ->whereNumber('id');
        });

        // S3-09: API Chăm sóc định kỳ + Cảnh báo
        Route::prefix('periodic-cares')->group(function () {
            Route::get('/warnings', [PeriodicCareController::class, 'warnings'])
                ->name('periodic-cares.warnings');
            Route::get('/', [PeriodicCareController::class, 'index'])
                ->name('periodic-cares.index');
            Route::post('/', [PeriodicCareController::class, 'store'])
                ->name('periodic-cares.store');
            Route::get('/{id}', [PeriodicCareController::class, 'show'])
                ->name('periodic-cares.show')
                ->whereNumber('id');
            Route::patch('/{id}', [PeriodicCareController::class, 'update'])
                ->name('periodic-cares.update')
                ->whereNumber('id');
            Route::post('/{id}/mark-done', [PeriodicCareController::class, 'markDone'])
                ->name('periodic-cares.mark-done')
                ->whereNumber('id');
            Route::delete('/{id}', [PeriodicCareController::class, 'destroy'])
                ->name('periodic-cares.destroy')
                ->whereNumber('id');
        });

        // S3-02: API Quản lý Người liên hệ
        Route::prefix('contacts')->group(function () {
            Route::get('/', [ContactController::class, 'index']);
            Route::post('/', [ContactController::class, 'store']);
            Route::post('/{id}/transfer', [ContactController::class, 'transfer'])->whereNumber('id');
            Route::get('/{id}/history', [ContactController::class, 'history'])->whereNumber('id');
            Route::patch('/{id}', [ContactController::class, 'update'])->whereNumber('id');
            Route::put('/{id}', [ContactController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [ContactController::class, 'destroy'])->whereNumber('id');
        });

        // S3-01 / S3-03 / S3-05: API Doanh nghiệp & Cấu trúc Công ty Mẹ - Con (360)
        Route::prefix('companies')->group(function () {
            Route::get('/', [CompanyHierarchyController::class, 'index']);
            Route::post('/', [CompanyHierarchyController::class, 'store']);
            Route::post('/{parentId}/subsidiaries', [CompanyHierarchyController::class, 'storeSubsidiary'])->whereNumber('parentId');
            Route::put('/{id}', [CompanyHierarchyController::class, 'update'])->whereNumber('id');
            Route::patch('/{id}', [CompanyHierarchyController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [CompanyHierarchyController::class, 'destroy'])->whereNumber('id');
        });

        // S3-05: Cấu trúc khách hàng mẹ - con & tổng giá trị hợp đồng
        Route::patch('/customers/{customer}/parent', [\App\Http\Controllers\Api\V1\CustomerHierarchyController::class, 'updateParent']);
        Route::get('/customers/{customer}/hierarchy', [\App\Http\Controllers\Api\V1\CustomerHierarchyController::class, 'hierarchy']);
        Route::get('/customers/{customer}/group-contract-value', [\App\Http\Controllers\Api\V1\CustomerHierarchyController::class, 'groupContractValue']);

        /*
        |--------------------------------------------------------------------------
        | S4-01 -> S4-09: Lead Management, Import, Merge, Scoring & Conversion
        |--------------------------------------------------------------------------
        */
        Route::get('/leads', [LeadAssignmentController::class, 'index']);
        Route::post('/leads', [LeadAssignmentController::class, 'storeManual']);
        Route::get('/leads/import/template', [LeadAssignmentController::class, 'importTemplate']);
        Route::post('/leads/import/preview', [LeadAssignmentController::class, 'importPreview']);
        Route::post('/leads/import/confirm', [LeadAssignmentController::class, 'importConfirm']);
        Route::get('/leads/check-duplicates', [LeadAssignmentController::class, 'checkDuplicates']);
        Route::post('/leads/merge', [LeadAssignmentController::class, 'merge']);
        Route::get('/leads/sla-alerts', [LeadAssignmentController::class, 'slaAlerts']);
        Route::post('/leads/check-sla', [LeadAssignmentController::class, 'checkSla']);
        Route::get('/leads/{lead}', [LeadAssignmentController::class, 'show'])->whereNumber('lead');
        Route::post('/leads/{lead}/assign', [LeadAssignmentController::class, 'assign'])->whereNumber('lead');
        Route::post('/leads/{lead}/accept', [LeadAssignmentController::class, 'accept'])->whereNumber('lead');
        Route::post('/leads/{lead}/reject', [LeadAssignmentController::class, 'reject'])->whereNumber('lead');
        Route::post('/leads/{lead}/contact', [LeadAssignmentController::class, 'contact'])->whereNumber('lead');
        Route::post('/leads/{lead}/convert', [LeadAssignmentController::class, 'convert'])->whereNumber('lead');
        Route::get('/leads/{lead}/history', [LeadAssignmentController::class, 'history'])->whereNumber('lead');

        // S4-05: Lead Scoring Rules
        Route::get('/lead-scoring-rules', [LeadAssignmentController::class, 'getScoringRules']);
        Route::post('/lead-scoring-rules', [LeadAssignmentController::class, 'storeScoringRule']);
        Route::delete('/lead-scoring-rules/{id}', [LeadAssignmentController::class, 'deleteScoringRule'])->whereNumber('id');

        // S4-06: Lead Assignment Rules
        Route::get('/lead-assignment-rules', [LeadAssignmentController::class, 'getAssignmentRules']);
        Route::post('/lead-assignment-rules', [LeadAssignmentController::class, 'storeAssignmentRule']);
        Route::delete('/lead-assignment-rules/{id}', [LeadAssignmentController::class, 'deleteAssignmentRule'])->whereNumber('id');

        // S4-03: Marketing Campaigns
        Route::get('/campaigns', [CampaignController::class, 'index']);
        Route::post('/campaigns', [CampaignController::class, 'store']);
        Route::get('/campaigns/{id}', [CampaignController::class, 'show'])->whereNumber('id');
        Route::put('/campaigns/{id}', [CampaignController::class, 'update'])->whereNumber('id');
        Route::patch('/campaigns/{id}/status', [CampaignController::class, 'changeStatus'])->whereNumber('id');
        Route::delete('/campaigns/{id}', [CampaignController::class, 'destroy'])->whereNumber('id');

        /*
        |--------------------------------------------------------------------------
        | S5-07 - Opportunity Stagnation
        |--------------------------------------------------------------------------
        */
        Route::get('/opportunities', [OpportunityStagnationController::class, 'index']);
        Route::get('/opportunities/problem-list', [OpportunityStagnationController::class, 'problems']);
        Route::get('/opportunities/stagnation-alerts', [OpportunityStagnationController::class, 'alerts']);
        Route::post('/opportunities/check-stagnation', [OpportunityStagnationController::class, 'check']);
        Route::get('/opportunity-stage-configs', [OpportunityStagnationController::class, 'configs']);
        Route::patch('/opportunity-stage-configs/{config}', [OpportunityStagnationController::class, 'updateConfig']);
        Route::get('/opportunities/{opportunity}', [OpportunityStagnationController::class, 'show'])->whereNumber('opportunity');
        Route::post('/opportunities/{opportunity}/activities', [OpportunityStagnationController::class, 'addActivity'])->whereNumber('opportunity');

        /*
        |--------------------------------------------------------------------------
        | S6-07 - Team Calendar
        |--------------------------------------------------------------------------
        */
        Route::get('/calendar/my', [CalendarController::class, 'myCalendar']);
        Route::get('/calendar/team', [CalendarController::class, 'teamCalendar']);
        Route::get('/calendar/users', [CalendarController::class, 'users']);
        Route::post('/calendar/meetings', [CalendarController::class, 'createMeeting']);
        Route::post('/calendar/tasks', [CalendarController::class, 'createTask']);

        /*
        |--------------------------------------------------------------------------
        | S7-07 - Contract Renewal
        |--------------------------------------------------------------------------
        */
        Route::get('/contracts', [ContractRenewalController::class, 'index']);
        Route::get('/contracts/expiry-alerts', [ContractRenewalController::class, 'alerts']);
        Route::post('/contracts/check-expiry', [ContractRenewalController::class, 'check']);
        Route::get('/contracts/expiry-setting', [ContractRenewalController::class, 'setting']);
        Route::patch('/contracts/expiry-setting', [ContractRenewalController::class, 'updateSetting']);
        Route::get('/contracts/{contract}', [ContractRenewalController::class, 'show'])->whereNumber('contract');
        Route::post('/contracts/{contract}/renewal-opportunity', [ContractRenewalController::class, 'createRenewal'])->whereNumber('contract');

        /*
        |--------------------------------------------------------------------------
        | S8-07 - Team Performance
        |--------------------------------------------------------------------------
        */
        Route::get('/team-performance', [TeamPerformanceController::class, 'index']);
        Route::get('/team-performance/members', [TeamPerformanceController::class, 'members']);
        Route::get('/team-performance/export', [TeamPerformanceController::class, 'export']);

        /*
        |--------------------------------------------------------------------------
        | S8-10 - Opportunity Export
        |--------------------------------------------------------------------------
        */
        Route::get('/opportunity-export', [OpportunityExportController::class, 'index']);
        Route::get('/opportunity-export/filters', [OpportunityExportController::class, 'filters']);
        Route::get('/opportunity-export/export', [OpportunityExportController::class, 'export']);

        /*
        |--------------------------------------------------------------------------
        | S4-01 - Web Forms Management & Lead Capture
        |--------------------------------------------------------------------------
        */
        Route::get('/web-forms', [WebFormController::class, 'index']);
        Route::post('/web-forms', [WebFormController::class, 'store']);
        Route::get('/web-forms/{id}', [WebFormController::class, 'show'])->whereNumber('id');
        Route::put('/web-forms/{id}', [WebFormController::class, 'update'])->whereNumber('id');
        Route::delete('/web-forms/{id}', [WebFormController::class, 'destroy'])->whereNumber('id');
        Route::get('/web-forms/{id}/embed-code', [WebFormController::class, 'getEmbedCode'])->whereNumber('id');

        /*
        |--------------------------------------------------------------------------
        | S5-01 -> S5-08, S6-01 -> S6-04: Sales Opportunities, Pipeline Kanban, Products, Stage Gates, Forecast & Collaboration
        |--------------------------------------------------------------------------
        */
        Route::get('/sales-opportunities/kanban', [SalesOpportunityController::class, 'kanban']);
        Route::get('/sales-opportunities/forecast', [SalesOpportunityController::class, 'forecast']);
        Route::post('/sales-opportunities/bulk-reassign', [SalesOpportunityController::class, 'bulkReassign']);
        Route::get('/opportunity-stage-gates', [SalesOpportunityController::class, 'getStageGates']);
        Route::patch('/opportunity-stage-gates/{id}', [SalesOpportunityController::class, 'updateStageGate'])->whereNumber('id');

        Route::get('/sales-opportunities', [SalesOpportunityController::class, 'index']);
        Route::post('/sales-opportunities', [SalesOpportunityController::class, 'store']);
        Route::get('/sales-opportunities/stages', [SalesOpportunityController::class, 'getStages']);
        Route::get('/sales-opportunities/options', [SalesOpportunityController::class, 'getFormOptions']);
        Route::get('/sales-opportunities/{id}', [SalesOpportunityController::class, 'show'])->whereNumber('id');
        Route::put('/sales-opportunities/{id}', [SalesOpportunityController::class, 'update'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/stage', [SalesOpportunityController::class, 'changeStage'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/close-won', [SalesOpportunityController::class, 'closeWon'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/close-lost', [SalesOpportunityController::class, 'closeLost'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/reopen', [SalesOpportunityController::class, 'reopen'])->whereNumber('id');
        Route::get('/sales-opportunities/{id}/histories', [SalesOpportunityController::class, 'histories'])->whereNumber('id');

        // S5-03: Products on Opportunity
        Route::get('/sales-opportunities/{id}/products', [SalesOpportunityController::class, 'getProducts'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/products', [SalesOpportunityController::class, 'addProduct'])->whereNumber('id');
        Route::delete('/sales-opportunities/{id}/products/{itemId}', [SalesOpportunityController::class, 'removeProduct'])->whereNumber('id')->whereNumber('itemId');

        // S6-03: Team Collaborators
        Route::get('/sales-opportunities/{id}/collaborators', [SalesOpportunityController::class, 'getCollaborators'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/collaborators', [SalesOpportunityController::class, 'addCollaborator'])->whereNumber('id');
        Route::delete('/sales-opportunities/{id}/collaborators/{collaboratorId}', [SalesOpportunityController::class, 'removeCollaborator'])->whereNumber('id')->whereNumber('collaboratorId');

        // S6-04: Attachments (up to 20MB)
        Route::get('/sales-opportunities/{id}/attachments', [SalesOpportunityController::class, 'getAttachments'])->whereNumber('id');
        Route::post('/sales-opportunities/{id}/attachments', [SalesOpportunityController::class, 'uploadAttachment'])->whereNumber('id');
        Route::delete('/sales-opportunities/{id}/attachments/{attachmentId}', [SalesOpportunityController::class, 'deleteAttachment'])->whereNumber('id')->whereNumber('attachmentId');
        Route::get('/sales-opportunities/{id}/attachments/{attachmentId}/download', [SalesOpportunityController::class, 'downloadAttachment'])->whereNumber('id')->whereNumber('attachmentId');

        /*
        |--------------------------------------------------------------------------
        | S6-05 -> S6-10: Activities, Tasks, Customer 360 Timeline, Reminders & Quick Call
        |--------------------------------------------------------------------------
        */
        Route::get('/activities', [ActivityTimelineController::class, 'indexActivities']);
        Route::post('/activities', [ActivityTimelineController::class, 'storeActivity']);
        Route::get('/customers/{id}/timeline', [ActivityTimelineController::class, 'customerTimeline'])->whereNumber('id');

        Route::get('/tasks', [ActivityTimelineController::class, 'indexTasks']);
        Route::post('/tasks', [ActivityTimelineController::class, 'storeTask']);
        Route::post('/tasks/{id}/complete', [ActivityTimelineController::class, 'completeTask'])->whereNumber('id');
        Route::post('/tasks/{id}/postpone', [ActivityTimelineController::class, 'postponeTask'])->whereNumber('id');
        Route::get('/tasks/reminders', [ActivityTimelineController::class, 'taskReminders']);
        Route::post('/quick-call', [ActivityTimelineController::class, 'quickCallLog']);

        // Route Aliases & Compatibility Endpoints
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::get('/org/hierarchy', [CompanyHierarchyController::class, 'index']);
        Route::get('/calendar/items', [CalendarController::class, 'teamCalendar']);
        Route::get('/activity-timeline/overview', [ActivityTimelineController::class, 'indexActivities']);
        Route::get('/contracts/expiring', [ContractRenewalController::class, 'alerts']);
        Route::get('/lead-assignment/stats', [LeadAssignmentController::class, 'slaAlerts']);
        Route::get('/opportunity-stagnation/problems', [OpportunityStagnationController::class, 'problems']);
        Route::get('/opportunity-stagnation/configs', [OpportunityStagnationController::class, 'configs']);
        Route::get('/team-performance/kpis', [TeamPerformanceController::class, 'index']);
        Route::get('/team-performance/logs', [TeamPerformanceController::class, 'index']);
    });
});

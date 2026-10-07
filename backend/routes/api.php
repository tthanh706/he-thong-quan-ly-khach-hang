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
use App\Http\Controllers\Api\V1\UserImportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\HandoverLogController;
use App\Http\Controllers\OpportunityController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('session.auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('admin.role')->group(function (): void {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts/{user}/lock', [AccountController::class, 'lock']);
        Route::get('/handover-logs', [HandoverLogController::class, 'index']);
    });

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/opportunities', [OpportunityController::class, 'index']);

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
    });
});

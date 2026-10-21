<?php

use App\Http\Controllers\Api\V1\LeadAssignmentController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post(
    '/login',
    [AuthController::class, 'login']
);

Route::middleware('session.auth')->group(
    function (): void {
        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );

        Route::get(
            '/me',
            [AuthController::class, 'me']
        );

        Route::prefix('v1')->group(
            function (): void {
                Route::get(
                    '/leads',
                    [LeadAssignmentController::class, 'index']
                );

                Route::get(
                    '/leads/sla-alerts',
                    [LeadAssignmentController::class, 'slaAlerts']
                );

                Route::post(
                    '/leads/check-sla',
                    [LeadAssignmentController::class, 'checkSla']
                );

                Route::get(
                    '/leads/{lead}',
                    [LeadAssignmentController::class, 'show']
                );

                Route::post(
                    '/leads/{lead}/assign',
                    [LeadAssignmentController::class, 'assign']
                );

                Route::post(
                    '/leads/{lead}/accept',
                    [LeadAssignmentController::class, 'accept']
                );

                Route::post(
                    '/leads/{lead}/reject',
                    [LeadAssignmentController::class, 'reject']
                );

                Route::post(
                    '/leads/{lead}/contact',
                    [LeadAssignmentController::class, 'contact']
                );

                Route::get(
                    '/leads/{lead}/history',
                    [LeadAssignmentController::class, 'history']
                );
            }
        );
    }
);
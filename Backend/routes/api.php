<?php

use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\LeadAssignmentController;
use App\Http\Controllers\Api\V1\OpportunityStagnationController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

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

                /*
                |--------------------------------------------------------------------------
                | S4-07 - Lead & SLA
                |--------------------------------------------------------------------------
                */

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

                /*
                |--------------------------------------------------------------------------
                | S5-07 - Opportunity Stagnation
                |--------------------------------------------------------------------------
                */

                Route::get(
                    '/opportunities',
                    [OpportunityStagnationController::class, 'index']
                );

                Route::get(
                    '/opportunities/problem-list',
                    [OpportunityStagnationController::class, 'problems']
                );

                Route::get(
                    '/opportunities/stagnation-alerts',
                    [OpportunityStagnationController::class, 'alerts']
                );

                Route::post(
                    '/opportunities/check-stagnation',
                    [OpportunityStagnationController::class, 'check']
                );

                Route::get(
                    '/opportunity-stage-configs',
                    [OpportunityStagnationController::class, 'configs']
                );

                Route::patch(
                    '/opportunity-stage-configs/{config}',
                    [OpportunityStagnationController::class, 'updateConfig']
                );

                Route::get(
                    '/opportunities/{opportunity}',
                    [OpportunityStagnationController::class, 'show']
                );

                Route::post(
                    '/opportunities/{opportunity}/activities',
                    [OpportunityStagnationController::class, 'addActivity']
                );

                /*
                |--------------------------------------------------------------------------
                | S6-07 - Team Calendar
                |--------------------------------------------------------------------------
                */

                Route::get(
                    '/calendar/my',
                    [CalendarController::class, 'myCalendar']
                );

                Route::get(
                    '/calendar/team',
                    [CalendarController::class, 'teamCalendar']
                );

                Route::get(
                    '/calendar/users',
                    [CalendarController::class, 'users']
                );

                Route::post(
                    '/calendar/meetings',
                    [CalendarController::class, 'createMeeting']
                );

                Route::post(
                    '/calendar/tasks',
                    [CalendarController::class, 'createTask']
                );
            }
        );
    }
);
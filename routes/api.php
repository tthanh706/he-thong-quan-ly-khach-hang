<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserRoleController;

Route::middleware('auth:sanctum')->post('/users/{id}/roles-teams', [UserRoleController::class, 'assignRoleAndTeam']);
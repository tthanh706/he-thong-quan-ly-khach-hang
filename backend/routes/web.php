<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/web-form-embed/{token}', [\App\Http\Controllers\Api\V1\WebFormController::class, 'renderEmbedView']);


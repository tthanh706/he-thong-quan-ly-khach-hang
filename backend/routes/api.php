<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Tách biệt 2 phân hệ:
| - S5: Product & Pricing (routes/api/s5.php)
| - S7: Common Category (routes/api/s7.php)
|
*/

Route::prefix('v1')->group(function (): void {
    require __DIR__ . '/api/s5.php';
    require __DIR__ . '/api/s7.php';
});

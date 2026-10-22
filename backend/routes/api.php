use App\Http\Controllers\Api\V1\ActivityController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::apiResource('activities', ActivityController::class)->only(['index', 'store', 'destroy']);
});
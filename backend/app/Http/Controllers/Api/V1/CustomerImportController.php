<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ImportCustomerRequest;
use App\Http\Requests\Customer\ConfirmImportRequest;
use App\Services\CustomerImportService;
use Illuminate\Http\JsonResponse;

class CustomerImportController extends Controller
{
    protected CustomerImportService $importService;

    public function __construct(CustomerImportService $importService)
    {
        $this->importService = $importService;
    }

    public function preview(ImportCustomerRequest $request): JsonResponse
    {
        $result = $this->importService->parsePreview($request->file('file'));
        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function confirm(ConfirmImportRequest $request): JsonResponse
    {
        $importedCount = $this->importService->confirmImport(
            $request->validated('rows'),
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Import thành công {$importedCount} khách hàng.",
            'imported_count' => $importedCount,
        ]);
    }
}

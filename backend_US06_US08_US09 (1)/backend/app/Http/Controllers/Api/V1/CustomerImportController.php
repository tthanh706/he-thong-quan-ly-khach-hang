<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ConfirmImportRequest;
use App\Http\Requests\Customer\ImportCustomerRequest;
use App\Http\Resources\ImportPreviewResource;
use App\Services\CustomerImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CustomerImportController extends Controller
{
    public function __construct(
        private readonly CustomerImportService $importService
    ) {}

    /**
     * GET /api/v1/customers/import/template
     * Tải file mẫu Excel
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        $path = $this->importService->downloadTemplate();

        return response()->download($path, 'mau_import_khach_hang.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * POST /api/v1/customers/import/preview
     * Upload file → validate → trả về preview
     */
    public function preview(ImportCustomerRequest $request): JsonResponse
    {
        $result = $this->importService->preview(
            $request->file('file'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => [
                'file_path' => $result['file_path'],
                'file_name' => $result['file_name'],
                'total_rows' => $result['total_rows'],
                'valid_count' => $result['valid_count'],
                'error_count' => $result['error_count'],
                'rows' => ImportPreviewResource::collection(collect($result['rows'])),
            ],
            'message' => 'Kiểm tra dữ liệu import thành công.',
        ]);
    }

    /**
     * POST /api/v1/customers/import/confirm
     * Xác nhận lưu các dòng hợp lệ
     */
    public function confirm(ConfirmImportRequest $request): JsonResponse
    {
        $result = $this->importService->confirm(
            $request->validated()['rows'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => [
                'success_count' => $result['success_count'],
                'error_count' => $result['error_count'],
                'errors' => $result['errors'],
            ],
            'message' => $result['error_count'] === 0
                ? 'Import khách hàng thành công.'
                : "Import hoàn tất với {$result['success_count']} thành công, {$result['error_count']} lỗi.",
        ]);
    }
}

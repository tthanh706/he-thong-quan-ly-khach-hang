<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ImportUsersRequest;
use App\Http\Resources\UserImportResultResource;
use App\Services\UserImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * S2-01: Quản trị hệ thống nhập danh sách người dùng hàng loạt từ file Excel.
 */
class UserImportController extends Controller
{
    private const TEMPLATE_FILE_NAME = 'mau-nhap-nguoi-dung.csv';

    public function __construct(private readonly UserImportService $userImportService) {}

    /**
     * POST /api/v1/users/import
     * dry_run=1: chỉ kiểm tra dữ liệu, không tạo tài khoản.
     */
    public function store(ImportUsersRequest $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run');
        $result = $this->userImportService->import(
            $request->file('file'),
            $dryRun,
            $request->attributes->get('current_user'),
        );

        $message = $dryRun
            ? "Đã kiểm tra {$result['total_rows']} dòng: {$result['valid_rows']} hợp lệ, {$result['invalid_rows']} lỗi."
            : "Đã tạo {$result['created_rows']} tài khoản. {$result['invalid_rows']} dòng lỗi đã được bỏ qua.";

        return (new UserImportResultResource($result))
            ->additional(['success' => true, 'message' => $message])
            ->response()
            ->setStatusCode($dryRun ? 200 : 201);
    }

    /**
     * GET /api/v1/users/import/template
     */
    public function template(): Response
    {
        return response($this->userImportService->buildTemplateCsv(), 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.self::TEMPLATE_FILE_NAME.'"',
        ]);
    }
}

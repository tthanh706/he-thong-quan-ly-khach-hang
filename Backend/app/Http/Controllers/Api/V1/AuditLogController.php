<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FilterAuditLogRequest;
use App\Http\Resources\AuditLogResource;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {
    }

    public function index(
        FilterAuditLogRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        $auditLogs = $this->auditLogService->getAuditLogs(
            isset($validated['user_id'])
                ? (int) $validated['user_id']
                : null,

            $validated['entity_type'] ?? null,

            $validated['from_date'] ?? null,

            $validated['to_date'] ?? null,

            (int) ($validated['per_page'] ?? 15)
        );

        return response()->json([
            'success' => true,

            'data' => AuditLogResource::collection(
                $auditLogs->items()
            ),

            'meta' => [
                'current_page' =>
                    $auditLogs->currentPage(),

                'last_page' =>
                    $auditLogs->lastPage(),

                'per_page' =>
                    $auditLogs->perPage(),

                'total' =>
                    $auditLogs->total(),
            ],

            'message' =>
                'Lấy nhật ký thay đổi thành công.',
        ]);
    }
}
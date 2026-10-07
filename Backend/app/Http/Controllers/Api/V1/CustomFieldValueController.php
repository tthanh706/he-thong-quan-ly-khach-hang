<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomField\FilterEntitiesByCustomFieldRequest;
use App\Http\Requests\CustomField\SaveCustomFieldValuesRequest;
use App\Http\Resources\CustomFieldValueResource;
use App\Services\CustomFieldExportService;
use App\Services\CustomFieldValueService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class CustomFieldValueController extends Controller
{
    public function __construct(
        private readonly CustomFieldValueService
            $customFieldValueService,

        private readonly CustomFieldExportService
            $customFieldExportService
    ) {
    }

    public function show(
        string $module,
        int $entityId
    ): JsonResponse {
        $values =
            $this->customFieldValueService
                ->getValues(
                    $module,
                    $entityId
                );

        return response()->json([
            'success' => true,

            'data' =>
                CustomFieldValueResource::collection(
                    $values
                ),

            'message' =>
                'Lấy trường tùy chỉnh thành công.',
        ]);
    }

    public function update(
        SaveCustomFieldValuesRequest $request,
        string $module,
        int $entityId
    ): JsonResponse {
        $values =
            $this->customFieldValueService
                ->saveValues(
                    $module,
                    $entityId,
                    $request->validated()['values']
                );

        return response()->json([
            'success' => true,

            'data' =>
                CustomFieldValueResource::collection(
                    $values
                ),

            'message' =>
                'Lưu trường tùy chỉnh thành công.',
        ]);
    }

    public function entities(
        FilterEntitiesByCustomFieldRequest $request,
        string $module
    ): JsonResponse {
        $validated = $request->validated();

        $entities =
            $this->customFieldValueService
                ->filterEntities(
                    $module,
                    $validated['search'] ?? null,
                    $validated['custom_fields'] ?? [],
                    (int) ($validated['per_page'] ?? 15)
                );

        return response()->json([
            'success' => true,

            'data' => $entities->items(),

            'meta' => [
                'current_page' =>
                    $entities->currentPage(),

                'last_page' =>
                    $entities->lastPage(),

                'per_page' =>
                    $entities->perPage(),

                'total' =>
                    $entities->total(),
            ],

            'message' =>
                'Lọc dữ liệu thành công.',
        ]);
    }

    public function export(
        FilterEntitiesByCustomFieldRequest $request,
        string $module
    ): BinaryFileResponse {
        $validated = $request->validated();

        $filePath =
            $this->customFieldExportService
                ->export(
                    $module,
                    $validated['search'] ?? null,
                    $validated['custom_fields'] ?? []
                );

        return response()
            ->download($filePath)
            ->deleteFileAfterSend(true);
    }
}
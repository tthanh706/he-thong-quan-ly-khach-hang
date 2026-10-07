<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomField\FilterCustomFieldRequest;
use App\Http\Requests\CustomField\StoreCustomFieldRequest;
use App\Http\Requests\CustomField\UpdateCustomFieldRequest;
use App\Http\Resources\CustomFieldResource;
use App\Models\CustomField;
use App\Services\CustomFieldService;
use Illuminate\Http\JsonResponse;

class CustomFieldController extends Controller
{
    public function __construct(
        private readonly CustomFieldService $customFieldService
    ) {
    }

    public function index(
        FilterCustomFieldRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        $customFields =
            $this->customFieldService->getCustomFields(
                $validated['module'] ?? null,
                array_key_exists('is_active', $validated)
                    ? (bool) $validated['is_active']
                    : null,
                (int) ($validated['per_page'] ?? 15)
            );

        return response()->json([
            'success' => true,

            'data' => CustomFieldResource::collection(
                $customFields->items()
            ),

            'meta' => [
                'current_page' =>
                    $customFields->currentPage(),

                'last_page' =>
                    $customFields->lastPage(),

                'per_page' =>
                    $customFields->perPage(),

                'total' =>
                    $customFields->total(),
            ],

            'message' =>
                'Lấy danh sách trường tùy chỉnh thành công.',
        ]);
    }

    public function store(
        StoreCustomFieldRequest $request
    ): JsonResponse {
        $currentUser =
            $request->attributes->get('current_user');

        $customField =
            $this->customFieldService->createCustomField(
                $request->validated(),
                $currentUser
            );

        return response()->json([
            'success' => true,

            'data' => new CustomFieldResource(
                $customField->load('creator')
            ),

            'message' =>
                'Thêm trường tùy chỉnh thành công.',
        ], 201);
    }

    public function update(
        UpdateCustomFieldRequest $request,
        CustomField $customField
    ): JsonResponse {
        $customField =
            $this->customFieldService->updateCustomField(
                $customField,
                $request->validated()
            );

        return response()->json([
            'success' => true,

            'data' => new CustomFieldResource(
                $customField
            ),

            'message' =>
                'Cập nhật trường tùy chỉnh thành công.',
        ]);
    }

    public function destroy(
        CustomField $customField
    ): JsonResponse {
        $currentUser =
            request()->attributes->get('current_user');

        if (
            !$currentUser
            || $currentUser->role !== 'admin'
        ) {
            abort(403, 'Bạn không có quyền thực hiện thao tác này.');
        }

        $this->customFieldService
            ->deleteCustomField($customField);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' =>
                'Xóa trường tùy chỉnh thành công.',
        ]);
    }
}
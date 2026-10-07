<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CommonCategory\CreateCommonCategoryRequest;
use App\Http\Requests\CommonCategory\UpdateCommonCategoryRequest;
use App\Http\Resources\CommonCategoryResource;
use App\Models\CommonCategory;
use App\Services\CommonCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommonCategoryController extends Controller
{
    public function __construct(private readonly CommonCategoryService $commonCategoryService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CommonCategory::class);
        $items = $this->commonCategoryService->list($request->query('category_type'));

        return response()->json([
            'success' => true,
            'message' => 'Danh mục dùng chung',
            'data' => CommonCategoryResource::collection($items),
        ]);
    }

    public function store(CreateCommonCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', CommonCategory::class);
        $item = $this->commonCategoryService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo danh mục',
            'data' => new CommonCategoryResource($item),
        ], 201);
    }

    public function show(CommonCategory $commonCategory): JsonResponse
    {
        $this->authorize('view', $commonCategory);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => new CommonCategoryResource($commonCategory),
        ]);
    }

    public function update(UpdateCommonCategoryRequest $request, CommonCategory $commonCategory): JsonResponse
    {
        $this->authorize('update', $commonCategory);
        $item = $this->commonCategoryService->update($commonCategory, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật danh mục',
            'data' => new CommonCategoryResource($item),
        ]);
    }

    public function destroy(CommonCategory $commonCategory): JsonResponse
    {
        $this->authorize('delete', $commonCategory);
        $commonCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa danh mục',
            'data' => null,
        ]);
    }
}

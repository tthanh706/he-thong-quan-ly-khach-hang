<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PriceList\CreatePriceListItemRequest;
use App\Http\Requests\PriceList\CreatePriceListRequest;
use App\Http\Requests\PriceList\UpdatePriceListRequest;
use App\Http\Resources\PriceListItemResource;
use App\Http\Resources\PriceListResource;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Services\PriceListService;
use Illuminate\Http\JsonResponse;

class PriceListController extends Controller
{
    public function __construct(private readonly PriceListService $priceListService) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', PriceList::class);

        $lists = PriceList::query()->withCount('items')->orderByDesc('is_standard')->get();

        return response()->json([
            'success' => true,
            'message' => 'Danh sách bảng giá',
            'data' => PriceListResource::collection($lists),
        ]);
    }

    public function store(CreatePriceListRequest $request): JsonResponse
    {
        $this->authorize('create', PriceList::class);
        $list = $this->priceListService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo bảng giá',
            'data' => new PriceListResource($list),
        ], 201);
    }

    public function show(PriceList $priceList): JsonResponse
    {
        $this->authorize('view', $priceList);
        $priceList->load(['items.product'])->loadCount('items');

        return response()->json([
            'success' => true,
            'message' => 'Chi tiết bảng giá',
            'data' => new PriceListResource($priceList),
        ]);
    }

    public function update(UpdatePriceListRequest $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);
        $list = $this->priceListService->update($priceList, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật bảng giá',
            'data' => new PriceListResource($list),
        ]);
    }

    public function destroy(PriceList $priceList): JsonResponse
    {
        $this->authorize('delete', $priceList);
        $priceList->items()->delete();
        $priceList->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bảng giá',
            'data' => null,
        ]);
    }

    public function upsertItem(CreatePriceListItemRequest $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);
        $item = $this->priceListService->upsertItem($priceList, $request->validated());
        $item->load('product');

        return response()->json([
            'success' => true,
            'message' => 'Đã lưu dòng giá',
            'data' => new PriceListItemResource($item),
        ]);
    }

    public function destroyItem(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);
        abort_unless($item->price_list_id === $priceList->id, 404);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã gỡ dòng giá',
            'data' => null,
        ]);
    }
}

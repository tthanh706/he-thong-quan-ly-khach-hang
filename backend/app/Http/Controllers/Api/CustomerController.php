<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CustomerController (API)
 *
 * Tất cả lỗi 401 / 403 / 404 sẽ được Handler::renderJson() bắt
 * và trả về JSON có cấu trúc thống nhất (SCRUM-91).
 */
class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $customerService) {}

    /** GET /api/customers */
    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerService->paginate(
            perPage: (int) $request->query('per_page', 20),
            filters: $request->only(['status', 'search', 'assigned_to']),
        );

        return response()->json([
            'success' => true,
            'data'    => $customers,
        ]);
    }

    /** GET /api/customers/{id} */
    public function show(int $id): JsonResponse
    {
        $customer = $this->customerService->findOrFail($id); // -> 404 nếu không có

        return response()->json([
            'success' => true,
            'data'    => $customer->load('assignedUser', 'campaigns'),
        ]);
    }

    /** POST /api/customers */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create($request->validated());

        return response()->json([
            'success' => true,
            'data'    => $customer,
            'message' => 'Khách hàng đã được tạo thành công.',
        ], 201);
    }

    /** PUT /api/customers/{id} */
    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        $customer = $this->customerService->update(
            $id,
            $request->validated(),
            $request->user()->id,   // -> 403 nếu không phải người sở hữu / admin
        );

        return response()->json([
            'success' => true,
            'data'    => $customer,
            'message' => 'Cập nhật thành công.',
        ]);
    }

    /** DELETE /api/customers/{id} */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->customerService->delete($id, $request->user()->id); // -> 403 / 404

        return response()->json([
            'success' => true,
            'message' => 'Khách hàng đã được xóa.',
        ]);
    }
}

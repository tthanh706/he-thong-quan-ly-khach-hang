<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\FilterCustomerRequest;
use App\Http\Requests\Customer\StoreCustomerProfileRequest;
use App\Http\Requests\Customer\StoreSavedFilterRequest;
use App\Http\Requests\Customer\UpdateCustomerOwnerRequest;
use App\Http\Requests\Customer\UpdateCustomerProfileRequest;
use App\Http\Resources\CustomerProfileResource;
use App\Http\Resources\SavedFilterResource;
use App\Models\Customer;
use App\Models\User;
use App\Services\CustomerService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {
    }

    /**
     * GET /api/v1/customers
     * S3-01 / S3-07: Tìm kiếm, lọc khách hàng theo Data Scope (MY/TEAM/ALL)
     */
    public function index(FilterCustomerRequest $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $perPage = $request->input('per_page') ? (int) $request->input('per_page') : 15;
        $filters = $request->validated();

        $result = $this->customerService->getFilteredCustomers($filters, $currentUser, $perPage);

        if ($result instanceof LengthAwarePaginator) {
            return response()->json([
                'success' => true,
                'data' => CustomerProfileResource::collection($result->items()),
                'pagination' => [
                    'current_page' => $result->currentPage(),
                    'last_page' => $result->lastPage(),
                    'per_page' => $result->perPage(),
                    'total' => $result->total(),
                    'from' => $result->firstItem(),
                    'to' => $result->lastItem(),
                ],
                'message' => 'Lấy danh sách khách hàng thành công.',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => CustomerProfileResource::collection($result),
            'message' => 'Lấy danh sách khách hàng thành công.',
        ]);
    }

    /**
     * POST /api/v1/customers
     * S3-01: Tạo mới hồ sơ khách hàng doanh nghiệp chuẩn
     */
    public function store(StoreCustomerProfileRequest $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $customer = $this->customerService->createCustomerProfile($request->validated(), $currentUser);

        return response()->json([
            'success' => true,
            'data' => new CustomerProfileResource($customer),
            'message' => 'Thêm mới hồ sơ khách hàng thành công.',
        ], 201);
    }

    /**
     * GET /api/v1/customers/{id}
     * S3-01: Chi tiết hồ sơ khách hàng
     */
    public function show(int $id, Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        $customer = Customer::with(['owner:id,name,email', 'parent:id,name,code', 'subsidiaries:id,name,code', 'contacts'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CustomerProfileResource($customer),
            'message' => 'Lấy thông tin khách hàng thành công.',
        ]);
    }

    /**
     * PUT/PATCH /api/v1/customers/{id}
     * S3-01: Cập nhật hồ sơ khách hàng doanh nghiệp
     */
    public function update(UpdateCustomerProfileRequest $request, int $id): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $customer = Customer::findOrFail($id);

        try {
            $updatedCustomer = $this->customerService->updateCustomerProfile($customer, $request->validated(), $currentUser);

            return response()->json([
                'success' => true,
                'data' => new CustomerProfileResource($updatedCustomer),
                'message' => 'Cập nhật hồ sơ khách hàng thành công.',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * DELETE /api/v1/customers/{id}
     * S3-01: Xóa hồ sơ khách hàng
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $customer = Customer::findOrFail($id);

        try {
            $this->customerService->deleteCustomerProfile($customer, $currentUser);

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Xóa khách hàng thành công.',
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * GET /api/v1/customers/filter-options
     * S3-07: Lấy các lựa chọn cho bộ lọc tìm kiếm
     */
    public function filterOptions(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        $options = $this->customerService->getFilterOptions($currentUser ?? new User(['role' => 'staff']));

        return response()->json([
            'success' => true,
            'data' => $options,
            'message' => 'Lấy danh mục bộ lọc thành công.',
        ]);
    }

    /**
     * GET /api/v1/customers/saved-filters
     * S3-07: Lấy danh sách bộ lọc đã lưu
     */
    public function savedFilters(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $filters = $this->customerService->getSavedFilters($currentUser);

        return response()->json([
            'success' => true,
            'data' => SavedFilterResource::collection($filters),
            'message' => 'Lấy danh sách bộ lọc đã lưu thành công.',
        ]);
    }

    /**
     * POST /api/v1/customers/saved-filters
     * S3-07: Lưu bộ lọc mới
     */
    public function storeSavedFilter(StoreSavedFilterRequest $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json(['success' => false, 'message' => 'Chưa đăng nhập'], 401);
        }

        $savedFilter = $this->customerService->saveFilter(
            $currentUser,
            $request->validated('name'),
            $request->validated('filters'),
            $request->input('module', 'customers')
        );

        return response()->json([
            'success' => true,
            'data' => new SavedFilterResource($savedFilter),
            'message' => 'Đã lưu bộ lọc thành công.',
        ], 201);
    }

    /**
     * DELETE /api/v1/customers/saved-filters/{id}
     * S3-07: Xóa bộ lọc đã lưu
     */
    public function destroySavedFilter(int $id, Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json(['success' => false, 'message' => 'Chưa đăng nhập'], 401);
        }

        $deleted = $this->customerService->deleteSavedFilter($currentUser, $id);

        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Đã xóa bộ lọc thành công.' : 'Không tìm thấy bộ lọc.',
        ]);
    }


    /**
     * GET /api/v1/customers/{id}/360
     * US-03: Trang khách hàng 360 toàn diện
     */
    public function show360(int $id): JsonResponse
    {
        $data = $this->customerService->getCustomer360($id);

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Lấy dữ liệu khách hàng 360 thành công.',
        ]);
    }

    /**
     * GET /api/v1/customers/duplicates
     * US-04: API phát hiện khách hàng trùng
     */
    public function duplicates(): JsonResponse
    {
        $result = $this->customerService->findDuplicates();

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Quét phát hiện khách hàng trùng thành công.',
        ]);
    }

    /**
     * POST /api/v1/customers/merge
     * US-04: API gộp khách hàng trùng
     */
    public function merge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_id' => ['required', 'integer', 'exists:customers,id'],
            'target_id' => ['required', 'integer', 'exists:customers,id'],
            'overrides' => ['nullable', 'array'],
        ]);

        $sourceId = (int) $validated['source_id'];
        $targetId = (int) $validated['target_id'];
        $overrides = $validated['overrides'] ?? [];

        try {
            $mergedCustomer = $this->customerService->mergeCustomers(
                $sourceId,
                $targetId,
                $overrides,
                $request->user()
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $mergedCustomer->id,
                    'name' => $mergedCustomer->name,
                    'taxCode' => $mergedCustomer->tax_code,
                    'contactsCount' => $mergedCustomer->contacts->count(),
                    'contractsCount' => $mergedCustomer->contracts->count(),
                ],
                'message' => "Gộp thành công khách hàng nguồn #{$sourceId} vào khách hàng chính #{$targetId}.",
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gộp khách hàng: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/v1/customers/{customer}/owner
     */
    public function updateOwner(
        UpdateCustomerOwnerRequest $request,
        Customer $customer
    ): JsonResponse {
        $currentUser = $request->attributes->get('current_user') ?? $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $updatedCustomer = $this->customerService->updateOwner(
            $customer,
            (int) $request->validated('owner_id'),
            $currentUser
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $updatedCustomer->id,
                'name' => $updatedCustomer->name,
                'owner_id' => $updatedCustomer->owner_id,
            ],
            'message' => 'Cập nhật người sở hữu khách hàng thành công.',
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCustomerParentRequest;
use App\Http\Resources\CustomerHierarchyResource;
use App\Models\Customer;
use App\Services\CustomerHierarchyService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class CustomerHierarchyController extends Controller
{
    public function __construct(
        private readonly CustomerHierarchyService $customerHierarchyService
    ) {
    }

    public function updateParent(
        UpdateCustomerParentRequest $request,
        Customer $customer
    ): JsonResponse {
        try {
            $updatedCustomer =
                $this->customerHierarchyService->updateParent(
                    $customer,
                    $request->validated('parent_customer_id')
                );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $updatedCustomer->id,
                    'name' => $updatedCustomer->name,
                    'parent_customer_id' =>
                        $updatedCustomer->parent_customer_id,
                ],
                'message' =>
                    'Cập nhật công ty mẹ thành công.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function hierarchy(
        Customer $customer
    ): JsonResponse {
        $customer =
            $this->customerHierarchyService->getHierarchy(
                $customer
            );

        return response()->json([
            'success' => true,
            'data' => new CustomerHierarchyResource(
                $customer
            ),
            'message' =>
                'Lấy cấu trúc công ty thành công.',
        ]);
    }

    public function groupContractValue(
        Customer $customer
    ): JsonResponse {
        $data =
            $this->customerHierarchyService
                ->getGroupContractValue($customer);

        return response()->json([
            'success' => true,
            'data' => $data,
            'message' =>
                'Lấy tổng giá trị hợp đồng của nhóm công ty thành công.',
        ]);
    }
}
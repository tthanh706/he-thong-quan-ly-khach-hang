<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateCustomerOwnerRequest;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {
    }

    public function updateOwner(
        UpdateCustomerOwnerRequest $request,
        Customer $customer
    ): JsonResponse {
        $currentUser = $request->attributes->get('current_user');

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
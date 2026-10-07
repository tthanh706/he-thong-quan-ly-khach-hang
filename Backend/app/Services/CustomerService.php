<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {
    }

    public function updateOwner(
        Customer $customer,
        int $newOwnerId,
        User $currentUser
    ): Customer {
        return DB::transaction(function () use (
            $customer,
            $newOwnerId,
            $currentUser
        ) {
            $oldOwnerId = $customer->owner_id;

            if ($oldOwnerId === $newOwnerId) {
                return $customer;
            }

            $customer->owner_id = $newOwnerId;
            $customer->save();

            $this->auditLogService->logChange(
                $currentUser->id,
                'updated',
                'Customer',
                $customer->id,
                'owner_id',
                $oldOwnerId,
                $newOwnerId
            );

            return $customer->fresh();
        });
    }
}
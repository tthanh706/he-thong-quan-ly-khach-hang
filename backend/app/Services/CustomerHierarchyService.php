<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CustomerHierarchyService
{
    public function updateParent(
        Customer $customer,
        ?int $parentCustomerId
    ): Customer {
        if ($parentCustomerId === null) {
            $customer->update([
                'parent_customer_id' => null,
            ]);

            return $customer->fresh();
        }

        if ($customer->id === $parentCustomerId) {
            throw new InvalidArgumentException(
                'Khách hàng không thể là công ty mẹ của chính mình.'
            );
        }

        $parentCustomer = Customer::findOrFail(
            $parentCustomerId
        );

        if (
            $this->wouldCreateCycle(
                $customer,
                $parentCustomer
            )
        ) {
            throw new InvalidArgumentException(
                'Không thể tạo quan hệ công ty mẹ/con do phát sinh vòng lặp.'
            );
        }

        $customer->update([
            'parent_customer_id' => $parentCustomerId,
        ]);

        return $customer->fresh();
    }

    public function getHierarchy(
        Customer $customer
    ): Customer {
        $this->loadChildrenRecursively($customer);

        return $customer;
    }

    public function getGroupCustomerIds(
        Customer $customer
    ): array {
        $ids = [$customer->id];

        $this->collectChildCustomerIds(
            $customer,
            $ids
        );

        return array_values(
            array_unique($ids)
        );
    }

    public function getGroupContractValue(
        Customer $customer
    ): array {
        $customerIds =
            $this->getGroupCustomerIds($customer);

        $totalValue = Contract::query()
            ->whereIn(
                'customer_id',
                $customerIds
            )
            ->sum('contract_value');

        $contracts = Contract::query()
            ->whereIn(
                'customer_id',
                $customerIds
            )
            ->with('customer')
            ->orderBy('customer_id')
            ->get();

        return [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'group_customer_ids' => $customerIds,
            'total_contract_value' => $totalValue,
            'contracts' => $contracts,
        ];
    }

    private function wouldCreateCycle(
        Customer $customer,
        Customer $parentCustomer
    ): bool {
        $current = $parentCustomer;

        while ($current !== null) {
            if ($current->id === $customer->id) {
                return true;
            }

            if ($current->parent_customer_id === null) {
                break;
            }

            $current = Customer::find(
                $current->parent_customer_id
            );
        }

        return false;
    }

    private function collectChildCustomerIds(
        Customer $customer,
        array &$ids
    ): void {
        $children = Customer::query()
            ->where(
                'parent_customer_id',
                $customer->id
            )
            ->get();

        foreach ($children as $child) {
            $ids[] = $child->id;

            $this->collectChildCustomerIds(
                $child,
                $ids
            );
        }
    }
    private function loadChildrenRecursively(
        Customer $customer
    ): void {
        $customer->load('childCustomers');

        foreach ($customer->childCustomers as $child) {
            $this->loadChildrenRecursively($child);
        }
    }
}
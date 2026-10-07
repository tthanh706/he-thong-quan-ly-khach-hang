<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    private ?AuditLogService $auditLogService = null;

    public function __construct(?AuditLogService $auditLogService = null)
    {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
    }

    /**
     * Lấy danh sách khách hàng có phân trang.
     */
    public function paginate(int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = Customer::query()->with('owner');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('owner_id', $filters['assigned_to']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Tìm khách hàng theo ID. Ném ModelNotFoundException nếu không tồn tại.
     *
     * @throws ModelNotFoundException
     */
    public function findOrFail(int $id): Customer
    {
        return Customer::findOrFail($id);
    }

    /**
     * Tạo khách hàng mới.
     */
    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    /**
     * Cập nhật thông tin khách hàng.
     *
     * @throws ModelNotFoundException   Nếu không tìm thấy.
     * @throws AuthorizationException   Nếu user không có quyền sửa.
     */
    public function update(int $id, array $data, int $actingUserId): Customer
    {
        $customer = $this->findOrFail($id);

        if (
            $customer->owner_id !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền chỉnh sửa khách hàng này.');
        }

        $customer->update($data);

        return $customer->fresh();
    }

    /**
     * Xoá mềm khách hàng.
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     */
    public function delete(int $id, int $actingUserId): void
    {
        $customer = $this->findOrFail($id);

        if (! $this->actingUserIsAdmin($actingUserId)) {
            throw new AuthorizationException('Chỉ quản trị viên mới có thể xóa khách hàng.');
        }

        $customer->delete();
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

    private function actingUserIsAdmin(int $userId): bool
    {
        return \App\Models\User::where('id', $userId)
                               ->where('role', 'admin')
                               ->exists();
    }
}

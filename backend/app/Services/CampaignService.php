<?php

namespace App\Services;

use App\Models\Campaign;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * CampaignService
 *
 * Business logic cho chiến dịch marketing.
 * Ném exception chuẩn để Handler::render() bắt và hiển thị trang lỗi dùng chung.
 */
class CampaignService
{
    /**
     * Lấy danh sách chiến dịch có phân trang.
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Campaign::query()->with(['creator', 'customer']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Tìm chiến dịch theo ID.
     *
     * @throws ModelNotFoundException
     */
    public function findOrFail(int $id): Campaign
    {
        return Campaign::findOrFail($id);
    }

    /**
     * Tạo chiến dịch mới.
     */
    public function create(array $data, int $createdBy): Campaign
    {
        return Campaign::create(array_merge($data, ['created_by' => $createdBy]));
    }

    /**
     * Cập nhật chiến dịch.
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException  Nếu không phải người tạo hoặc admin.
     */
    public function update(int $id, array $data, int $actingUserId): Campaign
    {
        $campaign = $this->findOrFail($id);

        if (
            $campaign->created_by !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền chỉnh sửa chiến dịch này.');
        }

        $campaign->update($data);

        return $campaign->fresh();
    }

    /**
     * Thay đổi trạng thái chiến dịch.
     *
     * @param  string $status  'draft' | 'active' | 'paused' | 'completed'
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     * @throws \InvalidArgumentException  Nếu trạng thái không hợp lệ.
     */
    public function changeStatus(int $id, string $status, int $actingUserId): Campaign
    {
        $allowed = ['draft', 'active', 'paused', 'completed'];

        if (! in_array($status, $allowed, true)) {
            throw new \InvalidArgumentException("Trạng thái [{$status}] không hợp lệ.");
        }

        return $this->update($id, ['status' => $status], $actingUserId);
    }

    /**
     * Xoá mềm chiến dịch.
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     */
    public function delete(int $id, int $actingUserId): void
    {
        $campaign = $this->findOrFail($id);

        if (
            $campaign->created_by !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền xóa chiến dịch này.');
        }

        $campaign->delete();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function actingUserIsAdmin(int $userId): bool
    {
        return \App\Models\User::where('id', $userId)
                               ->where('role', 'admin')
                               ->exists();
    }
}

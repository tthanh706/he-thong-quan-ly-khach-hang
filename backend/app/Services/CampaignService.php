<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Lead;
use App\Models\Opportunity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * CampaignService (S4-03)
 *
 * Business logic cho chiến dịch marketing: ngân sách, kênh, thời gian chạy,
 * đo lường số lead, số cơ hội và giá trị hợp đồng đã chốt.
 */
class CampaignService
{
    /**
     * Lấy danh sách chiến dịch có phân trang kèm thống kê kết quả thực tế (S4-03)
     */
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Campaign::query()
            ->with(['creator', 'customer'])
            ->withCount(['leads as lead_count', 'opportunities as opportunity_count']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['channel'])) {
            $query->where('channel', $filters['channel']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('channel', 'like', "%{$search}%");
            });
        }

        $paginator = $query->latest()->paginate($perPage);

        // Tính tổng giá trị đã chốt thắng (won_value) cho từng campaign
        $paginator->getCollection()->transform(function ($campaign) {
            $wonValue = Opportunity::where('campaign_id', $campaign->id)
                ->where(function ($q) {
                    $q->where('closed_outcome', 'won')
                      ->orWhere('stage', 'chot_thanh_cong');
                })
                ->sum(DB::raw('COALESCE(actual_won_value, value, amount, 0)'));

            $campaign->won_value = (float) $wonValue;
            return $campaign;
        });

        return $paginator;
    }

    /**
     * Tìm chiến dịch theo ID kèm thống kê
     */
    public function findOrFail(int $id): Campaign
    {
        $campaign = Campaign::with(['creator', 'customer'])
            ->withCount(['leads as lead_count', 'opportunities as opportunity_count'])
            ->findOrFail($id);

        $wonValue = Opportunity::where('campaign_id', $campaign->id)
            ->where(function ($q) {
                $q->where('closed_outcome', 'won')
                  ->orWhere('stage', 'chot_thanh_cong');
            })
            ->sum(\Illuminate\Support\Facades\DB::raw('COALESCE(actual_won_value, value, amount, 0)'));

        $campaign->won_value = (float) $wonValue;
        return $campaign;
    }

    /**
     * Tạo chiến dịch mới (S4-03)
     */
    public function create(array $data, int $createdBy): Campaign
    {
        return Campaign::create(array_merge($data, ['created_by' => $createdBy]));
    }

    /**
     * Cập nhật chiến dịch.
     */
    public function update(int $id, array $data, int $actingUserId): Campaign
    {
        $campaign = Campaign::findOrFail($id);

        if (
            $campaign->created_by !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền chỉnh sửa chiến dịch này.');
        }

        $campaign->update($data);

        return $this->findOrFail($id);
    }

    /**
     * Thay đổi trạng thái chiến dịch.
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
     */
    public function delete(int $id, int $actingUserId): void
    {
        $campaign = Campaign::findOrFail($id);

        if (
            $campaign->created_by !== $actingUserId
            && ! $this->actingUserIsAdmin($actingUserId)
        ) {
            throw new AuthorizationException('Bạn không có quyền xóa chiến dịch này.');
        }

        $campaign->delete();
    }

    private function actingUserIsAdmin(int $userId): bool
    {
        return \App\Models\User::where('id', $userId)
                               ->where('role', 'admin')
                               ->exists();
    }
}

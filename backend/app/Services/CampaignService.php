<?php

namespace App\Services;

use App\Enums\CampaignStatusEnum;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Campaign::query()
            ->with(['owner:id,name,email'])
            ->withCount(['leads', 'opportunities'])
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won'); // hoặc status = 'won' tùy schema Opportunity
            }], 'amount')
            ->dataScope($user);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['channel'])) {
            $query->where('channel', $filters['channel']);
        }

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        return $query->paginate($perPage);
    }

    public function findById(int $id, User $user): Campaign

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
        return Campaign::query()
            ->with(['owner:id,name,email'])
            ->withCount(['leads', 'opportunities'])
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won');
            }], 'amount')
            ->dataScope($user)
            ->findOrFail($id);
    }


    public function create(array $data, User $user): Campaign
    {
        return DB::transaction(function () use ($data, $user) {
            $data['owner_id'] = $user->id;
            $data['status'] = $data['status'] ?? CampaignStatusEnum::DRAFT->value;

            return Campaign::create($data);
        });
    }

    public function update(Campaign $campaign, array $data): Campaign

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
        return DB::transaction(function () use ($campaign, $data) {
            $campaign->update($data);
            return $campaign->fresh();
        });
    }

    public function delete(Campaign $campaign): bool
    {
        return DB::transaction(function () use ($campaign) {
            // Không xóa cứng nếu đã có lead/opportunity (soft delete)
            return $campaign->delete();
        });
    }

    /**

     */
    public function getPerformanceReport(User $user, array $filters = []): LengthAwarePaginator
    {

        $query = Campaign::query()
            ->select('campaigns.*')
            ->withCount('leads')
            ->withCount('opportunities')
            ->withSum(['opportunities as closed_value' => function ($q) {
                $q->where('stage', 'won');
            }], 'amount')
            ->dataScope($user);

        if (!empty($filters['from_date'])) {
            $query->where('start_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '<=', $filters['to_date']);
            });
        }

        return $query->orderByDesc('closed_value')->paginate($filters['per_page'] ?? 20);

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
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
     * Báo cáo chi tiết metrics theo chiến dịch
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
    }
}
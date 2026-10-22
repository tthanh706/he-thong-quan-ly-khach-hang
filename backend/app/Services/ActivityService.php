<?php

namespace App\Services;

use App\Models\Activity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ActivityService
{
    public function getPaginatedActivities(array $filters = []): LengthAwarePaginator
    {
        $query = Activity::with(['user', 'customer', 'contact', 'opportunity'])
            ->latest('performed_at');

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function createActivity(array $data): Activity
    {
        $data['user_id'] = Auth::id() ?? 1; // Mặc định NV Kinh doanh đang login
        
        return Activity::create($data);
    }

    public function deleteActivity(Activity $activity): bool
    {
        return $activity->delete();
    }
}
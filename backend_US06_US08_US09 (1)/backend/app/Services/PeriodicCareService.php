<?php

namespace App\Services;

use App\Enums\CareStatusEnum;
use App\Models\PeriodicCare;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PeriodicCareService
{
    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = PeriodicCare::query()
            ->with(['customer:id,code,name', 'assignee:id,name', 'creator:id,name'])
            ->dataScope($user);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['care_type'])) {
            $query->where('care_type', $filters['care_type']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('scheduled_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('scheduled_date', '<=', $filters['to_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
        }

        // Cảnh báo: chỉ lấy sắp đến hạn / quá hạn
        if (!empty($filters['warning_only'])) {
            $query->upcomingOrOverdue((int) ($filters['warning_days'] ?? 7));
        }

        $sortBy = $filters['sort_by'] ?? 'scheduled_date';
        $sortOrder = $filters['sort_order'] ?? 'asc';

        return $query
            ->orderBy($sortBy, $sortOrder)
            ->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id, User $user): PeriodicCare
    {
        return PeriodicCare::with(['customer', 'assignee', 'creator'])
            ->dataScope($user)
            ->findOrFail($id);
    }

    public function create(array $data, User $user): PeriodicCare
    {
        return DB::transaction(function () use ($data, $user) {
            return PeriodicCare::create([
                'customer_id' => $data['customer_id'],
                'care_type' => $data['care_type'],
                'scheduled_date' => $data['scheduled_date'],
                'assignee_id' => $data['assignee_id'] ?? null,
                'status' => CareStatusEnum::PENDING,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);
        });
    }

    public function update(PeriodicCare $care, array $data): PeriodicCare
    {
        return DB::transaction(function () use ($care, $data) {
            if (isset($data['status']) && $data['status'] === CareStatusEnum::DONE->value) {
                $data['completed_at'] = now();
            }

            $care->update($data);

            return $care->fresh(['customer', 'assignee', 'creator']);
        });
    }

    public function markDone(PeriodicCare $care, ?string $notes = null): PeriodicCare
    {
        $care->update([
            'status' => CareStatusEnum::DONE,
            'completed_at' => now(),
            'notes' => $notes ?? $care->notes,
        ]);

        return $care->fresh(['customer', 'assignee', 'creator']);
    }

    public function delete(PeriodicCare $care): bool
    {
        return $care->delete();
    }

    /**
     * API hỗ trợ & cảnh báo: trả về danh sách lịch chăm sóc sắp đến hạn / quá hạn
     */
    public function getWarnings(User $user, int $days = 7): array
    {
        $items = PeriodicCare::with(['customer:id,code,name', 'assignee:id,name'])
            ->dataScope($user)
            ->upcomingOrOverdue($days)
            ->orderBy('scheduled_date')
            ->get();

        return [
            'total' => $items->count(),
            'overdue' => $items->filter(fn ($item) => $item->scheduled_date->isPast())->count(),
            'upcoming' => $items->filter(fn ($item) => !$item->scheduled_date->isPast())->count(),
            'items' => $items,
        ];
    }
}

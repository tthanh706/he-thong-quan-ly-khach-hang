<?php

namespace App\Services;

use App\Enums\SupportStatusEnum;
use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupportRequestService
{
    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = SupportRequest::query()
            ->with(['customer:id,code,name', 'assignee:id,name', 'creator:id,name'])
            ->dataScope($user);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        return $query
            ->orderBy($sortBy, $sortOrder)
            ->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id, User $user): SupportRequest
    {
        return SupportRequest::with(['customer', 'assignee', 'creator'])
            ->dataScope($user)
            ->findOrFail($id);
    }

    public function create(array $data, User $user): SupportRequest
    {
        return DB::transaction(function () use ($data, $user) {
            $code = $this->generateCode();

            return SupportRequest::create([
                'code' => $code,
                'customer_id' => $data['customer_id'],
                'subject' => $data['subject'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'],
                'status' => SupportStatusEnum::OPEN,
                'assignee_id' => $data['assignee_id'] ?? null,
                'created_by' => $user->id,
            ]);
        });
    }

    public function update(SupportRequest $supportRequest, array $data): SupportRequest
    {
        return DB::transaction(function () use ($supportRequest, $data) {
            if (isset($data['status']) && $data['status'] === SupportStatusEnum::CLOSED->value) {
                $data['resolved_at'] = now();
            }

            $supportRequest->update($data);

            return $supportRequest->fresh(['customer', 'assignee', 'creator']);
        });
    }

    public function assign(SupportRequest $supportRequest, int $assigneeId): SupportRequest
    {
        $supportRequest->update([
            'assignee_id' => $assigneeId,
            'status' => SupportStatusEnum::IN_PROGRESS,
        ]);

        return $supportRequest->fresh(['customer', 'assignee', 'creator']);
    }

    public function delete(SupportRequest $supportRequest): bool
    {
        return $supportRequest->delete();
    }

    /**
     * API cảnh báo (US-08):
     * - HIGH priority chưa xử lý quá X giờ
     * - Mọi yêu cầu OPEN / IN_PROGRESS quá hạn xử lý
     * - Chưa được phân công (assignee_id null)
     */
    public function getWarnings(User $user, int $hoursHigh = 24, int $hoursNormal = 72): array
    {
        $baseQuery = SupportRequest::with(['customer:id,code,name', 'assignee:id,name', 'creator:id,name'])
            ->dataScope($user)
            ->whereIn('status', [
                SupportStatusEnum::OPEN->value,
                SupportStatusEnum::IN_PROGRESS->value,
            ]);

        // 1. Ưu tiên HIGH quá hạn
        $highOverdue = (clone $baseQuery)
            ->where('priority', 'HIGH')
            ->where('created_at', '<=', now()->subHours($hoursHigh))
            ->orderBy('created_at')
            ->get();

        // 2. MEDIUM / LOW quá hạn
        $normalOverdue = (clone $baseQuery)
            ->whereIn('priority', ['MEDIUM', 'LOW'])
            ->where('created_at', '<=', now()->subHours($hoursNormal))
            ->orderBy('created_at')
            ->get();

        // 3. Chưa phân công
        $unassigned = (clone $baseQuery)
            ->whereNull('assignee_id')
            ->orderBy('created_at')
            ->get();

        // Gộp unique theo id
        $allItems = $highOverdue
            ->concat($normalOverdue)
            ->concat($unassigned)
            ->unique('id')
            ->values();

        return [
            'total' => $allItems->count(),
            'high_priority_overdue' => $highOverdue->count(),
            'normal_overdue' => $normalOverdue->count(),
            'unassigned' => $unassigned->count(),
            'items' => $allItems,
        ];
    }

    private function generateCode(): string
    {
        $last = SupportRequest::withTrashed()
            ->orderByDesc('id')
            ->value('code');

        $number = 100;
        if ($last && preg_match('/REQ-(\d+)/', $last, $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return 'REQ-' . $number;
    }
}

<?php

namespace App\Services;

use App\Models\HandoverLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AccountHandoverService
{
    public function __construct(private SessionService $sessionService) {}

    public function lockAndHandover(User $source, User $target, User $performedBy): array
    {
        if ($source->isLocked()) {
            throw ValidationException::withMessages(['account' => 'Tài khoản đã bị khóa.']);
        }

        if ($source->is($target)) {
            throw ValidationException::withMessages([
                'replacement_user_id' => 'Không thể chọn chính tài khoản bị khóa.',
            ]);
        }

        if ($target->isLocked()) {
            throw ValidationException::withMessages([
                'replacement_user_id' => 'Người tiếp nhận đang bị khóa.',
            ]);
        }

        return DB::transaction(function () use ($source, $target, $performedBy): array {
            $now = now();
            $customerIds = $source->customers()->pluck('id');
            $opportunityIds = $source->opportunities()->pluck('id');

            $source->customers()->update(['owner_id' => $target->id]);
            $source->opportunities()->update(['owner_id' => $target->id]);

            $logs = [];
            foreach ($customerIds as $entityId) {
                $logs[] = $this->logRow($source, $target, $performedBy, 'customer', $entityId, $now);
            }
            foreach ($opportunityIds as $entityId) {
                $logs[] = $this->logRow($source, $target, $performedBy, 'opportunity', $entityId, $now);
            }

            if ($logs !== []) {
                HandoverLog::insert($logs);
            }

            $source->update(['locked_at' => $now]);
            $revokedSessions = $this->sessionService->revokeAllForUser($source);

            return [
                'customers' => count($customerIds),
                'opportunities' => count($opportunityIds),
                'target_user_id' => $target->id,
                'revoked_sessions' => $revokedSessions,
                'locked_at' => $now,
            ];
        });
    }

    private function logRow(User $source, User $target, User $performedBy, string $type, int $entityId, $now): array
    {
        return [
            'source_user_id' => $source->id,
            'target_user_id' => $target->id,
            'performed_by_user_id' => $performedBy->id,
            'entity_type' => $type,
            'entity_id' => $entityId,
            'handed_over_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}

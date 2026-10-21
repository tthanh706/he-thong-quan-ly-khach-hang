<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\OpportunityMember;
use App\Models\OpportunityOwnershipLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OpportunityMemberService
{
    /**
     * Lấy danh sách thành viên của Opportunity
     */
    public function getMembers(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->opportunityMembers()
            ->with(['user:id,name,email', 'addedBy:id,name'])
            ->orderBy('added_at')
            ->get();
    }

    /**
     * Thêm thành viên vào Opportunity
     */
    public function addMember(Opportunity $opportunity, array $data, User $actor): OpportunityMember
    {
        return DB::transaction(function () use ($opportunity, $data, $actor) {
            $member = OpportunityMember::create([
                'opportunity_id' => $opportunity->id,
                'user_id' => $data['user_id'],
                'role' => $data['role'] ?? 'member',
                'added_by' => $actor->id,
                'added_at' => now(),
            ]);

            return $member->load(['user:id,name,email', 'addedBy:id,name']);
        });
    }

    /**
     * Xóa thành viên khỏi Opportunity
     */
    public function removeMember(Opportunity $opportunity, int $userId): void
    {
        DB::transaction(function () use ($opportunity, $userId) {
            OpportunityMember::where('opportunity_id', $opportunity->id)
                ->where('user_id', $userId)
                ->delete();
        });
    }

    /**
     * Chuyển quyền sở hữu + ghi nhật ký
     */
    public function transferOwnership(
        Opportunity $opportunity,
        int $newOwnerId,
        User $actor,
        ?string $note = null,
        bool $keepAsMember = true
    ): Opportunity {
        return DB::transaction(function () use ($opportunity, $newOwnerId, $actor, $note, $keepAsMember) {
            $oldOwnerId = $opportunity->owner_id;

            // Ghi nhật ký trước khi đổi
            OpportunityOwnershipLog::create([
                'opportunity_id' => $opportunity->id,
                'from_owner_id' => $oldOwnerId,
                'to_owner_id' => $newOwnerId,
                'changed_by' => $actor->id,
                'note' => $note,
                'changed_at' => now(),
            ]);

            // Đổi owner
            $opportunity->owner_id = $newOwnerId;
            $opportunity->save();

            // Nếu giữ owner cũ làm member
            if ($keepAsMember && $oldOwnerId) {
                $exists = OpportunityMember::where('opportunity_id', $opportunity->id)
                    ->where('user_id', $oldOwnerId)
                    ->exists();

                if (!$exists) {
                    OpportunityMember::create([
                        'opportunity_id' => $opportunity->id,
                        'user_id' => $oldOwnerId,
                        'role' => 'member',
                        'added_by' => $actor->id,
                        'added_at' => now(),
                    ]);
                }
            }

            // Nếu new owner đang là member → xóa khỏi members (vì đã thành owner)
            OpportunityMember::where('opportunity_id', $opportunity->id)
                ->where('user_id', $newOwnerId)
                ->delete();

            return $opportunity->fresh(['owner', 'opportunityMembers.user']);
        });
    }

    /**
     * Lấy lịch sử chuyển quyền sở hữu
     */
    public function getOwnershipLogs(Opportunity $opportunity): \Illuminate\Database\Eloquent\Collection
    {
        return $opportunity->ownershipLogs()
            ->with([
                'fromOwner:id,name',
                'toOwner:id,name',
                'changedBy:id,name',
            ])
            ->orderByDesc('changed_at')
            ->get();
    }
}
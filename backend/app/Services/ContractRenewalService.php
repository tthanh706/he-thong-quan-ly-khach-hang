<?php

namespace App\Services;

use App\Enums\ContractAlertTypeEnum;
use App\Enums\ContractStatusEnum;
use App\Enums\OpportunityStatusEnum;
use App\Models\Contract;
use App\Models\ContractExpiryAlert;
use App\Models\ContractExpirySetting;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ContractRenewalService
{
    public function getWarningSetting(): ContractExpirySetting
    {
        return ContractExpirySetting::firstOrCreate(
            [],
            [
                'warning_days' => 30,
                'is_active' => true,
            ]
        );
    }

    public function updateWarningSetting(
        int $warningDays,
        bool $isActive
    ): ContractExpirySetting {
        $setting = $this->getWarningSetting();

        $setting->update([
            'warning_days' => $warningDays,
            'is_active' => $isActive,
        ]);

        return $setting->fresh();
    }

    public function getDaysRemaining(
        Contract $contract
    ): int {
        return (int) today()->diffInDays(
            $contract->end_date,
            false
        );
    }

    public function checkContracts(): array
    {
        $setting = $this->getWarningSetting();

        $expiringSoonCount = 0;
        $expiredCount = 0;

        $contracts = Contract::query()
            ->where(
                'status',
                ContractStatusEnum::ACTIVE->value
            )
            ->get();

        foreach ($contracts as $contract) {
            $daysRemaining = $this->getDaysRemaining(
                $contract
            );

            if ($daysRemaining < 0) {
                if ($this->flagExpired($contract)) {
                    $expiredCount++;
                }

                continue;
            }

            if (
                $setting->is_active
                && $daysRemaining <= $setting->warning_days
            ) {
                if (
                    $this->flagExpiringSoon(
                        $contract,
                        $daysRemaining
                    )
                ) {
                    $expiringSoonCount++;
                }
            }
        }

        return [
            'expiring_soon_count' => $expiringSoonCount,
            'expired_count' => $expiredCount,
            'total_flagged' => $expiringSoonCount
                + $expiredCount,
        ];
    }

    public function flagExpiringSoon(
        Contract $contract,
        int $daysRemaining
    ): bool {
        $alert = ContractExpiryAlert::firstOrCreate(
            [
                'contract_id' => $contract->id,
                'type' => ContractAlertTypeEnum::EXPIRING_SOON->value,
            ],
            [
                'recipient_user_id' => $contract->accountant_user_id,
                'message' => sprintf(
                    'Hợp đồng %s của %s sẽ hết hạn sau %d ngày.',
                    $contract->contract_code,
                    $contract->customer_name,
                    $daysRemaining
                ),
                'detected_at' => now(),
            ]
        );

        return $alert->wasRecentlyCreated;
    }

    public function flagExpired(
        Contract $contract
    ): bool {
        return DB::transaction(function () use (
            $contract
        ): bool {
            $contract->update([
                'status' => ContractStatusEnum::EXPIRED,
            ]);

            $alert = ContractExpiryAlert::firstOrCreate(
                [
                    'contract_id' => $contract->id,
                    'type' => ContractAlertTypeEnum::EXPIRED->value,
                ],
                [
                    'recipient_user_id' => $contract->accountant_user_id,
                    'message' => sprintf(
                        'Hợp đồng %s của %s đã hết hạn vào ngày %s.',
                        $contract->contract_code,
                        $contract->customer_name,
                        $contract->end_date->format('d/m/Y')
                    ),
                    'detected_at' => now(),
                ]
            );

            return $alert->wasRecentlyCreated;
        });
    }

    public function getContractsForAccountant(
        User $accountant
    ): Collection {
        return Contract::query()
            ->with([
                'owner',
                'accountant',
                'renewalOpportunity',
                'expiryAlerts',
            ])
            ->where(
                'accountant_user_id',
                $accountant->id
            )
            ->orderBy('end_date')
            ->get();
    }

    public function getAlertsForAccountant(
        User $accountant
    ): Collection {
        return ContractExpiryAlert::query()
            ->with([
                'contract.owner',
                'contract.accountant',
                'recipient',
            ])
            ->where(
                'recipient_user_id',
                $accountant->id
            )
            ->latest('detected_at')
            ->get();
    }

    public function createRenewalOpportunity(
        Contract $contract
    ): Opportunity {
        if (
            !in_array(
                $contract->status,
                [
                    ContractStatusEnum::ACTIVE,
                    ContractStatusEnum::EXPIRED,
                ],
                true
            )
        ) {
            throw new InvalidArgumentException(
                'Trạng thái hợp đồng không cho phép tạo cơ hội gia hạn.'
            );
        }

        $existingOpportunity = Opportunity::query()
            ->where(
                'source_contract_id',
                $contract->id
            )
            ->first();

        if ($existingOpportunity) {
            throw new InvalidArgumentException(
                'Hợp đồng này đã có cơ hội gia hạn.'
            );
        }

        return DB::transaction(function () use (
            $contract
        ): Opportunity {
            return Opportunity::create([
                'source_contract_id' => $contract->id,
                'opportunity_type' => 'renewal',

                'name' => sprintf(
                    'Gia hạn %s - %s',
                    $contract->contract_code,
                    $contract->customer_name
                ),

                'owner_user_id' => $contract->owner_user_id,

                'team_leader_id' => null,

                'stage' => 'new',

                'status' => OpportunityStatusEnum::OPEN,

                'value' => $contract->contract_value,

                'expected_close_date' => $contract->end_date,

                'last_activity_at' => now(),
            ]);
        });
    }
}
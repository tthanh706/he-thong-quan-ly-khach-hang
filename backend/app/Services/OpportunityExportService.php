<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\OpportunityCustomField;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class OpportunityExportService
{
    public function getFilteredOpportunities(
        User $currentUser,
        array $filters
    ): Collection {
        $query = Opportunity::query()
            ->with([
                'owner',
                'teamLeader',
                'customFieldValues.customField',
            ])
            ->where(
                'team_leader_id',
                $currentUser->id
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->orderBy('expected_close_date')
            ->orderBy('id')
            ->get();
    }

    public function getActiveCustomFields(): Collection
    {
        return OpportunityCustomField::query()
            ->where(
                'is_active',
                true
            )
            ->orderBy('id')
            ->get();
    }

    public function canViewFinancials(
        User $user
    ): bool {
        return (bool)
            $user->can_view_opportunity_financials;
    }

    public function buildRows(
        User $currentUser,
        Collection $opportunities,
        Collection $customFields
    ): array {
        $canViewFinancials =
            $this->canViewFinancials(
                $currentUser
            );

        return $opportunities
            ->map(function (
                Opportunity $opportunity
            ) use (
                $customFields,
                $canViewFinancials
            ): array {
                $status = $opportunity->status;

                $row = [
                    'id' =>
                        $opportunity->id,

                    'name' =>
                        $opportunity->name,

                    'owner' =>
                        $opportunity->owner?->name,

                    'stage' =>
                        $opportunity->stage,

                    'status' =>
                        $status instanceof \BackedEnum
                            ? $status->value
                            : (string) $status,

                    'value' =>
                        (float) $opportunity->value,

                    'expected_close_date' =>
                        $opportunity
                            ->expected_close_date
                            ?->format('Y-m-d'),

                    'opportunity_type' =>
                        $opportunity
                            ->opportunity_type,
                ];

                if ($canViewFinancials) {
                    $row['cost_price'] =
                        (float)
                        $opportunity->cost_price;

                    $row['profit_margin'] =
                        $opportunity
                            ->profit_margin;
                }

                foreach (
                    $customFields
                    as $customField
                ) {
                    $customValue =
                        $opportunity
                            ->customFieldValues
                            ->firstWhere(
                                'custom_field_id',
                                $customField->id
                            );

                    $row[
                        'custom_'
                        . $customField->field_key
                    ] = $customValue
                        ?->field_value;
                }

                return $row;
            })
            ->values()
            ->all();
    }

    private function applyFilters(
        Builder $query,
        array $filters
    ): void {
        if (!empty($filters['stage'])) {
            $query->where(
                'stage',
                $filters['stage']
            );
        }

        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (!empty(
            $filters['owner_user_id']
        )) {
            $query->where(
                'owner_user_id',
                $filters['owner_user_id']
            );
        }

        if (!empty(
            $filters['date_from']
        )) {
            $query->whereDate(
                'expected_close_date',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty(
            $filters['date_to']
        )) {
            $query->whereDate(
                'expected_close_date',
                '<=',
                $filters['date_to']
            );
        }

        if (!empty(
            $filters['search']
        )) {
            $search =
                $filters['search'];

            $query->where(
                function (
                    Builder $subQuery
                ) use ($search): void {
                    $subQuery
                        ->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhereHas(
                            'owner',
                            function (
                                Builder $ownerQuery
                            ) use ($search): void {
                                $ownerQuery
                                    ->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    );
                            }
                        );
                }
            );
        }
    }
}
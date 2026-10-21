<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadActivityLog;
use App\Models\LeadMergeLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeadDeduplicationService
{
    /**
     * Detect duplicate leads for the given lead based on email, phone_number, company_name.
     *
     * @return array{duplicate_leads: Collection, matching_customers: Collection}
     */
    public function detectDuplicates(Lead $lead): array
    {
        $duplicateLeads = Lead::query()
            ->duplicatesOf($lead)
            ->with(['assignedUser', 'activityLogs'])
            ->get();

        $matchingCustomers = $this->findMatchingCustomers($lead);

        return [
            'duplicate_leads'     => $duplicateLeads,
            'matching_customers'  => $matchingCustomers,
        ];
    }

    /**
     * Find existing customers that match the lead's dedup fields.
     * Used to suggest linking a lead to an existing customer record.
     */
    public function findMatchingCustomers(Lead $lead): Collection
    {
        return Customer::query()
            ->where(function ($q) use ($lead) {
                if ($lead->email) {
                    $q->orWhere('email', $lead->email);
                }
                if ($lead->phone_number) {
                    $q->orWhere('phone_number', $lead->phone_number);
                }
                if ($lead->company_name) {
                    $q->orWhere('company_name', $lead->company_name);
                }
            })
            ->get();
    }

    /**
     * Link a lead directly to an existing customer record.
     */
    public function linkLeadToCustomer(Lead $lead, Customer $customer, int $performedBy): Lead
    {
        return DB::transaction(function () use ($lead, $customer, $performedBy) {
            $lead->update([
                'linked_customer_id' => $customer->id,
                'status'             => 'converted',
            ]);

            LeadActivityLog::create([
                'lead_id'     => $lead->id,
                'type'        => 'status_change',
                'subject'     => 'Lead linked to existing customer',
                'description' => "Lead linked to customer #{$customer->id} ({$customer->company_name})",
                'metadata'    => [
                    'customer_id'   => $customer->id,
                    'customer_name' => $customer->company_name,
                ],
                'created_by'  => $performedBy,
            ]);

            return $lead->fresh(['linkedCustomer', 'activityLogs']);
        });
    }

    /**
     * Merge a secondary lead into a primary lead.
     *
     * All activity logs from the secondary lead are reassigned to the primary lead.
     * The secondary lead is marked as 'merged' and soft-deleted.
     * A LeadMergeLog audit record is created.
     *
     * @param Lead   $primaryLead   The lead to keep.
     * @param Lead   $secondaryLead The lead to merge and retire.
     * @param int    $performedBy   User ID performing the merge.
     * @param string|null $reason   Optional merge reason.
     * @return Lead  The updated primary lead with merged data.
     *
     * @throws \InvalidArgumentException If attempting to merge a lead into itself.
     */
    public function mergeLeads(Lead $primaryLead, Lead $secondaryLead, int $performedBy, ?string $reason = null): Lead
    {
        if ($primaryLead->id === $secondaryLead->id) {
            throw new \InvalidArgumentException('Cannot merge a lead into itself.');
        }

        if ($secondaryLead->status === 'merged') {
            throw new \InvalidArgumentException('The secondary lead has already been merged.');
        }

        return DB::transaction(function () use ($primaryLead, $secondaryLead, $performedBy, $reason) {
            // 1. Snapshot both leads before merge for audit
            $primarySnapshot   = $primaryLead->toArray();
            $secondarySnapshot = $secondaryLead->toArray();

            // 2. Merge field values — fill in blanks on primary from secondary
            $fieldsToMerge = ['email', 'phone_number', 'company_name', 'job_title', 'source', 'notes'];
            foreach ($fieldsToMerge as $field) {
                if (empty($primaryLead->{$field}) && !empty($secondaryLead->{$field})) {
                    $primaryLead->{$field} = $secondaryLead->{$field};
                }
            }

            // Merge custom_fields (secondary fills gaps)
            if (!empty($secondaryLead->custom_fields)) {
                $merged = array_merge(
                    $secondaryLead->custom_fields ?? [],
                    $primaryLead->custom_fields ?? []
                );
                $primaryLead->custom_fields = $merged;
            }

            $primaryLead->save();

            // 3. Reassign all activity logs from secondary → primary
            $movedActivitiesCount = LeadActivityLog::where('lead_id', $secondaryLead->id)
                ->update(['lead_id' => $primaryLead->id]);

            // 4. Mark secondary lead as merged
            $secondaryLead->update([
                'status'             => 'merged',
                'merged_into_lead_id' => $primaryLead->id,
            ]);
            $secondaryLead->delete(); // soft-delete

            // 5. Create audit log for the merge operation
            $mergeLog = LeadMergeLog::create([
                'primary_lead_id'          => $primaryLead->id,
                'merged_lead_id'           => $secondaryLead->id,
                'performed_by'             => $performedBy,
                'primary_lead_snapshot'     => $primarySnapshot,
                'merged_lead_snapshot'      => $secondarySnapshot,
                'merged_activities_summary' => [
                    'moved_activities_count' => $movedActivitiesCount,
                    'merged_fields'          => $fieldsToMerge,
                ],
                'merge_reason'             => $reason,
            ]);

            // 6. Log merge as activity on primary lead
            LeadActivityLog::create([
                'lead_id'     => $primaryLead->id,
                'type'        => 'merge',
                'subject'     => 'Lead merged',
                'description' => "Lead #{$secondaryLead->id} ({$secondaryLead->full_name}) merged into this lead.",
                'metadata'    => [
                    'merged_lead_id'  => $secondaryLead->id,
                    'merge_log_id'    => $mergeLog->id,
                    'activities_moved' => $movedActivitiesCount,
                ],
                'created_by'  => $performedBy,
            ]);

            return $primaryLead->fresh(['activityLogs', 'mergeLogsAsPrimary']);
        });
    }
}

<?php

namespace App\Services;

use App\Enums\LeadAssignmentActionEnum;
use App\Enums\LeadStatusEnum;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadAssignmentHistory;
use App\Models\LeadAssignmentRule;
use App\Models\LeadScoringRule;
use App\Models\LeadSlaAlert;
use App\Models\Opportunity;
use App\Models\SalesActivity;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LeadAssignmentService
{
    private int $slaMinutes = 60;

    /**
     * S4-09: Xem danh sách lead với bộ lọc nâng cao
     */
    public function getLeads(array $filters): LengthAwarePaginator
    {
        $query = Lead::query()
            ->with([
                'assignedUser',
                'teamLeader',
                'campaign',
                'webForm',
                'convertedCustomer',
                'convertedOpportunity',
            ])
            ->where('is_merged', false);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['rating'])) {
            $query->where('rating', $filters['rating']); // hot, warm, cold
        }

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (!empty($filters['campaign_id'])) {
            $query->where('campaign_id', $filters['campaign_id']);
        }

        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (!empty($filters['team_leader_id'])) {
            $query->where('team_leader_id', $filters['team_leader_id']);
        }

        if (array_key_exists('sla_overdue', $filters) && $filters['sla_overdue']) {
            $query
                ->whereNull('contacted_at')
                ->whereNotNull('sla_deadline')
                ->where('sla_deadline', '<', now());
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            });
        }

        // Ưu tiên sắp xếp theo điểm tiềm năng (S4-05) rồi tới thời gian tạo
        return $query
            ->orderBy('score', 'desc')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * S4-02: Nhập tay một lead từ sự kiện, danh thiếp hoặc nguồn khác
     */
    public function createManual(array $data, User $actor): Lead
    {
        if (empty($data['source'])) {
            throw new InvalidArgumentException('Mọi lead nhập vào đều bắt buộc phải có nguồn.');
        }

        return DB::transaction(function () use ($data, $actor) {
            $lead = new Lead();
            $lead->name = $data['name'];
            $lead->email = $data['email'] ?? null;
            $lead->phone = $data['phone'] ?? null;
            $lead->company = $data['company'] ?? null;
            $lead->industry = $data['industry'] ?? null;
            $lead->company_size = $data['company_size'] ?? null;
            $lead->interest_demand = $data['interest_demand'] ?? null;
            $lead->source = $data['source'];
            $lead->campaign_id = $data['campaign_id'] ?? null;
            $lead->status = LeadStatusEnum::WAITING_ASSIGNMENT;

            // Chấm điểm tự động (S4-05)
            $this->calculateScore($lead);

            $lead->save();

            // Ghi nhật ký khởi tạo
            $this->createHistory(
                $lead,
                $actor,
                LeadAssignmentActionEnum::CREATED,
                null,
                LeadStatusEnum::WAITING_ASSIGNMENT->value,
                "Tạo lead thủ công từ nguồn {$lead->source}"
            );

            // Chạy quy tắc phân bổ tự động (S4-06)
            $this->applyAutoAssignment($lead);

            return $lead->fresh(['assignedUser', 'teamLeader', 'campaign']);
        });
    }

    /**
     * S4-02: Xem trước và kiểm tra tính hợp lệ file nhập hàng loạt
     */
    public function importPreview(array $rows): array
    {
        $validRows = [];
        $errorRows = [];
        $phoneRegex = '/^(0|\+84)[0-9]{9,10}$/';

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 1;
            $errors = [];

            $name = trim($row['name'] ?? '');
            $source = trim($row['source'] ?? '');
            $phone = trim($row['phone'] ?? '');
            $email = trim($row['email'] ?? '');
            $company = trim($row['company'] ?? '');
            $industry = trim($row['industry'] ?? '');
            $companySize = trim($row['company_size'] ?? '');
            $interestDemand = trim($row['interest_demand'] ?? '');

            if (empty($name)) {
                $errors[] = 'Họ tên không được để trống.';
            }
            if (empty($source)) {
                $errors[] = 'Bắt buộc phải có nguồn lead.';
            }
            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Email '{$email}' không đúng định dạng.";
            }
            if (!empty($phone) && !preg_match($phoneRegex, $phone)) {
                $errors[] = "Số điện thoại '{$phone}' không hợp lệ (cần 10 số).";
            }

            $rowData = [
                'row_number' => $rowNumber,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'company' => $company,
                'industry' => $industry,
                'company_size' => $companySize,
                'interest_demand' => $interestDemand,
                'source' => $source,
            ];

            if (!empty($errors)) {
                $rowData['errors'] = $errors;
                $errorRows[] = $rowData;
            } else {
                $validRows[] = $rowData;
            }
        }

        return [
            'total_rows' => count($rows),
            'valid_count' => count($validRows),
            'error_count' => count($errorRows),
            'valid_rows' => $validRows,
            'error_rows' => $errorRows,
        ];
    }

    /**
     * S4-02: Xác nhận nhập hàng loạt các dòng hợp lệ vào cơ sở dữ liệu
     */
    public function importConfirm(array $validRows, User $actor, ?int $campaignId = null): array
    {
        $importedLeads = [];

        DB::transaction(function () use ($validRows, $actor, $campaignId, &$importedLeads) {
            foreach ($validRows as $row) {
                $lead = new Lead();
                $lead->name = $row['name'];
                $lead->email = !empty($row['email']) ? $row['email'] : null;
                $lead->phone = !empty($row['phone']) ? $row['phone'] : null;
                $lead->company = !empty($row['company']) ? $row['company'] : null;
                $lead->industry = !empty($row['industry']) ? $row['industry'] : null;
                $lead->company_size = !empty($row['company_size']) ? $row['company_size'] : null;
                $lead->interest_demand = !empty($row['interest_demand']) ? $row['interest_demand'] : null;
                $lead->source = $row['source'];
                $lead->campaign_id = $campaignId;
                $lead->status = LeadStatusEnum::WAITING_ASSIGNMENT;

                $this->calculateScore($lead);
                $lead->save();

                $this->createHistory(
                    $lead,
                    $actor,
                    LeadAssignmentActionEnum::CREATED,
                    null,
                    LeadStatusEnum::WAITING_ASSIGNMENT->value,
                    "Nhập hàng loạt từ Excel (Nguồn: {$lead->source})"
                );

                $this->applyAutoAssignment($lead);
                $importedLeads[] = $lead;
            }
        });

        return [
            'imported_count' => count($importedLeads),
            'message' => 'Đã nhập thành công ' . count($importedLeads) . ' lead vào hệ thống.',
        ];
    }

    /**
     * S4-04: Phát hiện trùng theo email, số điện thoại và tên công ty
     */
    public function detectDuplicates(?string $email, ?string $phone, ?string $company, ?int $excludeLeadId = null): array
    {
        $duplicateLeads = collect();
        $matchingCustomer = null;

        // 1. Kiểm tra trùng trong bảng leads
        if (!empty($email) || !empty($phone) || !empty($company)) {
            $query = Lead::query()
                ->where('is_merged', false)
                ->when($excludeLeadId, fn ($q) => $q->where('id', '!=', $excludeLeadId));

            $query->where(function ($q) use ($email, $phone, $company) {
                $hasCond = false;
                if (!empty($email)) {
                    $q->where('email', $email);
                    $hasCond = true;
                }
                if (!empty($phone)) {
                    $hasCond ? $q->orWhere('phone', $phone) : $q->where('phone', $phone);
                    $hasCond = true;
                }
                if (!empty($company)) {
                    $hasCond ? $q->orWhere('company', 'like', "%{$company}%") : $q->where('company', 'like', "%{$company}%");
                }
            });

            $duplicateLeads = $query->with(['assignedUser', 'campaign'])->limit(10)->get();
        }

        // 2. Kiểm tra trùng với khách hàng doanh nghiệp đã có trong hệ thống
        if (!empty($email) || !empty($phone) || !empty($company)) {
            $custQuery = Customer::query()->where('is_active', true);
            $custQuery->where(function ($q) use ($email, $phone, $company) {
                $hasCond = false;
                if (!empty($email)) {
                    $q->where('email', $email);
                    $hasCond = true;
                }
                if (!empty($phone)) {
                    $hasCond ? $q->orWhere('phone', $phone) : $q->where('phone', $phone);
                    $hasCond = true;
                }
                if (!empty($company)) {
                    $hasCond ? $q->orWhere('name', 'like', "%{$company}%") : $q->where('name', 'like', "%{$company}%");
                }
            });

            $matchingCustomer = $custQuery->first();
        }

        return [
            'has_duplicate' => $duplicateLeads->isNotEmpty() || $matchingCustomer !== null,
            'duplicate_leads' => $duplicateLeads,
            'matching_customer' => $matchingCustomer ? [
                'id' => $matchingCustomer->id,
                'name' => $matchingCustomer->name,
                'code' => $matchingCustomer->code,
                'phone' => $matchingCustomer->phone,
                'email' => $matchingCustomer->email,
                'address' => $matchingCustomer->address,
                'owner' => $matchingCustomer->owner?->name ?? 'Chưa gán',
            ] : null,
        ];
    }

    /**
     * S4-04: Gộp lead trùng — giữ nguyên lịch sử của cả hai bản ghi
     */
    public function mergeLeads(int $primaryLeadId, int $secondaryLeadId, User $actor): Lead
    {
        if ($primaryLeadId === $secondaryLeadId) {
            throw new InvalidArgumentException('Không thể gộp một lead với chính nó.');
        }

        return DB::transaction(function () use ($primaryLeadId, $secondaryLeadId, $actor) {
            $primary = Lead::findOrFail($primaryLeadId);
            $secondary = Lead::findOrFail($secondaryLeadId);

            if ($secondary->is_merged) {
                throw new InvalidArgumentException('Lead phụ đã từng được gộp trước đó.');
            }

            // Điền bổ sung thông tin còn thiếu từ secondary sang primary
            $primary->email = $primary->email ?: $secondary->email;
            $primary->phone = $primary->phone ?: $secondary->phone;
            $primary->company = $primary->company ?: $secondary->company;
            $primary->industry = $primary->industry ?: $secondary->industry;
            $primary->company_size = $primary->company_size ?: $secondary->company_size;
            $primary->interest_demand = $primary->interest_demand
                ? ($primary->interest_demand . "\n[Gộp thêm]: " . $secondary->interest_demand)
                : $secondary->interest_demand;

            $this->calculateScore($primary);
            $primary->save();

            // Chuyển toàn bộ hoạt động của secondary sang primary
            SalesActivity::where('lead_id', $secondary->id)->update(['lead_id' => $primary->id]);

            // Đánh dấu secondary là đã gộp
            $secondary->update([
                'is_merged' => true,
                'merged_into_lead_id' => $primary->id,
                'status' => LeadStatusEnum::MERGED,
            ]);

            // Ghi nhật ký trên cả 2 bản ghi
            $this->createHistory(
                $primary,
                $actor,
                LeadAssignmentActionEnum::MERGED,
                $primary->status?->value,
                $primary->status?->value,
                "Đã gộp thông tin và toàn bộ hoạt động từ Lead #{$secondary->id} ({$secondary->name})"
            );

            $this->createHistory(
                $secondary,
                $actor,
                LeadAssignmentActionEnum::MERGED,
                $secondary->status?->value,
                LeadStatusEnum::MERGED->value,
                "Đã được gộp vào Lead chính #{$primary->id} ({$primary->name})"
            );

            return $primary->fresh(['assignedUser', 'campaign', 'histories']);
        });
    }

    /**
     * S4-05: Cấu hình chấm điểm lead tự động
     */
    public function calculateScore(Lead $lead): void
    {
        $rules = LeadScoringRule::where('is_active', true)->get();
        $totalScore = 0;

        foreach ($rules as $rule) {
            $type = $rule->criteria_type;
            $val = mb_strtolower(trim($rule->criteria_value));

            $match = false;
            if ($type === 'industry' && !empty($lead->industry)) {
                $match = str_contains(mb_strtolower($lead->industry), $val);
            } elseif ($type === 'company_size' && !empty($lead->company_size)) {
                $match = str_contains(mb_strtolower($lead->company_size), $val);
            } elseif ($type === 'source' && !empty($lead->source)) {
                $match = str_contains(mb_strtolower($lead->source), $val);
            } elseif ($type === 'interest_demand' && !empty($lead->interest_demand)) {
                $match = str_contains(mb_strtolower($lead->interest_demand), $val);
            }

            if ($match) {
                $totalScore += $rule->points;
            }
        }

        $lead->score = $totalScore;

        // Phân loại Nóng, Ấm, Lạnh theo ngưỡng
        if ($totalScore >= 70) {
            $lead->rating = 'hot';
        } elseif ($totalScore >= 40) {
            $lead->rating = 'warm';
        } else {
            $lead->rating = 'cold';
        }
    }

    /**
     * S4-06: Phân bổ lead tự động theo quy tắc xếp thứ tự ưu tiên
     */
    public function applyAutoAssignment(Lead $lead): bool
    {
        // Nếu lead đã được phân công thì không gán lại
        if ($lead->assigned_to !== null) {
            return false;
        }

        $rules = LeadAssignmentRule::where('is_active', true)
            ->orderBy('priority', 'asc')
            ->get();

        foreach ($rules as $rule) {
            $matched = false;
            $assignedUserId = null;
            $teamLeaderId = null;

            if ($rule->condition_type === 'region') {
                $region = mb_strtolower(trim($rule->condition_value ?? ''));
                $textToCheck = mb_strtolower(($lead->company ?? '') . ' ' . ($lead->name ?? '') . ' ' . ($lead->interest_demand ?? ''));
                if (!empty($region) && str_contains($textToCheck, $region)) {
                    $matched = true;
                    $assignedUserId = $rule->assign_to_user_id;
                }
            } elseif ($rule->condition_type === 'industry') {
                $ind = mb_strtolower(trim($rule->condition_value ?? ''));
                if (!empty($ind) && !empty($lead->industry) && str_contains(mb_strtolower($lead->industry), $ind)) {
                    $matched = true;
                    $assignedUserId = $rule->assign_to_user_id;
                }
            } elseif ($rule->condition_type === 'round_robin') {
                $matched = true;
                // Lấy user trong group hoặc tất cả staff để xoay vòng
                $groupUsersQuery = User::where('role', 'staff')->whereNull('locked_at');
                if ($rule->assign_to_group_id) {
                    $groupUsersQuery->whereHas('businessGroups', function ($q) use ($rule) {
                        $q->where('business_groups.id', $rule->assign_to_group_id);
                    });
                }
                $users = $groupUsersQuery->get();
                if ($users->isNotEmpty()) {
                    // Chọn người có ít lead đang chăm sóc nhất để xoay vòng công bằng
                    $assignedUserId = $users->sortBy(function ($u) {
                        return Lead::where('assigned_to', $u->id)->whereIn('status', ['assigned', 'caring'])->count();
                    })->first()->id;
                }
            }

            if ($matched && $assignedUserId) {
                $assignee = User::find($assignedUserId);
                if ($assignee) {
                    $leader = $assignee->teamLeader ?: User::where('role', 'admin')->first();
                    $this->assignLead($lead, $assignee, $leader);
                    return true;
                }
            }
        }

        // Không khớp quy tắc nào: ở hàng chờ để trưởng nhóm phân tay (S4-06)
        $lead->status = LeadStatusEnum::WAITING_ASSIGNMENT;
        $lead->save();
        return false;
    }

    /**
     * S4-08: Chuyển một lead đủ điều kiện thành khách hàng, người liên hệ và cơ hội
     */
    public function convertLead(Lead $lead, array $options, User $actor): array
    {
        if ($lead->status === LeadStatusEnum::CONVERTED || $lead->converted_at !== null) {
            throw new InvalidArgumentException('Lead này đã được chuyển đổi trước đó và không thể sửa đổi.');
        }

        return DB::transaction(function () use ($lead, $options, $actor) {
            // 1. Tạo Khách hàng doanh nghiệp
            $customerName = trim($options['customer_name'] ?? ($lead->company ?: "Doanh nghiệp của " . $lead->name));
            $customerCode = 'KH-' . strtoupper(substr(md5(uniqid('', true)), 0, 6));

            $customer = Customer::create([
                'name' => $customerName,
                'code' => $customerCode,
                'tax_code' => $options['tax_code'] ?? null,
                'address' => $options['address'] ?? 'Chưa cập nhật',
                'phone' => $lead->phone,
                'email' => $lead->email,
                'notes' => "Chuyển đổi từ Lead #{$lead->id} ({$lead->name}). Nguồn: {$lead->source}",
                'status' => 'Tiềm năng',
                'owner_id' => $lead->assigned_to ?: $actor->id,
                'is_active' => true,
            ]);

            // 2. Tạo Người liên hệ chính
            $contact = Contact::create([
                'name' => $lead->name,
                'customer_id' => $customer->id,
                'phone' => $lead->phone,
                'email' => $lead->email,
                'title' => $options['contact_title'] ?? 'Đại diện liên hệ',
                'department' => $options['contact_department'] ?? 'Ban Giám Đốc',
                'is_primary' => true,
                'notes' => "Liên hệ sinh từ Lead #{$lead->id}",
                'created_by' => $actor->id,
            ]);

            // 3. Tạo Cơ hội bán hàng ban đầu
            $oppName = trim($options['opportunity_name'] ?? ("Cơ hội bán hàng - " . $customerName));
            $oppValue = (float) ($options['opportunity_value'] ?? 50000000);
            $expectedCloseDate = $options['expected_close_date'] ?? now()->addDays(30)->toDateString();

            $opportunity = Opportunity::create([
                'name' => $oppName,
                'title' => $oppName,
                'customer_id' => $customer->id,
                'contact_id' => $contact->id,
                'campaign_id' => $lead->campaign_id,
                'source' => $lead->source,
                'stage' => 'khao_sat',
                'value' => $oppValue,
                'amount' => $oppValue,
                'win_probability' => 10,
                'expected_close_date' => $expectedCloseDate,
                'owner_id' => $lead->assigned_to ?: $actor->id,
                'owner_user_id' => $lead->assigned_to ?: $actor->id,
                'team_leader_id' => $lead->team_leader_id,
                'notes' => "Cơ hội khởi tạo từ Lead #{$lead->id}. Nhu cầu: " . ($lead->interest_demand ?? 'Chưa rõ'),
                'status' => 'open',
            ]);

            // 4. Chuyển toàn bộ hoạt động đã ghi trên lead sang Customer và Opportunity mới
            SalesActivity::where('lead_id', $lead->id)->update([
                'customer_id' => $customer->id,
                'opportunity_id' => $opportunity->id,
            ]);

            // 5. Cập nhật trạng thái lead thành ĐÃ CHUYỂN ĐỔI (khóa chỉnh sửa)
            $oldStatus = $lead->status?->value;
            $lead->update([
                'status' => LeadStatusEnum::CONVERTED,
                'converted_at' => now(),
                'converted_customer_id' => $customer->id,
                'converted_contact_id' => $contact->id,
                'converted_opportunity_id' => $opportunity->id,
            ]);

            // Ghi nhật ký chuyển đổi
            $this->createHistory(
                $lead,
                $actor,
                LeadAssignmentActionEnum::CONVERTED,
                $oldStatus,
                LeadStatusEnum::CONVERTED->value,
                "Đã chuyển đổi thành công sang Khách hàng #{$customer->id}, Liên hệ #{$contact->id}, Cơ hội #{$opportunity->id}"
            );

            return [
                'customer' => $customer,
                'contact' => $contact,
                'opportunity' => $opportunity,
                'lead' => $lead->fresh(['convertedCustomer', 'convertedContact', 'convertedOpportunity']),
            ];
        });
    }

    public function assignLead(
        Lead $lead,
        User $assignedUser,
        ?User $teamLeader = null
    ): Lead {
        return DB::transaction(
            function () use (
                $lead,
                $assignedUser,
                $teamLeader
            ) {
                $oldStatus = $lead->status?->value;

                $assignedAt = now();

                $lead->update([
                    'assigned_to' => $assignedUser->id,
                    'team_leader_id' => $teamLeader?->id,
                    'status' => LeadStatusEnum::ASSIGNED,
                    'assigned_at' => $assignedAt,
                    'accepted_at' => null,
                    'contacted_at' => null,
                    'sla_deadline' => $assignedAt
                        ->copy()
                        ->addMinutes($this->slaMinutes),
                    'sla_flagged_at' => null,
                    'rejection_reason' => null,
                ]);

                LeadSlaAlert::query()
                    ->where('lead_id', $lead->id)
                    ->delete();

                $this->createHistory(
                    $lead,
                    $assignedUser,
                    LeadAssignmentActionEnum::ASSIGNED,
                    $oldStatus,
                    LeadStatusEnum::ASSIGNED->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function acceptLead(
        Lead $lead,
        User $user
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::ASSIGNED
        ) {
            throw new InvalidArgumentException(
                'Lead không ở trạng thái chờ nhận.'
            );
        }

        return DB::transaction(
            function () use ($lead, $user) {
                $oldStatus = $lead->status->value;

                $lead->update([
                    'status' => LeadStatusEnum::CARING,
                    'accepted_at' => now(),
                    'rejection_reason' => null,
                ]);

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::ACCEPTED,
                    $oldStatus,
                    LeadStatusEnum::CARING->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function rejectLead(
        Lead $lead,
        User $user,
        string $reason
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::ASSIGNED
        ) {
            throw new InvalidArgumentException(
                'Chỉ lead đang chờ nhận mới có thể từ chối.'
            );
        }

        return DB::transaction(
            function () use (
                $lead,
                $user,
                $reason
            ) {
                $oldStatus = $lead->status->value;

                $lead->update([
                    'assigned_to' => null,
                    'status' =>
                        LeadStatusEnum::WAITING_ASSIGNMENT,
                    'assigned_at' => null,
                    'accepted_at' => null,
                    'sla_deadline' => null,
                    'sla_flagged_at' => null,
                    'rejection_reason' => $reason,
                ]);

                LeadSlaAlert::query()
                    ->where('lead_id', $lead->id)
                    ->delete();

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::REJECTED,
                    $oldStatus,
                    LeadStatusEnum::WAITING_ASSIGNMENT->value,
                    $reason
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function markContacted(
        Lead $lead,
        User $user,
        ?string $contactedAt = null
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::CARING
        ) {
            throw new InvalidArgumentException(
                'Lead phải ở trạng thái đang chăm sóc trước khi ghi nhận liên hệ.'
            );
        }

        return DB::transaction(
            function () use (
                $lead,
                $user,
                $contactedAt
            ) {
                $lead->update([
                    'contacted_at' =>
                        $contactedAt ?? now(),
                ]);

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::CONTACTED,
                    $lead->status->value,
                    $lead->status->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function flagOverdueLeads(): int
    {
        $leads = Lead::query()
            ->whereIn('status', [
                LeadStatusEnum::ASSIGNED->value,
                LeadStatusEnum::CARING->value,
            ])
            ->whereNull('contacted_at')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', now())
            ->whereNull('sla_flagged_at')
            ->get();

        $count = 0;

        foreach ($leads as $lead) {
            DB::transaction(
                function () use (
                    $lead,
                    &$count
                ) {
                    $flaggedAt = now();

                    $lead->update([
                        'sla_flagged_at' => $flaggedAt,
                    ]);

                    LeadSlaAlert::firstOrCreate(
                        [
                            'lead_id' => $lead->id,
                        ],
                        [
                            'recipient_user_id' =>
                                $lead->team_leader_id,
                            'overdue_at' => $flaggedAt,
                        ]
                    );

                    LeadAssignmentHistory::create([
                        'lead_id' => $lead->id,
                        'user_id' => null,
                        'action' =>
                            LeadAssignmentActionEnum::SLA_OVERDUE,
                        'old_status' =>
                            $lead->status->value,
                        'new_status' =>
                            $lead->status->value,
                        'reason' =>
                            'Lead quá thời hạn SLA nhưng chưa được liên hệ.',
                    ]);

                    $count++;
                }
            );
        }

        return $count;
    }

    public function getHistory(Lead $lead)
    {
        return $lead
            ->histories()
            ->with('user')
            ->latest()
            ->get();
    }

    public function getSlaAlerts(
        ?int $recipientUserId = null
    ) {
        return LeadSlaAlert::query()
            ->with([
                'lead',
                'recipient',
            ])
            ->when(
                $recipientUserId,
                fn ($query) =>
                    $query->where(
                        'recipient_user_id',
                        $recipientUserId
                    )
            )
            ->latest('overdue_at')
            ->get();
    }

    private function ensureAssignedToUser(
        Lead $lead,
        User $user
    ): void {
        if ($lead->assigned_to !== $user->id) {
            throw new InvalidArgumentException(
                'Lead này không được phân cho bạn.'
            );
        }
    }

    private function createHistory(
        Lead $lead,
        ?User $user,
        LeadAssignmentActionEnum $action,
        ?string $oldStatus,
        ?string $newStatus,
        ?string $reason = null
    ): void {
        LeadAssignmentHistory::create([
            'lead_id' => $lead->id,
            'user_id' => $user?->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'reason' => $reason,
        ]);
    }
}
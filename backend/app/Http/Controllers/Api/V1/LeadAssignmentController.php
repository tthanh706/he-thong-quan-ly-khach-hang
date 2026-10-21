<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptLeadRequest;
use App\Http\Requests\ContactLeadRequest;
use App\Http\Requests\FilterLeadRequest;
use App\Http\Requests\RejectLeadRequest;
use App\Http\Resources\LeadAssignmentHistoryResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\LeadSlaAlertResource;
use App\Models\Lead;
use App\Models\LeadAssignmentRule;
use App\Models\LeadScoringRule;
use App\Models\User;
use App\Services\LeadAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class LeadAssignmentController extends Controller
{
    public function __construct(
        private readonly LeadAssignmentService $leadAssignmentService
    ) {
    }

    public function index(
        FilterLeadRequest $request
    ): JsonResponse {
        $leads = $this->leadAssignmentService
            ->getLeads($request->validated());

        return response()->json([
            'success' => true,
            'data' => LeadResource::collection(
                $leads->items()
            ),
            'meta' => [
                'current_page' => $leads->currentPage(),
                'last_page' => $leads->lastPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
            ],
            'message' => 'Lấy danh sách lead thành công.',
        ]);
    }

    public function show(
        Lead $lead
    ): JsonResponse {
        $lead->load([
            'assignedUser',
            'teamLeader',
            'campaign',
            'webForm',
            'convertedCustomer',
        ]);

        return response()->json([
            'success' => true,
            'data' => new LeadResource($lead),
            'message' => 'Lấy thông tin lead thành công.',
        ]);
    }

    /**
     * S4-02: Tạo lead thủ công
     */
    public function storeManual(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'company' => 'nullable|string|max:150',
            'industry' => 'nullable|string|max:100',
            'company_size' => 'nullable|string|max:50',
            'interest_demand' => 'nullable|string|max:500',
            'source' => 'required|string|max:100', // Bắt buộc có nguồn (S4-02)
            'campaign_id' => 'nullable|integer|exists:campaigns,id',
        ], [
            'name.required' => 'Họ tên lead không được để trống.',
            'source.required' => 'Mọi lead nhập vào đều bắt buộc phải có nguồn (S4-02).',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
        ]);

        $actor = $request->attributes->get('current_user') ?: User::first();

        try {
            $lead = $this->leadAssignmentService->createManual($validated, $actor);

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' => 'Đã tạo lead thủ công thành công.',
            ], 201);
        } catch (InvalidArgumentException $e) {
            return $this->businessError($e);
        }
    }

    /**
     * S4-02: Tải mẫu Excel nhập lead
     */
    public function importTemplate(): JsonResponse
    {
        $headers = ['Họ và tên (*)', 'Nguồn (*)', 'Số điện thoại', 'Email', 'Tên công ty', 'Ngành nghề', 'Quy mô nhân sự', 'Nhu cầu quan tâm'];
        $exampleRows = [
            ['Nguyễn Văn An', 'Hội thảo', '0912345678', 'an.nguyen@techasia.vn', 'Công ty Cổ phần TechAsia', 'Công nghệ thông tin', '100 - 500 nhân sự', 'Quan tâm gói CRM Enterprise'],
            ['Trần Thị Bích', 'Danh thiếp', '0987654321', 'bich.tran@ancuong.com', 'Tập đoàn An Cường', 'Sản xuất', 'Trên 500 nhân sự', 'Cần tư vấn giải pháp quản lý bán hàng'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'headers' => $headers,
                'example_rows' => $exampleRows,
                'required_columns' => ['Họ và tên (*)', 'Nguồn (*)'],
                'sources_allowed' => ['Hội thảo', 'Sự kiện', 'Danh thiếp', 'Website', 'Google Ads', 'Facebook', 'Giới thiệu', 'Cold Call'],
            ],
            'message' => 'Lấy cấu trúc tệp mẫu thành công.',
        ]);
    }

    /**
     * S4-02: Xem trước file import và kiểm tra lỗi từng dòng
     */
    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.name' => 'nullable|string',
            'rows.*.source' => 'nullable|string',
        ]);

        $result = $this->leadAssignmentService->importPreview($request->input('rows'));

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Kiểm tra xem trước dữ liệu hoàn tất.',
        ]);
    }

    /**
     * S4-02: Xác nhận nhập hàng loạt vào cơ sở dữ liệu
     */
    public function importConfirm(Request $request): JsonResponse
    {
        $request->validate([
            'valid_rows' => 'required|array|min:1',
            'campaign_id' => 'nullable|integer|exists:campaigns,id',
        ]);

        $actor = $request->attributes->get('current_user') ?: User::first();
        $result = $this->leadAssignmentService->importConfirm(
            $request->input('valid_rows'),
            $actor,
            $request->input('campaign_id')
        );

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => $result['message'],
        ]);
    }

    /**
     * S4-04: Kiểm tra trùng theo email, sđt và tên công ty
     */
    public function checkDuplicates(Request $request): JsonResponse
    {
        $email = $request->query('email');
        $phone = $request->query('phone');
        $company = $request->query('company');
        $excludeId = $request->query('exclude_id') ? (int) $request->query('exclude_id') : null;

        $res = $this->leadAssignmentService->detectDuplicates($email, $phone, $company, $excludeId);

        return response()->json([
            'success' => true,
            'data' => [
                'has_duplicate' => $res['has_duplicate'],
                'duplicate_leads' => LeadResource::collection($res['duplicate_leads']),
                'matching_customer' => $res['matching_customer'],
            ],
            'message' => $res['has_duplicate'] ? 'Phát hiện bản ghi trùng lặp.' : 'Không phát hiện trùng lặp.',
        ]);
    }

    /**
     * S4-04: Gộp lead trùng giữ nguyên lịch sử của cả 2 bản ghi
     */
    public function merge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'primary_lead_id' => 'required|integer|exists:leads,id',
            'secondary_lead_id' => 'required|integer|exists:leads,id',
        ]);

        $actor = $request->attributes->get('current_user') ?: User::first();

        try {
            $merged = $this->leadAssignmentService->mergeLeads(
                (int) $validated['primary_lead_id'],
                (int) $validated['secondary_lead_id'],
                $actor
            );

            return response()->json([
                'success' => true,
                'data' => new LeadResource($merged),
                'message' => 'Đã gộp hai lead thành công và bảo toàn toàn bộ lịch sử tương tác.',
            ]);
        } catch (InvalidArgumentException $e) {
            return $this->businessError($e);
        }
    }

    /**
     * S4-08: Chuyển 1 lead đủ điều kiện thành khách hàng, người liên hệ và cơ hội
     */
    public function convert(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:200',
            'tax_code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:300',
            'opportunity_name' => 'nullable|string|max:200',
            'opportunity_value' => 'nullable|numeric|min:0',
            'expected_close_date' => 'nullable|date',
            'contact_title' => 'nullable|string|max:100',
            'contact_department' => 'nullable|string|max:100',
        ]);

        $actor = $request->attributes->get('current_user') ?: User::first();

        try {
            $res = $this->leadAssignmentService->convertLead($lead, $validated, $actor);

            return response()->json([
                'success' => true,
                'data' => [
                    'customer' => $res['customer'],
                    'contact' => $res['contact'],
                    'opportunity' => $res['opportunity'],
                    'lead' => new LeadResource($res['lead']),
                ],
                'message' => 'Chuyển đổi lead thành công! Đã tạo Khách hàng, Người liên hệ và Cơ hội bán hàng.',
            ]);
        } catch (InvalidArgumentException $e) {
            return $this->businessError($e);
        }
    }

    /**
     * S4-05: Cấu hình tiêu chí chấm điểm
     */
    public function getScoringRules(): JsonResponse
    {
        $rules = LeadScoringRule::latest()->get();
        return response()->json([
            'success' => true,
            'data' => $rules,
            'thresholds' => [
                'hot' => 70,
                'warm' => 40,
                'cold' => 0,
            ],
            'message' => 'Lấy danh sách tiêu chí chấm điểm thành công.',
        ]);
    }

    public function storeScoringRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'criteria_type' => 'required|in:industry,company_size,source,interest_demand',
            'criteria_value' => 'required|string|max:150',
            'points' => 'required|integer',
            'is_active' => 'boolean',
        ]);

        $actor = $request->attributes->get('current_user');
        $rule = LeadScoringRule::create(array_merge($validated, ['created_by' => $actor?->id]));

        return response()->json([
            'success' => true,
            'data' => $rule,
            'message' => 'Đã lưu tiêu chí chấm điểm thành công.',
        ], 201);
    }

    public function deleteScoringRule(int $id): JsonResponse
    {
        LeadScoringRule::findOrFail($id)->delete();
        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tiêu chí chấm điểm.',
        ]);
    }

    /**
     * S4-06: Cấu hình quy tắc phân bổ tự động
     */
    public function getAssignmentRules(): JsonResponse
    {
        $rules = LeadAssignmentRule::with(['assignedUser', 'assignedGroup'])
            ->orderBy('priority', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rules,
            'message' => 'Lấy danh sách quy tắc phân bổ tự động thành công.',
        ]);
    }

    public function storeAssignmentRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'priority' => 'required|integer|min:1',
            'condition_type' => 'required|in:region,industry,round_robin',
            'condition_value' => 'nullable|string|max:150',
            'assign_to_user_id' => 'nullable|integer|exists:users,id',
            'assign_to_group_id' => 'nullable|integer|exists:business_groups,id',
            'is_active' => 'boolean',
        ]);

        $rule = LeadAssignmentRule::create($validated);

        return response()->json([
            'success' => true,
            'data' => $rule->load(['assignedUser', 'assignedGroup']),
            'message' => 'Đã lưu quy tắc phân bổ tự động thành công.',
        ], 201);
    }

    public function deleteAssignmentRule(int $id): JsonResponse
    {
        LeadAssignmentRule::findOrFail($id)->delete();
        return response()->json([
            'success' => true,
            'message' => 'Đã xóa quy tắc phân bổ.',
        ]);
    }

    public function assign(
        Request $request,
        Lead $lead
    ): JsonResponse {
        $validated = $request->validate([
            'assigned_to' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'team_leader_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $assignedUser = User::findOrFail(
            $validated['assigned_to']
        );

        $teamLeader = isset(
            $validated['team_leader_id']
        )
            ? User::findOrFail(
                $validated['team_leader_id']
            )
            : null;

        $lead = $this->leadAssignmentService
            ->assignLead(
                $lead,
                $assignedUser,
                $teamLeader
            );

        return response()->json([
            'success' => true,
            'data' => new LeadResource($lead),
            'message' => 'Phân lead thành công.',
        ]);
    }

    public function accept(
        AcceptLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->acceptLead($lead, $user);

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Nhận lead thành công. Lead đã chuyển sang trạng thái đang chăm sóc.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function reject(
        RejectLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->rejectLead(
                    $lead,
                    $user,
                    $request->validated('reason')
                );

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Từ chối lead thành công. Lead đã quay lại hàng chờ phân bổ.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function contact(
        ContactLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->markContacted(
                    $lead,
                    $user,
                    $request->validated('contacted_at')
                );

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Đã ghi nhận thời gian liên hệ khách hàng.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function history(
        Lead $lead
    ): JsonResponse {
        $history = $this->leadAssignmentService
            ->getHistory($lead);

        return response()->json([
            'success' => true,
            'data' =>
                LeadAssignmentHistoryResource::collection(
                    $history
                ),
            'message' =>
                'Lấy lịch sử xử lý lead thành công.',
        ]);
    }

    public function checkSla(): JsonResponse
    {
        $count = $this->leadAssignmentService
            ->flagOverdueLeads();

        return response()->json([
            'success' => true,
            'data' => [
                'flagged_count' => $count,
            ],
            'message' =>
                'Kiểm tra lead quá SLA thành công.',
        ]);
    }

    public function slaAlerts(
        Request $request
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $alerts = $this->leadAssignmentService
            ->getSlaAlerts(
                in_array((string) ($user?->role instanceof \BackedEnum ? $user->role->value : $user?->role), ['admin', 'manager'], true)
                    ? null
                    : $user?->id
            );

        return response()->json([
            'success' => true,
            'data' => LeadSlaAlertResource::collection(
                $alerts
            ),
            'message' =>
                'Lấy cảnh báo SLA thành công.',
        ]);
    }

    private function businessError(
        InvalidArgumentException $exception
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $exception->getMessage(),
        ], 422);
    }
}
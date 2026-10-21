<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\OpportunityHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesOpportunityController extends Controller
{
    /**
     * Danh sách giai đoạn chuẩn và xác suất thành công mặc định
     */
    public const STAGES = [
        'khao_sat' => [
            'key' => 'khao_sat',
            'label' => 'Khảo sát / Tìm hiểu',
            'probability' => 10,
            'color' => '#64748b',
        ],
        'danh_gia' => [
            'key' => 'danh_gia',
            'label' => 'Đánh giá nhu cầu',
            'probability' => 25,
            'color' => '#0284c7',
        ],
        'de_xuat' => [
            'key' => 'de_xuat',
            'label' => 'Đề xuất giải pháp',
            'probability' => 50,
            'color' => '#8b5cf6',
        ],
        'thuong_thao' => [
            'key' => 'thuong_thao',
            'label' => 'Thương thảo / Báo giá',
            'probability' => 75,
            'color' => '#f59e0b',
        ],
        'won' => [
            'key' => 'won',
            'label' => 'Thành công (Won)',
            'probability' => 100,
            'color' => '#10b981',
        ],
        'lost' => [
            'key' => 'lost',
            'label' => 'Thất bại (Lost)',
            'probability' => 0,
            'color' => '#ef4444',
        ],
    ];

    /**
     * Danh sách cơ hội bán hàng (S5-01)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Opportunity::query()
            ->with([
                'customer:id,name,code,phone,email',
                'contact:id,name,title,phone,email,is_primary',
                'owner:id,name,email',
                'teamLeader:id,name,email',
            ])
            ->withCount('histories');

        // Tìm kiếm theo tên cơ hội, khách hàng hoặc liên hệ
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  })
                  ->orWhereHas('contact', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Lọc theo khách hàng (1 khách hàng có thể có nhiều cơ hội song song)
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        // Lọc theo giai đoạn
        if ($request->filled('stage')) {
            $query->where('stage', $request->input('stage'));
        }

        // Lọc theo người sở hữu
        if ($request->filled('owner_user_id')) {
            $ownerId = $request->input('owner_user_id');
            $query->where(function ($q) use ($ownerId) {
                $q->where('owner_user_id', $ownerId)
                  ->orWhere('owner_id', $ownerId);
            });
        }

        // Lọc theo nguồn
        if ($request->filled('source')) {
            $query->where('source', $request->input('source'));
        }

        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSorts = ['name', 'value', 'amount', 'expected_close_date', 'win_probability', 'created_at', 'stage'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $opportunities = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $opportunities,
            'meta' => [
                'stages' => self::STAGES,
            ],
        ]);
    }

    /**
     * Tạo mới cơ hội bán hàng (S5-01)
     * - Khai báo tên cơ hội, khách hàng, người liên hệ chính, giai đoạn, giá trị dự kiến, ngày dự kiến chốt, nguồn
     * - Xác suất thắng lấy mặc định theo giai đoạn, sửa tay được kèm ghi chú
     * - Ngày dự kiến chốt không được ở quá khứ khi tạo mới
     */
    public function store(Request $request): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        $validated = $request->validate([
            'name' => 'required|string|max:180',
            'customer_id' => 'required|exists:customers,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'stage' => 'required|string|max:80',
            'value' => 'required|numeric|min:0',
            'expected_close_date' => [
                'required',
                'date',
                "after_or_equal:{$today}",
            ],
            'source' => 'nullable|string|max:100',
            'win_probability' => 'nullable|integer|min:0|max:100',
            'probability_note' => 'nullable|string|max:1000',
            'owner_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ], [
            'name.required' => 'Vui lòng nhập tên cơ hội bán hàng',
            'customer_id.required' => 'Vui lòng chọn khách hàng',
            'customer_id.exists' => 'Khách hàng không tồn tại',
            'stage.required' => 'Vui lòng chọn giai đoạn bán hàng',
            'value.required' => 'Vui lòng nhập giá trị dự kiến',
            'expected_close_date.required' => 'Vui lòng chọn ngày dự kiến chốt',
            'expected_close_date.after_or_equal' => 'Ngày dự kiến chốt không được ở trong quá khứ khi tạo mới',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $stageKey = $validated['stage'];
        $defaultProb = self::STAGES[$stageKey]['probability'] ?? 10;

        $hasCustomProb = isset($validated['win_probability']) && (int) $validated['win_probability'] !== (int) $defaultProb;
        $winProbability = isset($validated['win_probability']) ? (int) $validated['win_probability'] : $defaultProb;

        $ownerId = $validated['owner_user_id'] ?? $currentUser?->id;

        // Xác định status theo giai đoạn
        $status = 'open';
        if ($stageKey === 'won') {
            $status = 'won';
        } elseif ($stageKey === 'lost') {
            $status = 'lost';
        }

        $opportunity = Opportunity::create([
            'name' => $validated['name'],
            'title' => $validated['name'], // đồng bộ tương thích
            'customer_id' => $validated['customer_id'],
            'contact_id' => $validated['contact_id'] ?? null,
            'stage' => $stageKey,
            'status' => $status,
            'value' => $validated['value'],
            'amount' => $validated['value'], // đồng bộ tương thích
            'expected_close_date' => $validated['expected_close_date'],
            'source' => $validated['source'] ?: 'Trực tiếp',
            'win_probability' => $winProbability,
            'win_probability_customized' => $hasCustomProb,
            'probability_note' => $validated['probability_note'] ?? null,
            'owner_user_id' => $ownerId,
            'owner_id' => $ownerId,
            'notes' => $validated['notes'] ?? null,
            'last_activity_at' => now(),
        ]);

        // Ghi lại lịch sử khởi tạo cơ hội (S6-01)
        OpportunityHistory::create([
            'opportunity_id' => $opportunity->id,
            'field_name' => 'created',
            'field_label' => 'Khởi tạo cơ hội',
            'old_value' => null,
            'new_value' => json_encode([
                'name' => $opportunity->name,
                'stage' => $opportunity->stage,
                'value' => (float) $opportunity->value,
                'expected_close_date' => (string) $opportunity->expected_close_date,
                'win_probability' => (int) $opportunity->win_probability,
            ]),
            'old_label' => null,
            'new_label' => 'Tạo mới cơ hội',
            'changed_by_user_id' => $currentUser?->id,
            'reason' => 'Tạo mới cơ hội trên hệ thống',
        ]);

        $opportunity->load(['customer', 'contact', 'owner']);

        return response()->json([
            'success' => true,
            'message' => 'Tạo cơ hội bán hàng thành công',
            'data' => $opportunity,
        ], 201);
    }

    /**
     * Chi tiết cơ hội bán hàng và lịch sử thay đổi (S6-01)
     */
    public function show(int $id): JsonResponse
    {
        $opportunity = Opportunity::with([
            'customer',
            'contact',
            'owner',
            'teamLeader',
            'histories.changedByUser:id,name,email',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $opportunity,
            'meta' => [
                'stages' => self::STAGES,
            ],
        ]);
    }

    /**
     * Cập nhật cơ hội bán hàng & Tự động ghi nhật ký thay đổi (S5-01 & S6-01)
     * - Ghi lại mọi thay đổi giai đoạn, giá trị, ngày chốt và người sở hữu
     * - Mỗi dòng có giá trị trước, giá trị sau, người thực hiện và thời điểm
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:180',
            'customer_id' => 'sometimes|required|exists:customers,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'stage' => 'sometimes|required|string|max:80',
            'value' => 'sometimes|required|numeric|min:0',
            'expected_close_date' => 'sometimes|required|date',
            'source' => 'nullable|string|max:100',
            'win_probability' => 'nullable|integer|min:0|max:100',
            'win_probability_customized' => 'nullable|boolean',
            'probability_note' => 'nullable|string|max:1000',
            'owner_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
            'change_reason' => 'nullable|string|max:500',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $changeReason = $validated['change_reason'] ?? $validated['probability_note'] ?? null;

        // Kiểm tra và ghi nhận các trường nhạy cảm cần audit log (S6-01)
        // 1. Giai đoạn (stage)
        if (isset($validated['stage']) && $validated['stage'] !== $opportunity->stage) {
            $oldStageKey = $opportunity->stage;
            $newStageKey = $validated['stage'];
            $oldStageLabel = self::STAGES[$oldStageKey]['label'] ?? $oldStageKey;
            $newStageLabel = self::STAGES[$newStageKey]['label'] ?? $newStageKey;

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'stage',
                'field_label' => 'Giai đoạn',
                'old_value' => $oldStageKey,
                'new_value' => $newStageKey,
                'old_label' => $oldStageLabel,
                'new_label' => $newStageLabel,
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $changeReason ?: "Chuyển giai đoạn từ {$oldStageLabel} sang {$newStageLabel}",
            ]);

            $opportunity->stage = $newStageKey;
            if ($newStageKey === 'won') {
                $opportunity->status = 'won';
            } elseif ($newStageKey === 'lost') {
                $opportunity->status = 'lost';
            } else {
                $opportunity->status = 'open';
            }

            // Nếu chưa bị sửa tay xác suất thì tự cập nhật theo stage mới
            if (!($opportunity->win_probability_customized ?? false) && !isset($validated['win_probability'])) {
                $newProb = self::STAGES[$newStageKey]['probability'] ?? $opportunity->win_probability;
                $opportunity->win_probability = $newProb;
            }
        }

        // 2. Giá trị dự kiến (value / amount)
        if (isset($validated['value']) && (float) $validated['value'] !== (float) $opportunity->value) {
            $oldVal = (float) $opportunity->value;
            $newVal = (float) $validated['value'];

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'value',
                'field_label' => 'Giá trị dự kiến',
                'old_value' => (string) $oldVal,
                'new_value' => (string) $newVal,
                'old_label' => number_format($oldVal, 0, ',', '.') . ' VNĐ',
                'new_label' => number_format($newVal, 0, ',', '.') . ' VNĐ',
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $changeReason ?: 'Điều chỉnh giá trị cơ hội',
            ]);

            $opportunity->value = $newVal;
            $opportunity->amount = $newVal;
        }

        // 3. Ngày dự kiến chốt (expected_close_date)
        if (isset($validated['expected_close_date'])) {
            $oldDateStr = $opportunity->expected_close_date ? Carbon::parse($opportunity->expected_close_date)->toDateString() : null;
            $newDateStr = Carbon::parse($validated['expected_close_date'])->toDateString();

            if ($oldDateStr !== $newDateStr) {
                OpportunityHistory::create([
                    'opportunity_id' => $opportunity->id,
                    'field_name' => 'expected_close_date',
                    'field_label' => 'Ngày dự kiến chốt',
                    'old_value' => $oldDateStr,
                    'new_value' => $newDateStr,
                    'old_label' => $oldDateStr ? Carbon::parse($oldDateStr)->format('d/m/Y') : 'Chưa thiết lập',
                    'new_label' => Carbon::parse($newDateStr)->format('d/m/Y'),
                    'changed_by_user_id' => $currentUser?->id,
                    'reason' => $changeReason ?: 'Thay đổi thời hạn dự kiến chốt',
                ]);

                $opportunity->expected_close_date = $newDateStr;
            }
        }

        // 4. Người sở hữu (owner_user_id)
        if (isset($validated['owner_user_id']) && (int) $validated['owner_user_id'] !== (int) $opportunity->owner_user_id) {
            $oldUser = User::find($opportunity->owner_user_id);
            $newUser = User::find($validated['owner_user_id']);

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'owner_user_id',
                'field_label' => 'Người sở hữu',
                'old_value' => (string) $opportunity->owner_user_id,
                'new_value' => (string) $validated['owner_user_id'],
                'old_label' => $oldUser ? $oldUser->name : 'Chưa phân công',
                'new_label' => $newUser ? $newUser->name : 'Chưa phân công',
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $changeReason ?: 'Chuyển giao người sở hữu cơ hội',
            ]);

            $opportunity->owner_user_id = $validated['owner_user_id'];
            $opportunity->owner_id = $validated['owner_user_id'];
        }

        // 5. Xác suất thắng (win_probability)
        if (isset($validated['win_probability']) && (int) $validated['win_probability'] !== (int) $opportunity->win_probability) {
            $oldProb = (int) $opportunity->win_probability;
            $newProb = (int) $validated['win_probability'];

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'win_probability',
                'field_label' => 'Xác suất thành công',
                'old_value' => "{$oldProb}%",
                'new_value' => "{$newProb}%",
                'old_label' => "{$oldProb}%",
                'new_label' => "{$newProb}%",
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $changeReason ?: 'Sửa tay xác suất thành công',
            ]);

            $opportunity->win_probability = $newProb;
            $opportunity->win_probability_customized = true;
            if (isset($validated['probability_note'])) {
                $opportunity->probability_note = $validated['probability_note'];
            }
        }

        // Các trường khác
        if (isset($validated['name'])) {
            $opportunity->name = $validated['name'];
            $opportunity->title = $validated['name'];
        }
        if (isset($validated['customer_id'])) {
            $opportunity->customer_id = $validated['customer_id'];
        }
        if (array_key_exists('contact_id', $validated)) {
            $opportunity->contact_id = $validated['contact_id'];
        }
        if (isset($validated['source'])) {
            $opportunity->source = $validated['source'];
        }
        if (isset($validated['notes'])) {
            $opportunity->notes = $validated['notes'];
        }

        $opportunity->last_activity_at = now();
        $opportunity->save();

        $opportunity->load(['customer', 'contact', 'owner', 'histories.changedByUser']);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cơ hội bán hàng thành công',
            'data' => $opportunity,
        ]);
    }

    /**
     * Xem toàn bộ lịch sử thay đổi của một cơ hội (S6-01)
     */
    public function histories(int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $histories = OpportunityHistory::with('changedByUser:id,name,email')
            ->where('opportunity_id', $opportunity->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'opportunity' => [
                    'id' => $opportunity->id,
                    'name' => $opportunity->name,
                    'stage' => $opportunity->stage,
                    'value' => $opportunity->value,
                    'expected_close_date' => $opportunity->expected_close_date,
                    'win_probability' => $opportunity->win_probability,
                ],
                'histories' => $histories,
            ],
        ]);
    }

    /**
     * Trả về danh sách cấu hình giai đoạn và xác suất
     */
    public function getStages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => array_values(self::STAGES),
        ]);
    }

    /**
     * Trả về dữ liệu dropdown cho form tạo/sửa cơ hội
     */
    public function getFormOptions(): JsonResponse
    {
        $customers = Customer::query()
            ->select('id', 'name', 'code', 'phone', 'email')
            ->where('is_active', true)
            ->with(['contacts:id,customer_id,name,title,phone,email,is_primary'])
            ->orderBy('name')
            ->get();

        $users = User::query()
            ->select('id', 'name', 'email', 'role')
            ->whereNull('locked_at')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'customers' => $customers,
                'users' => $users,
                'stages' => array_values(self::STAGES),
                'sources' => [
                    'Website Form',
                    'Trực tiếp',
                    'Giới thiệu (Referral)',
                    'Khách hàng cũ',
                    'Hội thảo / Sự kiện',
                    'Đối tác',
                    'Mạng xã hội',
                    'Khác',
                ],
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BusinessGroup;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\OpportunityAttachment;
use App\Models\OpportunityCollaborator;
use App\Models\OpportunityHistory;
use App\Models\OpportunityProduct;
use App\Models\OpportunityStageGate;
use App\Models\Product;
use App\Models\SalesActivity;
use App\Models\SalesTarget;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
     * Danh sách cơ hội bán hàng & Lọc đa tiêu chí (S5-01 & S6-02)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Opportunity::query()
            ->with([
                'customer:id,name,code,phone,email',
                'contact:id,name,title,phone,email,is_primary',
                'owner:id,name,email',
                'teamLeader:id,name,email',
                'campaign:id,name,channel',
                'products.product:id,name,code,price',
                'collaborators.user:id,name,email',
            ])
            ->withCount(['histories', 'attachments', 'salesActivities']);

        // Phân quyền cơ bản: Nếu role là staff và không có query chỉ định, mặc định thấy cơ hội của mình hoặc được chia sẻ
        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        if ($currentUser && $currentUser->role === 'staff' && !$request->filled('all_staff')) {
            $query->where(function ($q) use ($currentUser) {
                $q->where('owner_user_id', $currentUser->id)
                  ->orWhere('owner_id', $currentUser->id)
                  ->orWhereHas('collaborators', fn ($cq) => $cq->where('user_id', $currentUser->id));
            });
        }

        // Tìm kiếm
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

        // Lọc theo khách hàng
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }

        // Lọc theo giai đoạn
        if ($request->filled('stage')) {
            $query->where('stage', $request->input('stage'));
        }

        // Lọc theo chiến dịch (S4-03)
        if ($request->filled('campaign_id')) {
            $query->where('campaign_id', $request->input('campaign_id'));
        }

        // S6-02: Lọc theo khoảng giá trị
        if ($request->filled('min_value')) {
            $query->where(DB::raw('COALESCE(value, amount, 0)'), '>=', (float) $request->input('min_value'));
        }
        if ($request->filled('max_value')) {
            $query->where(DB::raw('COALESCE(value, amount, 0)'), '<=', (float) $request->input('max_value'));
        }

        // S6-02: Lọc theo khoảng ngày chốt
        if ($request->filled('close_from')) {
            $query->whereDate('expected_close_date', '>=', $request->input('close_from'));
        }
        if ($request->filled('close_to')) {
            $query->whereDate('expected_close_date', '<=', $request->input('close_to'));
        }

        // S6-02: Lọc theo sản phẩm
        if ($request->filled('product_id')) {
            $query->whereHas('products', fn ($pq) => $pq->where('product_id', $request->input('product_id')));
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
     * S5-02: Bảng Kanban Pipeline điều hành các cơ hội bán hàng
     */
    public function kanban(Request $request): JsonResponse
    {
        $query = Opportunity::query()
            ->with([
                'customer:id,name,code,phone,email',
                'contact:id,name,title,phone',
                'owner:id,name,email',
                'teamLeader:id,name,email',
                'campaign:id,name',
            ])
            ->withCount(['salesActivities', 'products', 'attachments']);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        // Mặc định nhân viên chỉ thấy cơ hội của mình trừ khi có quyền quản lý
        if ($currentUser && $currentUser->role === 'staff' && !$request->filled('all_staff')) {
            $query->where(function ($q) use ($currentUser) {
                $q->where('owner_user_id', $currentUser->id)
                  ->orWhere('owner_id', $currentUser->id)
                  ->orWhereHas('collaborators', fn ($cq) => $cq->where('user_id', $currentUser->id));
            });
        }

        if ($request->filled('owner_user_id')) {
            $ownerId = $request->input('owner_user_id');
            $query->where(function ($q) use ($ownerId) {
                $q->where('owner_user_id', $ownerId)
                  ->orWhere('owner_id', $ownerId);
            });
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('close_from')) {
            $query->whereDate('expected_close_date', '>=', $request->input('close_from'));
        }
        if ($request->filled('close_to')) {
            $query->whereDate('expected_close_date', '<=', $request->input('close_to'));
        }

        $allOpps = $query->get();

        $columns = [];
        foreach (self::STAGES as $key => $meta) {
            $items = $allOpps->where('stage', $key)->values();
            $totalVal = $items->sum(fn ($o) => (float) ($o->value ?? $o->amount ?? 0));

            $columns[$key] = [
                'stage_key' => $key,
                'label' => $meta['label'],
                'probability' => $meta['probability'],
                'color' => $meta['color'],
                'count' => $items->count(),
                'total_value' => $totalVal,
                'items' => $items->map(function ($opp) {
                    $isStagnant = !empty($opp->stagnation_flagged_at)
                        || ($opp->expected_close_date && Carbon::parse($opp->expected_close_date)->isPast() && !$opp->is_closed);

                    return [
                        'id' => $opp->id,
                        'name' => $opp->name,
                        'value' => (float) ($opp->value ?? $opp->amount ?? 0),
                        'expected_close_date' => (string) $opp->expected_close_date,
                        'win_probability' => (int) $opp->win_probability,
                        'customer' => $opp->customer ? [
                            'id' => $opp->customer->id,
                            'name' => $opp->customer->name,
                            'code' => $opp->customer->code,
                        ] : null,
                        'contact' => $opp->contact ? [
                            'id' => $opp->contact->id,
                            'name' => $opp->contact->name,
                            'title' => $opp->contact->title,
                        ] : null,
                        'owner' => $opp->owner ? [
                            'id' => $opp->owner->id,
                            'name' => $opp->owner->name,
                        ] : null,
                        'source' => $opp->source,
                        'is_stagnant' => $isStagnant,
                        'is_closed' => (bool) $opp->is_closed,
                        'closed_outcome' => $opp->closed_outcome,
                        'activity_count' => $opp->sales_activities_count,
                        'product_count' => $opp->products_count,
                    ];
                }),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => array_values($columns),
            'message' => 'Lấy dữ liệu pipeline Kanban thành công.',
        ]);
    }

    /**
     * S5-04: Điều kiện bắt buộc khi rời giai đoạn & Chuyển giai đoạn Kanban
     */
    public function changeStage(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        if ($opportunity->is_closed) {
            return response()->json([
                'success' => false,
                'message' => 'Cơ hội này đã được đóng và không thể chuyển giai đoạn. Trưởng nhóm cần mở lại nếu muốn tiếp tục.',
            ], 422);
        }

        $validated = $request->validate([
            'target_stage' => 'required|string|in:' . implode(',', array_keys(self::STAGES)),
            'override_by_leader' => 'nullable|boolean',
            'override_reason' => 'nullable|string|max:500',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $targetStage = $validated['target_stage'];
        $currentStage = $opportunity->stage;

        if ($targetStage === $currentStage) {
            return response()->json(['success' => true, 'message' => 'Giai đoạn không thay đổi.', 'data' => $opportunity]);
        }

        // Kiểm tra điều kiện bắt buộc rời giai đoạn (S5-04 Stage Gates)
        $gate = OpportunityStageGate::where('stage_key', $currentStage)->where('is_active', true)->first();
        $missingConditions = [];

        if ($gate) {
            // 1. Kiểm tra số hoạt động
            if ($gate->require_activity_count > 0) {
                $actCount = SalesActivity::where('opportunity_id', $opportunity->id)->count();
                if ($actCount < $gate->require_activity_count) {
                    $missingConditions[] = "Yêu cầu ghi nhận tối thiểu {$gate->require_activity_count} cuộc gặp/trao đổi trước khi rời giai đoạn (hiện có: {$actCount}).";
                }
            }

            // 2. Kiểm tra có sản phẩm
            if ($gate->require_product) {
                $prodCount = OpportunityProduct::where('opportunity_id', $opportunity->id)->count();
                if ($prodCount === 0) {
                    $missingConditions[] = "Yêu cầu phải đính kèm ít nhất 1 sản phẩm/dịch vụ vào cơ hội.";
                }
            }

            // 3. Kiểm tra có người liên hệ
            if ($gate->require_contact && empty($opportunity->contact_id)) {
                $missingConditions[] = "Yêu cầu phải gắn thông tin Người liên hệ chính của khách hàng.";
            }
        }

        // Nếu có điều kiện chưa thỏa
        if (!empty($missingConditions)) {
            $isLeader = in_array($currentUser?->role, ['admin', 'team_leader', 'manager'], true);
            $overrideRequested = !empty($validated['override_by_leader']);

            if (!$overrideRequested || !$isLeader) {
                return response()->json([
                    'success' => false,
                    'can_override' => $isLeader,
                    'missing_conditions' => $missingConditions,
                    'message' => 'Chưa thỏa mãn điều kiện chuyển giai đoạn: ' . implode(' ', $missingConditions) . ($isLeader ? ' (Bạn có quyền Trưởng nhóm để ghi đè kèm lý do).' : ''),
                ], 422);
            }

            if (empty($validated['override_reason'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trưởng nhóm bắt buộc phải nhập lý do khi ghi đè điều kiện giai đoạn.',
                ], 422);
            }
        }

        return DB::transaction(function () use ($opportunity, $targetStage, $currentStage, $validated, $currentUser, $missingConditions) {
            $oldStageLabel = self::STAGES[$currentStage]['label'] ?? $currentStage;
            $newStageLabel = self::STAGES[$targetStage]['label'] ?? $targetStage;

            $reason = "Chuyển giai đoạn từ {$oldStageLabel} sang {$newStageLabel}";
            if (!empty($validated['override_by_leader'])) {
                $reason .= " [Ghi đè bởi Trưởng nhóm: {$validated['override_reason']}]";
            }

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'stage',
                'field_label' => 'Giai đoạn',
                'old_value' => $currentStage,
                'new_value' => $targetStage,
                'old_label' => $oldStageLabel,
                'new_label' => $newStageLabel,
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $reason,
            ]);

            $opportunity->stage = $targetStage;

            if ($targetStage === 'won') {
                $opportunity->status = 'won';
                $opportunity->is_closed = true;
                $opportunity->closed_outcome = 'won';
                $opportunity->closed_at = now();
                $opportunity->win_probability = 100;
            } elseif ($targetStage === 'lost') {
                $opportunity->status = 'lost';
                $opportunity->is_closed = true;
                $opportunity->closed_outcome = 'lost';
                $opportunity->closed_at = now();
                $opportunity->win_probability = 0;
            } else {
                $opportunity->status = 'open';
                if (!($opportunity->win_probability_customized ?? false)) {
                    $opportunity->win_probability = self::STAGES[$targetStage]['probability'] ?? 10;
                }
            }

            $opportunity->last_activity_at = now();
            $opportunity->save();

            return response()->json([
                'success' => true,
                'message' => "Đã chuyển cơ hội sang giai đoạn [{$newStageLabel}].",
                'data' => $opportunity->fresh(['customer', 'contact', 'owner']),
            ]);
        });
    }

    /**
     * S5-03: Danh sách sản phẩm của cơ hội
     */
    public function getProducts(int $id): JsonResponse
    {
        $items = OpportunityProduct::with('product')
            ->where('opportunity_id', $id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * S5-03: Thêm sản phẩm dịch vụ vào cơ hội & Tự động tính lại giá trị hợp đồng
     */
    public function addProduct(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'is_subscription' => 'nullable|boolean',
            'billing_cycle' => 'nullable|in:monthly,quarterly,yearly',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $unitPrice = isset($validated['unit_price']) ? (float) $validated['unit_price'] : (float) $product->price;
        $qty = (int) $validated['quantity'];
        $discount = (float) ($validated['discount_percent'] ?? 0);
        $isSub = (bool) ($validated['is_subscription'] ?? false);
        $cycle = $validated['billing_cycle'] ?? null;

        // Tính tổng tiền dòng sản phẩm
        $lineTotal = $qty * $unitPrice * (1 - $discount / 100);

        // Giá trị hợp đồng theo năm (ACV) nếu là dịch vụ thuê bao (S5-03)
        $annualValue = $lineTotal;
        if ($isSub) {
            if ($cycle === 'monthly') {
                $annualValue = $lineTotal * 12;
            } elseif ($cycle === 'quarterly') {
                $annualValue = $lineTotal * 4;
            }
        }

        $item = OpportunityProduct::create([
            'opportunity_id' => $opportunity->id,
            'product_id' => $product->id,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'discount_percent' => $discount,
            'is_subscription' => $isSub,
            'billing_cycle' => $cycle,
            'annual_value' => $annualValue,
            'total_amount' => $lineTotal,
        ]);

        // Tự động tính lại tổng giá trị của cơ hội từ tất cả các dòng sản phẩm (S5-03)
        $totalOppValue = OpportunityProduct::where('opportunity_id', $opportunity->id)->sum('total_amount');
        $opportunity->update([
            'value' => $totalOppValue,
            'amount' => $totalOppValue,
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Đã thêm sản phẩm '{$product->name}' vào cơ hội và tính lại giá trị hợp đồng.",
            'data' => $item->load('product'),
            'total_opportunity_value' => $totalOppValue,
        ], 201);
    }

    /**
     * S5-03: Xóa sản phẩm khỏi cơ hội và tính lại giá trị
     */
    public function deleteProduct(int $id, int $itemId): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);
        $item = OpportunityProduct::where('opportunity_id', $opportunity->id)->where('id', $itemId)->firstOrFail();
        $item->delete();

        $totalOppValue = OpportunityProduct::where('opportunity_id', $opportunity->id)->sum('total_amount');
        $opportunity->update([
            'value' => $totalOppValue,
            'amount' => $totalOppValue,
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa sản phẩm khỏi cơ hội.',
            'total_opportunity_value' => $totalOppValue,
        ]);
    }

    /**
     * S5-05: Đóng Thắng cơ hội bán hàng
     */
    public function closeWon(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $validated = $request->validate([
            'actual_won_value' => 'required|numeric|min:0',
            'contract_signed_at' => 'required|date',
            'notes' => 'nullable|string|max:500',
        ], [
            'actual_won_value.required' => 'Đóng Thắng bắt buộc nhập giá trị chốt thực tế.',
            'contract_signed_at.required' => 'Đóng Thắng bắt buộc nhập ngày ký hợp đồng.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        return DB::transaction(function () use ($opportunity, $validated, $currentUser) {
            $opportunity->update([
                'stage' => 'won',
                'status' => 'won',
                'is_closed' => true,
                'closed_outcome' => 'won',
                'closed_at' => now(),
                'actual_won_value' => $validated['actual_won_value'],
                'contract_signed_at' => $validated['contract_signed_at'],
                'win_probability' => 100,
                'last_activity_at' => now(),
            ]);

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'closed_won',
                'field_label' => 'Đóng Thắng (Closed Won)',
                'old_value' => null,
                'new_value' => number_format($validated['actual_won_value'], 0, ',', '.') . ' VNĐ',
                'old_label' => null,
                'new_label' => 'Hợp đồng ký ngày ' . Carbon::parse($validated['contract_signed_at'])->format('d/m/Y'),
                'changed_by_user_id' => $currentUser?->id,
                'reason' => 'Chốt hợp đồng thành công: ' . ($validated['notes'] ?? ''),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chúc mừng! Đã đóng Thắng cơ hội bán hàng thành công và ghi nhận vào chỉ tiêu doanh số.',
                'data' => $opportunity->fresh(['customer', 'contact', 'owner']),
            ]);
        });
    }

    /**
     * S5-05: Đóng Thua cơ hội bán hàng
     */
    public function closeLost(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $validated = $request->validate([
            'loss_reason' => 'required|string|max:150',
            'competitor_name' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:500',
        ], [
            'loss_reason.required' => 'Đóng Thua bắt buộc chọn lý do thất bại.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        return DB::transaction(function () use ($opportunity, $validated, $currentUser) {
            $opportunity->update([
                'stage' => 'lost',
                'status' => 'lost',
                'is_closed' => true,
                'closed_outcome' => 'lost',
                'closed_at' => now(),
                'loss_reason' => $validated['loss_reason'],
                'competitor_name' => $validated['competitor_name'] ?? null,
                'win_probability' => 0,
                'last_activity_at' => now(),
            ]);

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'closed_lost',
                'field_label' => 'Đóng Thua (Closed Lost)',
                'old_value' => null,
                'new_value' => $validated['loss_reason'],
                'old_label' => null,
                'new_label' => $validated['competitor_name'] ? "Đối thủ: {$validated['competitor_name']}" : 'Thất bại',
                'changed_by_user_id' => $currentUser?->id,
                'reason' => 'Lý do: ' . $validated['loss_reason'] . ($validated['competitor_name'] ? " (Thắng thầu: {$validated['competitor_name']})" : ''),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã ghi nhận Đóng Thua cơ hội bán hàng.',
                'data' => $opportunity->fresh(['customer', 'contact', 'owner']),
            ]);
        });
    }

    /**
     * S5-05: Mở lại cơ hội đã đóng (Chỉ Trưởng nhóm trở lên)
     */
    public function reopen(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        if (!$opportunity->is_closed) {
            return response()->json(['success' => false, 'message' => 'Cơ hội này chưa bị đóng.'], 422);
        }

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        if (!in_array($currentUser?->role, ['admin', 'team_leader', 'manager'], true)) {
            return response()->json(['success' => false, 'message' => 'Chỉ cấp Trưởng nhóm trở lên mới có quyền mở lại cơ hội đã đóng.'], 403);
        }

        $validated = $request->validate([
            'reopen_reason' => 'required|string|max:500',
        ], [
            'reopen_reason.required' => 'Mở lại cơ hội bắt buộc phải nhập lý do.',
        ]);

        return DB::transaction(function () use ($opportunity, $validated, $currentUser) {
            $opportunity->update([
                'stage' => 'khao_sat',
                'status' => 'open',
                'is_closed' => false,
                'closed_outcome' => null,
                'closed_at' => null,
                'reopened_at' => now(),
                'reopen_reason' => $validated['reopen_reason'],
                'win_probability' => 10,
                'last_activity_at' => now(),
            ]);

            OpportunityHistory::create([
                'opportunity_id' => $opportunity->id,
                'field_name' => 'reopen',
                'field_label' => 'Mở lại cơ hội',
                'old_value' => 'Đã đóng',
                'new_value' => 'Mở lại',
                'old_label' => 'Đã đóng',
                'new_label' => 'Khảo sát / Tìm hiểu',
                'changed_by_user_id' => $currentUser?->id,
                'reason' => $validated['reopen_reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã mở lại cơ hội thành công.',
                'data' => $opportunity->fresh(['customer', 'contact', 'owner']),
            ]);
        });
    }

    /**
     * S5-06: Dự báo doanh số tính theo trọng số xác suất (Weighted Sales Forecast)
     */
    public function forecast(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        $startOfNextMonth = $now->copy()->addMonth()->startOfMonth()->toDateString();
        $endOfNextMonth = $now->copy()->addMonth()->endOfMonth()->toDateString();

        $startOfQuarter = $now->copy()->startOfQuarter()->toDateString();
        $endOfQuarter = $now->copy()->endOfQuarter()->toDateString();

        $openOpps = Opportunity::where('status', 'open')
            ->where('is_closed', false)
            ->with(['owner:id,name,role', 'owner.businessGroups:id,name'])
            ->get();

        $calcForecast = function ($collection) {
            $rawSum = $collection->sum(fn ($o) => (float) ($o->value ?? $o->amount ?? 0));
            $weightedSum = $collection->sum(fn ($o) => (float) ($o->value ?? $o->amount ?? 0) * ((int) ($o->win_probability ?? 10) / 100));
            return [
                'count' => $collection->count(),
                'raw_pipeline_value' => $rawSum,
                'weighted_forecast_value' => round($weightedSum, 2),
            ];
        };

        // Theo kỳ dự kiến chốt (Tháng này, Tháng sau, Quý này)
        $thisMonthOpps = $openOpps->filter(fn ($o) => $o->expected_close_date && $o->expected_close_date >= $startOfMonth && $o->expected_close_date <= $endOfMonth);
        $nextMonthOpps = $openOpps->filter(fn ($o) => $o->expected_close_date && $o->expected_close_date >= $startOfNextMonth && $o->expected_close_date <= $endOfNextMonth);
        $thisQuarterOpps = $openOpps->filter(fn ($o) => $o->expected_close_date && $o->expected_close_date >= $startOfQuarter && $o->expected_close_date <= $endOfQuarter);

        // Doanh số thực tế đã chốt (won) trong tháng này và quý này
        $actualWonThisMonth = (float) Opportunity::where(fn ($q) => $q->where('closed_outcome', 'won')->orWhere('stage', 'won'))
            ->whereDate('contract_signed_at', '>=', $startOfMonth)
            ->whereDate('contract_signed_at', '<=', $endOfMonth)
            ->sum(DB::raw('COALESCE(actual_won_value, value, amount, 0)'));

        $actualWonThisQuarter = (float) Opportunity::where(fn ($q) => $q->where('closed_outcome', 'won')->orWhere('stage', 'won'))
            ->whereDate('contract_signed_at', '>=', $startOfQuarter)
            ->whereDate('contract_signed_at', '<=', $endOfQuarter)
            ->sum(DB::raw('COALESCE(actual_won_value, value, amount, 0)'));

        // Chỉ tiêu (Sales Target) nếu có
        $targetThisMonth = (float) SalesTarget::whereYear('start_date', $now->year)->whereMonth('start_date', $now->month)->sum('target_value') ?: 500000000;

        // Phân rã theo nhân viên
        $byRep = [];
        $users = User::where('role', 'staff')->get();
        foreach ($users as $user) {
            $userOpps = $openOpps->where('owner_user_id', $user->id);
            $userStats = $calcForecast($userOpps);
            $userWon = (float) Opportunity::where('owner_user_id', $user->id)
                ->where(fn ($q) => $q->where('closed_outcome', 'won')->orWhere('stage', 'won'))
                ->sum(DB::raw('COALESCE(actual_won_value, value, amount, 0)'));

            $byRep[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'email' => $user->email,
                'opportunity_count' => $userStats['count'],
                'weighted_forecast' => $userStats['weighted_forecast_value'],
                'actual_won' => $userWon,
            ];
        }

        // Phân rã theo nhóm kinh doanh
        $byTeam = [];
        $groups = BusinessGroup::all();
        foreach ($groups as $group) {
            $userIds = $group->users()->pluck('users.id')->toArray();
            $teamOpps = $openOpps->filter(fn ($o) => in_array($o->owner_user_id, $userIds, true));
            $teamStats = $calcForecast($teamOpps);

            $byTeam[] = [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'opportunity_count' => $teamStats['count'],
                'weighted_forecast' => $teamStats['weighted_forecast_value'],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'periods' => [
                    'this_month' => array_merge($calcForecast($thisMonthOpps), [
                        'label' => 'Tháng này (' . $now->format('m/Y') . ')',
                        'target' => $targetThisMonth,
                        'actual_won' => $actualWonThisMonth,
                    ]),
                    'next_month' => array_merge($calcForecast($nextMonthOpps), [
                        'label' => 'Tháng sau (' . $now->copy()->addMonth()->format('m/Y') . ')',
                    ]),
                    'this_quarter' => array_merge($calcForecast($thisQuarterOpps), [
                        'label' => 'Quý này (Q' . $now->quarter . '/' . $now->year . ')',
                        'actual_won' => $actualWonThisQuarter,
                    ]),
                ],
                'by_rep' => $byRep,
                'by_team' => $byTeam,
            ],
            'message' => 'Lấy dữ liệu dự báo doanh số trọng số thành công.',
        ]);
    }

    /**
     * S5-08: Phân bổ lại cơ hội cho người khác trong nhóm (Bulk Reassign)
     */
    public function bulkReassign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'opportunity_ids' => 'required|array|min:1',
            'opportunity_ids.*' => 'integer|exists:opportunities,id',
            'new_owner_user_id' => 'required|integer|exists:users,id',
            'reason' => 'required|string|max:500',
        ], [
            'new_owner_user_id.required' => 'Vui lòng chọn nhân viên tiếp nhận.',
            'reason.required' => 'Chuyển giao quyền sở hữu cơ hội bắt buộc phải nhập lý do.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $newOwner = User::findOrFail($validated['new_owner_user_id']);
        $oppIds = $validated['opportunity_ids'];
        $reason = $validated['reason'];

        $updatedCount = 0;

        DB::transaction(function () use ($oppIds, $newOwner, $reason, $currentUser, &$updatedCount) {
            foreach ($oppIds as $oppId) {
                $opportunity = Opportunity::find($oppId);
                if (!$opportunity) continue;

                $oldUser = User::find($opportunity->owner_user_id);
                $oldName = $oldUser ? $oldUser->name : 'Chưa phân công';

                $opportunity->update([
                    'owner_user_id' => $newOwner->id,
                    'owner_id' => $newOwner->id,
                    'last_activity_at' => now(),
                ]);

                OpportunityHistory::create([
                    'opportunity_id' => $opportunity->id,
                    'field_name' => 'owner_user_id',
                    'field_label' => 'Người sở hữu',
                    'old_value' => (string) $oldUser?->id,
                    'new_value' => (string) $newOwner->id,
                    'old_label' => $oldName,
                    'new_label' => $newOwner->name,
                    'changed_by_user_id' => $currentUser?->id,
                    'reason' => "Điều chuyển quyền sở hữu: {$reason}",
                ]);

                $updatedCount++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Đã chuyển giao thành công {$updatedCount} cơ hội sang cho {$newOwner->name}.",
        ]);
    }

    /**
     * S6-03: Danh sách người cùng tham gia cơ hội (Collaborators)
     */
    public function getCollaborators(int $id): JsonResponse
    {
        $collaborators = OpportunityCollaborator::with('user:id,name,email,role')
            ->where('opportunity_id', $id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $collaborators,
        ]);
    }

    /**
     * S6-03: Thêm thành viên cùng tham gia cơ hội
     */
    public function addCollaborator(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'nullable|in:collaborator,viewer',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        $collaborator = OpportunityCollaborator::updateOrCreate(
            ['opportunity_id' => $opportunity->id, 'user_id' => $validated['user_id']],
            ['role' => $validated['role'] ?? 'collaborator', 'added_by' => $currentUser?->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm thành viên cùng tham gia cơ hội thành công.',
            'data' => $collaborator->load('user'),
        ]);
    }

    /**
     * S6-03: Xóa thành viên cùng tham gia cơ hội
     */
    public function removeCollaborator(int $id, int $userId): JsonResponse
    {
        OpportunityCollaborator::where('opportunity_id', $id)->where('user_id', $userId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã gỡ thành viên khỏi cơ hội.',
        ]);
    }

    /**
     * S6-04: Danh sách tài liệu đính kèm cơ hội
     */
    public function getAttachments(int $id): JsonResponse
    {
        $attachments = OpportunityAttachment::with('uploader:id,name,email')
            ->where('opportunity_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $attachments,
        ]);
    }

    /**
     * S6-04: Tải lên tài liệu đính kèm (tối đa 20MB / tệp)
     */
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        $request->validate([
            'file' => 'required|file|max:20480', // 20MB = 20480 KB (S6-04)
        ], [
            'file.required' => 'Vui lòng chọn tệp tài liệu cần tải lên.',
            'file.max' => 'Dung lượng tệp không được vượt quá 20MB (S6-04).',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getClientMimeType();

        $path = $file->store('attachments/opportunities/' . $opportunity->id, 'public');

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        $attachment = OpportunityAttachment::create([
            'opportunity_id' => $opportunity->id,
            'file_name' => $fileName,
            'file_path' => $path,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'uploaded_by' => $currentUser?->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tải lên tệp '{$fileName}' thành công.",
            'data' => $attachment->load('uploader'),
        ], 201);
    }

    /**
     * S6-04: Tải xuống tài liệu có phân quyền
     */
    public function downloadAttachment(Request $request, int $id, int $attachmentId): BinaryFileResponse|JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);
        $attachment = OpportunityAttachment::where('opportunity_id', $opportunity->id)->where('id', $attachmentId)->firstOrFail();

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        // Kiểm tra quyền: Chỉ người sở hữu, thành viên được chia sẻ, trưởng nhóm và admin mới được tải (S6-04)
        $isOwner = $opportunity->owner_user_id === $currentUser?->id || $opportunity->owner_id === $currentUser?->id;
        $isCollaborator = OpportunityCollaborator::where('opportunity_id', $opportunity->id)->where('user_id', $currentUser?->id)->exists();
        $isLeaderOrAdmin = in_array($currentUser?->role, ['admin', 'team_leader', 'manager'], true);

        if (!$isOwner && !$isCollaborator && !$isLeaderOrAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền tải xuống tài liệu này.',
            ], 403);
        }

        $fullPath = storage_path('app/public/' . $attachment->file_path);
        if (!file_exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Tệp không tồn tại trên hệ thống lưu trữ.',
            ], 404);
        }

        return response()->download($fullPath, $attachment->file_name);
    }

    /**
     * S6-04: Xóa tài liệu đính kèm
     */
    public function deleteAttachment(int $id, int $attachmentId): JsonResponse
    {
        $attachment = OpportunityAttachment::where('opportunity_id', $id)->where('id', $attachmentId)->firstOrFail();
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }
        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tài liệu đính kèm.',
        ]);
    }

    /**
     * S5-04: Danh sách cấu hình điều kiện chuyển giai đoạn
     */
    public function getStageGates(): JsonResponse
    {
        $gates = OpportunityStageGate::all();
        return response()->json([
            'success' => true,
            'data' => $gates,
        ]);
    }

    public function updateStageGate(Request $request, int $id): JsonResponse
    {
        $gate = OpportunityStageGate::findOrFail($id);

        $validated = $request->validate([
            'require_activity_count' => 'nullable|integer|min:0',
            'require_product' => 'nullable|boolean',
            'require_contact' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $gate->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật điều kiện chuyển giai đoạn thành công.',
            'data' => $gate,
        ]);
    }

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
            'campaign_id' => 'nullable|exists:campaigns,id',
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

        $status = 'open';
        if ($stageKey === 'won') {
            $status = 'won';
        } elseif ($stageKey === 'lost') {
            $status = 'lost';
        }

        $opportunity = Opportunity::create([
            'name' => $validated['name'],
            'title' => $validated['name'],
            'customer_id' => $validated['customer_id'],
            'contact_id' => $validated['contact_id'] ?? null,
            'campaign_id' => $validated['campaign_id'] ?? null,
            'stage' => $stageKey,
            'status' => $status,
            'value' => $validated['value'],
            'amount' => $validated['value'],
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

        $opportunity->load(['customer', 'contact', 'owner', 'campaign']);

        return response()->json([
            'success' => true,
            'message' => 'Tạo cơ hội bán hàng thành công',
            'data' => $opportunity,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $opportunity = Opportunity::with([
            'customer',
            'contact',
            'owner',
            'teamLeader',
            'campaign',
            'products.product',
            'collaborators.user',
            'attachments.uploader',
            'histories.changedByUser:id,name,email',
            'salesActivities.user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $opportunity,
            'meta' => [
                'stages' => self::STAGES,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $opportunity = Opportunity::findOrFail($id);

        if ($opportunity->is_closed) {
            return response()->json([
                'success' => false,
                'message' => 'Cơ hội đã đóng. Chỉ có thể mở lại cơ hội bởi Trưởng nhóm trước khi chỉnh sửa thông tin.',
            ], 422);
        }

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
            'campaign_id' => 'nullable|exists:campaigns,id',
            'notes' => 'nullable|string',
            'change_reason' => 'nullable|string|max:500',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $changeReason = $validated['change_reason'] ?? $validated['probability_note'] ?? null;

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
                $opportunity->is_closed = true;
                $opportunity->closed_outcome = 'won';
            } elseif ($newStageKey === 'lost') {
                $opportunity->status = 'lost';
                $opportunity->is_closed = true;
                $opportunity->closed_outcome = 'lost';
            } else {
                $opportunity->status = 'open';
            }

            if (!($opportunity->win_probability_customized ?? false) && !isset($validated['win_probability'])) {
                $newProb = self::STAGES[$newStageKey]['probability'] ?? $opportunity->win_probability;
                $opportunity->win_probability = $newProb;
            }
        }

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
        if (array_key_exists('campaign_id', $validated)) {
            $opportunity->campaign_id = $validated['campaign_id'];
        }
        if (isset($validated['source'])) {
            $opportunity->source = $validated['source'];
        }
        if (isset($validated['notes'])) {
            $opportunity->notes = $validated['notes'];
        }

        $opportunity->last_activity_at = now();
        $opportunity->save();

        $opportunity->load(['customer', 'contact', 'owner', 'campaign', 'histories.changedByUser']);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cơ hội bán hàng thành công',
            'data' => $opportunity,
        ]);
    }

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

    public function getStages(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => array_values(self::STAGES),
        ]);
    }

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

        $products = Product::query()
            ->selectRaw('id, name, sku as code, list_price as price, unit')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $campaigns = \App\Models\Campaign::query()
            ->select('id', 'name', 'channel', 'status')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'customers' => $customers,
                'users' => $users,
                'products' => $products,
                'campaigns' => $campaigns,
                'stages' => array_values(self::STAGES),
                'sources' => [
                    'Website Form',
                    'Trực tiếp',
                    'Giới thiệu (Referral)',
                    'Khách hàng cũ',
                    'Hội thảo / Sự kiện',
                    'Đối tác',
                    'Mạng xã hội',
                    'Cold Call',
                    'Khác',
                ],
            ],
        ]);
    }
}

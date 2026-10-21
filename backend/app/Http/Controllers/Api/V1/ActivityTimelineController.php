<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CalendarItem;
use App\Models\Contact;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\OpportunityHistory;
use App\Models\Quote;
use App\Models\SalesActivity;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityTimelineController extends Controller
{
    /**
     * S6-05: Danh sách hoạt động tương tác với khách hàng
     */
    public function indexActivities(Request $request): JsonResponse
    {
        $query = SalesActivity::query()
            ->with([
                'user:id,name,email',
                'customer:id,name,code',
                'contact:id,name,phone,email',
                'opportunity:id,name,stage',
                'lead:id,name,company',
            ]);

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }
        if ($request->filled('opportunity_id')) {
            $query->where('opportunity_id', $request->input('opportunity_id'));
        }
        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->input('lead_id'));
        }
        if ($request->filled('activity_type')) {
            $query->where('activity_type', $request->input('activity_type'));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $activities = $query->orderBy('occurred_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $activities,
            'message' => 'Lấy danh sách hoạt động thành công.',
        ]);
    }

    /**
     * S6-05: Ghi nhận một hoạt động tương tác (cuộc gọi, cuộc gặp, email, ghi chú)
     */
    public function storeActivity(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'activity_type' => 'required|in:call,meeting,email,note,quotation',
            'title' => 'required|string|max:180',
            'description' => 'nullable|string',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'contact_id' => 'nullable|integer|exists:contacts,id',
            'opportunity_id' => 'nullable|integer|exists:opportunities,id',
            'lead_id' => 'nullable|integer|exists:leads,id',
            'duration_minutes' => 'nullable|integer|min:0',
            'result' => 'nullable|string',
            'occurred_at' => 'nullable|date',
        ], [
            'activity_type.required' => 'Vui lòng chọn loại hoạt động.',
            'title.required' => 'Vui lòng nhập tiêu đề hoạt động.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $occurredAt = !empty($validated['occurred_at']) ? Carbon::parse($validated['occurred_at']) : now();

        $activity = SalesActivity::create([
            'user_id' => $currentUser?->id ?: User::first()->id,
            'team_leader_id' => $currentUser?->team_leader_id,
            'customer_id' => $validated['customer_id'] ?? null,
            'contact_id' => $validated['contact_id'] ?? null,
            'opportunity_id' => $validated['opportunity_id'] ?? null,
            'lead_id' => $validated['lead_id'] ?? null,
            'activity_type' => $validated['activity_type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'result' => $validated['result'] ?? null,
            'occurred_at' => $occurredAt,
        ]);

        // Cập nhật last_activity_at trên Cơ hội hoặc Khách hàng
        if (!empty($validated['opportunity_id'])) {
            Opportunity::where('id', $validated['opportunity_id'])->update(['last_activity_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã ghi nhận hoạt động thành công.',
            'data' => $activity->load(['user', 'customer', 'contact', 'opportunity']),
        ], 201);
    }

    /**
     * S6-08: Dòng thời gian tương tác đầy đủ của một khách hàng (Customer 360 Timeline)
     */
    public function customerTimeline(Request $request, int $customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $typeFilter = $request->query('type'); // activity, stage_change, quote, task
        $userFilter = $request->query('user_id');

        $events = [];

        // 1. Toàn bộ hoạt động (cuộc gọi, cuộc gặp, email, ghi chú)
        if (!$typeFilter || $typeFilter === 'activity') {
            $activities = SalesActivity::with('user:id,name,email')
                ->where('customer_id', $customer->id)
                ->when($userFilter, fn ($q) => $q->where('user_id', $userFilter))
                ->get();

            foreach ($activities as $act) {
                $events[] = [
                    'id' => 'act_' . $act->id,
                    'event_type' => 'activity',
                    'sub_type' => $act->activity_type?->value ?? (string) $act->activity_type,
                    'title' => $act->title,
                    'description' => $act->description,
                    'result' => $act->result,
                    'duration_minutes' => $act->duration_minutes,
                    'user' => $act->user ? ['id' => $act->user->id, 'name' => $act->user->name] : null,
                    'timestamp' => $act->occurred_at ? $act->occurred_at->toISOString() : $act->created_at->toISOString(),
                ];
            }
        }

        // 2. Thay đổi cơ hội bán hàng (Opportunity Histories)
        if (!$typeFilter || $typeFilter === 'stage_change') {
            $oppIds = Opportunity::where('customer_id', $customer->id)->pluck('id');
            if ($oppIds->isNotEmpty()) {
                $histories = OpportunityHistory::with(['changedByUser:id,name', 'opportunity:id,name'])
                    ->whereIn('opportunity_id', $oppIds)
                    ->when($userFilter, fn ($q) => $q->where('changed_by_user_id', $userFilter))
                    ->get();

                foreach ($histories as $hist) {
                    $events[] = [
                        'id' => 'hist_' . $hist->id,
                        'event_type' => 'stage_change',
                        'sub_type' => $hist->field_name,
                        'title' => "[{$hist->opportunity?->name}] " . $hist->field_label . ": " . ($hist->new_label ?: $hist->new_value),
                        'description' => "Từ " . ($hist->old_label ?: ($hist->old_value ?? 'Khởi tạo')) . " -> " . ($hist->new_label ?: $hist->new_value) . ($hist->reason ? " ({$hist->reason})" : ''),
                        'result' => null,
                        'duration_minutes' => null,
                        'user' => $hist->changedByUser ? ['id' => $hist->changedByUser->id, 'name' => $hist->changedByUser->name] : null,
                        'timestamp' => $hist->created_at->toISOString(),
                    ];
                }
            }
        }

        // 3. Báo giá đã gửi (Quotes)
        if (!$typeFilter || $typeFilter === 'quote') {
            $quotes = \Illuminate\Support\Facades\Schema::hasColumn('quotes', 'customer_id')
                ? Quote::where('customer_id', $customer->id)
                    ->when($userFilter, fn ($q) => $q->where('created_by', $userFilter))
                    ->get()
                : collect();

            foreach ($quotes as $quote) {
                $events[] = [
                    'id' => 'quote_' . $quote->id,
                    'event_type' => 'quote',
                    'sub_type' => 'quotation',
                    'title' => "Báo giá: " . ($quote->quote_code ?? "#{$quote->id}"),
                    'description' => "Tổng tiền: " . number_format($quote->total_amount ?? 0, 0, ',', '.') . " VNĐ - Chiết khấu: {$quote->discount_percentage}%",
                    'result' => $quote->status,
                    'duration_minutes' => null,
                    'user' => null,
                    'timestamp' => $quote->created_at ? $quote->created_at->toISOString() : now()->toISOString(),
                ];
            }
        }

        // 4. Công việc đã thực hiện
        if (!$typeFilter || $typeFilter === 'task') {
            $tasks = CalendarItem::with('assignedUser:id,name')
                ->where('customer_id', $customer->id)
                ->when($userFilter, fn ($q) => $q->where('assigned_user_id', $userFilter))
                ->get();

            foreach ($tasks as $task) {
                $events[] = [
                    'id' => 'task_' . $task->id,
                    'event_type' => 'task',
                    'sub_type' => $task->item_type?->value ?? (string) $task->item_type,
                    'title' => "Công việc: " . $task->title,
                    'description' => $task->description . ($task->postpone_reason ? " [Lý do hoãn: {$task->postpone_reason}]" : ''),
                    'result' => $task->status?->value ?? (string) $task->status,
                    'duration_minutes' => null,
                    'user' => $task->assignedUser ? ['id' => $task->assignedUser->id, 'name' => $task->assignedUser->name] : null,
                    'timestamp' => $task->completed_at ? $task->completed_at->toISOString() : ($task->due_at ? $task->due_at->toISOString() : $task->created_at->toISOString()),
                ];
            }
        }

        // Sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
        usort($events, fn ($a, $b) => strcmp($b['timestamp'], $a['timestamp']));

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'code' => $customer->code,
                ],
                'timeline' => $events,
                'total_events' => count($events),
            ],
            'message' => 'Lấy dòng thời gian tương tác khách hàng thành công.',
        ]);
    }

    /**
     * S6-06: Danh sách công việc có hạn hoàn thành (Tasks)
     */
    public function indexTasks(Request $request): JsonResponse
    {
        $query = CalendarItem::query()
            ->with([
                'assignedUser:id,name,email',
                'teamLeader:id,name,email',
                'customer:id,name,code',
                'opportunity:id,name,stage',
            ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();

        if ($currentUser && $currentUser->role === 'staff' && !$request->filled('all_staff')) {
            $query->where('assigned_user_id', $currentUser->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }
        if ($request->filled('item_type')) {
            $query->where('item_type', $request->input('item_type'));
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->input('customer_id'));
        }
        if ($request->filled('opportunity_id')) {
            $query->where('opportunity_id', $request->input('opportunity_id'));
        }

        $tasks = $query->orderByRaw("CASE WHEN status = 'scheduled' AND due_at < NOW() THEN 0 WHEN status = 'scheduled' THEN 1 ELSE 2 END")
            ->orderBy('due_at', 'asc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $tasks,
            'message' => 'Lấy danh sách công việc thành công.',
        ]);
    }

    /**
     * S6-06: Tạo mới công việc có hạn hoàn thành
     */
    public function storeTask(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:180',
            'due_at' => 'required|date',
            'priority' => 'required|in:low,medium,high',
            'assigned_user_id' => 'required|exists:users,id',
            'customer_id' => 'nullable|exists:customers,id',
            'opportunity_id' => 'nullable|exists:opportunities,id',
            'description' => 'nullable|string',
            'reminder_minutes' => 'nullable|integer|min:0',
        ], [
            'title.required' => 'Vui lòng nhập tiêu đề công việc.',
            'due_at.required' => 'Vui lòng chọn hạn hoàn thành.',
            'assigned_user_id.required' => 'Vui lòng chọn người thực hiện.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $assignee = User::findOrFail($validated['assigned_user_id']);

        $task = CalendarItem::create([
            'title' => $validated['title'],
            'item_type' => 'task',
            'priority' => $validated['priority'],
            'assigned_user_id' => $assignee->id,
            'team_leader_id' => $currentUser?->id,
            'customer_id' => $validated['customer_id'] ?? null,
            'opportunity_id' => $validated['opportunity_id'] ?? null,
            'due_at' => Carbon::parse($validated['due_at']),
            'status' => 'scheduled',
            'description' => $validated['description'] ?? null,
            'reminder_minutes' => $validated['reminder_minutes'] ?? 15,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã giao công việc thành công.',
            'data' => $task->load(['assignedUser', 'customer', 'opportunity']),
        ], 201);
    }

    /**
     * S6-06: Đánh dấu công việc hoàn thành
     */
    public function completeTask(int $id): JsonResponse
    {
        $task = CalendarItem::findOrFail($id);
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu công việc hoàn thành.',
            'data' => $task,
        ]);
    }

    /**
     * S6-06: Hoãn công việc kèm lý do bắt buộc
     */
    public function postponeTask(Request $request, int $id): JsonResponse
    {
        $task = CalendarItem::findOrFail($id);

        $validated = $request->validate([
            'new_due_at' => 'required|date|after:now',
            'postpone_reason' => 'required|string|max:500',
        ], [
            'new_due_at.required' => 'Vui lòng chọn hạn hoàn thành mới.',
            'new_due_at.after' => 'Hạn hoàn thành mới phải ở trong tương lai.',
            'postpone_reason.required' => 'Hoãn công việc bắt buộc phải nhập lý do.',
        ]);

        $task->update([
            'status' => 'postponed',
            'due_at' => Carbon::parse($validated['new_due_at']),
            'postpone_reason' => $validated['postpone_reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã hoãn công việc thành công.',
            'data' => $task,
        ]);
    }

    /**
     * S6-09: Cảnh báo việc sắp đến hạn và việc quá hạn
     */
    public function taskReminders(Request $request): JsonResponse
    {
        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $now = Carbon::now();

        // 1. Việc quá hạn của cá nhân
        $overdueQuery = CalendarItem::where('status', 'scheduled')
            ->where('due_at', '<', $now)
            ->with(['customer:id,name', 'opportunity:id,name']);

        if ($currentUser && $currentUser->role === 'staff') {
            $overdueQuery->where('assigned_user_id', $currentUser->id);
        }
        $overdueTasks = $overdueQuery->orderBy('due_at', 'asc')->get();

        // 2. Việc sắp đến hạn trong vòng 24h
        $upcomingQuery = CalendarItem::where('status', 'scheduled')
            ->where('due_at', '>=', $now)
            ->where('due_at', '<=', $now->copy()->addHours(24))
            ->with(['customer:id,name', 'opportunity:id,name']);

        if ($currentUser && $currentUser->role === 'staff') {
            $upcomingQuery->where('assigned_user_id', $currentUser->id);
        }
        $upcomingTasks = $upcomingQuery->orderBy('due_at', 'asc')->get();

        // 3. Tổng số việc quá hạn của từng thành viên trong nhóm (cho Trưởng nhóm / Admin - S6-09)
        $leaderSummary = [];
        if ($currentUser && in_array($currentUser->role, ['admin', 'team_leader', 'manager'], true)) {
            $members = User::where('role', 'staff')->get();
            foreach ($members as $member) {
                $count = CalendarItem::where('assigned_user_id', $member->id)
                    ->where('status', 'scheduled')
                    ->where('due_at', '<', $now)
                    ->count();

                $leaderSummary[] = [
                    'user_id' => $member->id,
                    'user_name' => $member->name,
                    'email' => $member->email,
                    'overdue_count' => $count,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'overdue_tasks' => $overdueTasks,
                'upcoming_tasks' => $upcomingTasks,
                'total_overdue' => $overdueTasks->count(),
                'total_upcoming' => $upcomingTasks->count(),
                'leader_summary' => $leaderSummary,
            ],
            'message' => 'Lấy danh sách nhắc việc thành công.',
        ]);
    }

    /**
     * S6-10: Ghi nhanh kết quả cuộc gọi ngay trên điện thoại (Quick Call Log - 3 chạm)
     * - Biểu mẫu rút gọn: kết quả cuộc gọi, ghi chú ngắn, đặt lịch gọi lại
     * - Hoàn tất trong không quá ba thao tác chạm
     * - Tự động gắn vào cơ hội đang mở gần nhất của khách hàng đó
     */
    public function quickCallLog(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'call_result' => 'required|in:connected,busy,wrong_number,no_answer',
            'note' => 'nullable|string|max:500',
            'callback_at' => 'nullable|date',
        ], [
            'customer_id.required' => 'Vui lòng chọn khách hàng.',
            'call_result.required' => 'Vui lòng chọn kết quả cuộc gọi.',
        ]);

        $currentUser = $request->attributes->get('current_user') ?? auth()->user();
        $customer = Customer::findOrFail($validated['customer_id']);

        $resultLabels = [
            'connected' => 'Kết nối thành công',
            'busy' => 'Khách bận máy',
            'wrong_number' => 'Sai số điện thoại',
            'no_answer' => 'Không nghe máy / Đổ chuông không nhấc',
        ];

        // S6-10: Tự động gắn vào cơ hội đang mở gần nhất của khách hàng đó
        $latestOpenOpportunity = Opportunity::where('customer_id', $customer->id)
            ->where('status', 'open')
            ->where('is_closed', false)
            ->latest('updated_at')
            ->first();

        return DB::transaction(function () use ($validated, $currentUser, $customer, $resultLabels, $latestOpenOpportunity) {
            $resultText = $resultLabels[$validated['call_result']] ?? $validated['call_result'];
            $callbackTime = !empty($validated['callback_at']) ? Carbon::parse($validated['callback_at']) : null;

            // 1. Tạo hoạt động cuộc gọi
            $activity = SalesActivity::create([
                'user_id' => $currentUser?->id ?: User::first()->id,
                'team_leader_id' => $currentUser?->team_leader_id,
                'customer_id' => $customer->id,
                'contact_id' => $validated['contact_id'] ?? null,
                'opportunity_id' => $latestOpenOpportunity?->id,
                'activity_type' => 'call',
                'title' => "Cuộc gọi nhanh: {$resultText}",
                'description' => $validated['note'] ?? 'Ghi nhanh kết quả cuộc gọi trên điện thoại',
                'result' => $resultText,
                'call_result' => $validated['call_result'],
                'callback_at' => $callbackTime,
                'duration_minutes' => $validated['call_result'] === 'connected' ? 3 : 1,
                'occurred_at' => now(),
            ]);

            // 2. Nếu có đặt lịch gọi lại, tự động tạo việc trong CalendarItem
            if ($callbackTime) {
                CalendarItem::create([
                    'title' => "Gọi lại cho {$customer->name} (Hẹn sau cuộc gọi)",
                    'item_type' => 'task',
                    'priority' => 'high',
                    'assigned_user_id' => $currentUser?->id ?: User::first()->id,
                    'customer_id' => $customer->id,
                    'opportunity_id' => $latestOpenOpportunity?->id,
                    'due_at' => $callbackTime,
                    'status' => 'scheduled',
                    'description' => "Hẹn gọi lại sau khi ghi nhận: {$resultText}. Ghi chú: " . ($validated['note'] ?? ''),
                ]);
            }

            // Cập nhật last_activity_at trên Opportunity
            if ($latestOpenOpportunity) {
                $latestOpenOpportunity->update(['last_activity_at' => now()]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Đã lưu nhanh kết quả cuộc gọi thành công!',
                'data' => [
                    'activity' => $activity,
                    'attached_to_opportunity' => $latestOpenOpportunity ? [
                        'id' => $latestOpenOpportunity->id,
                        'name' => $latestOpenOpportunity->name,
                        'stage' => $latestOpenOpportunity->stage,
                    ] : null,
                    'scheduled_callback' => $callbackTime ? $callbackTime->format('d/m/Y H:i') : null,
                ],
            ], 201);
        });
    }
}

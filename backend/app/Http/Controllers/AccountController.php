<?php

namespace App\Http\Controllers;

use App\Http\Requests\LockAccountRequest;
use App\Models\User;
use App\Services\AccountHandoverService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    public function __construct(
        private readonly AccountHandoverService $handoverService,
        private readonly ?AuditLogService $auditLogService = null
    ) {}

    public function index(): JsonResponse
    {
        $accounts = User::query()
            ->withCount(['customers', 'opportunities'])
            ->with(['roles', 'businessGroups'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $accounts]);
    }

    /**
     * Thêm tài khoản mới
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[A-Za-z])(?=.*\d)/'],
            'role' => ['required', 'string', 'in:admin,manager,staff'],
            'phone' => ['nullable', 'string', 'regex:/^(\+84|0)\d{9,10}$/'],
            'job_title' => ['nullable', 'string', 'max:150'],
        ], [
            'name.required' => 'Vui lòng nhập họ và tên.',
            'name.max' => 'Họ và tên không được vượt quá 255 ký tự.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.unique' => 'Địa chỉ email này đã tồn tại trong hệ thống.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có tối thiểu 8 ký tự.',
            'password.regex' => 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.',
            'role.required' => 'Vui lòng chọn vai trò.',
            'role.in' => 'Vai trò không hợp lệ (admin, manager, staff).',
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).',
            'job_title.max' => 'Chức danh không được vượt quá 150 ký tự.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'status' => 'active',
        ]);

        $defaultRole = \App\Models\Role::where('name', $validated['role'])->first();
        if ($defaultRole) {
            $user->roles()->sync([$defaultRole->id]);
        }

        $admin = $request->attributes->get('current_user');
        if ($admin && $this->auditLogService) {
            try {
                $this->auditLogService->logChange(
                    $admin->id,
                    'created',
                    'User',
                    $user->id,
                    'account',
                    null,
                    "Tạo tài khoản: {$user->email} ({$user->role})"
                );
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Thêm tài khoản mới thành công!',
            'data' => $user,
        ], 201);
    }

    /**
     * Khóa tài khoản và bàn giao dữ liệu
     */
    public function lock(LockAccountRequest $request, User $user): JsonResponse
    {
        $admin = $request->attributes->get('current_user');

        if ($admin->is($user)) {
            return response()->json(['message' => 'Không thể tự khóa tài khoản đang đăng nhập.'], 422);
        }

        $target = User::findOrFail($request->integer('replacement_user_id'));
        $reason = $request->input('reason');
        $result = $this->handoverService->lockAndHandover($user, $target, $admin, $reason);

        if ($admin && $this->auditLogService) {
            try {
                $this->auditLogService->logChange(
                    $admin->id,
                    'updated',
                    'User',
                    $user->id,
                    'locked_at',
                    'active',
                    $reason ? "locked ({$reason})" : 'locked'
                );
            } catch (\Throwable) {}
        }

        return response()->json([
            'message' => 'Khóa tài khoản và bàn giao dữ liệu thành công.',
            'data' => $result,
        ]);
    }

    /**
     * Mở khóa tài khoản đã bị khóa
     */
    public function unlock(Request $request, User $user): JsonResponse
    {
        $user->locked_at = null;
        $user->locked_until = null;
        $user->lock_reason = null;
        $user->failed_login_attempts = 0;
        $user->save();

        $admin = $request->attributes->get('current_user');
        if ($admin && $this->auditLogService) {
            try {
                $this->auditLogService->logChange(
                    $admin->id,
                    'updated',
                    'User',
                    $user->id,
                    'locked_at',
                    'locked',
                    'unlocked'
                );
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Mở khóa tài khoản thành công! Người dùng có thể đăng nhập bình thường.',
            'data' => $user,
        ]);
    }

    /**
     * Phân quyền vai trò người dùng
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,manager,staff'],
        ], [
            'role.required' => 'Vui lòng chọn vai trò.',
            'role.in' => 'Vai trò không hợp lệ (admin, manager, staff).',
        ]);

        $admin = $request->attributes->get('current_user');
        if ($admin && $admin->is($user) && $validated['role'] !== 'admin') {
            return response()->json(['message' => 'Không thể tự thu hồi quyền quản trị viên của chính mình.'], 422);
        }

        $oldRole = $user->role;
        $user->role = $validated['role'];
        $user->save();

        if ($admin && $this->auditLogService) {
            try {
                $this->auditLogService->logChange(
                    $admin->id,
                    'updated',
                    'User',
                    $user->id,
                    'role',
                    $oldRole,
                    $user->role
                );
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật vai trò người dùng thành '{$user->role}'.",
            'data' => $user,
        ]);
    }

    /**
     * Xóa một tài khoản người dùng
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $admin = $request->attributes->get('current_user');

        if ($admin && (int) $admin->id === (int) $user->id) {
            return response()->json(['message' => 'Không thể tự xóa tài khoản của chính bạn.'], 422);
        }

        $customersCount = $user->customers()->count();
        $oppsCount = $user->opportunities()->count();
        if ($customersCount > 0 || $oppsCount > 0) {
            return response()->json([
                'message' => "Không thể xóa tài khoản '{$user->name}' do đang phụ trách {$customersCount} khách hàng và {$oppsCount} cơ hội. Vui lòng bàn giao dữ liệu trước khi xóa.",
            ], 422);
        }

        DB::transaction(function () use ($user, $admin) {
            $user->roles()->detach();
            $user->businessGroups()->detach();

            if (Schema::hasTable('permission_user')) {
                DB::table('permission_user')->where('user_id', $user->id)->delete();
            }
            if (Schema::hasTable('user_sessions')) {
                DB::table('user_sessions')->where('user_id', $user->id)->delete();
            }
            if (Schema::hasTable('api_tokens')) {
                DB::table('api_tokens')->where('user_id', $user->id)->delete();
            }
            if (Schema::hasTable('user_activation_tokens')) {
                DB::table('user_activation_tokens')->where('user_id', $user->id)->delete();
            }
            if (Schema::hasTable('password_reset_tokens')) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }
            if (Schema::hasTable('handover_logs')) {
                DB::table('handover_logs')
                    ->where('source_user_id', $user->id)
                    ->orWhere('target_user_id', $user->id)
                    ->orWhere('performed_by_user_id', $user->id)
                    ->delete();
            }

            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }

            if ($admin && $this->auditLogService) {
                try {
                    $this->auditLogService->logChange(
                        $admin->id,
                        'deleted',
                        'User',
                        $user->id,
                        'account',
                        "{$user->name} ({$user->email})",
                        null
                    );
                } catch (\Throwable) {}
            }

            $user->delete();
        });

        return response()->json([
            'success' => true,
            'message' => "Đã xóa tài khoản '{$user->name}' thành công!",
        ]);
    }

    /**
     * Xóa hàng loạt tài khoản người dùng
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ], [
            'ids.required' => 'Vui lòng chọn ít nhất một tài khoản để xóa.',
            'ids.min' => 'Vui lòng chọn ít nhất một tài khoản để xóa.',
        ]);

        $admin = $request->attributes->get('current_user');
        $ids = array_unique($validated['ids']);

        if ($admin) {
            $ids = array_values(array_filter($ids, fn ($id) => (int) $id !== (int) $admin->id));
        }

        if (empty($ids)) {
            return response()->json(['message' => 'Không có tài khoản hợp lệ để xóa (không thể tự xóa tài khoản của chính bạn).'], 422);
        }

        $users = User::whereIn('id', $ids)->withCount(['customers', 'opportunities'])->get();

        $deletableIds = [];
        $skipped = [];

        foreach ($users as $u) {
            if ($u->customers_count > 0 || $u->opportunities_count > 0) {
                $skipped[] = [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'reason' => "Đang phụ trách {$u->customers_count} khách hàng và {$u->opportunities_count} cơ hội",
                ];
            } else {
                $deletableIds[] = $u->id;
            }
        }

        if (empty($deletableIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa các tài khoản đã chọn vì tất cả đều đang phụ trách dữ liệu khách hàng hoặc cơ hội.',
                'skipped' => $skipped,
            ], 422);
        }

        DB::transaction(function () use ($deletableIds, $users, $admin) {
            foreach ($users as $u) {
                if (in_array($u->id, $deletableIds, true)) {
                    $u->roles()->detach();
                    $u->businessGroups()->detach();

                    if (Schema::hasTable('permission_user')) {
                        DB::table('permission_user')->where('user_id', $u->id)->delete();
                    }
                    if (Schema::hasTable('user_sessions')) {
                        DB::table('user_sessions')->where('user_id', $u->id)->delete();
                    }
                    if (Schema::hasTable('api_tokens')) {
                        DB::table('api_tokens')->where('user_id', $u->id)->delete();
                    }
                    if (Schema::hasTable('user_activation_tokens')) {
                        DB::table('user_activation_tokens')->where('user_id', $u->id)->delete();
                    }
                    if (Schema::hasTable('password_reset_tokens')) {
                        DB::table('password_reset_tokens')->where('email', $u->email)->delete();
                    }
                    if (Schema::hasTable('handover_logs')) {
                        DB::table('handover_logs')
                            ->where('source_user_id', $u->id)
                            ->orWhere('target_user_id', $u->id)
                            ->orWhere('performed_by_user_id', $u->id)
                            ->delete();
                    }

                    if ($u->avatar_path) {
                        Storage::disk('public')->delete($u->avatar_path);
                    }

                    if ($admin && $this->auditLogService) {
                        try {
                            $this->auditLogService->logChange(
                                $admin->id,
                                'deleted',
                                'User',
                                $u->id,
                                'account',
                                "{$u->name} ({$u->email})",
                                null
                            );
                        } catch (\Throwable) {}
                    }

                    $u->delete();
                }
            }
        });

        $deletedCount = count($deletableIds);
        $skippedCount = count($skipped);

        $msg = "Đã xóa thành công {$deletedCount} tài khoản.";
        if ($skippedCount > 0) {
            $msg .= " Bỏ qua {$skippedCount} tài khoản do đang phụ trách khách hàng hoặc cơ hội.";
        }

        return response()->json([
            'success' => true,
            'message' => $msg,
            'deleted_count' => $deletedCount,
            'skipped_count' => $skippedCount,
            'skipped' => $skipped,
        ]);
    }
}

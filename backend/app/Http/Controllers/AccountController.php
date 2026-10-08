<?php

namespace App\Http\Controllers;

use App\Http\Requests\LockAccountRequest;
use App\Models\User;
use App\Services\AccountHandoverService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        $result = $this->handoverService->lockAndHandover($user, $target, $admin);

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
}

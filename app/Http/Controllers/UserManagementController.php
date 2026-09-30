<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    /**
     * Khóa tài khoản và bàn giao toàn bộ dữ liệu
     * cho nhân viên kế nhiệm.
     */
    public function lock(Request $request, User $user)
    {
        // Chỉ Admin mới được thực hiện thao tác này
        if (! Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Bạn không có quyền thực hiện thao tác này.',
            ], 403);
        }

        // Không cho Admin tự khóa chính mình
        if (Auth::id() === $user->id) {
            return response()->json([
                'message' => 'Không thể tự khóa tài khoản đang đăng nhập.',
            ], 422);
        }

        $validated = $request->validate([
            'transfer_to_user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
        ]);

        $transferToUserId = (int) $validated['transfer_to_user_id'];

        // Không cho phép tự bàn giao cho chính tài khoản bị khóa
        if ($user->id === $transferToUserId) {
            return response()->json([
                'message' => 'Không thể bàn giao dữ liệu cho chính tài khoản bị khóa.',
            ], 422);
        }

        // Người nhận bàn giao phải đang hoạt động
        $successor = User::find($transferToUserId);

        if (! $successor || ! $successor->is_active) {
            return response()->json([
                'message' => 'Nhân viên kế nhiệm không tồn tại hoặc đã bị khóa.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($user, $successor) {

                // Khóa bản ghi nhân viên cần bàn giao
                $targetUser = User::whereKey($user->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Đếm dữ liệu trước khi bàn giao
                $customerCount = $targetUser->customers()->count();
                $opportunityCount = $targetUser->opportunities()->count();

                // Bàn giao toàn bộ Customer
                $targetUser->customers()->update([
                    'owner_id' => $successor->id,
                ]);

                // Bàn giao toàn bộ Opportunity
                $targetUser->opportunities()->update([
                    'owner_id' => $successor->id,
                ]);

                // Thu hồi toàn bộ session đang đăng nhập
                DB::table('sessions')
                    ->where('user_id', $targetUser->id)
                    ->delete();

                // Khóa tài khoản
                $targetUser->is_active = false;
                $targetUser->save();

                // Ghi lịch sử bàn giao
                $auditLog = AuditLog::create([
                    'actor_id' => Auth::id(),
                    'target_user_id' => $targetUser->id,
                    'transfer_to_user_id' => $successor->id,
                    'action' => 'lock_and_handover',
                    'details' => json_encode([
                        'customers_transferred' => $customerCount,
                        'opportunities_transferred' => $opportunityCount,
                    ], JSON_UNESCAPED_UNICODE),
                ]);

                return [
                    'target_user_id' => $targetUser->id,
                    'transfer_to_user_id' => $successor->id,
                    'customers_transferred' => $customerCount,
                    'opportunities_transferred' => $opportunityCount,
                    'audit_log_id' => $auditLog->id,
                ];
            });

            return response()->json([
                'message' => 'Khóa tài khoản và bàn giao dữ liệu thành công.',
                'data' => $result,
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Khóa tài khoản và bàn giao dữ liệu thất bại.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\LockAccountRequest;
use App\Models\User;
use App\Services\AccountHandoverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(private readonly AccountHandoverService $handoverService) {}

    public function index(): JsonResponse
    {
        $accounts = User::query()
            ->withCount(['customers', 'opportunities'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $accounts]);
    }

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
}

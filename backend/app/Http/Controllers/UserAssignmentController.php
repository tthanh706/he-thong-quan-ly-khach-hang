<?php

namespace App\Http\Controllers;

use App\Models\BusinessGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAssignmentController extends Controller
{
    public function index()
    {
        $users = User::with(['roles', 'businessGroups'])->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'users' => $users->map(fn (User $user) => $this->userPayload($user)),
        ]);
    }

    public function options()
    {
        return response()->json([
            'success' => true,
            'roles' => Role::orderBy('id')->get(['id', 'name', 'display_name']),
            'business_groups' => BusinessGroup::orderBy('name')->get(['id', 'name', 'parent_id']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'distinct', 'exists:roles,id'],
            'business_group_ids' => ['nullable', 'array'],
            'business_group_ids.*' => ['integer', 'distinct', 'exists:business_groups,id'],
        ]);

        $currentUser = $request->attributes->get('current_user');
        $adminRole = Role::where('name', 'admin')->first();
        $teamLeaderRole = Role::where('name', 'team_leader')->first();
        $requestedRoleIds = array_map('intval', $data['role_ids']);
        $requestedGroupIds = array_map('intval', $data['business_group_ids'] ?? []);

        // Không cho quản trị viên tự thu hồi vai trò admin của chính mình.
        if ($currentUser->id === $user->id && $adminRole) {
            $isCurrentlyAdmin = $user->roles()->where('roles.id', $adminRole->id)->exists();
            $keepsAdmin = in_array($adminRole->id, $requestedRoleIds, true);

            if ($isCurrentlyAdmin && !$keepsAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể tự thu hồi vai trò quản trị của chính mình.',
                ], 422);
            }
        }

        // Nếu có vai trò trưởng nhóm thì bắt buộc phải thuộc ít nhất một nhóm kinh doanh.
        if ($teamLeaderRole && in_array($teamLeaderRole->id, $requestedRoleIds, true) && count($requestedGroupIds) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Trưởng nhóm bắt buộc phải được gán ít nhất một nhóm kinh doanh.',
            ], 422);
        }

        DB::transaction(function () use ($user, $requestedRoleIds, $requestedGroupIds): void {
            $user->roles()->sync($requestedRoleIds);
            $user->businessGroups()->sync($requestedGroupIds);
        });

        $user->load(['roles', 'businessGroups']);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật vai trò và nhóm kinh doanh thành công.',
            'user' => $this->userPayload($user),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
            ])->values(),
            'business_groups' => $user->businessGroups->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])->values(),
        ];
    }
}

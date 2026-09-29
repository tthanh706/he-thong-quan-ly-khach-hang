<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;

class UserRoleController extends Controller 
{
    public function assignRoleAndTeam(Request $request, $userId) 
    {
        $targetUser = User::findOrFail($userId);
        $currentUser = auth()->user();

        $roleIds = $request->input('role_ids', []);
        $businessTeamId = $request->input('business_team_id');

        // Chặn tự thu hồi quyền admin của chính mình
        if ($currentUser->id === $targetUser->id) {
            $isAdminCurrent = $currentUser->roles()->where('slug', 'admin')->exists();
            $isStillAdmin = Role::whereIn('id', $roleIds)->where('slug', 'admin')->exists();
            if ($isAdminCurrent && !$isStillAdmin) {
                return response()->json(['message' => 'Bạn không thể tự thu hồi quyền quản trị của mình!'], 403);
            }
        }

        // Ràng buộc: Trưởng nhóm bắt buộc phải có nhóm kinh doanh
        $isTeamLeader = Role::whereIn('id', $roleIds)->where('slug', 'team-leader')->exists();
        if ($isTeamLeader && empty($businessTeamId)) {
            return response()->json(['message' => 'Trưởng nhóm bắt buộc phải được gán một nhóm kinh doanh!'], 422);
        }

        $targetUser->roles()->sync($roleIds);
        $targetUser->business_team_id = $businessTeamId;
        $targetUser->save();

        return response()->json(['message' => 'Cập nhật thành công!'], 200);
    }
}
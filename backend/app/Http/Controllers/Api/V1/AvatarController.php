<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UploadAvatarRequest;
use App\Http\Resources\UserProfileResource;
use App\Services\AvatarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S2-03: Người dùng tải lên ảnh đại diện (Avatar) hiển thị trên hệ thống.
 */
class AvatarController extends Controller
{
    public function __construct(private readonly AvatarService $avatarService) {}

    /**
     * POST /api/v1/profile/avatar (multipart/form-data, field "avatar")
     */
    public function store(UploadAvatarRequest $request): JsonResponse
    {
        $user = $this->avatarService->upload($request->attributes->get('current_user'), $request->file('avatar'));

        return (new UserProfileResource($user))
            ->additional(['success' => true, 'message' => 'Cập nhật ảnh đại diện thành công.'])
            ->response();
    }

    /**
     * DELETE /api/v1/profile/avatar
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $this->avatarService->remove($request->attributes->get('current_user'));

        return (new UserProfileResource($user))
            ->additional(['success' => true, 'message' => 'Đã gỡ ảnh đại diện.'])
            ->response();
    }
}

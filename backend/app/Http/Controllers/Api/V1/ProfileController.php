<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserProfileResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S2-02: Người dùng xem và cập nhật hồ sơ cá nhân (Profile & Chữ ký Email).
 * Người dùng luôn được xác định từ phiên đăng nhập, không nhận user_id từ client.
 */
class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profileService) {}

    /**
     * GET /api/v1/profile
     */
    public function show(Request $request): JsonResponse
    {
        return (new UserProfileResource($request->attributes->get('current_user')))
            ->additional(['success' => true])
            ->response();
    }

    /**
     * PATCH /api/v1/profile
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profileService->update($request->attributes->get('current_user'), $request->validated());

        return (new UserProfileResource($user))
            ->additional(['success' => true, 'message' => 'Cập nhật hồ sơ thành công.'])
            ->response();
    }
}

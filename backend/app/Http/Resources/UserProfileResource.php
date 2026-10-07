<?php

namespace App\Http\Resources;

use App\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Hồ sơ cá nhân của người dùng đang đăng nhập (S2-02, S2-03).
 *
 * @mixin User
 */
class UserProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => UserRoleEnum::tryFrom((string) $this->role)?->label() ?? (string) $this->role,
            'phone' => $this->phone,
            'job_title' => $this->job_title,
            'email_signature' => $this->email_signature,
            'avatar_url' => $this->avatar_url,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

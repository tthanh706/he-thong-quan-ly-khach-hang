<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;

/**
 * S2-02: Xem và cập nhật hồ sơ cá nhân (Profile & Chữ ký Email).
 */
class ProfileService
{
    private const EDITABLE_FIELDS = ['name', 'phone', 'job_title', 'email_signature'];

    /**
     * @param  array<string, mixed>  $data  Dữ liệu đã được validate bởi UpdateProfileRequest
     */
    public function update(User $user, array $data): User
    {
        $attributes = Arr::only($data, self::EDITABLE_FIELDS);

        if (array_key_exists('email_signature', $attributes) && $attributes['email_signature'] !== null) {
            $attributes['email_signature'] = $this->normalizeSignature((string) $attributes['email_signature']);
        }

        $user->fill($attributes)->save();

        return $user->refresh();
    }

    /**
     * Chuẩn hóa xuống dòng và loại bỏ khoảng trắng thừa cuối mỗi dòng.
     */
    private function normalizeSignature(string $signature): ?string
    {
        $lines = preg_split('/\r\n|\r|\n/', $signature) ?: [];
        $normalized = trim(implode("\n", array_map('rtrim', $lines)));

        return $normalized === '' ? null : $normalized;
    }
}

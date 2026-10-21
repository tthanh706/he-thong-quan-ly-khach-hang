<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * S2-03: Tải lên / gỡ ảnh đại diện người dùng.
 * File ảnh lưu trên disk "public" (storage/app/public/avatars/{user_id}), DB chỉ lưu đường dẫn.
 */
class AvatarService
{
    public const DISK = 'public';

    private const DIRECTORY = 'avatars';

    public function upload(User $user, UploadedFile $file): User
    {
        $previousPath = $user->avatar_path;

        // extension() đoán theo nội dung file (MIME), không tin tên file client gửi lên.
        $fileName = Str::uuid()->toString().'.'.$file->extension();
        $path = $file->storeAs(self::DIRECTORY.'/'.$user->id, $fileName, self::DISK);

        if ($path === false) {
            throw new RuntimeException('Không thể lưu ảnh đại diện.');
        }

        $user->forceFill(['avatar_path' => $path])->save();
        $this->deleteFile($previousPath);

        return $user->refresh();
    }

    public function remove(User $user): User
    {
        $this->deleteFile($user->avatar_path);
        $user->forceFill(['avatar_path' => null])->save();

        return $user->refresh();
    }

    private function deleteFile(?string $path): void
    {
        if ($path !== null && $path !== '' && Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }
}

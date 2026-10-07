<?php

namespace App\Enums;

use Illuminate\Support\Str;

/**
 * Vai trò của người dùng trong hệ thống CRM.
 */
enum UserRoleEnum: string
{
    case ADMIN = 'admin';
    case MANAGER = 'manager';
    case STAFF = 'staff';

    /**
     * Các nhãn (đã bỏ dấu, viết thường) được chấp nhận khi nhập dữ liệu từ file.
     */
    private const ALIASES = [
        'admin' => self::ADMIN,
        'quan_tri' => self::ADMIN,
        'quan_tri_vien' => self::ADMIN,
        'manager' => self::MANAGER,
        'quan_ly' => self::MANAGER,
        'truong_nhom' => self::MANAGER,
        'staff' => self::STAFF,
        'sales' => self::STAFF,
        'nhan_vien' => self::STAFF,
        'nhan_vien_kinh_doanh' => self::STAFF,
    ];

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Chuyển giá trị nhập tự do (VD: "Quản lý", "STAFF") về enum tương ứng.
     */
    public static function fromInput(?string $input): ?self
    {
        $normalized = Str::of((string) $input)->ascii()->lower()->trim()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->value();

        return self::tryFrom($normalized) ?? (self::ALIASES[$normalized] ?? null);
    }

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Quản trị viên',
            self::MANAGER => 'Quản lý',
            self::STAFF => 'Nhân viên kinh doanh',
        };
    }
}

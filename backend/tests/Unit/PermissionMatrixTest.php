<?php

namespace Tests\Unit;

use App\Enums\DataScope;
use App\Enums\Role;
use App\Support\PermissionMatrix;
use PHPUnit\Framework\TestCase;

class PermissionMatrixTest extends TestCase
{
    public function test_nhan_vien_khong_duoc_xoa(): void
    {
        $this->assertTrue(PermissionMatrix::allows(Role::EMPLOYEE, 'view'));
        $this->assertTrue(PermissionMatrix::allows(Role::EMPLOYEE, 'edit'));
        $this->assertFalse(PermissionMatrix::allows(Role::EMPLOYEE, 'delete'));
        $this->assertTrue(PermissionMatrix::allows(Role::TEAM_LEAD, 'delete'));
        $this->assertTrue(PermissionMatrix::allows(Role::DIRECTOR, 'delete'));
    }

    public function test_pham_vi_mac_dinh_theo_vai_tro(): void
    {
        $this->assertSame(DataScope::OWN, PermissionMatrix::defaultScope(Role::EMPLOYEE));
        $this->assertSame(DataScope::TEAM, PermissionMatrix::defaultScope(Role::TEAM_LEAD));
        $this->assertSame(DataScope::ALL, PermissionMatrix::defaultScope(Role::DIRECTOR));
    }

    public function test_chong_nang_quyen_khi_xin_pham_vi_khong_duoc_phep(): void
    {
        // Nhan vien xin "team" -> bi ha ve "own"
        $this->assertSame(DataScope::OWN, PermissionMatrix::resolveScope(Role::EMPLOYEE, 'team'));
        $this->assertSame(DataScope::OWN, PermissionMatrix::resolveScope(Role::EMPLOYEE, 'all'));

        // Truong nhom xin "all" -> bi ha ve "team"
        $this->assertSame(DataScope::TEAM, PermissionMatrix::resolveScope(Role::TEAM_LEAD, 'all'));

        // Giam doc duoc chon ca ba
        $this->assertSame(DataScope::ALL, PermissionMatrix::resolveScope(Role::DIRECTOR, 'all'));
        $this->assertSame(DataScope::OWN, PermissionMatrix::resolveScope(Role::DIRECTOR, 'own'));

        // Gia tri la / khong hop le -> mac dinh
        $this->assertSame(DataScope::ALL, PermissionMatrix::resolveScope(Role::DIRECTOR, 'khong-hop-le'));
        $this->assertSame(DataScope::OWN, PermissionMatrix::resolveScope(Role::EMPLOYEE, null));
        $this->assertSame(DataScope::OWN, PermissionMatrix::resolveScope(Role::EMPLOYEE, 'auto'));
    }
}

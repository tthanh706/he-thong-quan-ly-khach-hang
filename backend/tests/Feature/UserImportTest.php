<?php

namespace Tests\Feature;

use App\Mail\ImportedUserWelcomeMail;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use ZipArchive;

/**
 * S2-01: Nhập danh sách người dùng hàng loạt từ file Excel.
 */
class UserImportTest extends TestCase
{
    use RefreshDatabase;

    private const IMPORT_URL = '/api/v1/users/import';

    private function makeUser(string $email, string $role = 'staff'): User
    {
        return User::create(['name' => $email, 'email' => $email, 'password' => Hash::make('password'), 'role' => $role]);
    }

    private function tokenFor(User $user): string
    {
        return UserSession::create([
            'user_id' => $user->id,
            'token' => hash('sha256', uniqid((string) $user->id, true)),
            'last_activity' => now(),
            'expires_at' => now()->addMinutes(30),
            'revoked' => false,
        ])->token;
    }

    private function csvFile(string $content, string $name = 'users.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "\xEF\xBB\xBF".$content);
    }

    private function sampleCsv(): string
    {
        return implode("\n", [
            'Họ tên,Email,Vai trò',
            'Nguyễn Văn An,an@company.com,staff',
            'Trần Thị Bình,BINH@company.com,Quản lý',
            'Lê Văn Cường,email-sai,staff',
            'Phạm Duy,existing@company.com,staff',
            'Hoàng Em,an@company.com,staff',
            'Vũ Giang,giang@company.com,giam_doc',
            ',,',
        ]);
    }

    public function test_admin_can_preview_import_without_creating_users(): void
    {
        $admin = $this->makeUser('admin@company.com', 'admin');
        $this->makeUser('existing@company.com');

        $response = $this->withToken($this->tokenFor($admin))
            ->post(self::IMPORT_URL, ['file' => $this->csvFile($this->sampleCsv()), 'dry_run' => '1'], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.dry_run', true)
            ->assertJsonPath('data.total_rows', 6)
            ->assertJsonPath('data.valid_rows', 2)
            ->assertJsonPath('data.invalid_rows', 4)
            ->assertJsonPath('data.created_rows', 0)
            ->assertJsonPath('data.rows.1.email', 'binh@company.com')
            ->assertJsonPath('data.rows.1.role', 'manager')
            ->assertJsonPath('data.rows.2.errors.0', 'Email không đúng định dạng.')
            ->assertJsonPath('data.rows.3.errors.0', 'Email đã tồn tại trong hệ thống.')
            ->assertJsonPath('data.rows.4.errors.0', 'Email bị trùng với dòng 2 trong file.')
            ->assertJsonPath('data.rows.5.status', 'invalid');

        $this->assertDatabaseMissing('users', ['email' => 'an@company.com']);
    }

    public function test_admin_can_import_valid_rows_and_skip_invalid_rows(): void
    {
        Mail::fake();
        $admin = $this->makeUser('admin@company.com', 'admin');
        $this->makeUser('existing@company.com');

        $response = $this->withToken($this->tokenFor($admin))
            ->post(self::IMPORT_URL, ['file' => $this->csvFile($this->sampleCsv())], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.created_rows', 2)
            ->assertJsonPath('data.rows.0.status', 'created');

        $created = User::where('email', 'an@company.com')->firstOrFail();
        $this->assertSame('staff', $created->role);
        $this->assertNotSame('', $created->password);
        $this->assertDatabaseHas('users', ['email' => 'binh@company.com', 'role' => 'manager']);
        $this->assertDatabaseMissing('users', ['email' => 'giang@company.com']);
        $this->assertSame(1, User::where('email', 'an@company.com')->count());

        Mail::assertSent(ImportedUserWelcomeMail::class, 2);
        Mail::assertSent(
            ImportedUserWelcomeMail::class,
            fn (ImportedUserWelcomeMail $mail): bool => $mail->user->is($created) && Hash::check($mail->temporaryPassword, $created->password),
        );
    }

    public function test_import_rejects_file_missing_required_columns(): void
    {
        $admin = $this->makeUser('admin@company.com', 'admin');

        $this->withToken($this->tokenFor($admin))
            ->post(self::IMPORT_URL, ['file' => $this->csvFile("Họ tên,Số điện thoại\nAn,0912345678")], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_import_rejects_unsupported_extension(): void
    {
        $admin = $this->makeUser('admin@company.com', 'admin');

        $this->withToken($this->tokenFor($admin))
            ->post(self::IMPORT_URL, ['file' => UploadedFile::fake()->create('users.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_non_admin_cannot_import_users(): void
    {
        $staff = $this->makeUser('staff@company.com');

        $this->withToken($this->tokenFor($staff))
            ->post(self::IMPORT_URL, ['file' => $this->csvFile($this->sampleCsv())], ['Accept' => 'application/json'])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'an@company.com']);
    }

    public function test_guest_cannot_import_users(): void
    {
        $this->post(self::IMPORT_URL, ['file' => $this->csvFile($this->sampleCsv())], ['Accept' => 'application/json'])
            ->assertUnauthorized();
    }

    public function test_admin_can_import_xlsx_file(): void
    {
        if (!class_exists(ZipArchive::class)) {
            $this->markTestSkipped('PHP extension zip chưa được bật.');
        }

        Mail::fake();
        $admin = $this->makeUser('admin@company.com', 'admin');

        $this->withToken($this->tokenFor($admin))
            ->post(self::IMPORT_URL, ['file' => $this->makeXlsx([
                ['Họ tên', 'Email', 'Vai trò'],
                ['Đỗ Hải', 'hai@company.com', 'admin'],
            ])], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.created_rows', 1);

        $this->assertDatabaseHas('users', ['email' => 'hai@company.com', 'role' => 'admin', 'name' => 'Đỗ Hải']);
    }

    public function test_admin_can_download_template(): void
    {
        $admin = $this->makeUser('admin@company.com', 'admin');

        $response = $this->withToken($this->tokenFor($admin))->get('/api/v1/users/import/template');

        $response->assertOk();
        $content = (string) $response->getContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Email', $content);
        $this->assertStringContainsString('Vai trò', $content);
        $this->assertStringContainsString('attachment;', (string) $response->headers->get('Content-Disposition'));
    }

    /**
     * Tạo file .xlsx tối thiểu (inline string) để kiểm thử bộ đọc Excel.
     *
     * @param  array<int, array<int, string>>  $rows
     */
    private function makeXlsx(array $rows): UploadedFile
    {
        $sheetRows = '';
        foreach ($rows as $rowIndex => $cells) {
            $rowNumber = $rowIndex + 1;
            $sheetRows .= "<row r=\"{$rowNumber}\">";
            foreach ($cells as $columnIndex => $value) {
                $reference = chr(65 + $columnIndex).$rowNumber;
                $sheetRows .= "<c r=\"{$reference}\" t=\"inlineStr\"><is><t>".htmlspecialchars($value).'</t></is></c>';
            }
            $sheetRows .= '</row>';
        }

        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Users" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'.$sheetRows.'</sheetData></worksheet>');
        $zip->close();

        return new UploadedFile($path, 'users.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }
}

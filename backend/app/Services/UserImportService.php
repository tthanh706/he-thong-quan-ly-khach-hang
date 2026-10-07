<?php

namespace App\Services;

use App\Enums\UserRoleEnum;
use App\Mail\ImportedUserWelcomeMail;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * S2-01: Nhập danh sách người dùng hàng loạt từ file Excel/CSV.
 *
 * Luồng xử lý: đọc file -> nhận diện cột tiêu đề -> validate từng dòng
 * (định dạng, trùng trong file, trùng trong DB) -> (nếu không phải chạy thử)
 * tạo tài khoản cho các dòng hợp lệ trong một transaction -> gửi email mật khẩu tạm.
 */
class UserImportService
{
    public const MAX_ROWS = 500;

    public const ROW_STATUS_VALID = 'valid';

    public const ROW_STATUS_INVALID = 'invalid';

    public const ROW_STATUS_CREATED = 'created';

    /**
     * Tên cột chuẩn => các tiêu đề được chấp nhận (đã bỏ dấu, snake_case).
     */
    private const HEADER_ALIASES = [
        'name' => ['name', 'full_name', 'ho_ten', 'ho_va_ten', 'ten', 'ten_nhan_vien'],
        'email' => ['email', 'e_mail', 'dia_chi_email', 'thu_dien_tu'],
        'role' => ['role', 'vai_tro', 'quyen', 'chuc_vu'],
    ];

    private const REQUIRED_COLUMNS = ['name', 'email'];

    private const COLUMN_LABELS = ['name' => 'Họ tên', 'email' => 'Email', 'role' => 'Vai trò'];

    public function __construct(private readonly SpreadsheetReaderService $spreadsheetReader) {}

    /**
     * @return array{
     *     dry_run: bool,
     *     file_name: string,
     *     total_rows: int,
     *     valid_rows: int,
     *     invalid_rows: int,
     *     created_rows: int,
     *     rows: array<int, array{row: int, name: string, email: string, role: string, status: string, errors: array<int, string>}>
     * }
     *
     * @throws ValidationException
     */
    public function import(UploadedFile $file, bool $dryRun, User $performedBy): array
    {
        $sheetRows = $this->spreadsheetReader->read($file);

        $headerRowNumber = array_key_first($sheetRows);
        if ($headerRowNumber === null) {
            throw ValidationException::withMessages(['file' => 'File không có dữ liệu.']);
        }

        $columnMap = $this->mapHeaderColumns($sheetRows[$headerRowNumber]);
        unset($sheetRows[$headerRowNumber]);

        $dataRows = array_filter($sheetRows, fn (array $cells): bool => $this->hasContent($cells));
        $this->assertRowCount(count($dataRows));

        $rows = $this->validateRows($dataRows, $columnMap);

        if (!$dryRun) {
            $rows = $this->createUsers($rows, $performedBy);
        }

        return $this->buildSummary($rows, $dryRun, $file->getClientOriginalName());
    }

    /**
     * Nội dung file mẫu (CSV UTF-8 có BOM để Excel hiển thị đúng tiếng Việt).
     */
    public function buildTemplateCsv(): string
    {
        $lines = [
            ['Họ tên', 'Email', 'Vai trò'],
            ['Nguyễn Văn An', 'an.nguyen@company.com', UserRoleEnum::STAFF->value],
            ['Trần Thị Bình', 'binh.tran@company.com', UserRoleEnum::MANAGER->value],
        ];

        $handle = fopen('php://temp', 'r+');
        foreach ($lines as $line) {
            fputcsv($handle, $line, ',', '"', '');
        }
        rewind($handle);
        $csv = (string) stream_get_contents($handle);
        fclose($handle);

        return "\xEF\xBB\xBF".$csv;
    }

    /**
     * @param  array<int, string>  $headerCells
     * @return array<string, int> Tên cột chuẩn => chỉ số cột trong file
     *
     * @throws ValidationException
     */
    private function mapHeaderColumns(array $headerCells): array
    {
        $columnMap = [];

        foreach ($headerCells as $index => $header) {
            $normalized = $this->normalizeHeader($header);

            foreach (self::HEADER_ALIASES as $column => $aliases) {
                if (!isset($columnMap[$column]) && in_array($normalized, $aliases, true)) {
                    $columnMap[$column] = $index;
                }
            }
        }

        $missingColumns = array_diff(self::REQUIRED_COLUMNS, array_keys($columnMap));
        if ($missingColumns !== []) {
            $labels = array_map(fn (string $column): string => self::COLUMN_LABELS[$column], $missingColumns);

            throw ValidationException::withMessages([
                'file' => 'File thiếu cột bắt buộc: '.implode(', ', $labels).'. Vui lòng sử dụng file mẫu.',
            ]);
        }

        return $columnMap;
    }

    /**
     * @param  array<int, array<int, string>>  $dataRows
     * @param  array<string, int>  $columnMap
     * @return array<int, array{row: int, name: string, email: string, role: string, status: string, errors: array<int, string>}>
     */
    private function validateRows(array $dataRows, array $columnMap): array
    {
        $records = [];
        foreach ($dataRows as $rowNumber => $cells) {
            $records[$rowNumber] = [
                'name' => $this->cell($cells, $columnMap, 'name'),
                'email' => Str::lower($this->cell($cells, $columnMap, 'email')),
                'role_input' => $this->cell($cells, $columnMap, 'role'),
            ];
        }

        $existingEmails = User::query()
            ->whereIn('email', array_filter(array_column($records, 'email')))
            ->pluck('email')
            ->map(fn (string $email): string => Str::lower($email))
            ->flip()
            ->all();

        $seenEmails = [];
        $rows = [];

        foreach ($records as $rowNumber => $record) {
            $role = $record['role_input'] === '' ? UserRoleEnum::STAFF : UserRoleEnum::fromInput($record['role_input']);
            $errors = $this->validateRecord($record, $role);

            if ($record['email'] !== '') {
                if (isset($existingEmails[$record['email']])) {
                    $errors[] = 'Email đã tồn tại trong hệ thống.';
                } elseif (isset($seenEmails[$record['email']])) {
                    $errors[] = "Email bị trùng với dòng {$seenEmails[$record['email']]} trong file.";
                } else {
                    $seenEmails[$record['email']] = $rowNumber;
                }
            }

            $rows[] = [
                'row' => $rowNumber,
                'name' => $record['name'],
                'email' => $record['email'],
                'role' => $role?->value ?? $record['role_input'],
                'status' => $errors === [] ? self::ROW_STATUS_VALID : self::ROW_STATUS_INVALID,
                'errors' => $errors,
            ];
        }

        return $rows;
    }

    /**
     * @param  array{name: string, email: string, role_input: string}  $record
     * @return array<int, string>
     */
    private function validateRecord(array $record, ?UserRoleEnum $role): array
    {
        $validator = Validator::make($record, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255'],
        ], [
            'name.required' => 'Thiếu họ tên.',
            'name.max' => 'Họ tên không được vượt quá 255 ký tự.',
            'email.required' => 'Thiếu email.',
            'email.email' => 'Email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 255 ký tự.',
        ]);

        $errors = $validator->errors()->all();

        if ($role === null) {
            $errors[] = 'Vai trò không hợp lệ (chấp nhận: '.implode(', ', UserRoleEnum::values()).').';
        }

        return $errors;
    }

    /**
     * @param  array<int, array{row: int, name: string, email: string, role: string, status: string, errors: array<int, string>}>  $rows
     * @return array<int, array{row: int, name: string, email: string, role: string, status: string, errors: array<int, string>}>
     */
    private function createUsers(array $rows, User $performedBy): array
    {
        $credentials = [];

        DB::transaction(function () use (&$rows, &$credentials): void {
            foreach ($rows as $index => $row) {
                if ($row['status'] !== self::ROW_STATUS_VALID) {
                    continue;
                }

                $temporaryPassword = $this->generateTemporaryPassword();
                $user = User::create([
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'role' => $row['role'],
                    'password' => Hash::make($temporaryPassword),
                ]);

                $rows[$index]['status'] = self::ROW_STATUS_CREATED;
                $credentials[] = [$user, $temporaryPassword];
            }
        });

        foreach ($credentials as [$user, $temporaryPassword]) {
            $this->sendWelcomeMail($user, $temporaryPassword);
        }

        Log::info('Nhập người dùng hàng loạt hoàn tất.', [
            'performed_by_user_id' => $performedBy->id,
            'created_count' => count($credentials),
        ]);

        return $rows;
    }

    private function sendWelcomeMail(User $user, string $temporaryPassword): void
    {
        try {
            Mail::to($user->email)->send(new ImportedUserWelcomeMail($user, $temporaryPassword));
        } catch (Throwable $exception) {
            // Không ghi email/mật khẩu vào log (Convention mục 8).
            Log::warning('Không gửi được email chào mừng cho người dùng được nhập.', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * @param  array<int, array{row: int, name: string, email: string, role: string, status: string, errors: array<int, string>}>  $rows
     */
    private function buildSummary(array $rows, bool $dryRun, string $fileName): array
    {
        $countByStatus = array_count_values(array_column($rows, 'status'));
        $invalidRows = $countByStatus[self::ROW_STATUS_INVALID] ?? 0;

        return [
            'dry_run' => $dryRun,
            'file_name' => $fileName,
            'total_rows' => count($rows),
            'valid_rows' => count($rows) - $invalidRows,
            'invalid_rows' => $invalidRows,
            'created_rows' => $countByStatus[self::ROW_STATUS_CREATED] ?? 0,
            'rows' => $rows,
        ];
    }

    private function assertRowCount(int $rowCount): void
    {
        if ($rowCount === 0) {
            throw ValidationException::withMessages(['file' => 'File không có dòng dữ liệu nào ngoài dòng tiêu đề.']);
        }

        if ($rowCount > self::MAX_ROWS) {
            throw ValidationException::withMessages([
                'file' => 'Mỗi lần chỉ được nhập tối đa '.self::MAX_ROWS." người dùng (file hiện có {$rowCount} dòng).",
            ]);
        }
    }

    /**
     * @param  array<int, string>  $cells
     * @param  array<string, int>  $columnMap
     */
    private function cell(array $cells, array $columnMap, string $column): string
    {
        if (!isset($columnMap[$column])) {
            return '';
        }

        return trim((string) ($cells[$columnMap[$column]] ?? ''));
    }

    /**
     * @param  array<int, string>  $cells
     */
    private function hasContent(array $cells): bool
    {
        foreach ($cells as $value) {
            if (trim((string) $value) !== '') {
                return true;
            }
        }

        return false;
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)->ascii()->lower()->trim()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->value();
    }

    private function generateTemporaryPassword(): string
    {
        return 'Tmp'.Str::upper(Str::random(4)).random_int(1000, 9999).'a1';
    }
}

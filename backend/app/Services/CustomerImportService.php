<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomerImportService
{
    public function __construct(
        private readonly SpreadsheetReaderService $spreadsheetReader
    ) {}

    /**
     * Tải file mẫu CSV / Excel
     */
    public function downloadTemplate(): string
    {
        $tempPath = storage_path('app/temp/customer_import_template_' . Str::random(8) . '.csv');
        if (!is_dir(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }

        $csvContent = "\xEF\xBB\xBF"
            . "Mã KH,Tên khách hàng,Số điện thoại,Email,Mã số thuế,Địa chỉ\n"
            . "KH001,Nguyễn Văn A,0901234567,a@gmail.com,0123456789,Hà Nội\n"
            . "KH002,Công ty ABC,0912345678,contact@abc.com,9876543210,TP.HCM\n";

        file_put_contents($tempPath, $csvContent);

        return $tempPath;
    }

    /**
     * Parse & validate file Excel / CSV → trả về preview
     */
    public function preview(UploadedFile $file, User $user): array
    {
        // Đọc dữ liệu qua SpreadsheetReaderService hỗ trợ cả xlsx và csv
        $rows = $this->spreadsheetReader->read($file);

        // Bỏ dòng tiêu đề (dòng 1)
        $header = array_shift($rows) ?? [];

        $preview = [];
        $validCount = 0;
        $errorCount = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = is_numeric($index) ? $index : count($preview) + 2;

            $code = trim((string) ($row[0] ?? $row['A'] ?? ''));
            $name = trim((string) ($row[1] ?? $row['B'] ?? ''));
            $phone = trim((string) ($row[2] ?? $row['C'] ?? ''));
            $email = trim((string) ($row[3] ?? $row['D'] ?? ''));
            $taxCode = trim((string) ($row[4] ?? $row['E'] ?? ''));
            $address = trim((string) ($row[5] ?? $row['F'] ?? ''));

            // Bỏ dòng trống
            if ($code === '' && $name === '') {
                continue;
            }

            $errors = [];

            if ($code === '') {
                $errors[] = 'Mã KH bắt buộc';
            } elseif (Customer::where('code', $code)->exists()) {
                $errors[] = 'Mã KH đã tồn tại';
            }

            if ($name === '') {
                $errors[] = 'Tên khách hàng bắt buộc';
            }

            if ($phone !== '' && !preg_match('/^(0|\+84)[0-9]{9,10}$/', $phone)) {
                $errors[] = 'Sai định dạng SĐT';
            }

            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Email không hợp lệ';
            }

            $status = empty($errors) ? 'Hợp lệ' : 'Lỗi dữ liệu';

            if ($status === 'Hợp lệ') {
                $validCount++;
            } else {
                $errorCount++;
            }

            $preview[] = [
                'row' => $rowNumber,
                'code' => $code,
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'tax_code' => $taxCode,
                'address' => $address,
                'status' => $status,
                'errors' => $errors,
            ];
        }

        // Lưu file tạm để confirm sau nếu cần
        $storedPath = $file->storeAs(
            'imports/' . $user->id,
            'preview_' . time() . '_' . $file->getClientOriginalName(),
            'local'
        );

        return [
            'file_path' => $storedPath,
            'file_name' => $file->getClientOriginalName(),
            'total_rows' => count($preview),
            'valid_count' => $validCount,
            'error_count' => $errorCount,
            'rows' => $preview,
        ];
    }

    /**
     * Xác nhận lưu các dòng hợp lệ vào DB
     */
    public function confirm(array $rows, User $user): array
    {
        $success = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($rows, $user, &$success, &$failed, &$errors) {
            foreach ($rows as $index => $row) {
                try {
                    if (empty($row['code']) || empty($row['name'])) {
                        $failed++;
                        $errors[] = [
                            'row' => $index + 1,
                            'message' => 'Thiếu mã hoặc tên khách hàng',
                        ];
                        continue;
                    }

                    if (Customer::where('code', $row['code'])->exists()) {
                        $failed++;
                        $errors[] = [
                            'row' => $index + 1,
                            'message' => "Mã KH {$row['code']} đã tồn tại",
                        ];
                        continue;
                    }

                    Customer::create([
                        'code' => $row['code'],
                        'name' => $row['name'],
                        'phone' => $row['phone'] ?? null,
                        'email' => $row['email'] ?? null,
                        'tax_code' => $row['tax_code'] ?? null,
                        'address' => $row['address'] ?? null,
                        'owner_id' => $user->id,
                        'is_active' => true,
                        'source' => 'EXCEL_IMPORT',
                    ]);

                    $success++;
                } catch (\Throwable $e) {
                    $failed++;
                    $errors[] = [
                        'row' => $index + 1,
                        'message' => $e->getMessage(),
                    ];
                }
            }
        });

        return [
            'success_count' => $success,
            'error_count' => $failed,
            'errors' => $errors,
        ];
    }
}

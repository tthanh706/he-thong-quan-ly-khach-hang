<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CustomerImportService
{
    public function parsePreview(UploadedFile $file): array
    {
        $rows = [];
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $index = 1;
        while (($data = fgetcsv($handle)) !== false) {
            $rows[] = [
                'row_index' => $index++,
                'name' => $data[0] ?? '',
                'phone' => $data[1] ?? '',
                'email' => $data[2] ?? '',
                'address' => $data[3] ?? '',
                'is_valid' => !empty($data[0]),
            ];
        }
        fclose($handle);

        return [
            'total_rows' => count($rows),
            'valid_rows' => count(array_filter($rows, fn($r) => $r['is_valid'])),
            'preview_data' => array_slice($rows, 0, 50),
        ];
    }

    public function confirmImport(array $rows, int $importedBy): int
    {
        $count = 0;
        DB::transaction(function () use ($rows, &$count) {
            foreach ($rows as $item) {
                if (!empty($item['name'])) {
                    Customer::create([
                        'name' => $item['name'],
                        'phone' => $item['phone'] ?? null,
                        'email' => $item['email'] ?? null,
                        'address' => $item['address'] ?? null,
                    ]);
                    $count++;
                }
            }
        });

        return $count;
    }
}

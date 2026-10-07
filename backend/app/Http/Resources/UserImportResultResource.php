<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Kết quả nhập người dùng hàng loạt (S2-01).
 *
 * @property-read array<string, mixed> $resource
 */
class UserImportResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'dry_run' => (bool) $this->resource['dry_run'],
            'file_name' => (string) $this->resource['file_name'],
            'total_rows' => (int) $this->resource['total_rows'],
            'valid_rows' => (int) $this->resource['valid_rows'],
            'invalid_rows' => (int) $this->resource['invalid_rows'],
            'created_rows' => (int) $this->resource['created_rows'],
            'rows' => array_map(static fn (array $row): array => [
                'row' => (int) $row['row'],
                'name' => (string) $row['name'],
                'email' => (string) $row['email'],
                'role' => (string) $row['role'],
                'status' => (string) $row['status'],
                'errors' => array_values($row['errors']),
            ], $this->resource['rows']),
        ];
    }
}

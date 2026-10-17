<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportPreviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'row' => $this->resource['row'] ?? null,
            'code' => $this->resource['code'] ?? null,
            'name' => $this->resource['name'] ?? null,
            'phone' => $this->resource['phone'] ?? null,
            'email' => $this->resource['email'] ?? null,
            'tax_code' => $this->resource['tax_code'] ?? null,
            'address' => $this->resource['address'] ?? null,
            'status' => $this->resource['status'] ?? 'Lỗi dữ liệu', // Hợp lệ | Lỗi dữ liệu
            'errors' => $this->resource['errors'] ?? [],
        ];
    }
}

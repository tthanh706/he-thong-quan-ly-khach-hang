<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AuditLogService
{
    public function logChange(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $fieldName,
        mixed $oldValue,
        mixed $newValue
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'field_name' => $fieldName,
            'old_value' => $this->normalizeValue($oldValue),
            'new_value' => $this->normalizeValue($newValue),
        ]);
    }

    public function getAuditLogs(
        ?int $userId = null,
        ?string $entityType = null,
        ?string $fromDate = null,
        ?string $toDate = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = AuditLog::query()
            ->with('user')
            ->latest('created_at');

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        if ($entityType !== null) {
            $query->where('entity_type', $entityType);
        }

        if ($fromDate !== null) {
            $query->whereDate('created_at', '>=', $fromDate);
        }

        if ($toDate !== null) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        return $query->paginate($perPage);
    }

    private function normalizeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            return json_encode(
                $value,
                JSON_UNESCAPED_UNICODE
            );
        }

        return (string) $value;
    }
}
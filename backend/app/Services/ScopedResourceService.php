<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ScopedResourceService
{
    public function __construct(private DataScopeService $scope) {}

    public function list(string $modelClass, User $user, ?string $search = null)
    {
        $query = $modelClass::query()->with('owner:id,name');
        $this->scope->apply($query, $user);

        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->latest()->get()->map(fn ($item) => $this->format($item));
    }

    public function find(string $modelClass, User $user, int $id): Model
    {
        $record = $modelClass::with('owner:id,name')->findOrFail($id);
        abort_unless(
            $this->scope->canAccess($record, $user),
            403,
            'Bạn không có quyền truy cập bản ghi này vì nằm ngoài phạm vi dữ liệu được phép.'
        );
        return $record;
    }

    public function exportXls(string $modelClass, User $user, ?string $search, string $title)
    {
        $rows = $this->list($modelClass, $user, $search);
        $html = '<meta charset="UTF-8"><table border="1"><tr><th>ID</th><th>Tên</th><th>Trạng thái</th><th>Giá trị</th><th>Người phụ trách</th></tr>';
        foreach ($rows as $row) {
            $html .= '<tr><td>'.e($row['id']).'</td><td>'.e($row['name']).'</td><td>'.e($row['status'] ?? '').'</td><td>'.e((string)($row['value'] ?? '')).'</td><td>'.e($row['ownerName']).'</td></tr>';
        }
        $html .= '</table>';

        return response($html, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$title.'.xls"',
        ]);
    }

    public function format(Model $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'status' => $item->status,
            'value' => $item->value,
            'description' => $item->description,
            'owner_id' => $item->owner_id,
            'business_group_id' => $item->business_group_id,
            'ownerName' => $item->owner?->name,
        ];
    }
}

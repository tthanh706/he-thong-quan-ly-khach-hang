<?php

namespace App\Http\Controllers\Api;

use App\Enums\DataScope;
use App\Exceptions\AccessDenied;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Action;
use App\Support\PermissionMatrix;
use App\Support\ScopeResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\ValidationException;

/**
 * Lop co so cho 4 module (khach hang, co hoi, hoat dong, bao gia).
 *
 * Moi thao tac deu di qua cap RBAC (theo vai tro) + Data Scope (theo du lieu so huu);
 * controller khong duoc bo qua buoc loc pham vi.
 */
abstract class ScopedApiController extends Controller
{
    /** @var array<string, string> Ten hanh dong -> nhan tieng Viet khi bao loi */
    protected const ACTION_LABEL = [
        Action::VIEW => 'xem',
        Action::CREATE => 'tạo mới',
        Action::EDIT => 'chỉnh sửa',
        Action::DELETE => 'xoá',
        Action::EXPORT => 'xuất Excel',
    ];

    public function __construct(protected readonly ScopeResolver $scopeResolver) {}

    /** @return class-string<Model> */
    abstract protected function modelClass(): string;

    /** Ten module dung trong thong bao loi, vi du: customer */
    abstract protected function entityName(): string;

    /** Nhan tieng Viet cua module, vi du: Khach hang */
    abstract protected function entityLabel(): string;

    /** @return array<string, mixed> */
    abstract protected function rules(?int $id = null): array;

    /**
     * @return array<int, string> Cac cot duoc tim kiem nhanh qua ?q=
     */
    protected function searchable(): array
    {
        return [];
    }

    /**
     * @return array<int, string> Cac cot xuat ra file CSV
     */
    protected function exportColumns(): array
    {
        return ['id', 'created_at'];
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $scope = $this->currentScope($request);

        $this->authorizeAction($user, Action::VIEW);

        $base = $this->modelClass()::query();
        $totalAll = (clone $base)->count();

        $query = $this->scopeResolver->apply($base, $user, $scope);
        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);

        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $paginator = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => array_map([$this, 'transform'], $paginator->items()),
            'meta' => [
                'scope' => $scope->value,
                'scope_label' => $scope->label(),
                'total_visible' => $paginator->total(),
                'total_all' => $totalAll,
                'hidden_count' => $totalAll - $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, int|string $id): JsonResponse
    {
        $model = $this->findInScope($request, $id, Action::VIEW);

        return response()->json([
            'data' => $this->transform($model),
            'meta' => $this->meta($request),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAction($user, Action::CREATE);

        $data = $request->validate($this->rules());

        // So huu gan tu token, khong bao gio tin tu client
        $data['owner_id'] = $user->id;
        $data['team_id'] = $user->team_id;

        $modelClass = $this->modelClass();

        /** @var Model $model */
        $model = new $modelClass();
        $model->forceFill($data);
        $model->save();

        return response()->json([
            'data' => $this->transform($model->refresh()->load($this->withRelations())),
            'meta' => $this->meta($request),
        ], 201);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();

        $this->authorizeAction($user, Action::EDIT);

        $model = $this->findInScope($request, $id, Action::EDIT);

        // Chi kiem tra nhung truong client that su gui len (cap nhat mot phan)
        $rules = array_filter(
            $this->rules((int) $model->getKey()),
            static fn (string $field): bool => $request->has($field),
            ARRAY_FILTER_USE_KEY,
        );

        $data = $request->validate($rules);
        $model->fill($data);

        // So huu khong doi khi sua; tranh gian de lay quyet dinh ve pham vi
        $model->save();

        return response()->json([
            'data' => $this->transform($model->refresh()->load($this->withRelations())),
            'meta' => $this->meta($request),
        ]);
    }

    public function destroy(Request $request, int|string $id): Response
    {
        $user = $request->user();

        $this->authorizeAction($user, Action::DELETE);

        $model = $this->findInScope($request, $id, Action::DELETE);
        $model->delete();

        return response()->json([
            'message' => 'Đã xoá '.mb_strtolower($this->entityLabel()).' "'.$model->getKey().'".',
            'meta' => $this->meta($request),
        ]);
    }

    /** Xuat Excel (CSV tuong thich Excel) chi gom ban ghi trong pham vi. */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $scope = $this->currentScope($request);

        $this->authorizeAction($user, Action::EXPORT);

        $query = $this->scopeResolver->apply($this->modelClass()::query(), $user, $scope);
        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);

        $columns = $this->exportColumns();
        $rows = $query->orderBy('id')->get();

        $filename = $this->entityName().'-'.$scope->value.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($columns, $rows): void {
            $handle = fopen('php://output', 'wb');

            // BOM de Excel nhan dung tieng Viet
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns);

            foreach ($rows as $row) {
                $line = [];
                foreach ($columns as $column) {
                    $value = data_get($this->transform($row), $column);
                    $line[] = is_scalar($value) ? (string) $value : '';
                }
                fputcsv($handle, $line);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Tim ban ghi theo id va chan truy cap neu ngoai pham vi.
     */
    protected function findInScope(Request $request, int|string $id, string $action): Model
    {
        $user = $request->user();
        $scope = $this->currentScope($request);

        /** @var Model|null $model */
        $model = $this->modelClass()::query()
            ->with($this->withRelations())
            ->find($id);

        if ($model === null) {
            throw ValidationException::withMessages([
                'id' => 'Không tìm thấy '.mb_strtolower($this->entityLabel()).' với mã "'.$id.'".',
            ]);
        }

        if (! $this->scopeResolver->isRecordInScope($user, $scope, $model)) {
            throw AccessDenied::forRecord(
                entity: $this->entityName(),
                record: $model,
                user: $user,
                scope: $scope,
                action: self::ACTION_LABEL[$action] ?? $action,
                entityLabel: $this->entityLabel(),
                ownerName: $model->owner?->name ?? 'không rõ',
                teamName: $model->team?->name ?? 'không rõ',
                roleLabel: $user->role->label(),
            );
        }

        return $model;
    }

    /** Kiem tra quyen theo vai truoc khi chay phan loc du lieu. */
    protected function authorizeAction(User $user, string $action): void
    {
        if (! PermissionMatrix::allows($user->role, $action)) {
            throw AccessDenied::forAction(
                entity: $this->entityName(),
                entityLabel: $this->entityLabel(),
                action: $action,
                actionLabel: self::ACTION_LABEL[$action] ?? $action,
                user: $user,
            );
        }
    }

    protected function currentScope(Request $request): DataScope
    {
        $attribute = $request->attributes->get('scope');

        return $attribute instanceof DataScope
            ? $attribute
            : DataScope::from((string) ($attribute ?? PermissionMatrix::defaultScope($request->user()->role)->value));
    }

    protected function stampOwnership(Model $model, User $user): void
    {
        $model->setAttribute('owner_id', $user->id);
        $model->setAttribute('team_id', $user->team_id);
    }

    /** @return array<int, string> */
    protected function withRelations(): array
    {
        return ['owner', 'team'];
    }

    protected function applySearch(Builder $query, Request $request): void
    {
        $term = trim((string) $request->query('q', ''));

        $searchable = $this->searchable();

        if ($term === '' || $searchable === []) {
            return;
        }

        $query->where(function (Builder $inner) use ($term, $searchable): void {
            foreach ($searchable as $column) {
                $inner->orWhere($inner->getModel()->qualifyColumn($column), 'like', '%'.$term.'%');
            }
        });
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        foreach (['status', 'stage', 'type'] as $field) {
            $value = $request->query($field);

            if (is_string($value) && $value !== '') {
                $query->where($query->getModel()->qualifyColumn($field), $value);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function meta(Request $request): array
    {
        $scope = $this->currentScope($request);

        return [
            'scope' => $scope->value,
            'scope_label' => $scope->label(),
            'permissions' => $request->attributes->get('permissions'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function transform(Model $model): array
    {
        return [
            'id' => $model->getKey(),
            'owner_id' => $model->getAttribute('owner_id'),
            'team_id' => $model->getAttribute('team_id'),
            'owner_name' => $model->owner?->name,
            'team_name' => $model->team?->name,
            'created_at' => $model->created_at?->toIso8601String(),
            'updated_at' => $model->updated_at?->toIso8601String(),
        ];
    }
}

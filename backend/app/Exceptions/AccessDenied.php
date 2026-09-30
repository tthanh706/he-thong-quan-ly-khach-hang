<?php

namespace App\Exceptions;

use App\Enums\DataScope;
use App\Models\User;
use App\Support\PermissionMatrix;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Loi khi nguoi dung cham vao ban ghi ngoai pham vi du lieu hoac khong duoc phep thao tac.
 *
 * Tu tra ve 403 kem thong diep tieng Viet, giong het phan hien thi o front-end.
 */
class AccessDenied extends RuntimeException implements Responsable
{
    public function __construct(
        string $message,
        public readonly string $entity,
        public readonly int|string|null $recordId,
        public readonly DataScope $scope,
        public readonly string $action,
        public readonly ?User $user = null,
    ) {
        parent::__construct($message);
    }

    public function toResponse($request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'AccessDeniedError',
            'entity' => $this->entity,
            'record_id' => $this->recordId,
            'scope' => $this->scope->value,
            'scope_label' => $this->scope->label(),
            'action' => $this->action,
        ], 403);
    }

    /**
     * Sinh thong diep tieng Viet giong ban `buildAccessDeniedMessage` o front-end.
     */
    public static function forRecord(
        string $entity,
        object $record,
        User $user,
        DataScope $scope,
        string $action,
        string $entityLabel,
        string $ownerName,
        string $teamName,
        string $roleLabel,
    ): self {
        $recordId = $record->id ?? null;

        $why = match ($scope) {
            DataScope::OWN => 'Phạm vi hiện tại của bạn là "'.$scope->label().'" nên chỉ thấy các bản ghi bạn trực tiếp sở hữu.',
            DataScope::TEAM => 'Phạm vi hiện tại của bạn là "'.$scope->label().'" nên chỉ thấy dữ liệu của nhóm '.$teamName.'.',
            DataScope::ALL => 'Phạm vi hiện tại của bạn là "'.$scope->label().'" nên chỉ thấy dữ liệu bạn sở hữu.',
        };

        $message = implode(' ', [
            'Không có quyền thực hiện: '.$action.' '.mb_strtolower($entityLabel).' "'.$recordId.'".',
            $why,
            'Bản ghi này do '.$ownerName.' (nhóm '.$teamName.') sở hữu, nằm ngoài phạm vi dữ liệu của '.$roleLabel.' đang đăng nhập.',
            'Vui lòng liên hệ trưởng nhóm hoặc Giám đốc kinh doanh để được cấp quyền truy cập.',
        ]);

        return new self($message, $entity, $recordId, $scope, $action, $user);
    }

    /**
     * Loi khi vai tro khong duoc phep thao tac (VD: nhan vien khong duoc xoa ban ghi).
     */
    public static function forAction(
        string $entity,
        string $entityLabel,
        string $action,
        string $actionLabel,
        User $user,
    ): self {
        $message = implode(' ', [
            'Không có quyền thực hiện: '.$actionLabel.' '.mb_strtolower($entityLabel).'.',
            'Vai trò '.$user->role->label().' không được cấp quyền này trong ma trận phân quyền.',
            'Vui lòng liên hệ trưởng nhóm hoặc Giám đốc kinh doanh để được cấp quyền.',
        ]);

        return new self($message, $entity, null, PermissionMatrix::defaultScope($user->role), $action, $user);
    }
}

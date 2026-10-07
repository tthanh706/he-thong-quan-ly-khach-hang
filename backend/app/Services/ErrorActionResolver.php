<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * ErrorActionResolver
 *
 * Xác định "hành động gợi ý" hiển thị trên trang lỗi dùng chung
 * (SCRUM-91), giúp người dùng biết nên làm gì tiếp theo thay vì
 * chỉ thấy một trang trắng / thông báo lỗi khô khan.
 *
 * Ví dụ:
 *  - 401 (chưa đăng nhập)      -> gợi ý đăng nhập lại
 *  - 403 (không đủ quyền)      -> gợi ý quay lại trang trước / về Dashboard
 *  - 404 (không tồn tại)       -> gợi ý về trang chủ / tìm kiếm
 */
class ErrorActionResolver
{
    /**
     * @param int     $statusCode  Mã lỗi HTTP (401, 403, 404, 419, 500...)
     * @param Request $request     Request hiện tại, dùng để lấy "previous url"
     *
     * @return array{
     *   title: string,
     *   message: string,
     *   primary_action: array{label: string, url: string},
     *   secondary_action: ?array{label: string, url: string}
     * }
     */
    public function resolve(int $statusCode, Request $request): array
    {
        $previousUrl = url()->previous();
        $hasPrevious = $previousUrl && $previousUrl !== $request->fullUrl();

        return match ($statusCode) {
            401 => [
                'title'   => 'Bạn cần đăng nhập',
                'message' => 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để tiếp tục.',
                'primary_action'   => [
                    'label' => 'Đăng nhập lại',
                    'url'   => route('login', ['redirect' => $request->fullUrl()]),
                ],
                'secondary_action' => null,
            ],

            403 => [
                'title'   => 'Bạn không có quyền truy cập',
                'message' => 'Tài khoản của bạn không đủ quyền để xem nội dung này. Nếu đây là nhầm lẫn, hãy liên hệ quản trị viên.',
                'primary_action'   => $hasPrevious
                    ? ['label' => 'Quay lại trang trước', 'url' => $previousUrl]
                    : ['label' => 'Về trang chủ', 'url' => route('dashboard')],
                'secondary_action' => ['label' => 'Về Dashboard', 'url' => route('dashboard')],
            ],

            404 => [
                'title'   => 'Không tìm thấy trang',
                'message' => 'Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.',
                'primary_action'   => ['label' => 'Về trang chủ', 'url' => route('dashboard')],
                'secondary_action' => $hasPrevious
                    ? ['label' => 'Quay lại trang trước', 'url' => $previousUrl]
                    : null,
            ],

            419 => [
                'title'   => 'Phiên làm việc đã hết hạn',
                'message' => 'Trang đã hết hạn do không hoạt động trong thời gian dài. Vui lòng tải lại trang.',
                'primary_action'   => ['label' => 'Tải lại trang', 'url' => $request->fullUrl()],
                'secondary_action' => null,
            ],

            default => [
                'title'   => 'Đã có lỗi xảy ra',
                'message' => 'Hệ thống gặp sự cố. Vui lòng thử lại sau ít phút.',
                'primary_action'   => ['label' => 'Về trang chủ', 'url' => route('dashboard')],
                'secondary_action' => null,
            ],
        };
    }
}

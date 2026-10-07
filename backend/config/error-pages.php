<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cấu hình trang lỗi dùng chung (SCRUM-91)
    |--------------------------------------------------------------------------
    |
    | Định nghĩa: danh sách mã lỗi HTTP được xử lý, có thể ghi đè tiêu đề /
    | thông báo / hành động gợi ý theo môi trường (local, staging, production).
    |
    */

    /*
     * Danh sách HTTP status code sẽ được xử lý bởi Handler::render().
     * Các code không có trong danh sách này sẽ dùng hành vi mặc định của Laravel.
     */
    'handled_codes' => [401, 403, 404, 419, 500],

    /*
     * Cho phép hiển thị stack trace trong trang lỗi web (chỉ dùng local/debug).
     */
    'show_debug_info' => env('APP_DEBUG', false),

    /*
     * Ghi đè nội dung cho từng mã lỗi.
     * Nếu không set ở đây, ErrorActionResolver sẽ dùng giá trị mặc định.
     */
    'messages' => [
        401 => [
            'title'   => 'Bạn cần đăng nhập',
            'message' => 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để tiếp tục.',
        ],
        403 => [
            'title'   => 'Bạn không có quyền truy cập',
            'message' => 'Tài khoản của bạn không đủ quyền để xem nội dung này. Nếu đây là nhầm lẫn, hãy liên hệ quản trị viên.',
        ],
        404 => [
            'title'   => 'Không tìm thấy trang',
            'message' => 'Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.',
        ],
        419 => [
            'title'   => 'Phiên làm việc đã hết hạn',
            'message' => 'Trang đã hết hạn do không hoạt động trong thời gian dài. Vui lòng tải lại trang.',
        ],
        500 => [
            'title'   => 'Đã có lỗi xảy ra',
            'message' => 'Hệ thống gặp sự cố. Vui lòng thử lại sau ít phút.',
        ],
    ],

];

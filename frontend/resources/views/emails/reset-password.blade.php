<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yêu cầu đặt lại mật khẩu</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            color: #334155;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .email-wrapper {
            max-width: 580px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        .email-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .email-body {
            padding: 32px 24px;
        }
        .email-body p {
            margin-bottom: 20px;
            font-size: 15px;
        }
        .btn-wrapper {
            text-align: center;
            margin: 30px 0;
        }
        .btn-reset {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            padding: 14px 32px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .notice-box {
            background-color: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
            color: #64748b;
            margin-top: 24px;
        }
        .email-footer {
            background-color: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            font-size: 13px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
        }
        .break-link {
            word-break: break-all;
            color: #4f46e5;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1>{{ config('app.name', 'System') }}</h1>
        </div>

        <div class="email-body">
            <p>Xin chào <strong>{{ $user->name ?? $user->email }}</strong>,</p>
            <p>Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>

            <div class="btn-wrapper">
                <a href="{{ $url }}" class="btn-reset">Đặt Lại Mật Khẩu Ngay</a>
            </div>

            <div class="notice-box">
                Liên kết đặt lại mật khẩu này sẽ hết hạn sau <strong>{{ $count }} phút</strong>.<br>
                Nếu bạn không gửi yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này một cách an toàn.
            </div>

            <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
                Nếu nút trên không hoạt động, sao chép và dán liên kết sau vào trình duyệt web của bạn:<br>
                <a href="{{ $url }}" class="break-link">{{ $url }}</a>
            </p>
        </div>

        <div class="email-footer">
            &copy; {{ date('Y') }} {{ config('app.name') }}. Tất cả quyền được bảo lưu.
        </div>
    </div>
</body>
</html>

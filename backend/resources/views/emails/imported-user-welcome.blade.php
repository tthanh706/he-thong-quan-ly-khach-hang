<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Tài khoản CRM của bạn đã được tạo</title>
</head>
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7ef;border-radius:14px;">
        <tr>
            <td style="padding:28px 32px;">
                <p style="margin:0 0 6px;font-weight:700;letter-spacing:.04em;color:#7545d9;">CRM</p>
                <h1 style="margin:0 0 16px;font-size:22px;">Xin chào {{ $user->name }},</h1>
                <p style="line-height:1.6;">Quản trị viên đã tạo tài khoản CRM cho bạn. Thông tin đăng nhập:</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;background:#f4f0ff;border-radius:10px;width:100%;">
                    <tr><td style="padding:12px 16px;"><strong>Email:</strong> {{ $user->email }}</td></tr>
                    <tr><td style="padding:0 16px 12px;"><strong>Mật khẩu tạm:</strong> <code style="font-size:15px;">{{ $temporaryPassword }}</code></td></tr>
                </table>
                <p style="line-height:1.6;">Vui lòng đăng nhập và đổi mật khẩu ngay trong lần đăng nhập đầu tiên.</p>
                <p style="margin:24px 0;">
                    <a href="{{ $loginUrl }}" style="background:#7545d9;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:9px;font-weight:700;">Đăng nhập CRM</a>
                </p>
                <p style="color:#667085;font-size:13px;line-height:1.5;">Nếu bạn không mong đợi email này, vui lòng liên hệ quản trị viên hệ thống.</p>
            </td>
        </tr>
    </table>
</body>
</html>

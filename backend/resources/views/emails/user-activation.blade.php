<!doctype html><html><body style="font-family:Arial,sans-serif">
<h2>Xin chào {{ $user->name }},</h2>
<p>Tài khoản CRM của bạn vừa được tạo.</p>
<p><b>Email:</b> {{ $user->email }}</p>
<p><b>Mật khẩu tạm:</b> <code>{{ $tempPassword }}</code></p>
<p><a href="{{ $activationUrl }}">Kích hoạt tài khoản</a></p>
<p>Sau khi kích hoạt, vui lòng đăng nhập và đổi mật khẩu để đảm bảo an toàn.</p>
</body></html>

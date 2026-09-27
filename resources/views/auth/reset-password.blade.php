<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt Lại Mật Khẩu Mới</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2rem; max-width: 440px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .icon-header { width: 56px; height: 56px; background: rgba(14, 165, 233, 0.15); color: #0ea5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem; }
        h2 { text-align: center; font-size: 1.35rem; margin-bottom: 0.5rem; }
        p.subtitle { text-align: center; color: #94a3b8; font-size: 0.88rem; margin-bottom: 1.25rem; }
        .expiry-pill { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; padding: 0.5rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-align: center; margin-bottom: 1.25rem; }
        .alert-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 10px; padding: 0.85rem; font-size: 0.85rem; margin-bottom: 1.25rem; }
        .form-group { margin-bottom: 1.25rem; }
        label { display: block; font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
        input[type="email"], input[type="password"] { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 0.75rem 1rem; font-size: 0.95rem; outline: none; }
        input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25); }
        .btn-submit { width: 100%; background: #10b981; color: #fff; border: none; border-radius: 8px; padding: 0.85rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-submit:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-header">
            <i class="fa-solid fa-key"></i>
        </div>
        <h2>Đặt Mật Khẩu Mới</h2>
        <p class="subtitle">Nhập mật khẩu mới an toàn cho tài khoản của bạn.</p>

        <div class="expiry-pill">
            <i class="fa-solid fa-clock"></i> Liên kết có hiệu lực 30 phút (Hết hạn lúc: {{ \Carbon\Carbon::parse($expires_at)->format('H:i:s d/m/Y') }})
        </div>

        @if ($errors->any())
            <div class="alert-danger">
                @foreach ($errors->all() as $error)
                    <div><i class="fa-solid fa-triangle-exclamation"></i> {{ $error }}</div>
                @endforeach
            </div>
        @endif

        <form action="{{ route('password.update') }}" method="POST">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">

            <div class="form-group">
                <label for="email"><i class="fa-regular fa-envelope"></i> Email Tài Khoản</label>
                <input type="email" id="email" name="email" value="{{ old('email', $email) }}" required readonly style="opacity: 0.7;">
            </div>

            <div class="form-group">
                <label for="password"><i class="fa-solid fa-lock"></i> Mật khẩu mới (Min 8 ký tự)</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required autofocus>
            </div>

            <div class="form-group">
                <label for="password_confirmation"><i class="fa-solid fa-shield-check"></i> Xác nhận mật khẩu mới</label>
                <input type="password" id="password_confirmation" name="password_confirmation" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn-submit">
                <i class="fa-solid fa-floppy-disk"></i> Cập Nhật Mật Khẩu
            </button>
        </form>
    </div>
</body>
</html>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quên Mật Khẩu - Khôi Phục Tài Khoản</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2rem; max-width: 440px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .icon-header { width: 56px; height: 56px; background: rgba(99, 102, 241, 0.15); color: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem; }
        h2 { text-align: center; font-size: 1.35rem; margin-bottom: 0.5rem; }
        p.subtitle { text-align: center; color: #94a3b8; font-size: 0.88rem; margin-bottom: 1.5rem; }
        .alert-success { background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.4); color: #7dd3fc; border-radius: 10px; padding: 1rem; font-size: 0.88rem; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; }
        .alert-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 10px; padding: 0.85rem; font-size: 0.85rem; margin-bottom: 1.25rem; }
        .form-group { margin-bottom: 1.25rem; }
        label { display: block; font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
        input[type="email"] { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 0.75rem 1rem; font-size: 0.95rem; outline: none; }
        input[type="email"]:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25); }
        .btn-submit { width: 100%; background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 0.85rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-submit:hover { background: #4f46e5; }
        .footer-note { text-align: center; font-size: 0.78rem; color: #64748b; margin-top: 1.25rem; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-header">
            <i class="fa-solid fa-lock-open"></i>
        </div>
        <h2>Quên Mật Khẩu?</h2>
        <p class="subtitle">Nhập email đăng ký để nhận liên kết khôi phục có hiệu lực trong 30 phút.</p>

        @if (session('status'))
            <div class="alert-success">
                <i class="fa-solid fa-circle-info" style="font-size: 1.2rem; margin-top: 0.1rem;"></i>
                <div>{{ session('status') }}</div>
            </div>
        @endif

        @if ($errors->any())
            <div class="alert-danger">
                @foreach ($errors->all() as $error)
                    <div><i class="fa-solid fa-triangle-exclamation"></i> {{ $error }}</div>
                @endforeach
            </div>
        @endif

        <form action="{{ route('password.email') }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="email"><i class="fa-regular fa-envelope"></i> Địa chỉ Email</label>
                <input type="email" id="email" name="email" value="{{ old('email') }}" placeholder="name@company.com" required autofocus>
            </div>

            <button type="submit" class="btn-submit">
                <i class="fa-solid fa-paper-plane"></i> Gửi Liên Kết Khôi Phục
            </button>
        </form>

        <div class="footer-note">
            <i class="fa-solid fa-shield-halved"></i> Hệ thống sử dụng cơ chế Anti-Enumeration để bảo vệ quyền riêng tư người dùng.
        </div>
    </div>
</body>
</html>

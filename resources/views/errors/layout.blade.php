<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Đã có lỗi xảy ra')</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
            background: #f5f6fa;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .error-card {
            background: #fff;
            border-radius: 12px;
            padding: 40px;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .error-code { font-size: 48px; font-weight: 700; color: #ef4444; margin-bottom: 8px; }
        .error-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .error-message { color: #6b7280; margin-bottom: 24px; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            margin: 4px;
        }
        .btn-primary { background: #4f46e5; color: #fff; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
    </style>
</head>
<body>
    <div class="error-card">
        @yield('content')
    </div>
</body>
</html>

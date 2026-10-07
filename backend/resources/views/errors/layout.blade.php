<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Đã có lỗi xảy ra') – Hệ thống QLKH</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg-from:    #0f172a;
            --bg-to:      #1e293b;
            --card-bg:    rgba(255,255,255,0.04);
            --card-border:rgba(255,255,255,0.08);
            --text-main:  #f1f5f9;
            --text-muted: #94a3b8;
            --accent:     #6366f1;
            --accent-hov: #818cf8;
            --danger:     #f43f5e;
            --secondary-bg: rgba(255,255,255,0.06);
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: linear-gradient(135deg, var(--bg-from) 0%, var(--bg-to) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: var(--text-main);
        }

        /* Noise grain overlay */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 0;
        }

        .error-wrap {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 480px;
        }

        .error-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 48px 40px 40px;
            text-align: center;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow:
                0 0 0 1px rgba(255,255,255,0.05),
                0 24px 64px rgba(0,0,0,0.4);
            animation: cardIn 0.45s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes cardIn {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        /* Status code big number */
        .error-code {
            font-size: clamp(64px, 18vw, 88px);
            font-weight: 700;
            line-height: 1;
            letter-spacing: -4px;
            background: linear-gradient(135deg, var(--danger) 0%, #fb923c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
            animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.8; }
        }

        /* Divider line */
        .error-divider {
            width: 48px;
            height: 3px;
            background: linear-gradient(90deg, var(--accent), transparent);
            border-radius: 2px;
            margin: 0 auto 20px;
        }

        .error-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--text-main);
        }

        .error-message {
            color: var(--text-muted);
            font-size: 15px;
            line-height: 1.65;
            margin-bottom: 32px;
        }

        /* Buttons */
        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .btn-primary {
            background: var(--accent);
            color: #fff;
            box-shadow: 0 4px 20px rgba(99,102,241,0.35);
        }

        .btn-primary:hover {
            background: var(--accent-hov);
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(99,102,241,0.45);
        }

        .btn-secondary {
            background: var(--secondary-bg);
            color: var(--text-muted);
            border: 1px solid var(--card-border);
        }

        .btn-secondary:hover {
            background: rgba(255,255,255,0.10);
            color: var(--text-main);
            transform: translateY(-1px);
        }

        /* Footer note */
        .error-footer {
            margin-top: 24px;
            font-size: 13px;
            color: rgba(148,163,184,0.5);
        }

        /* Responsive */
        @media (max-width: 400px) {
            .error-card { padding: 36px 24px 28px; }
        }
    </style>
</head>
<body>
    <div class="error-wrap">
        <div class="error-card">
            @yield('content')
        </div>
        <p class="error-footer">Hệ thống quản lý khách hàng &copy; {{ date('Y') }}</p>
    </div>
</body>
</html>

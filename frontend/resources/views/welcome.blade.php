<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-light text-dark flex items-center justify-center min-h-screen">
    <div class="container text-center p-6">
        <h1 class="text-3xl font-bold mb-4">{{ config('app.name', 'Laravel Application') }}</h1>
        <p class="mb-6 text-gray-600">Hệ thống quản lý Customer & Campaign API</p>
        
        <div class="flex justify-center gap-4">
            @if (Route::has('login'))
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn btn-primary">Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="btn btn-secondary">Đăng nhập</a>
                @endauth
            @endif
        </div>
    </div>
</body>
</html>

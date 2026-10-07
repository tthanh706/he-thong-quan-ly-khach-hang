@extends('layouts.auth')

@section('title', 'Quên mật khẩu')
@section('page_heading', 'Quên mật khẩu?')
@section('page_subheading', 'Nhập email của bạn để nhận liên kết hướng dẫn đặt lại mật khẩu.')

@section('content')
    <form method="POST" action="{{ route('password.email') }}">
        @csrf

        <div class="form-group">
            <label for="email" class="form-label">Địa chỉ Email</label>
            <div class="input-wrapper">
                <input 
                    id="email" 
                    type="email" 
                    name="email" 
                    class="form-control @error('email') is-invalid @enderror" 
                    value="{{ old('email') }}" 
                    placeholder="name@company.com" 
                    required 
                    autofocus
                >
                <div class="input-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                </div>
            </div>
            @error('email')
                <div class="invalid-feedback">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ $message }}
                </div>
            @enderror
        </div>

        <button type="submit" class="btn-submit">
            <span>Gửi liên kết đặt lại mật khẩu</span>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
        </button>
    </form>

    <div class="auth-footer">
        Đã nhớ lại mật khẩu? 
        <a href="{{ route('login') }}" class="auth-link">Quay lại đăng nhập</a>
    </div>
@endsection

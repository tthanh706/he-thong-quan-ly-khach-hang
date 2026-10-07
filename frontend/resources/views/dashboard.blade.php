@extends('layouts.auth')

@section('title', 'Bảng điều khiển')
@section('page_heading', 'Xin chào, ' . (Auth::user()->name ?? 'Thành viên'))
@section('page_subheading', 'Đăng nhập thành công vào hệ thống.')

@section('content')
    <div style="text-align: center; margin-bottom: 2rem;">
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 1.25rem; border-radius: 16px; margin-bottom: 1.5rem; font-weight: 500;">
            🎉 Tài khoản của bạn đã được xác thực an toàn!
        </div>

        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="btn-submit" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4);">
                <span>Đăng xuất</span>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
            </button>
        </form>
    </div>
@endsection

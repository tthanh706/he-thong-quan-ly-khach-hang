@extends('layouts.app') {{-- Hoặc layout chung của dự án --}}

@section('content')
<div class="container mt-5">
    <h2>Đổi mật khẩu</h2>

    @if (session('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif

    <form method="POST" action="{{ route('password.update') }}">
        @csrf

        {{-- 1. Mật khẩu hiện tại --}}
        <div class="mb-3">
            <label class="form-label">Mật khẩu hiện tại</label>
            <input type="password" name="current_password" class="form-control @error('current_password') is-invalid @enderror" required>
            @error('current_password')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        {{-- 2. Mật khẩu mới --}}
        <div class="mb-3">
            <label class="form-label">Mật khẩu mới (Tối thiểu 8 ký tự, gồm chữ và số)</label>
            <input type="password" name="new_password" class="form-control @error('new_password') is-invalid @enderror" required>
            @error('new_password')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        {{-- 3. Xác nhận mật khẩu mới --}}
        <div class="mb-3">
            <label class="form-label">Xác nhận mật khẩu mới</label>
            <input type="password" name="new_password_confirmation" class="form-control" required>
        </div>

        <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
    </form>
</div>
@endsection
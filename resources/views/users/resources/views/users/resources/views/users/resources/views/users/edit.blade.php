@extends('layouts.app')

@section('content')
<div class="card shadow-sm col-md-8 mx-auto">
    <div class="card-header bg-white py-3">
        <h5 class="mb-0 fw-bold text-warning text-dark">Chỉnh Sửa Tài Khoản</h5>
    </div>
    <div class="card-body">
        <form action="{{ route('users.update', $user->id) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="mb-3">
                <label class="form-label fw-semibold">Họ và Tên</label>
                <input type="text" name="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $user->name) }}">
                @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
            </div>

            <div class="mb-3">
                <label class="form-label fw-semibold">Email</label>
                <input type="email" name="email" class="form-control @error('email') is-invalid @enderror" value="{{ old('email', $user->email) }}">
                @error('email') <div class="invalid-feedback">{{ $message }}</div> @enderror
            </div>

            <div class="mb-3">
                <label class="form-label fw-semibold">Mật Khẩu (Để trống nếu không muốn đổi)</label>
                <input type="password" name="password" class="form-control @error('password') is-invalid @enderror">
                @error('password') <div class="invalid-feedback">{{ $message }}</div> @enderror
            </div>

            <div class="mb-3">
                <label class="form-label fw-semibold">Nhóm Tài Khoản</label>
                <select name="group_id" class="form-select @error('group_id') is-invalid @enderror">
                    @foreach($groups as $group)
                        <option value="{{ $group->id }}" {{ $user->group_id == $group->id ? 'selected' : '' }}>
                            {{ $group->name }}
                        </option>
                    @endforeach
                </select>
                @error('group_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
            </div>

            <div class="d-flex justify-content-between">
                <a href="{{ route('users.index') }}" class="btn btn-secondary">Quay lại</a>
                <button type="submit" class="btn btn-warning">Cập Nhật</button>
            </div>
        </form>
    </div>
</div>
@endsection
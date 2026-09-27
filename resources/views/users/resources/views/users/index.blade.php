@extends('layouts.app')

@section('content')
<div class="card shadow-sm">
    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 class="mb-0 fw-bold text-primary">Danh Sách Tài Khoản</h5>
        <a href="{{ route('users.create') }}" class="btn btn-success">+ Thêm Tài Khoản</a>
    </div>
    <div class="card-body">
        <form action="{{ route('users.index') }}" method="GET" class="mb-3">
            <div class="input-group">
                <input type="text" name="search" class="form-control" placeholder="Tìm theo tên hoặc email..." value="{{ request('search') }}">
                <button class="btn btn-outline-secondary" type="submit">Tìm kiếm</button>
            </div>
        </form>

        <table class="table table-bordered table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th>STT</th>
                    <th>Họ và Tên</th>
                    <th>Email</th>
                    <th>Nhóm / Phòng Ban</th>
                    <th width="150" class="text-center">Thao Tác</th>
                </tr>
            </thead>
            <tbody>
                @forelse($users as $key => $user)
                <tr>
                    <td>{{ $users->firstItem() + $key }}</td>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td><span class="badge bg-info text-dark">{{ $user->group->name ?? 'Chưa phân nhóm' }}</span></td>
                    <td class="text-center">
                        <a href="{{ route('users.edit', $user->id) }}" class="btn btn-sm btn-warning">Sửa</a>
                        <form action="{{ route('users.destroy', $user->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Bạn có chắc muốn xóa?')">
                            @csrf
                            @method('DELETE')
                            <button class="btn btn-sm btn-danger">Xóa</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="text-center text-muted">Không tìm thấy dữ liệu</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="d-flex justify-content-center">
            {{ $users->withQueryString()->links() }}
        </div>
    </div>
</div>
@endsection
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Danh sách tài khoản + Tìm kiếm
    public function index(Request $request)
    {
        $query = User::with('group');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(5);
        return view('users.index', compact('users'));
    }

    // Giao diện Thêm mới
    public function create()
    {
        $groups = Group::all();
        return view('users.create', compact('groups'));
    }

    // Lưu tài khoản mới
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'group_id' => 'required|exists:groups,id',
        ], [
            'name.required'     => 'Vui lòng nhập họ tên.',
            'email.required'    => 'Vui lòng nhập email.',
            'email.unique'      => 'Email này đã tồn tại.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min'      => 'Mật khẩu phải từ 6 ký tự.',
            'group_id.required' => 'Vui lòng chọn nhóm tài khoản.',
        ]);

        User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'group_id' => $request->group_id,
        ]);

        return redirect()->route('users.index')->with('success', 'Thêm tài khoản thành công!');
    }

    // Giao diện Chỉnh sửa
    public function edit(User $user)
    {
        $groups = Group::all();
        return view('users.edit', compact('user', 'groups'));
    }

    // Cập nhật tài khoản
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'group_id' => 'required|exists:groups,id',
        ]);

        $data = [
            'name'     => $request->name,
            'email'    => $request->email,
            'group_id' => $request->group_id,
        ];

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:6']);
            $data['password'] = bcrypt($request->password);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'Cập nhật thành công!');
    }

    // Xóa tài khoản
    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('users.index')->with('success', 'Xóa tài khoản thành công!');
    }
}
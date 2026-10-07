<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private UserService $users) {}
    public function index(Request $request)
    {
        $page = $this->users->list($request->only(['search','role','status']));
        return response()->json([
            'success'=>true,
            'data'=>$page->items(),
            'meta'=>['current_page'=>$page->currentPage(),'last_page'=>$page->lastPage(),'per_page'=>$page->perPage(),'total'=>$page->total()],
        ]);
    }
    public function store(StoreUserRequest $request)
    {
        $user = $this->users->create($request->validated());
        return response()->json(['success'=>true,'message'=>'Tạo tài khoản thành công. Email kích hoạt và mật khẩu tạm đã được gửi.','user'=>$user],201);
    }
    public function show(User $user) { return response()->json(['success'=>true,'user'=>$user]); }
    public function update(UpdateUserRequest $request, User $user)
    {
        $user=$this->users->update($user,$request->validated());
        return response()->json(['success'=>true,'message'=>'Cập nhật người dùng thành công.','user'=>$user]);
    }
}

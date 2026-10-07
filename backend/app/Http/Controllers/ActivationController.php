<?php
namespace App\Http\Controllers;
use App\Services\UserService;
use Illuminate\Http\Request;
class ActivationController extends Controller
{
    public function __construct(private UserService $users) {}
    public function activate(Request $request)
    {
        $data=$request->validate(['token'=>['required','string']]);
        $this->users->activate($data['token']);
        return response()->json(['success'=>true,'message'=>'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.']);
    }
}

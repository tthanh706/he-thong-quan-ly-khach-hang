<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use App\Services\CampaignService;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AuthService      $authService,
        private readonly CustomerService  $customerService,
        private readonly CampaignService  $campaignService,
    ) {}

    /**
     * Trang Dashboard tổng quan.
     * AuthenticationException nếu chưa đăng nhập -> Handler -> 401.
     */
    public function index(Request $request): View
    {
        $user = $this->authService->currentUser();

        $recentCustomers = $this->customerService->paginate(5, [
            'assigned_to' => $user->role === 'staff' ? $user->id : null,
        ]);

        $activeCampaigns = $this->campaignService->paginate(5, [
            'status'     => 'active',
            'created_by' => $user->role === 'staff' ? $user->id : null,
        ]);

        return view('dashboard', compact('user', 'recentCustomers', 'activeCampaigns'));
    }
}

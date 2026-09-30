<?php

namespace App\Http\Controllers\Api;

use App\Enums\DataScope;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\Quote;
use App\Support\ScopeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly ScopeResolver $scopeResolver) {}

    /**
     * Tong hop theo pham vi hien tai: moi so lieu deu cham vao bo loc cua nguoi dang nhap.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $scope = DataScope::from((string) $request->attributes->get('scope'));

        $counts = [
            'customers' => $this->scopeResolver->apply(Customer::query(), $user, $scope)->count(),
            'opportunities' => $this->scopeResolver->apply(Opportunity::query(), $user, $scope)->count(),
            'activities' => $this->scopeResolver->apply(Activity::query(), $user, $scope)->count(),
            'quotes' => $this->scopeResolver->apply(Quote::query(), $user, $scope)->count(),
        ];

        $pipeline = $this->scopeResolver->apply(Opportunity::query(), $user, $scope)
            ->selectRaw('stage, count(*) as total, sum(amount) as amount')
            ->groupBy('stage')
            ->get()
            ->map(fn ($row): array => [
                'stage' => $row->stage->value,
                'stage_label' => $row->stage->label(),
                'total' => (int) $row->total,
                'amount' => (float) $row->amount,
            ]);

        $visibleRevenue = (float) $this->scopeResolver->apply(Quote::query(), $user, $scope)
            ->where('status', 'accepted')
            ->sum('amount');

        $hidden = [];
        foreach (['customers' => Customer::class, 'opportunities' => Opportunity::class, 'activities' => Activity::class, 'quotes' => Quote::class] as $key => $class) {
            $hidden[$key] = $class::query()->count() - $counts[$key];
        }

        return response()->json([
            'data' => [
                'counts' => $counts,
                'pipeline' => $pipeline,
                'accepted_revenue' => $visibleRevenue,
            ],
            'meta' => [
                'scope' => $scope->value,
                'scope_label' => $scope->label(),
                'hidden_counts' => $hidden,
                'permissions' => $request->attributes->get('permissions'),
            ],
        ]);
    }
}

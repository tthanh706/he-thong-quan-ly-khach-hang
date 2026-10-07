<?php
namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\Quote;
use App\Services\ScopedResourceService;
use Illuminate\Http\Request;

class ScopedResourceController extends Controller
{
    public function __construct(private ScopedResourceService $resources) {}

    private function user(Request $request) { return $request->attributes->get('current_user'); }

    public function customers(Request $request) { return response()->json($this->resources->list(Customer::class, $this->user($request), $request->string('search')->toString())); }
    public function customer(Request $request, int $id) { return response()->json($this->resources->format($this->resources->find(Customer::class, $this->user($request), $id))); }
    public function exportCustomers(Request $request) { return $this->resources->exportXls(Customer::class, $this->user($request), $request->string('search')->toString(), 'khach_hang'); }

    public function opportunities(Request $request) { return response()->json($this->resources->list(Opportunity::class, $this->user($request), $request->string('search')->toString())); }
    public function opportunity(Request $request, int $id) { return response()->json($this->resources->format($this->resources->find(Opportunity::class, $this->user($request), $id))); }
    public function exportOpportunities(Request $request) { return $this->resources->exportXls(Opportunity::class, $this->user($request), $request->string('search')->toString(), 'co_hoi'); }

    public function activities(Request $request) { return response()->json($this->resources->list(Activity::class, $this->user($request), $request->string('search')->toString())); }
    public function activity(Request $request, int $id) { return response()->json($this->resources->format($this->resources->find(Activity::class, $this->user($request), $id))); }
    public function exportActivities(Request $request) { return $this->resources->exportXls(Activity::class, $this->user($request), $request->string('search')->toString(), 'hoat_dong'); }

    public function quotes(Request $request) { return response()->json($this->resources->list(Quote::class, $this->user($request), $request->string('search')->toString())); }
    public function quote(Request $request, int $id) { return response()->json($this->resources->format($this->resources->find(Quote::class, $this->user($request), $id))); }
    public function exportQuotes(Request $request) { return $this->resources->exportXls(Quote::class, $this->user($request), $request->string('search')->toString(), 'bao_gia'); }
}

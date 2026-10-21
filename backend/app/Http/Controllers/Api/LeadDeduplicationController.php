<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LinkLeadToCustomerRequest;
use App\Http\Requests\MergeLeadRequest;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Resources\DuplicateCheckResource;
use App\Http\Resources\LeadResource;
use App\Models\Customer;
use App\Models\Lead;
use App\Services\LeadDeduplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeadDeduplicationController extends Controller
{
    public function __construct(
        private readonly LeadDeduplicationService $deduplicationService
    ) {}

    /**
     * GET /api/leads
     * List all active leads with pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $leads = Lead::query()
            ->active()
            ->with(['assignedUser'])
            ->withCount('activityLogs')
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('company_name', 'LIKE', "%{$search}%")
                      ->orWhere('phone_number', 'LIKE', "%{$search}%");
                });
            })
            ->when($request->input('status'), fn($q, $status) => $q->where('status', $status))
            ->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_dir', 'desc'))
            ->paginate($request->input('per_page', 20));

        return LeadResource::collection($leads);
    }

    /**
     * POST /api/leads
     * Create a new lead (triggers auto-dedup check).
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create($request->validated());

        // Auto-detect duplicates upon creation
        $duplicateResult = $this->deduplicationService->detectDuplicates($lead);

        $hasDuplicates = $duplicateResult['duplicate_leads']->isNotEmpty()
                      || $duplicateResult['matching_customers']->isNotEmpty();

        return response()->json([
            'data'    => new LeadResource($lead->load('assignedUser')),
            'warning' => $hasDuplicates ? new DuplicateCheckResource(array_merge(
                ['lead_id' => $lead->id],
                $duplicateResult
            )) : null,
        ], 201);
    }

    /**
     * GET /api/leads/{lead}
     * Show lead details.
     */
    public function show(Lead $lead): LeadResource
    {
        return new LeadResource(
            $lead->load(['assignedUser', 'linkedCustomer', 'activityLogs.creator'])
        );
    }

    /**
     * GET /api/leads/{lead}/check-duplicates
     * Check for duplicates of a specific lead.
     */
    public function checkDuplicates(Lead $lead): DuplicateCheckResource
    {
        $result = $this->deduplicationService->detectDuplicates($lead);

        return new DuplicateCheckResource(array_merge(
            ['lead_id' => $lead->id],
            $result
        ));
    }

    /**
     * POST /api/leads/merge
     * Merge two leads: secondary → primary.
     */
    public function merge(MergeLeadRequest $request): JsonResponse
    {
        $primaryLead   = Lead::findOrFail($request->validated('primary_lead_id'));
        $secondaryLead = Lead::findOrFail($request->validated('secondary_lead_id'));

        try {
            $mergedLead = $this->deduplicationService->mergeLeads(
                $primaryLead,
                $secondaryLead,
                $request->user()->id,
                $request->validated('merge_reason')
            );

            return response()->json([
                'message' => 'Gộp lead thành công.',
                'data'    => new LeadResource($mergedLead),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/leads/{lead}/link-customer
     * Link a lead to an existing customer.
     */
    public function linkToCustomer(LinkLeadToCustomerRequest $request, Lead $lead): JsonResponse
    {
        $customer = Customer::findOrFail($request->validated('customer_id'));

        $updatedLead = $this->deduplicationService->linkLeadToCustomer(
            $lead,
            $customer,
            $request->user()->id
        );

        return response()->json([
            'message' => 'Lead đã được gắn vào hồ sơ khách hàng.',
            'data'    => new LeadResource($updatedLead),
        ]);
    }
}

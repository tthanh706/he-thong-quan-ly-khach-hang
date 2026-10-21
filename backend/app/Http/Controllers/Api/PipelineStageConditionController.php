<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStageConditionRequest;
use App\Http\Requests\TransitionStageRequest;
use App\Http\Resources\PipelineStageResource;
use App\Http\Resources\StageConditionResource;
use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\StageTransitionCondition;
use App\Policies\StageTransitionPolicy;
use App\Services\StageTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PipelineStageConditionController extends Controller
{
    public function __construct(
        private readonly StageTransitionService $transitionService,
        private readonly StageTransitionPolicy $policy
    ) {}

    /**
     * GET /api/pipelines/{pipelineId}/stages
     * List all stages of a pipeline with their conditions.
     */
    public function index(int $pipelineId): JsonResponse
    {
        $stages = $this->transitionService->getStagesWithConditions($pipelineId);

        return response()->json([
            'data' => PipelineStageResource::collection($stages),
        ]);
    }

    /**
     * POST /api/stages/{stage}/conditions
     * Add a transition condition to a stage. Requires manager role.
     */
    public function storeCondition(StoreStageConditionRequest $request, PipelineStage $stage): JsonResponse
    {
        if (!$this->policy->manageConditions($request->user())) {
            return response()->json([
                'message' => 'Bạn không có quyền quản lý điều kiện chuyển giai đoạn.',
            ], 403);
        }

        $condition = StageTransitionCondition::create(array_merge(
            $request->validated(),
            ['pipeline_stage_id' => $stage->id]
        ));

        return response()->json([
            'message' => 'Điều kiện đã được thêm thành công.',
            'data'    => new StageConditionResource($condition),
        ], 201);
    }

    /**
     * PUT /api/conditions/{condition}
     * Update a transition condition.
     */
    public function updateCondition(StoreStageConditionRequest $request, StageTransitionCondition $condition): JsonResponse
    {
        if (!$this->policy->manageConditions($request->user())) {
            return response()->json([
                'message' => 'Bạn không có quyền quản lý điều kiện chuyển giai đoạn.',
            ], 403);
        }

        $condition->update($request->validated());

        return response()->json([
            'message' => 'Điều kiện đã được cập nhật.',
            'data'    => new StageConditionResource($condition),
        ]);
    }

    /**
     * DELETE /api/conditions/{condition}
     * Delete a transition condition.
     */
    public function deleteCondition(Request $request, StageTransitionCondition $condition): JsonResponse
    {
        if (!$this->policy->manageConditions($request->user())) {
            return response()->json([
                'message' => 'Bạn không có quyền quản lý điều kiện chuyển giai đoạn.',
            ], 403);
        }

        $condition->delete();

        return response()->json([
            'message' => 'Điều kiện đã được xoá.',
        ]);
    }

    /**
     * POST /api/opportunities/{opportunity}/validate-transition
     * Validate if an opportunity can transition to a target stage
     * without actually performing the transition.
     */
    public function validateTransition(Request $request, Opportunity $opportunity): JsonResponse
    {
        $request->validate([
            'target_stage_id' => ['required', 'integer', 'exists:pipeline_stages,id'],
        ]);

        $targetStage = PipelineStage::findOrFail($request->input('target_stage_id'));
        $validation  = $this->transitionService->validateTransition($opportunity, $targetStage);

        return response()->json([
            'data' => array_merge($validation, [
                'user_can_override' => $this->policy->override($request->user()),
            ]),
        ]);
    }

    /**
     * POST /api/opportunities/{opportunity}/transition
     * Transition an opportunity to a new stage.
     * Supports override with reason for authorized users.
     */
    public function transition(TransitionStageRequest $request, Opportunity $opportunity): JsonResponse
    {
        $targetStage = PipelineStage::findOrFail($request->validated('target_stage_id'));
        $isOverride  = (bool) $request->input('is_override', false);

        // Check override permission if attempting override
        if ($isOverride && !$this->policy->override($request->user())) {
            return response()->json([
                'message' => 'Bạn không có quyền ghi đè điều kiện chuyển giai đoạn. Yêu cầu cấp Trưởng nhóm trở lên.',
            ], 403);
        }

        try {
            $updatedOpportunity = $this->transitionService->transitionStage(
                $opportunity,
                $targetStage,
                $request->user()->id,
                $isOverride,
                $request->input('override_reason')
            );

            return response()->json([
                'message' => $isOverride
                    ? 'Chuyển giai đoạn thành công (đã ghi đè điều kiện).'
                    : 'Chuyển giai đoạn thành công.',
                'data'    => [
                    'opportunity_id' => $updatedOpportunity->id,
                    'new_stage'      => new PipelineStageResource($updatedOpportunity->pipelineStage),
                    'overridden'     => $isOverride,
                ],
            ]);
        } catch (\App\Exceptions\StageTransitionBlockedException $e) {
            // Exception renders itself with 422 + failed conditions
            throw $e;
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateRenewalOpportunityRequest;
use App\Http\Requests\FilterContractRequest;
use App\Http\Requests\UpdateContractExpirySettingRequest;
use App\Http\Resources\ContractExpiryAlertResource;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Services\ContractRenewalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ContractRenewalController extends Controller
{
    public function index(
        FilterContractRequest $request,
        ContractRenewalService $service
    ): JsonResponse {
        $user = $request->attributes->get('current_user');

        $contracts = $service
            ->getContractsForAccountant($user);

        $filters = $request->validated();

        if (!empty($filters['status'])) {
            $contracts = $contracts
                ->filter(
                    fn ($contract) =>
                        $contract->status->value === $filters['status']
                )
                ->values();
        }

        if (!empty($filters['search'])) {
            $search = mb_strtolower(
                $filters['search']
            );

            $contracts = $contracts
                ->filter(function ($contract) use ($search): bool {
                    return str_contains(
                        mb_strtolower($contract->contract_code),
                        $search
                    )
                    || str_contains(
                        mb_strtolower($contract->customer_name),
                        $search
                    );
                })
                ->values();
        }

        if (!empty($filters['only_warning'])) {
            $contracts = $contracts
                ->filter(
                    fn ($contract) =>
                        $contract->expiryAlerts->isNotEmpty()
                )
                ->values();
        }

        return response()->json([
            'success' => true,
            'data' => ContractResource::collection(
                $contracts
            ),
            'message' => 'Lấy danh sách hợp đồng thành công.',
        ]);
    }

    public function show(
        Contract $contract
    ): JsonResponse {
        $contract->load([
            'owner',
            'accountant',
            'renewalOpportunity',
            'expiryAlerts',
        ]);

        return response()->json([
            'success' => true,
            'data' => new ContractResource(
                $contract
            ),
            'message' => 'Lấy thông tin hợp đồng thành công.',
        ]);
    }

    public function alerts(
        Request $request,
        ContractRenewalService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $alerts = $service
            ->getAlertsForAccountant($user);

        return response()->json([
            'success' => true,
            'data' => ContractExpiryAlertResource::collection(
                $alerts
            ),
            'message' => 'Lấy cảnh báo hợp đồng thành công.',
        ]);
    }

    public function check(
        ContractRenewalService $service
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $service->checkContracts(),
            'message' => 'Kiểm tra thời hạn hợp đồng thành công.',
        ]);
    }

    public function setting(
        ContractRenewalService $service
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $service->getWarningSetting(),
            'message' => 'Lấy cấu hình cảnh báo thành công.',
        ]);
    }

    public function updateSetting(
        UpdateContractExpirySettingRequest $request,
        ContractRenewalService $service
    ): JsonResponse {
        $data = $request->validated();

        $setting = $service->updateWarningSetting(
            $data['warning_days'],
            $data['is_active']
        );

        return response()->json([
            'success' => true,
            'data' => $setting,
            'message' => 'Cập nhật cấu hình cảnh báo thành công.',
        ]);
    }

    public function createRenewal(
        CreateRenewalOpportunityRequest $request,
        Contract $contract,
        ContractRenewalService $service
    ): JsonResponse {
        try {
            $opportunity = $service
                ->createRenewalOpportunity(
                    $contract
                );
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $opportunity->id,
                'source_contract_id' => $opportunity->source_contract_id,
                'opportunity_type' => $opportunity->opportunity_type,
                'name' => $opportunity->name,
                'stage' => $opportunity->stage,
                'status' => $opportunity->status->value,
                'value' => $opportunity->value,
                'expected_close_date' => $opportunity
                    ->expected_close_date?->format('Y-m-d'),
            ],
            'message' => 'Tạo cơ hội gia hạn thành công.',
        ], 201);
    }
}
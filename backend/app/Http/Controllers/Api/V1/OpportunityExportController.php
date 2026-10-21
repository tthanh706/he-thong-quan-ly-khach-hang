<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpportunityExportFilterRequest;
use App\Services\OpportunityExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OpportunityExportController extends Controller
{
    public function index(
        OpportunityExportFilterRequest $request,
        OpportunityExportService $service
    ): JsonResponse {
        $currentUser =
            $request->attributes->get(
                'current_user'
            );

        if (!$this->isTeamLeader($currentUser)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Chỉ trưởng nhóm kinh doanh được xem danh sách cơ hội.',
            ], 403);
        }

        $filters = $request->validated();

        $opportunities =
            $service->getFilteredOpportunities(
                $currentUser,
                $filters
            );

        $customFields =
            $service->getActiveCustomFields();

        $rows = $service->buildRows(
            $currentUser,
            $opportunities,
            $customFields
        );

        return response()->json([
            'success' => true,
            'data' => [
                'can_view_financials' =>
                    $service->canViewFinancials(
                        $currentUser
                    ),

                'custom_fields' =>
                    $customFields
                        ->map(function ($field): array {
                            return [
                                'id' => $field->id,
                                'name' => $field->name,
                                'field_key' =>
                                    $field->field_key,
                                'field_type' =>
                                    $field->field_type,
                            ];
                        })
                        ->values(),

                'opportunities' => $rows,
            ],
            'message' =>
                'Lấy danh sách cơ hội thành công.',
        ]);
    }

    public function filters(
        Request $request
    ): JsonResponse {
        $currentUser =
            $request->attributes->get(
                'current_user'
            );

        if (!$this->isTeamLeader($currentUser)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Bạn không có quyền xem bộ lọc.',
            ], 403);
        }

        $stages = \App\Models\Opportunity::query()
            ->where(
                'team_leader_id',
                $currentUser->id
            )
            ->whereNotNull('stage')
            ->distinct()
            ->orderBy('stage')
            ->pluck('stage');

        $statuses = \App\Models\Opportunity::query()
            ->where(
                'team_leader_id',
                $currentUser->id
            )
            ->whereNotNull('status')
            ->distinct()
            ->pluck('status')
            ->map(function ($status): string {
                return $status instanceof \BackedEnum
                    ? $status->value
                    : (string) $status;
            })
            ->unique()
            ->values();

        $owners = \App\Models\User::query()
            ->whereIn(
                'id',
                \App\Models\Opportunity::query()
                    ->where(
                        'team_leader_id',
                        $currentUser->id
                    )
                    ->whereNotNull(
                        'owner_user_id'
                    )
                    ->pluck(
                        'owner_user_id'
                    )
            )
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'stages' => $stages,
                'statuses' => $statuses,
                'owners' => $owners,
            ],
            'message' =>
                'Lấy dữ liệu bộ lọc thành công.',
        ]);
    }

    public function export(
        OpportunityExportFilterRequest $request,
        OpportunityExportService $service
    ): BinaryFileResponse|JsonResponse {
        $currentUser =
            $request->attributes->get(
                'current_user'
            );

        if (!$this->isTeamLeader($currentUser)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Chỉ trưởng nhóm kinh doanh được xuất danh sách cơ hội.',
            ], 403);
        }

        $filters = $request->validated();

        $opportunities =
            $service->getFilteredOpportunities(
                $currentUser,
                $filters
            );

        $customFields =
            $service->getActiveCustomFields();

        $rows = $service->buildRows(
            $currentUser,
            $opportunities,
            $customFields
        );

        $canViewFinancials =
            $service->canViewFinancials(
                $currentUser
            );

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setTitle(
            'Danh sach co hoi'
        );

        $headers = [
            'STT',
            'Tên cơ hội',
            'Người phụ trách',
            'Giai đoạn',
            'Trạng thái',
            'Giá trị',
            'Ngày dự kiến chốt',
            'Loại cơ hội',
        ];

        if ($canViewFinancials) {
            $headers[] = 'Giá vốn';
            $headers[] = 'Biên lợi nhuận (%)';
        }

        foreach (
            $customFields
            as $customField
        ) {
            $headers[] =
                $customField->name;
        }

        $column = 1;

        foreach (
            $headers
            as $header
        ) {
            $sheet->setCellValue(
                [$column, 1],
                $header
            );

            $column++;
        }

        $rowNumber = 2;

        foreach (
            $rows
            as $index => $row
        ) {
            $column = 1;

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $index + 1
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row['name']
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row['owner']
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row['stage']
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row['status']
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row['value']
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row[
                    'expected_close_date'
                ]
            );

            $sheet->setCellValue(
                [$column++, $rowNumber],
                $row[
                    'opportunity_type'
                ]
            );

            if ($canViewFinancials) {
                $sheet->setCellValue(
                    [$column++, $rowNumber],
                    $row['cost_price']
                );

                $sheet->setCellValue(
                    [$column++, $rowNumber],
                    $row[
                        'profit_margin'
                    ]
                );
            }

            foreach (
                $customFields
                as $customField
            ) {
                $key =
                    'custom_'
                    . $customField
                        ->field_key;

                $sheet->setCellValue(
                    [$column++, $rowNumber],
                    $row[$key] ?? null
                );
            }

            $rowNumber++;
        }

        $lastColumn =
            $sheet->getHighestColumn();

        $sheet->getStyle(
            "A1:{$lastColumn}1"
        )
            ->getFont()
            ->setBold(true);

        foreach (
            range(
                'A',
                $lastColumn
            )
            as $excelColumn
        ) {
            $sheet
                ->getColumnDimension(
                    $excelColumn
                )
                ->setAutoSize(true);
        }

        $filename =
            'danh-sach-co-hoi-'
            . now()->format(
                'Y-m-d-His'
            )
            . '.xlsx';

        $temporaryFile =
            tempnam(
                sys_get_temp_dir(),
                'opportunity-export-'
            );

        $writer =
            new Xlsx(
                $spreadsheet
            );

        $writer->save(
            $temporaryFile
        );

        $spreadsheet
            ->disconnectWorksheets();

        return response()
            ->download(
                $temporaryFile,
                $filename,
                [
                    'Content-Type' =>
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]
            )
            ->deleteFileAfterSend(
                true
            );
    }

    private function isTeamLeader(
        $user
    ): bool {
        if (!$user) {
            return false;
        }

        $role = $user->role;

        if ($role instanceof \BackedEnum) {
            $role = $role->value;
        }

        return in_array(
            (string) $role,
            ['team_leader', 'admin', 'manager'],
            true
        );
    }
}
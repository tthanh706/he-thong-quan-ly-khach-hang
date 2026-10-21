<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeamPerformanceFilterRequest;
use App\Http\Resources\TeamPerformanceResource;
use App\Services\TeamPerformanceService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TeamPerformanceController extends Controller
{
    private function resolveTeamLeader($currentUser): ?User
    {
        if ($currentUser->role === 'team_leader') {
            return $currentUser;
        }
        if (in_array($currentUser->role, ['admin', 'manager'])) {
            return User::where('role', 'team_leader')->first() ?? $currentUser;
        }
        return null;
    }

    public function index(
        TeamPerformanceFilterRequest $request,
        TeamPerformanceService $service
    ): JsonResponse {
        $currentUser = $request->attributes->get(
            'current_user'
        );

        $teamLeader = $this->resolveTeamLeader($currentUser);
        if (!$teamLeader) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Chỉ trưởng nhóm hoặc quản trị viên được xem báo cáo nhóm.',
            ], 403);
        }

        $filters = $request->validated();

        $report = $service->getReport(
            $teamLeader,
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null,
            isset($filters['user_id'])
                ? (int) $filters['user_id']
                : null
        );

        return response()->json([
            'success' => true,

            'data' => [
                'period' => $report['period'],

                'summary' => $report['summary'],

                'members' =>
                    TeamPerformanceResource::collection(
                        $report['members']
                    ),
            ],

            'message' =>
                'Lấy báo cáo năng suất nhóm thành công.',
        ]);
    }

    public function members(
        Request $request,
        TeamPerformanceService $service
    ): JsonResponse {
        $currentUser = $request->attributes->get(
            'current_user'
        );

        $teamLeader = $this->resolveTeamLeader($currentUser);
        if (!$teamLeader) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Chỉ trưởng nhóm hoặc quản trị viên được xem thành viên nhóm.',
            ], 403);
        }

        $members = $service
            ->getMembers($teamLeader)
            ->map(function ($user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $members,
            'message' =>
                'Lấy danh sách thành viên thành công.',
        ]);
    }

    public function export(
        TeamPerformanceFilterRequest $request,
        TeamPerformanceService $service
    ): BinaryFileResponse|JsonResponse {
        $currentUser = $request->attributes->get(
            'current_user'
        );

        $teamLeader = $this->resolveTeamLeader($currentUser);
        if (!$teamLeader) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'Chỉ trưởng nhóm hoặc quản trị viên được xuất báo cáo.',
            ], 403);
        }

        $filters = $request->validated();

        $report = $service->getReport(
            $teamLeader,
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null,
            isset($filters['user_id'])
                ? (int) $filters['user_id']
                : null
        );

        $spreadsheet = new Spreadsheet();

        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setTitle('Nang suat nhom');

        $sheet->setCellValue(
            'A1',
            'BÁO CÁO HOẠT ĐỘNG VÀ NĂNG SUẤT NHÓM'
        );

        $sheet->mergeCells('A1:J1');

        $sheet->setCellValue(
            'A2',
            'Từ ngày'
        );

        $sheet->setCellValue(
            'B2',
            $report['period']['date_from']
        );

        $sheet->setCellValue(
            'C2',
            'Đến ngày'
        );

        $sheet->setCellValue(
            'D2',
            $report['period']['date_to']
        );

        $headers = [
            'STT',
            'Nhân viên',
            'Email',
            'Cuộc gọi',
            'Cuộc gặp',
            'Báo giá',
            'Tổng hoạt động',
            'Lead được giao',
            'Đúng SLA',
            'Tỷ lệ SLA (%)',
        ];

        $column = 'A';

        foreach ($headers as $header) {
            $sheet->setCellValue(
                $column . '4',
                $header
            );

            $column++;
        }

        $row = 5;

        foreach ($report['members'] as $index => $member) {
            $sheet->setCellValue(
                "A{$row}",
                $index + 1
            );

            $sheet->setCellValue(
                "B{$row}",
                $member['name']
            );

            $sheet->setCellValue(
                "C{$row}",
                $member['email']
            );

            $sheet->setCellValue(
                "D{$row}",
                $member['calls']
            );

            $sheet->setCellValue(
                "E{$row}",
                $member['meetings']
            );

            $sheet->setCellValue(
                "F{$row}",
                $member['quotations']
            );

            $sheet->setCellValue(
                "G{$row}",
                $member['total_activities']
            );

            $sheet->setCellValue(
                "H{$row}",
                $member['assigned_leads']
            );

            $sheet->setCellValue(
                "I{$row}",
                $member['responded_within_sla']
            );

            $sheet->setCellValue(
                "J{$row}",
                $member['sla_rate']
            );

            $row++;
        }

        $row += 2;

        $sheet->setCellValue(
            "A{$row}",
            'TỔNG TOÀN NHÓM'
        );

        $sheet->setCellValue(
            "D{$row}",
            $report['summary']['calls']
        );

        $sheet->setCellValue(
            "E{$row}",
            $report['summary']['meetings']
        );

        $sheet->setCellValue(
            "F{$row}",
            $report['summary']['quotations']
        );

        $sheet->setCellValue(
            "G{$row}",
            $report['summary']['total_activities']
        );

        $sheet->setCellValue(
            "H{$row}",
            $report['summary']['assigned_leads']
        );

        $sheet->setCellValue(
            "I{$row}",
            $report['summary']['responded_within_sla']
        );

        $sheet->setCellValue(
            "J{$row}",
            $report['summary']['sla_rate']
        );

        foreach (
            range('A', 'J')
            as $excelColumn
        ) {
            $sheet
                ->getColumnDimension(
                    $excelColumn
                )
                ->setAutoSize(true);
        }

        $sheet
            ->getStyle('A1:J1')
            ->getFont()
            ->setBold(true)
            ->setSize(14);

        $sheet
            ->getStyle('A4:J4')
            ->getFont()
            ->setBold(true);

        $sheet
            ->getStyle(
                "A{$row}:J{$row}"
            )
            ->getFont()
            ->setBold(true);

        $filename = sprintf(
            'bao-cao-nang-suat-%s-%s.xlsx',
            $report['period']['date_from'],
            $report['period']['date_to']
        );

        $temporaryFile = tempnam(
            sys_get_temp_dir(),
            'team-performance-'
        );

        $writer = new Xlsx(
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
            ->deleteFileAfterSend(true);
    }
}
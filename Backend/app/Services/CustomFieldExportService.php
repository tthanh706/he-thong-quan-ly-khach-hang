<?php

namespace App\Services;

use App\Models\CustomField;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CustomFieldExportService
{
    public function __construct(
        private readonly CustomFieldValueService
            $customFieldValueService
    ) {
    }

    public function export(
        string $module,
        ?string $search,
        array $customFields
    ): string {
        $fields = CustomField::query()
            ->where('module', $module)
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        $entities =
            $this->customFieldValueService
                ->getEntitiesForExport(
                    $module,
                    $search,
                    $customFields
                );

        $entityIds = $entities->pluck('id');

        $valueMap =
            $this->customFieldValueService
                ->getValueMap(
                    $module,
                    $entityIds
                );

        $spreadsheet = new Spreadsheet();

        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setTitle(
            $module === 'customer'
                ? 'Khach hang'
                : 'Co hoi'
        );

        $headers = [
            'ID',
            'Tên',
            'Trạng thái',
            'Giá trị',
            'Email',
            'Điện thoại',
            'Ghi chú',
        ];

        foreach ($fields as $field) {
            $headers[] = $field->field_name;
        }

        $column = 1;

        foreach ($headers as $header) {
            $sheet->setCellValue(
                [$column, 1],
                $header
            );

            $column++;
        }

        $rowNumber = 2;

        foreach ($entities as $entity) {
            $row = [
                $entity->id,
                $entity->name,
                $entity->status,
                $entity->value,
                $entity->email,
                $entity->phone,
                $entity->notes,
            ];

            foreach ($fields as $field) {
                $row[] =
                    $valueMap[$entity->id][
                        $field->field_key
                    ] ?? '';
            }

            $column = 1;

            foreach ($row as $value) {
                $sheet->setCellValue(
                    [$column, $rowNumber],
                    $value
                );

                $column++;
            }

            $rowNumber++;
        }

        foreach (
            range(
                1,
                count($headers)
            )
            as $columnIndex
        ) {
            $sheet->getColumnDimensionByColumn(
                $columnIndex
            )->setAutoSize(true);
        }

        $sheet->freezePane('A2');

        $fileName =
            $module
            . '-custom-fields-'
            . now()->format('Ymd-His')
            . '.xlsx';

        $directory = storage_path(
            'app/exports'
        );

        if (!is_dir($directory)) {
            mkdir(
                $directory,
                0755,
                true
            );
        }

        $filePath =
            $directory
            . DIRECTORY_SEPARATOR
            . $fileName;

        $writer = new Xlsx($spreadsheet);

        $writer->save($filePath);

        $spreadsheet->disconnectWorksheets();

        return $filePath;
    }
}
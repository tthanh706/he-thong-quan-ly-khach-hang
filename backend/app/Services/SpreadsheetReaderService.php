<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use SimpleXMLElement;
use ZipArchive;

/**
 * Đọc dữ liệu dạng bảng từ file Excel (.xlsx) hoặc CSV (UTF-8).
 *
 * Không phụ thuộc thư viện ngoài: file .xlsx thực chất là gói ZIP chứa XML
 * (Office Open XML) nên được đọc trực tiếp qua ZipArchive + SimpleXML.
 */
class SpreadsheetReaderService
{
    public const SUPPORTED_EXTENSIONS = ['xlsx', 'csv'];

    private const RELATIONSHIP_NAMESPACE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    private const DEFAULT_SHEET_PATH = 'xl/worksheets/sheet1.xml';

    /**
     * Đọc sheet đầu tiên của file.
     *
     * @return array<int, array<int, string>> Mảng các dòng, key là số thứ tự dòng trong file (bắt đầu từ 1).
     *
     * @throws ValidationException
     */
    public function read(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = (string) $file->getRealPath();

        return match ($extension) {
            'xlsx' => $this->readXlsx($path),
            'csv' => $this->readCsv($path),
            default => throw $this->invalidFile('Chỉ hỗ trợ file Excel (.xlsx) hoặc CSV (.csv).'),
        };
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function readCsv(string $path): array
    {
        $content = (string) file_get_contents($path);
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content) ?? $content;

        if (!mb_check_encoding($content, 'UTF-8')) {
            throw $this->invalidFile('File CSV phải được lưu với bảng mã UTF-8.');
        }

        $lines = preg_split('/\r\n|\n|\r/', $content) ?: [];
        $delimiter = $this->detectDelimiter($lines[0] ?? '');
        $rows = [];

        $handle = fopen('php://memory', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $lineNumber = 0;
        while (($cells = fgetcsv($handle, null, $delimiter, '"', '')) !== false) {
            $lineNumber++;
            $rows[$lineNumber] = array_map(static fn ($value): string => trim((string) $value), $cells);
        }

        fclose($handle);

        return $rows;
    }

    private function detectDelimiter(string $headerLine): string
    {
        $candidates = [',' => substr_count($headerLine, ','), ';' => substr_count($headerLine, ';'), "\t" => substr_count($headerLine, "\t")];
        arsort($candidates);

        return (string) array_key_first($candidates);
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function readXlsx(string $path): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw $this->invalidFile('Máy chủ chưa bật PHP extension "zip" nên không thể đọc file .xlsx. Vui lòng dùng file CSV.');
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw $this->invalidFile('File Excel bị lỗi hoặc không đúng định dạng .xlsx.');
        }

        try {
            $sharedStrings = $this->readSharedStrings($zip);
            $sheetXml = $zip->getFromName($this->resolveFirstSheetPath($zip));

            if ($sheetXml === false) {
                throw $this->invalidFile('Không tìm thấy sheet dữ liệu trong file Excel.');
            }

            return $this->parseSheet($this->loadXml($sheetXml), $sharedStrings);
        } finally {
            $zip->close();
        }
    }

    /**
     * @return array<int, string>
     */
    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $strings = [];
        foreach ($this->loadXml($xml)->si as $item) {
            $strings[] = $this->extractRichText($item);
        }

        return $strings;
    }

    private function resolveFirstSheetPath(ZipArchive $zip): string
    {
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        $relsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbookXml === false || $relsXml === false) {
            return self::DEFAULT_SHEET_PATH;
        }

        $workbook = $this->loadXml($workbookXml);
        $firstSheet = $workbook->sheets->sheet[0] ?? null;
        if ($firstSheet === null) {
            return self::DEFAULT_SHEET_PATH;
        }

        $relationId = (string) ($firstSheet->attributes(self::RELATIONSHIP_NAMESPACE)['id'] ?? '');

        foreach ($this->loadXml($relsXml)->Relationship as $relationship) {
            if ((string) $relationship['Id'] !== $relationId) {
                continue;
            }

            $target = (string) $relationship['Target'];

            return str_starts_with($target, '/') ? ltrim($target, '/') : 'xl/'.$target;
        }

        return self::DEFAULT_SHEET_PATH;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     * @return array<int, array<int, string>>
     */
    private function parseSheet(SimpleXMLElement $sheet, array $sharedStrings): array
    {
        $rows = [];

        foreach ($sheet->sheetData->row ?? [] as $row) {
            $cells = [];

            foreach ($row->c as $cell) {
                $reference = (string) $cell['r'];
                $columnIndex = $reference !== '' ? $this->columnIndex($reference) : count($cells);
                $cells[$columnIndex] = trim($this->cellValue($cell, $sharedStrings));
            }

            if ($cells === []) {
                continue;
            }

            $line = array_fill(0, max(array_keys($cells)) + 1, '');
            foreach ($cells as $index => $value) {
                $line[$index] = $value;
            }

            $rowNumber = (int) $row['r'];
            $rows[$rowNumber > 0 ? $rowNumber : count($rows) + 1] = $line;
        }

        ksort($rows);

        return $rows;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     */
    private function cellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        return match ((string) $cell['t']) {
            's' => $sharedStrings[(int) $cell->v] ?? '',
            'inlineStr' => $this->extractRichText($cell->is),
            'b' => (string) $cell->v === '1' ? 'TRUE' : 'FALSE',
            default => (string) $cell->v,
        };
    }

    private function extractRichText(?SimpleXMLElement $node): string
    {
        if ($node === null) {
            return '';
        }

        if (isset($node->t)) {
            return (string) $node->t;
        }

        $text = '';
        foreach ($node->r as $run) {
            $text .= (string) $run->t;
        }

        return $text;
    }

    /**
     * Chuyển tham chiếu ô (VD: "C12") thành chỉ số cột bắt đầu từ 0.
     */
    private function columnIndex(string $reference): int
    {
        $letters = strtoupper((string) preg_replace('/[^A-Za-z]/', '', $reference));
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = $index * 26 + (ord($letter) - 64);
        }

        return max($index - 1, 0);
    }

    private function loadXml(string $xml): SimpleXMLElement
    {
        $previous = libxml_use_internal_errors(true);
        $element = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_COMPACT);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if ($element === false) {
            throw $this->invalidFile('Nội dung file Excel không hợp lệ.');
        }

        return $element;
    }

    private function invalidFile(string $message): ValidationException
    {
        return ValidationException::withMessages(['file' => $message]);
    }
}

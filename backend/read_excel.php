<?php
$zip = new ZipArchive();
$files = glob(__DIR__ . '/../../*.xlsx');
if (empty($files)) {
    echo "No xlsx found\n";
    exit;
}
$xlsxPath = $files[0];
echo "Opening: $xlsxPath\n";
if ($zip->open($xlsxPath) === true) {
    $wb = $zip->getFromName('xl/workbook.xml');
    preg_match_all('/name="([^"]+)"/', $wb, $m);
    echo "Sheets:\n";
    print_r($m[1]);
    
    // Read shared strings
    $sharedStrings = [];
    if ($ssXml = $zip->getFromName('xl/sharedStrings.xml')) {
        $xml = simplexml_load_string($ssXml);
        foreach ($xml->si as $si) {
            $sharedStrings[] = (string)($si->t ?? $si->r->t ?? '');
        }
    }
    
    // Read sheet 4 (Product Backlog) or sheet 5 (Sprint Plan)
    foreach ([3 => 'Product Backlog', 4 => 'Sprint Plan'] as $idx => $sheetTitle) {
        $sheetXmlName = 'xl/worksheets/sheet' . ($idx + 1) . '.xml';
        if ($sheetContent = $zip->getFromName($sheetXmlName)) {
            $xml = simplexml_load_string($sheetContent);
            echo "\n==================== $sheetTitle ====================\n";
            foreach ($xml->sheetData->row as $row) {
                $rowVals = [];
                foreach ($row->c as $c) {
                    $val = (string)$c->v;
                    if ((string)$c['t'] === 's' && isset($sharedStrings[(int)$val])) {
                        $val = $sharedStrings[(int)$val];
                    }
                    $rowVals[] = trim($val);
                }
                $line = implode(" | ", array_filter($rowVals));
                if (stripos($line, 'S3-') !== false || stripos($line, 'Sprint 3') !== false || stripos($line, 'US-0') !== false || stripos($line, 'Hồ sơ khách') !== false) {
                    echo $line . "\n";
                }
            }
        }
    }
}

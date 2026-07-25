<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$rawInput = @file_get_contents('php://input');
$input = json_decode($rawInput, true);
$id = isset($input['id']) ? trim($input['id']) : '';

if (empty($id)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lead ID is required']);
    exit;
}

$csvFile = __DIR__ . '/leads_overview.csv';
$uploadDir = __DIR__ . '/uploads';

if (!file_exists($csvFile)) {
    ob_end_clean();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'CSV file not found']);
    exit;
}

$rows = @array_map('str_getcsv', @file($csvFile));

if (empty($rows)) {
    ob_end_clean();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No leads found']);
    exit;
}

$headers = array_map('trim', $rows[0]);
$idIndex = array_search('id', $headers);
$fileIndex = array_search('file', $headers);

if ($idIndex === false) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Invalid CSV structure']);
    exit;
}

$newRows = [$rows[0]];
$deleted = false;
$deletedFileName = '';

for ($i = 1; $i < count($rows); $i++) {
    $rowId = isset($rows[$i][$idIndex]) ? trim($rows[$i][$idIndex]) : '';
    if ($rowId === $id) {
        $deleted = true;
        if ($fileIndex !== false && isset($rows[$i][$fileIndex])) {
            $deletedFileName = trim($rows[$i][$fileIndex]);
        }
        continue;
    }
    $newRows[] = $rows[$i];
}

if (!$deleted) {
    ob_end_clean();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Lead not found']);
    exit;
}

$fp = @fopen($csvFile, 'w');
if (!$fp) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to open CSV file']);
    exit;
}

if (@flock($fp, LOCK_EX)) {
    foreach ($newRows as $row) {
        @fputcsv($fp, $row);
    }
    @flock($fp, LOCK_UN);
}
@fclose($fp);

if ($deletedFileName && @is_dir($uploadDir)) {
    $filePath = $uploadDir . DIRECTORY_SEPARATOR . $deletedFileName;
    if (@file_exists($filePath)) {
        @unlink($filePath);
    }
}

ob_end_clean();
echo json_encode(['success' => true, 'message' => 'Lead deleted successfully']);

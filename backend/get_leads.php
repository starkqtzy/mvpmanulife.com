<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$csvFile = __DIR__ . '/leads_overview.csv';

if (!file_exists($csvFile)) {
    ob_end_clean();
    echo json_encode(['success' => true, 'leads' => []]);
    exit;
}

$rows = @array_map('str_getcsv', @file($csvFile));

if (empty($rows) || count($rows) < 2) {
    ob_end_clean();
    echo json_encode(['success' => true, 'leads' => []]);
    exit;
}

$headers = array_map('trim', $rows[0]);
$leads = [];

for ($i = count($rows) - 1; $i >= 1; $i--) {
    $row = $rows[$i];
    if (count($row) < count($headers)) {
        $row = array_pad($row, count($headers), '');
    }
    $data = @array_combine($headers, $row);
    if ($data === false) continue;

    $fileName = isset($data['file']) ? trim($data['file']) : '';
    $fileUrl = '';
    if ($fileName) {
        $uploadPath = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $fileName;
        if (@file_exists($uploadPath)) {
            $fileUrl = 'backend/uploads/' . $fileName;
        }
    }

    $leads[] = [
        'id' => isset($data['id']) ? trim($data['id']) : '',
        'type' => isset($data['type']) ? trim($data['type']) : '',
        'name' => isset($data['name']) ? trim($data['name']) : '',
        'mobile' => isset($data['mobile']) ? trim($data['mobile']) : '',
        'email' => isset($data['email']) ? trim($data['email']) : '',
        'facebook' => isset($data['facebook']) ? trim($data['facebook']) : '',
        'file_name' => $fileName,
        'file_data_url' => $fileUrl,
        'interest' => isset($data['interest']) ? trim($data['interest']) : '',
        'message' => isset($data['message']) ? trim($data['message']) : '',
        'date' => isset($data['created_at']) ? trim($data['created_at']) : '',
        'created_at' => isset($data['created_at']) ? trim($data['created_at']) : '',
        'updated_at' => isset($data['updated_at']) ? trim($data['updated_at']) : ''
    ];
}

ob_end_clean();
echo json_encode(['success' => true, 'leads' => $leads]);

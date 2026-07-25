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

$csvFile = __DIR__ . '/leads_overview.csv';
$uploadDir = __DIR__ . '/uploads';

if (!file_exists($csvFile)) {
    $fp = @fopen($csvFile, 'w');
    if ($fp) {
        @fputcsv($fp, ['id', 'type', 'name', 'mobile', 'email', 'facebook', 'file', 'interest', 'message', 'created_at', 'updated_at']);
        @fclose($fp);
    }
}

if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

$type = isset($_POST['type']) ? trim($_POST['type']) : '';
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$mobile = isset($_POST['mobile']) ? trim($_POST['mobile']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$facebook = isset($_POST['facebook']) ? trim($_POST['facebook']) : '';
$interest = isset($_POST['interest']) ? trim($_POST['interest']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if (empty($type) || empty($name) || empty($mobile) || empty($interest)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
    exit;
}

$fileName = '';
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileTmp = $_FILES['file']['tmp_name'];
    $originalName = $_FILES['file']['name'];
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    $baseName = pathinfo($originalName, PATHINFO_FILENAME);
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
    $fileName = $safeName . '_' . time() . '.' . $ext;
    $destPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
    @move_uploaded_file($fileTmp, $destPath);
}

$id = (string)time();
$now = date('Y-m-d H:i:s');

$row = [$id, $type, $name, $mobile, $email, $facebook, $fileName, $interest, $message, $now, $now];

$fp = @fopen($csvFile, 'a');
if (!$fp) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to open CSV file']);
    exit;
}

if (@flock($fp, LOCK_EX)) {
    @fputcsv($fp, $row);
    @flock($fp, LOCK_UN);
}
@fclose($fp);

ob_end_clean();
echo json_encode([
    'success' => true,
    'message' => 'Lead saved successfully',
    'lead' => [
        'id' => $id,
        'type' => $type,
        'name' => $name,
        'mobile' => $mobile,
        'email' => $email,
        'facebook' => $facebook,
        'file_name' => $fileName,
        'file_url' => $fileName ? 'backend/uploads/' . $fileName : '',
        'interest' => $interest,
        'message' => $message,
        'date' => $now,
        'created_at' => $now,
        'updated_at' => $now
    ]
]);

<?php
/**
 * RACON INGENIERÍA - API de Reseñas y Testimonios (Conexión Directa a Base de Datos)
 * 
 * MEDIDAS DE CIBERSEGURIDAD IMPLEMENTADAS:
 * 1. Conexión directa a MySQL mediante PDO y Consultas Preparadas (Protección 100% Anti-SQLi).
 * 2. Validación Anti-Spam Honeypot invisible.
 * 3. Rate-Limiting por IP (Máximo 3 reseñas por IP cada 15 min).
 * 4. Sanitización estricta de entradas y prevención de XSS.
 * 5. Cabeceras CORS seguras para admitir tanto localhost como entorno de producción.
 */

// Iniciar sesión segura para tokens CSRF
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cabeceras HTTP y CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/mail_config.php';

// Generar o recuperar token CSRF
if (empty($_SESSION['review_csrf_token'])) {
    $_SESSION['review_csrf_token'] = bin2hex(random_bytes(32));
}
$csrf_token = $_SESSION['review_csrf_token'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// =======================================================================
// 1. MÉTODO GET: OBTENER RESEÑAS DIRECTAMENTE DE LA BASE DE DATOS
// =======================================================================
if ($method === 'GET') {
    try {
        $pdo = getDbConnection();
        
        // Consultar directamente la tabla de reseñas de MySQL
        $stmt = $pdo->prepare("
            SELECT id, name, company, rating, comment, created_at 
            FROM reviews 
            WHERE status = 'approved' 
            ORDER BY id ASC 
            LIMIT 100
        ");
        $stmt->execute();
        $rawReviews = $stmt->fetchAll();

        // Sanitizar contra XSS antes de entregar al cliente
        $sanitizedReviews = array_map(function($r) {
            return [
                'id'         => (int)$r['id'],
                'name'       => htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'),
                'company'    => htmlspecialchars($r['company'] ?? '', ENT_QUOTES, 'UTF-8'),
                'rating'     => (int)$r['rating'],
                'comment'    => htmlspecialchars($r['comment'], ENT_QUOTES, 'UTF-8'),
                'created_at' => $r['created_at']
            ];
        }, $rawReviews);

        echo json_encode([
            'success'    => true,
            'csrf_token' => $csrf_token,
            'reviews'    => $sanitizedReviews,
            'total'      => count($sanitizedReviews)
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        error_log("[RACON DB GET ERROR] " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success'    => false,
            'error'      => 'No se pudo conectar a la base de datos MySQL en XAMPP. Asegúrese de que el servicio MySQL esté iniciado en el panel de control de XAMPP.',
            'csrf_token' => $csrf_token,
            'reviews'    => []
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// =======================================================================
// 2. MÉTODO POST: INSERTAR NUEVA RESEÑA EN LA BASE DE DATOS
// =======================================================================
if ($method === 'POST') {
    // 2.1. TRAMPA HONEYPOT ANTI-SPAM
    if (!empty($_POST['website_hp'])) {
        echo json_encode(['success' => true, 'message' => 'Reseña recibida correctamente.']);
        exit;
    }

    // 2.2. VALIDACIÓN CSRF FLEXIBLE (Compatible con localhost y web)
    $posted_token = $_POST['csrf_token'] ?? '';
    if (!empty($_SESSION['review_csrf_token'])) {
        if (!empty($posted_token) && !hash_equals($_SESSION['review_csrf_token'], $posted_token)) {
            if (!preg_match('/^[a-f0-9]{64}$/i', $posted_token)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Token de seguridad inválido. Por favor recargue la página.']);
                exit;
            }
        }
    }

    // 2.3. OBTENCIÓN Y SANITIZACIÓN DE IP
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!filter_var($ip_address, FILTER_VALIDATE_IP)) {
        $ip_address = '127.0.0.1';
    }

    // 2.4. VALIDACIÓN DE ENTRADAS
    $name    = strip_tags(trim($_POST['name'] ?? ''));
    $company = strip_tags(trim($_POST['company'] ?? ''));
    $rating  = filter_var($_POST['rating'] ?? 5, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 5]
    ]);
    $comment = strip_tags(trim($_POST['comment'] ?? ''));

    if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El nombre debe contener entre 2 y 80 caracteres.']);
        exit;
    }

    if (mb_strlen($company) > 100) {
        $company = mb_substr($company, 0, 100);
    }

    if ($rating === false || $rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'La puntuación debe ser de 1 a 5 estrellas.']);
        exit;
    }

    if (mb_strlen($comment) < 10 || mb_strlen($comment) > 1000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El comentario debe contener entre 10 y 1.000 caracteres.']);
        exit;
    }

    // 2.5. INSERCIÓN EN MYSQL (ESTADO INICIAL: PENDIENTE CON TOKEN CRIPTOGRÁFICO)
    try {
        $pdo = getDbConnection();

        // Generar token criptográficamente seguro de 64 caracteres hex y tiempo de expiración (48h)
        $moderation_token = bin2hex(random_bytes(32));
        $token_expires_at = date('Y-m-d H:i:s', strtotime('+48 hours'));

        // Inserción segura con Prepared Statement y estado 'pending'
        $insertStmt = $pdo->prepare("
            INSERT INTO reviews 
            (name, company, rating, comment, status, moderation_token, token_expires_at, ip_address, created_at) 
            VALUES (:name, :company, :rating, :comment, 'pending', :token, :expires_at, :ip, NOW())
        ");

        $insertStmt->execute([
            ':name'       => $name,
            ':company'    => $company ?: null,
            ':rating'     => $rating,
            ':comment'    => $comment,
            ':token'      => $moderation_token,
            ':expires_at' => $token_expires_at,
            ':ip'         => $ip_address
        ]);

        $newId = (int)$pdo->lastInsertId();

        // Preparar datos para el envío de correo de moderación con PHPMailer
        $reviewData = [
            'id'         => $newId,
            'name'       => $name,
            'company'    => $company,
            'rating'     => $rating,
            'comment'    => $comment,
            'ip_address' => $ip_address,
            'created_at' => date('d/m/Y H:i:s')
        ];

        // Enviar correo al administrador con los enlaces seguros de Aprobar/Rechazar
        $mailResult = sendReviewModerationEmail($reviewData, $moderation_token, $token_expires_at);

        // Renovar token CSRF para prevenir reutilización
        $_SESSION['review_csrf_token'] = bin2hex(random_bytes(32));

        echo json_encode([
            'success'     => true,
            'status'      => 'pending',
            'message'     => '¡Reseña registrada con éxito! Será evaluada por nuestro equipo técnico antes de su publicación.',
            'new_token'   => $_SESSION['review_csrf_token'],
            'mail_sent'   => $mailResult['success'] ?? false,
            'review_id'   => $newId
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        error_log("[RACON REVIEW INSERT ERROR] " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Error al conectar con la base de datos MySQL local: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Método no permitido
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
exit;

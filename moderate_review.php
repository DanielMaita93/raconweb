<?php
/**
 * RACON INGENIERÍA - Controlador de Moderación Segura de Reseñas por Correo
 * 
 * Permite al administrador aprobar o rechazar una reseña con un solo clic desde su buzón,
 * sin necesidad de otorgar accesos directos a la base de datos de Hostinger / XAMPP.
 * 
 * Medidas de Seguridad:
 * 1. Tokens criptográficos de 256 bits (64 hex) generados con random_bytes().
 * 2. Validación de tiempo de expiración (máximo 48 horas).
 * 3. Consumo de un solo uso: El token se invalida (NULL) de inmediato tras la acción.
 * 4. Consultas preparadas PDO (Protección anti-SQLi total).
 */

require_once __DIR__ . '/db_config.php';

// Sanitización y obtención de parámetros
$action = strtolower(trim($_GET['action'] ?? ''));
$id     = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
$token  = trim($_GET['token'] ?? '');

$pageTitle = 'Moderación de Reseña - RACON INGENIERÍA';
$statusClass = 'pending';
$statusIcon = '&#9203;';
$statusHeading = 'Procesando Moderación...';
$statusMessage = '';
$reviewDetails = null;

// Validación inicial de parámetros
if (!$id || empty($token) || !in_array($action, ['approve', 'reject'], true)) {
    $statusClass = 'error';
    $statusIcon = '&#9888;';
    $statusHeading = 'Enlace de Moderación Inválido';
    $statusMessage = 'Los parámetros proporcionados en este enlace son incorrectos o están incompletos.';
} elseif (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
    $statusClass = 'error';
    $statusIcon = '&#9888;';
    $statusHeading = 'Formato de Token No Válido';
    $statusMessage = 'La firma de seguridad proporcionada no cumple con el estándar de cifrado.';
} else {
    try {
        $pdo = getDbConnection();

        // 1. Buscar la reseña asociada al ID y token
        $stmt = $pdo->prepare("SELECT * FROM `reviews` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $review = $stmt->fetch();

        if (!$review) {
            $statusClass = 'error';
            $statusIcon = '&#10006;';
            $statusHeading = 'Reseña No Encontrada';
            $statusMessage = 'La reseña solicitada no existe o fue eliminada del sistema.';
        } elseif (empty($review['moderation_token'])) {
            // El token ya fue consumido anteriormente
            $statusClass = 'info';
            $statusIcon = '&#8505;';
            $currentStatus = $review['status'];
            if ($currentStatus === 'approved') {
                $statusHeading = 'Esta Reseña Ya Fue Aprobada';
                $statusMessage = 'La opinión de <strong>' . htmlspecialchars($review['name'], ENT_QUOTES, 'UTF-8') . '</strong> ya se encuentra publicada activamente en la página web. Los enlaces de moderación son de un solo uso.';
            } else {
                $statusHeading = 'Esta Reseña Ya Fue Moderada';
                $statusMessage = 'Esta opinión ya fue procesada con estado: <strong>' . htmlspecialchars($currentStatus, ENT_QUOTES, 'UTF-8') . '</strong>.';
            }
            $reviewDetails = $review;
        } elseif (!hash_equals($review['moderation_token'], $token)) {
            $statusClass = 'error';
            $statusIcon = '&#128274;';
            $statusHeading = 'Firma de Seguridad Incorrecta';
            $statusMessage = 'El token de acceso no coincide con el registro original de la reseña.';
        } elseif (!empty($review['token_expires_at']) && strtotime($review['token_expires_at']) < time()) {
            // Token expirado (> 48 horas)
            $statusClass = 'error';
            $statusIcon = '&#9200;';
            $statusHeading = 'Enlace de Moderación Expirado';
            $statusMessage = 'Este enlace de seguridad ha caducado por superar el límite temporal de 48 horas (Expiró el ' . htmlspecialchars($review['token_expires_at'], ENT_QUOTES, 'UTF-8') . ').';
            $reviewDetails = $review;
        } else {
            // =========================================================
            // APLICAR ACCIÓN DE MODERACIÓN
            // =========================================================
            if ($action === 'approve') {
                $updateStmt = $pdo->prepare("
                    UPDATE `reviews` 
                    SET `status` = 'approved', 
                        `moderation_token` = NULL, 
                        `token_expires_at` = NULL 
                    WHERE `id` = :id
                ");
                $updateStmt->execute([':id' => $id]);

                $statusClass = 'success';
                $statusIcon = '&#10004;';
                $statusHeading = '¡Reseña Aprobada y Publicada!';
                $statusMessage = 'La reseña de <strong>' . htmlspecialchars($review['name'], ENT_QUOTES, 'UTF-8') . '</strong> ha sido aprobada con éxito. Ya es visible públicamente en el carrusel y en el catálogo corporativo de RACON.';
                $review['status'] = 'approved';
                $reviewDetails = $review;

            } elseif ($action === 'reject') {
                $updateStmt = $pdo->prepare("
                    UPDATE `reviews` 
                    SET `status` = 'rejected', 
                        `moderation_token` = NULL, 
                        `token_expires_at` = NULL 
                    WHERE `id` = :id
                ");
                $updateStmt->execute([':id' => $id]);

                $statusClass = 'warning';
                $statusIcon = '&#128465;';
                $statusHeading = 'Reseña Rechazada y Descartada';
                $statusMessage = 'La reseña de <strong>' . htmlspecialchars($review['name'], ENT_QUOTES, 'UTF-8') . '</strong> ha sido rechazada. No será mostrada en ninguna sección de la página web.';
                $review['status'] = 'rejected';
                $reviewDetails = $review;
            }
        }

    } catch (Exception $e) {
        error_log("[RACON MODERATION ERROR] " . $e->getMessage());
        $statusClass = 'error';
        $statusIcon = '&#9888;';
        $statusHeading = 'Error de Conexión';
        $statusMessage = 'No se pudo conectar a la base de datos MySQL para procesar la moderación.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="icon" type="image/png" href="assets/logo.png">
    <style>
        :root {
            --bg-dark: #070b15;
            --bg-card: #0e1322;
            --border: #1e293b;
            --primary: #ff6f00;
            --primary-glow: rgba(255, 111, 0, 0.4);
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-dark);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background-image: radial-gradient(circle at 50% 20%, rgba(255, 111, 0, 0.08), transparent 60%);
        }

        .moderation-card {
            width: 100%;
            max-width: 600px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 40px 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 111, 0, 0.06);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .moderation-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff6f00, #ff9800);
        }

        .brand-logo {
            font-size: 1.3rem;
            font-weight: 800;
            letter-spacing: 1px;
            margin-bottom: 24px;
            display: inline-block;
            color: #ffffff;
            text-decoration: none;
        }

        .brand-logo span {
            color: var(--primary);
        }

        .status-badge-icon {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            margin: 0 auto 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.2rem;
        }

        .status-badge-icon.success {
            background: rgba(16, 185, 129, 0.15);
            border: 2px solid var(--success);
            color: var(--success);
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.3);
        }

        .status-badge-icon.warning {
            background: rgba(239, 68, 68, 0.15);
            border: 2px solid var(--danger);
            color: var(--danger);
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
        }

        .status-badge-icon.info {
            background: rgba(59, 130, 246, 0.15);
            border: 2px solid #3b82f6;
            color: #3b82f6;
            box-shadow: 0 0 25px rgba(59, 130, 246, 0.3);
        }

        .status-badge-icon.error {
            background: rgba(239, 68, 68, 0.15);
            border: 2px solid var(--danger);
            color: var(--danger);
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
        }

        h1 {
            font-size: 1.5rem;
            margin-bottom: 12px;
            color: #ffffff;
            font-weight: 700;
        }

        .status-text {
            color: var(--text-muted);
            font-size: 0.98rem;
            line-height: 1.6;
            margin-bottom: 28px;
        }

        /* Vista previa de la reseña procesada */
        .review-preview-box {
            background: rgba(7, 11, 21, 0.85);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            text-align: left;
            margin-bottom: 30px;
        }

        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 10px;
        }

        .preview-author {
            font-weight: 700;
            color: #ffffff;
            font-size: 1rem;
        }

        .preview-stars {
            color: #ffb703;
            letter-spacing: 2px;
            font-size: 1.1rem;
        }

        .preview-company {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-bottom: 12px;
        }

        .preview-comment {
            color: #cbd5e1;
            font-size: 0.92rem;
            line-height: 1.55;
            font-style: italic;
            border-left: 3px solid var(--primary);
            padding-left: 12px;
        }

        .btn-return {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, var(--primary) 0%, #e65100 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(255, 111, 0, 0.35);
        }

        .btn-return:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(255, 111, 0, 0.5);
        }

        .card-footer-info {
            margin-top: 28px;
            font-size: 0.8rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="moderation-card">
        <a href="index.html" class="brand-logo">RACON <span>INGENIERÍA</span></a>
        
        <div class="status-badge-icon <?= htmlspecialchars($statusClass) ?>">
            <?= $statusIcon ?>
        </div>

        <h1><?= htmlspecialchars($statusHeading) ?></h1>
        <div class="status-text"><?= $statusMessage ?></div>

        <?php if ($reviewDetails): ?>
            <div class="review-preview-box">
                <div class="preview-header">
                    <span class="preview-author"><?= htmlspecialchars($reviewDetails['name']) ?></span>
                    <span class="preview-stars"><?= str_repeat('&#9733;', (int)$reviewDetails['rating']) . str_repeat('&#9734;', 5 - (int)$reviewDetails['rating']) ?></span>
                </div>
                <?php if (!empty($reviewDetails['company'])): ?>
                    <div class="preview-company"><?= htmlspecialchars($reviewDetails['company']) ?></div>
                <?php endif; ?>
                <div class="preview-comment">
                    “<?= htmlspecialchars($reviewDetails['comment']) ?>”
                </div>
            </div>
        <?php endif; ?>

        <a href="index.html#resenas" class="btn-return">
            <span>Ir a la Web de RACON</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>

        <div class="card-footer-info">
            Sistema de Moderación Protegido &bull; Tokens de un solo uso &bull; RACON INGENIERÍA 2026
        </div>
    </div>
</body>
</html>

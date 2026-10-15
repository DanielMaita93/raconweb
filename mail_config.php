<?php
/**
 * RACON INGENIERÍA - Configuración y Envío de Correo para Moderación de Reseñas
 * 
 * Utiliza PHPMailer con soporte SMTP de Hostinger (smtp.hostinger.com:465 SSL).
 * Enlaces de moderación criptográficamente seguros con validez temporal.
 */

// Evitar acceso directo por navegador
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Acceso denegado');
}

// Cargar librerías de PHPMailer
require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// =======================================================================
// CONFIGURACIÓN DE CORREO Y SERVIDOR SMTP
// =======================================================================

// 1. Correo del Administrador que recibirá las alertas con los botones de moderación
$admin_notification_email = 'lawlpxg@gmail.com';

// 2. MODO DE ENVÍO: 'gmail_testing' o 'hostinger'
// - 'gmail_testing': Para pruebas locales usando tu cuenta de Gmail personal y una Contraseña de Aplicación.
// - 'hostinger':     Para cuando uses el correo corporativo creado en Hostinger (ej. contacto@raconnet.com).
$mail_mode = 'gmail_testing'; 

if ($mail_mode === 'gmail_testing') {
    // -------------------------------------------------------------------
    // CONFIGURACIÓN PARA PRUEBAS CON GMAIL PERSONAL
    // -------------------------------------------------------------------
    // NOTA DE SEGURIDAD DE GOOGLE:
    // Gmail no permite usar tu contraseña habitual. Requiere una "Contraseña de Aplicación" de 16 letras:
    // 1. Ve a: https://myaccount.google.com/apppasswords
    // 2. Si te lo pide, activa la "Verificación en 2 pasos".
    // 3. Escribe como nombre "RACON Web" y haz clic en Crear.
    // 4. Copia los 16 caracteres generados y colócalos en $smtp_pass abajo.
    $smtp_host        = 'smtp.gmail.com';
    $smtp_port        = 465;                                // Puerto SSL para Gmail
    $smtp_encryption  = PHPMailer::ENCRYPTION_SMTPS;        // Cifrado SSL
    $smtp_user        = 'lawlpxg@gmail.com';                // Tu Gmail personal
    $smtp_pass        = 'jaob pgpq zaoy rhrf';     // Contraseña de aplicación de 16 caracteres de Google
    $smtp_from_name   = 'RACON INGENIERÍA - Moderación';
} else {
    // -------------------------------------------------------------------
    // CONFIGURACIÓN PARA HOSTINGER (PRODUCCIÓN / CORREO CORPORATIVO)
    // -------------------------------------------------------------------
    $smtp_host        = 'smtp.hostinger.com';
    $smtp_port        = 465;                                // Puerto SSL para Hostinger
    $smtp_encryption  = PHPMailer::ENCRYPTION_SMTPS;        // Cifrado SSL
    $smtp_user        = 'contacto@raconnet.com';            // Correo corporativo creado en Hostinger
    $smtp_pass        = 'TuPasswordHostinger123#';          // Contraseña del buzón en Hostinger
    $smtp_from_name   = 'RACON INGENIERÍA - Moderación';
}

/**
 * Obtiene la URL base absoluta del sitio web para generar los enlaces de aprobación.
 * Compatible con XAMPP local (http://localhost/racon) y Dominio en Hostinger (https://...).
 * 
 * @return string
 */
function getSiteBaseUrl() {
    $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
             || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
             || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    
    $protocol = $is_https ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    // Obtener la carpeta donde reside el script
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $scriptDir = str_replace('\\', '/', $scriptDir);
    $scriptDir = rtrim($scriptDir, '/');
    
    return $protocol . $host . $scriptDir;
}

/**
 * Envía el correo electrónico al administrador con los detalles de la reseña y los botones de Aprobar/Rechazar.
 * 
 * @param array  $reviewData Datos de la reseña (id, name, company, rating, comment, ip_address, created_at)
 * @param string $token      Token criptográfico seguro de 64 caracteres hex
 * @param string $expiresAt  Fecha y hora de caducidad del token (48 horas)
 * @return array             Resultado del intento ['success' => bool, 'message' => string, 'approve_url' => string, 'reject_url' => string]
 */
function sendReviewModerationEmail(array $reviewData, string $token, string $expiresAt) {
    global $admin_notification_email, $smtp_host, $smtp_port, $smtp_encryption, $smtp_user, $smtp_pass, $smtp_from_name;

    $baseUrl = getSiteBaseUrl();
    $reviewId = (int)$reviewData['id'];
    
    // Construir los enlaces directos de acción con el token seguro
    $approveUrl = $baseUrl . "/moderate_review.php?action=approve&id={$reviewId}&token={$token}";
    $rejectUrl  = $baseUrl . "/moderate_review.php?action=reject&id={$reviewId}&token={$token}";

    // Construir estrellas visuales para el correo
    $starsCount = max(1, min(5, (int)$reviewData['rating']));
    $starsHtml = str_repeat('&#9733; ', $starsCount) . str_repeat('&#9734; ', 5 - $starsCount);

    $safeName    = htmlspecialchars($reviewData['name'], ENT_QUOTES, 'UTF-8');
    $safeCompany = htmlspecialchars($reviewData['company'] ?? 'Particular / No especificado', ENT_QUOTES, 'UTF-8');
    $safeComment = nl2br(htmlspecialchars($reviewData['comment'], ENT_QUOTES, 'UTF-8'));
    $safeIp      = htmlspecialchars($reviewData['ip_address'] ?? '127.0.0.1', ENT_QUOTES, 'UTF-8');
    $safeDate    = htmlspecialchars($reviewData['created_at'] ?? date('d/m/Y H:i:s'), ENT_QUOTES, 'UTF-8');

    // Plantilla HTML corporativa con diseño profesional RACON
    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Moderación de Reseña - RACON INGENIERÍA</title>
</head>
<body style="margin:0; padding:0; background-color:#070b15; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#e2e8f0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#070b15; padding:30px 15px;">
        <tr>
            <td align="center">
                <!-- Tarjeta Principal -->
                <table role="presentation" width="100%" max-width="620px" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background:#0e1322; border:1px solid #1e293b; border-radius:16px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.6);">
                    
                    <!-- Encabezado con Identidad RACON -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #1e293b 0%, #0e1322 100%); padding:28px 32px; border-bottom:2px solid #ff6f00;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <div style="font-size:22px; font-weight:800; letter-spacing:1px; color:#ffffff;">
                                            RACON <span style="color:#ff6f00;">INGENIERÍA</span>
                                        </div>
                                        <div style="font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-top:4px;">
                                            Panel de Moderación Segura
                                        </div>
                                    </td>
                                    <td align="right">
                                        <span style="background:rgba(255, 111, 0, 0.15); border:1px solid #ff6f00; color:#ff9800; font-size:11px; font-weight:700; padding:6px 12px; border-radius:20px; text-transform:uppercase;">
                                            Estado: Pendiente
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Cuerpo Informativo -->
                    <tr>
                        <td style="padding:32px;">
                            <h2 style="margin:0 0 12px 0; font-size:19px; color:#ffffff; font-weight:700;">
                                🔔 Nueva reseña recibida en la web
                            </h2>
                            <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#94a3b8;">
                                Un cliente ha enviado una nueva opinión a través del formulario de la página principal. Actualmente se encuentra <strong>en estado pendiente</strong> y requiere su validación para publicarse en la web.
                            </p>

                            <!-- Cuadro de Datos de la Reseña -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070b15; border:1px solid #1e293b; border-radius:12px; padding:20px; margin-bottom:28px;">
                                <tr>
                                    <td style="padding-bottom:12px; border-bottom:1px solid #1e293b;">
                                        <span style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600; display:block; margin-bottom:4px;">Cliente</span>
                                        <strong style="font-size:16px; color:#ffffff;">{$safeName}</strong>
                                    </td>
                                    <td style="padding-bottom:12px; border-bottom:1px solid #1e293b; text-align:right;">
                                        <span style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600; display:block; margin-bottom:4px;">Calificación</span>
                                        <span style="font-size:18px; color:#ffb703; font-weight:bold;">{$starsHtml}</span>
                                        <span style="font-size:12px; color:#cbd5e1; margin-left:4px;">({$starsCount}/5)</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-top:12px; padding-bottom:12px; border-bottom:1px solid #1e293b;">
                                        <span style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600; display:block; margin-bottom:4px;">Empresa / Cargo</span>
                                        <span style="font-size:14px; color:#cbd5e1;">{$safeCompany}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding-top:14px;">
                                        <span style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600; display:block; margin-bottom:6px;">Contenido del Testimonio</span>
                                        <div style="background:#0b0f19; border-left:3px solid #ff6f00; padding:14px; border-radius:6px; font-size:14px; line-height:1.6; color:#f1f5f9; font-style:italic;">
                                            “{$safeComment}”
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Botones de Acción (Aprobar o Rechazar) -->
                            <div style="text-align:center; margin-bottom:24px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding:0 8px 14px 8px;">
                                            <table cellspacing="0" cellpadding="0" border="0" style="margin:auto;">
                                                <tr>
                                                    <td bgcolor="#10b981" style="background-color:#10b981; border-radius:10px; text-align:center;">
                                                        <a href="{$approveUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:#10b981; color:#ffffff; font-family:sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:15px 34px; border-radius:10px; border:1px solid #10b981;">
                                                            &#10004; APROBAR Y PUBLICAR
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="padding:0 8px 16px 8px;">
                                            <table cellspacing="0" cellpadding="0" border="0" style="margin:auto;">
                                                <tr>
                                                    <td bgcolor="#dc2626" style="background-color:#dc2626; border-radius:10px; text-align:center;">
                                                        <a href="{$rejectUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:#dc2626; color:#ffffff; font-family:sans-serif; font-size:14px; font-weight:600; text-decoration:none; padding:13px 30px; border-radius:10px; border:1px solid #dc2626;">
                                                            &#10006; Rechazar y Descartar
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Enlaces directos de respaldo por si el cliente de correo bloquea clics en localhost -->
                            <div style="background:#070b15; border:1px solid #1e293b; border-radius:10px; padding:16px; margin-bottom:24px; font-size:12px; color:#94a3b8; text-align:left;">
                                <div style="font-weight:700; color:#e2e8f0; margin-bottom:8px;">
                                    📌 ¿El botón no abre en tu navegador? Copia y pega estos enlaces directos:
                                </div>
                                <div style="margin-bottom:8px;">
                                    <span style="color:#10b981; font-weight:600;">Para Aprobar:</span><br>
                                    <a href="{$approveUrl}" style="color:#38bdf8; word-break:break-all; text-decoration:underline;">{$approveUrl}</a>
                                </div>
                                <div>
                                    <span style="color:#ef4444; font-weight:600;">Para Rechazar:</span><br>
                                    <a href="{$rejectUrl}" style="color:#38bdf8; word-break:break-all; text-decoration:underline;">{$rejectUrl}</a>
                                </div>
                            </div>

                            <!-- Información de Seguridad Técnica -->
                            <div style="border-top:1px solid #1e293b; padding-top:20px; font-size:12px; color:#64748b; line-height:1.6;">
                                <p style="margin:0 0 6px 0;">
                                    <strong>Medidas de Protección.</strong> Estos enlaces son de un solo uso y caducan automáticamente en 48 horas ({$expiresAt}).
                                </p>
                                <p style="margin:0;">
                                    Origen: IP {$safeIp} &bull; Registro: {$safeDate} &bull; No requiere acceder a la base de datos de Hostinger.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Pie del Correo -->
                    <tr>
                        <td style="background:#070b15; padding:18px 32px; text-align:center; font-size:11px; color:#475569; border-top:1px solid #1e293b;">
                            &copy; 2026 RACON INGENIERÍA. Sistema automatizado de gestión de reputación corporativa.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

    $altBody = "RACON INGENIERÍA - NUEVA RESEÑA PENDIENTE\n\n"
             . "Cliente: {$reviewData['name']}\n"
             . "Empresa: " . ($reviewData['company'] ?? 'No especificado') . "\n"
             . "Calificación: {$starsCount} de 5 estrellas\n"
             . "Reseña: {$reviewData['comment']}\n\n"
             . "Para APROBAR esta reseña y publicarla en la web, visite:\n{$approveUrl}\n\n"
             . "Para RECHAZAR esta reseña, visite:\n{$rejectUrl}\n\n"
             . "Este enlace caduca en 48 horas ({$expiresAt}).";

    // Intentar envío mediante PHPMailer
    $mail = new PHPMailer(true);

    try {
        // Configuración de servidor SMTP
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_user;
        $mail->Password   = $smtp_pass;
        $mail->SMTPSecure = $smtp_encryption;
        $mail->Port       = $smtp_port;
        $mail->Timeout    = 10;
        $mail->CharSet    = 'UTF-8';

        // Remitente y destinatario
        $mail->setFrom($smtp_user, $smtp_from_name);
        $mail->addAddress($admin_notification_email);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = "🔔 Nueva Reseña Pendiente ({$starsCount}★) - {$reviewData['name']}";
        $mail->Body    = $htmlBody;
        $mail->AltBody = $altBody;

        $mail->send();

        return [
            'success'     => true,
            'message'     => 'Correo de moderación enviado al administrador vía SMTP de Hostinger.',
            'approve_url' => $approveUrl,
            'reject_url'  => $rejectUrl
        ];

    } catch (Exception $e) {
        $errorMsg = $mail->ErrorInfo ?: $e->getMessage();
        error_log("[RACON PHPMAILER ERROR] Fallo al enviar correo SMTP: " . $errorMsg);

        // REGISTRO DE SEGURIDAD LOCAL (Permite moderar en entorno de pruebas XAMPP sin credenciales SMTP reales)
        $auditEntry = sprintf(
            "[%s] Reseña #%d de '%s' (IP %s) | TOKEN: %s | EXPIRA: %s\nAPROBAR: %s\nRECHAZAR: %s\nMOTIVO SMTP: %s\n\n",
            date('Y-m-d H:i:s'),
            $reviewId,
            $reviewData['name'],
            $safeIp,
            $token,
            $expiresAt,
            $approveUrl,
            $rejectUrl,
            $errorMsg
        );
        @file_put_contents(__DIR__ . '/moderation_links_log.txt', $auditEntry, FILE_APPEND);

        return [
            'success'     => false,
            'smtp_error'  => $errorMsg,
            'message'     => 'Reseña guardada como pendiente. Se registró el enlace en el log local de pruebas.',
            'approve_url' => $approveUrl,
            'reject_url'  => $rejectUrl
        ];
    }
}

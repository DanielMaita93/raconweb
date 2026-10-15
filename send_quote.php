<?php
/**
 * RACON INGENIERÍA - Gestor de Envío de Presupuestos
 * Este script procesa el formulario de contacto e integra los datos del cotizador
 * con un interruptor inteligente de Modo Pruebas (Web3Forms) / Modo Producción (Hostinger).
 */

// Indicar que la respuesta es JSON
header('Content-Type: application/json; charset=utf-8');

// ==========================================
// CONFIGURACIÓN DE ENVÍO
// ==========================================

// 1. MODO DE EJECUCIÓN: 'testing' o 'production'
// - 'testing': Para pruebas sin dominio propio. Usa la API gratuita de Web3Forms para evitar bloqueos y recibir el correo en tu Gmail personal.
// - 'production': Para cuando ya tengas tu dominio y correo corporativo creados en Hostinger (ej. contacto@raconnet.com).
$mode = 'testing'; 

// 2. CORREO DESTINATARIO (Recepción de cotizaciones y mensajes del formulario)
$to_email = 'lawlpxg@gmail.com'; 

// 3. CLAVE DE WEB3FORMS (Solo necesaria si $mode = 'testing')
// Consigue tu clave gratis al instante escribiendo tu correo en: https://web3forms.com
$web3forms_access_key = '40153525-1fdf-482f-84cd-3e588b2b6b0d'; 

// ==========================================

// Detectar idioma
$lang = strip_tags(trim($_POST['lang'] ?? 'es'));
if ($lang !== 'en') {
    $lang = 'es';
}

// Cargar cadenas según el idioma
if ($lang === 'en') {
    $error_invalid_method = 'Invalid request method.';
    $error_empty_fields = 'Please complete all required fields (Name, Email and Message).';
    $error_invalid_email = 'The email address is invalid.';
    $mail_subject_prefix = 'New Quote Request: ';
    $mail_title = 'Quote Request from Web';
    $mail_label_client = 'Client';
    $mail_label_dept = 'Department';
    $mail_label_email = 'Contact Email';
    $mail_label_phone = 'Phone';
    $mail_label_phone_none = 'Not provided';
    $mail_label_details = 'Budget Details & Message';
    $mail_footer = 'This email was automatically sent from the RACON INGENIERIA web form.';
    
    $success_message = 'Your budget request has been successfully received. We will contact you as soon as possible.';
    $error_server = 'The server was unable to process the email transmission at this time.';
} else {
    $error_invalid_method = 'Método de solicitud no válido.';
    $error_empty_fields = 'Por favor, completa todos los campos obligatorios (Nombre, Correo y Mensaje).';
    $error_invalid_email = 'La dirección de correo electrónico no es válida.';
    $mail_subject_prefix = 'Nueva Solicitud de Presupuesto: ';
    $mail_title = 'Solicitud de Cotización desde la Web';
    $mail_label_client = 'Cliente';
    $mail_label_dept = 'Departamento';
    $mail_label_email = 'Correo de Contacto';
    $mail_label_phone = 'Teléfono';
    $mail_label_phone_none = 'No proporcionado';
    $mail_label_details = 'Detalle del Presupuesto y Mensaje';
    $mail_footer = 'Este correo fue enviado de manera automática desde el formulario web de RACON INGENIERÍA.';
    
    $success_message = 'Tu solicitud de presupuesto ha sido recibida con éxito. Nos pondremos en contacto con usted a la brevedad posible.';
    $error_server = 'El servidor no pudo procesar el envío del correo en este momento.';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => $error_invalid_method
    ]);
    exit;
}

// Extraer y sanitizar datos recibidos
$name = strip_tags(trim($_POST['name'] ?? ''));
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone = strip_tags(trim($_POST['phone'] ?? ''));
$description = strip_tags(trim($_POST['description'] ?? ''));

// Validación básica
if (empty($name) || empty($email) || empty($description)) {
    echo json_encode([
        'status' => 'error',
        'message' => $error_empty_fields
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'status' => 'error',
        'message' => $error_invalid_email
    ]);
    exit;
}

// Asunto del correo
$subject = $mail_subject_prefix . $name;

// Construir cuerpo del correo en HTML con diseño corporativo
$email_content = '
<!DOCTYPE html>
<html lang="' . $lang . '">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f5f7;
            color: #333333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            border-top: 5px solid #ff6f00;
        }
        .header {
            background-color: #0c0d10;
            padding: 25px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #ffffff;
            letter-spacing: 1px;
        }
        .header h1 span {
            color: #ff6f00;
        }
        .content {
            padding: 30px;
        }
        .field-group {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eeeeee;
        }
        .field-title {
            font-weight: bold;
            color: #ff6f00;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .field-value {
            font-size: 16px;
            line-height: 1.5;
            color: #2c3e50;
        }
        .description-box {
            background-color: #f9f9f9;
            border-left: 4px solid #ffa000;
            padding: 15px;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
            color: #333;
        }
        .footer {
            background-color: #0c0d10;
            color: #7f8c8d;
            text-align: center;
            padding: 15px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RACON <span>NET</span></h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: #ffa000;">' . $mail_title . '</p>
        </div>
        <div class="content">
            <div class="field-group">
                <div class="field-title">' . $mail_label_client . '</div>
                <div class="field-value">' . htmlspecialchars($name) . '</div>
            </div>
            <div class="field-group">
                <div class="field-title">' . $mail_label_email . '</div>
                <div class="field-value"><a href="mailto:' . htmlspecialchars($email) . '" style="color: #ff6f00; text-decoration: none;">' . htmlspecialchars($email) . '</a></div>
            </div>
            <div class="field-group">
                <div class="field-title">' . $mail_label_phone . '</div>
                <div class="field-value">' . (empty($phone) ? $mail_label_phone_none : htmlspecialchars($phone)) . '</div>
            </div>
            <div class="field-group">
                <div class="field-title">' . $mail_label_details . '</div>
                <div class="description-box">' . nl2br(htmlspecialchars($description)) . '</div>
            </div>
        </div>
        <div class="footer">
            ' . $mail_footer . '
        </div>
    </div>
</body>
</html>
';

if ($mode === 'testing') {
    // -------------------------------------------------------------
    // MODO PRUEBAS: Envío por API Web3Forms (libre de bloqueos de Hostinger)
    // -------------------------------------------------------------
    if ($web3forms_access_key === 'xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') {
        echo json_encode([
            'status' => 'error',
            'message' => 'Por favor, configure su clave de Web3Forms gratuita en send_quote.php para procesar el envío.'
        ]);
        exit;
    }

    // Armamos los datos requeridos por la API de Web3Forms
    $post_data = [
        'access_key' => $web3forms_access_key,
        'name'       => $name,
        'email'      => $email,
        'subject'    => $subject,
        'message'    => "Cliente: $name\nEmail de contacto: $email\nTeléfono: " . ($phone ?: 'No proporcionado') . "\n\n---------------------------------\nDETALLE DEL PRESUPUESTO:\n---------------------------------\n" . $description,
        'from_name'  => 'RACON INGENIERÍA Web'
    ];

    // Envío vía cURL con fallback a file_get_contents (en caso de que cURL esté deshabilitado en Hostinger)
    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.web3forms.com/submit');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
        $response_raw = @curl_exec($ch);
        curl_close($ch);
    } else {
        $options = [
            'http' => [
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                'method'  => 'POST',
                'content' => http_build_query($post_data),
                'ignore_errors' => true
            ]
        ];
        $context  = stream_context_create($options);
        $response_raw = @file_get_contents('https://api.web3forms.com/submit', false, $context);
    }

    $response = json_decode($response_raw, true);
    $sent = ($response && isset($response['success']) && $response['success'] === true);

} else {
    // -------------------------------------------------------------
    // MODO PRODUCCIÓN: Envío con la función nativa mail() de Hostinger
    // -------------------------------------------------------------
    $host = preg_replace('/:[0-9]+$/', '', $_SERVER['HTTP_HOST']);
    if ($host === 'localhost' || filter_var($host, FILTER_VALIDATE_IP)) {
        $from_domain = 'raconnet.com';
    } else {
        $from_domain = $host;
    }
    
    $from_email = 'no-reply@' . $from_domain;

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: RACON Web <" . $from_email . ">" . "\r\n";
    $headers .= "Reply-To: " . $name . " <" . $email . ">" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $sent = @mail($to_email, $subject, $email_content, $headers, "-f" . $from_email);
}

// Retornar respuesta al JS
if ($sent) {
    echo json_encode([
        'status' => 'success',
        'message' => $success_message
    ]);
} else {
    $detail = '';
    if ($mode === 'testing' && isset($response['message'])) {
        $detail = ' Detalles: ' . $response['message'];
    }
    echo json_encode([
        'status' => 'error',
        'message' => $error_server . ($mode === 'testing' ? ' (Compruebe su Access Key en send_quote.php.' . $detail . ')' : '')
    ]);
}
?>

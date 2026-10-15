<?php
/**
 * RACON INGENIERÍA - Configuración Segura de Base de Datos
 * Compatible con XAMPP (Local) y Hostinger (Producción).
 * 
 * MEDIDAS DE SEGURIDAD INCLUIDAS:
 * 1. PDO con Prepared Statements nativos (EMULATE_PREPARES = false) -> Blindaje total contra Inyecciones SQL.
 * 2. Ocultación de errores técnicos en pantalla (Evita filtración de rutas y credenciales).
 * 3. Codificación forzada utf8mb4.
 */

// Evitar acceso directo por navegador a este archivo de configuración
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Acceso denegado');
}

// =======================================================================
// AJUSTES DE CONEXIÓN
// =======================================================================

// Detección automática ultra-robusta del entorno (Windows / XAMPP vs Servidor Hostinger)
$is_windows    = (DIRECTORY_SEPARATOR === '\\');
$is_local_ip   = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', ''])
              || in_array($_SERVER['SERVER_ADDR'] ?? '', ['127.0.0.1', '::1', '']);
$is_local_host = isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
$is_cli        = (php_sapi_name() === 'cli');

$is_localhost  = $is_windows || $is_local_ip || $is_local_host || $is_cli;

if ($is_localhost) {
    // -------------------------------------------------------------
    // ENTORNO LOCAL (XAMPP EN TU PC WINDOWS)
    // -------------------------------------------------------------
    $db_host = '127.0.0.1'; // 127.0.0.1 evita problemas de resolución de nombres con localhost
    $db_name = 'racon_db';
    $db_user = 'root';
    $db_pass = '';          // Por defecto en XAMPP no tiene contraseña
    $db_port = '3306';
} else {
    // -------------------------------------------------------------
    // ENTORNO DE PRODUCCIÓN (HOSTINGER)
    // Reemplaza con los datos que crees en el panel de Hostinger:
    // -------------------------------------------------------------
    $db_host = 'localhost';               // En Hostinger normalmente es 'localhost'
    $db_name = 'u123456789_racon_db';     // Nombre de base de datos de Hostinger
    $db_user = 'u123456789_racon_user';   // Usuario de base de datos de Hostinger
    $db_pass = 'TuPasswordSeguro123#';    // Contraseña asignada en Hostinger
    $db_port = '3306';
}

/**
 * Retorna la conexión PDO segura o lanza una excepción controlada.
 * 
 * @return PDO
 * @throws Exception
 */
function getDbConnection() {
    global $db_host, $db_name, $db_user, $db_pass, $db_port;

    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones para control de errores
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devolver arreglos asociativos
        PDO::ATTR_EMULATE_PREPARES   => false,                  // FORZAR prepared statements en el motor MySQL (Neutraliza SQLi)
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $db_user, $db_pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // SEGURIDAD: Guardar el error técnico en el log del servidor, NUNCA mostrarlo al cliente
        error_log("[RACON DB ERROR] " . $e->getMessage());
        throw new Exception("Error de conexión a la base de datos.");
    }
}

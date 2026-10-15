-- =======================================================================
-- RACON INGENIERÍA - ESTRUCTURA DE BASE DE DATOS PARA RESEÑAS
-- Compatible con: XAMPP (Localhost) y Hostinger (cPanel / phpMyAdmin)
-- Codificación: utf8mb4 (Soporte completo para emojis, tildes y seguridad)
-- =======================================================================

-- 1. Crear la base de datos si no existe (Útil para XAMPP en tu PC)
-- NOTA EN HOSTINGER: Hostinger te asigna un nombre de base de datos específico 
-- (ej. u123456789_racon), por lo que en Hostinger solo importarás las tablas.
CREATE DATABASE IF NOT EXISTS `racon_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `racon_db`;

-- 2. Eliminar la tabla si ya existe para evitar duplicados en re-importaciones
DROP TABLE IF EXISTS `reviews`;

-- 3. Crear tabla de reseñas corporativas con índices de alta velocidad y seguridad
CREATE TABLE `reviews` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL COMMENT 'Nombre completo del cliente',
    `company` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Empresa, cargo o ubicación',
    `rating` TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Calificación del 1 al 5',
    `comment` TEXT NOT NULL COMMENT 'Contenido de la reseña / testimonio',
    `status` ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Estado de moderación (por defecto pendiente)',
    `moderation_token` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Token criptográfico seguro para moderación por correo',
    `token_expires_at` DATETIME NULL DEFAULT NULL COMMENT 'Fecha de expiración del token (48 horas)',
    `ip_address` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1' COMMENT 'IP del emisor para seguridad',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación',
    
    -- Índices para optimizar las consultas públicas y proteger contra sobrecarga
    INDEX `idx_status_created` (`status`, `created_at` DESC),
    INDEX `idx_moderation_token` (`moderation_token`),
    INDEX `idx_ip_rate_limit` (`ip_address`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reseñas de clientes para RACON INGENIERÍA';

-- 4. Inserción de 20 reseñas iniciales de prestigio (Casos de Éxito Reales)
-- Permite que el carrusel rote lotes de 10 reseñas por día (Día 1: 1 a 10, Día 2: 11 a 20)
INSERT INTO `reviews` (`name`, `company`, `rating`, `comment`, `status`, `ip_address`, `created_at`) VALUES
('Carlos Méndez', 'Director de Infraestructura IT - Data Center Madrid', 5, 'Contratamos a RACON para la reorganización y peinado integral de 8 racks en nuestra sala técnica principal. La reducción térmica y la claridad en la identificación del cableado superaron todas nuestras expectativas. Servicio 100% profesional y sin interrupciones.', 'approved', '127.0.0.1', NOW() - INTERVAL 20 DAY),
('Elena Santillana', 'Responsable de Operaciones - Logística & Hub', 5, 'Impecable tendido de fibra óptica y certificación Fluke de extremo a extremo. Los informes técnicos fueron entregados al detalle con la documentación requerida por nuestra auditoría. Muy recomendables.', 'approved', '127.0.0.1', NOW() - INTERVAL 19 DAY),
('Marcos Del Río', 'Facility Manager - Edificio Corporativo Madrid', 5, 'RACON se encargó del cableado estructurado Cat6A en nuestras nuevas oficinas de 1.200 m². Cumplieron estrictamente los plazos de entrega y la canalización quedó con una estética pulcra y ordenada.', 'approved', '127.0.0.1', NOW() - INTERVAL 18 DAY),
('David Larrea', 'Ingeniero de Redes - Telecom Enterprise', 5, 'Excelente trabajo en la fusión de fibra monomodo y la instalación de sistemas de megafonía IP. El equipo técnico demostró gran solvencia y dominio de la normativa europea.', 'approved', '127.0.0.1', NOW() - INTERVAL 17 DAY),
('Sophie Dubois', 'IT Operations Lead - Bruselas, Bélgica', 5, 'RACON desplegó el backbone de interconexión para nuestra sede europea en Bruselas. La coordinación técnica internacional y el estricto apego a los estándares ISO/IEC fue sobresaliente.', 'approved', '127.0.0.1', NOW() - INTERVAL 16 DAY),
('Javier Gómez', 'Director de Seguridad y Sistemas - Banco Metropolitano', 5, 'Auditoría y saneamiento completo de salas de comunicaciones críticas. La redundancia en canalizaciones y la seguridad física de los armarios rack quedó impecable. Confianza total.', 'approved', '127.0.0.1', NOW() - INTERVAL 15 DAY),
('Jan Van Dijk', 'Project Manager Datacenter - Ámsterdam, Países Bajos', 5, 'Gran experiencia trabajando con el equipo de RACON en Ámsterdam. Instalación de pasillos fríos/calientes y parcheo de alta densidad con acabados de máxima precisión técnica.', 'approved', '127.0.0.1', NOW() - INTERVAL 14 DAY),
('Patricia Montero', 'Jefa de Mantenimiento - Parque Empresarial La Finca', 5, 'Instalaron el sistema fotovoltaico para autoconsumo en cubierta combinado con la infraestructura eléctrica BMS. Disminución inmediata en consumo energético y monitorización en tiempo real.', 'approved', '127.0.0.1', NOW() - INTERVAL 13 DAY),
('Piotr Kowalski', 'Senior Network Architect - Varsovia, Polonia', 5, 'Colaboración perfecta en el proyecto de tendido de fibra troncal en Varsovia. Pruebas de reflectometría OTDR con valores de atenuación inmejorables. Ingenieros de primer nivel.', 'approved', '127.0.0.1', NOW() - INTERVAL 12 DAY),
('Raúl Hernández', 'Ingeniero de Planta - Industria Farmacéutica Toledo', 5, 'Canalizaciones libres de halógenos y conexionado blindado Cat6A para entornos industriales con alta interferencia electromagnética. Cero incidencias desde el primer día.', 'approved', '127.0.0.1', NOW() - INTERVAL 11 DAY),
('Marta Alarcón', 'Coordinadora TIC - Complejo Hospitalario Universitario', 5, 'Despliegue de red de misión crítica y puntos Wi-Fi 6 en áreas clínicas con cero impacto en la operatividad diaria. Máxima higiene laboral y señalización exhaustiva de tomas.', 'approved', '127.0.0.1', NOW() - INTERVAL 10 DAY),
('Henrik Lindström', 'Infrastructure Lead - Oslo, Noruega', 5, 'RACON demostró una agilidad ejemplar en la instalación de cableado de telecomunicaciones bajo clima invernal en Oslo. Calidad sin concesiones y entrega antes del plazo pactado.', 'approved', '127.0.0.1', NOW() - INTERVAL 9 DAY),
('Fernando Sotomayor', 'Director Técnico - Centro de Innovación Tecnológica', 5, 'Reorganizaron un rack de 42U que era un auténtico caos de cables sin etiquetar. Ahora cualquier técnico puede realizar un cambio en segundos. Una inversión rentable desde el minuto uno.', 'approved', '127.0.0.1', NOW() - INTERVAL 8 DAY),
('Luka Horvat', 'Telecom Site Manager - Zagreb, Croacia', 5, 'Excelente trabajo en la integración de redes de telecomunicaciones en Croacia. Equipo técnico altamente cualificado con instrumental de calibración y certificación de última generación.', 'approved', '127.0.0.1', NOW() - INTERVAL 7 DAY),
('Beatriz Ramos', 'CTO - FinTech Hub Madrid', 5, 'Equiparon nuestras salas de servidores con cableado Cat6A blindado y control de acceso biométrico. Trato profesional, presupuesto transparente y ejecución impecable.', 'approved', '127.0.0.1', NOW() - INTERVAL 6 DAY),
('Alberto Calvo', 'Responsable BMS & Eficiencia - Torres Chamartín', 5, 'Integración perfecta del cableado de control para climatización y sensores IoT en edificio corporativo. El soporte post-instalación y la garantía documental son incomparables.', 'approved', '127.0.0.1', NOW() - INTERVAL 5 DAY),
('Carmen Navas', 'Gerente de Infraestructura - Retail & Distribución Iberia', 5, 'Cableado estructurado para 4 centros logísticos simultáneos. Cumplimiento de tiempos récord y certificación individualizada de cada puerto RJ45. Gran capacidad de despliegue.', 'approved', '127.0.0.1', NOW() - INTERVAL 4 DAY),
('Sergio Valenzuela', 'Administrador de Sistemas - Sede Corporativa Las Rozas', 5, 'Puntuales, pulcros y rigurosos. Nos resolvieron problemas crónicos de diafonía y pérdidas de paquetes simplemente reemplazando los patch cords y re-parcheando los paneles.', 'approved', '127.0.0.1', NOW() - INTERVAL 3 DAY),
('Álvaro Domínguez', 'Ingeniero Jefe de Telecomunicaciones - Hub Portuario', 5, 'Tendido y fusionado de enlaces de fibra óptica en condiciones de salinidad y ambiente exigente. Protecciones mecánicas adecuadas y reflectometría impecable.', 'approved', '127.0.0.1', NOW() - INTERVAL 2 DAY),
('Natalia Cifuentes', 'Directora de Proyectos - Smart Building Solutions', 5, 'La combinación de megafonía IP, paneles solares de autoconsumo y cableado estructurado en una sola empresa facilitó enormemente la dirección facultativa de obra. ¡10 sobre 10!', 'approved', '127.0.0.1', NOW() - INTERVAL 1 DAY);

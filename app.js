// ==========================================
// CONFIGURACIÓN GLOBAL, AÑO ACTUAL Y TEMA
// ==========================================
document.getElementById('current-year').textContent = new Date().getFullYear();

// Inicialización de Tema Claro / Oscuro
let currentTheme = localStorage.getItem('selectedTheme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
}

// Escuchar click en el botón de alternancia de tema
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('selectedTheme', isLight ? 'light' : 'dark');
        
        // Actualizar capa del mapa Leaflet si existe
        if (typeof updateMapTileLayer === 'function') {
            updateMapTileLayer(isLight);
        }
    });
}

// ==========================================
// CONFIGURACIÓN DE IDIOMA E i18n
// ==========================================
let currentLang = localStorage.getItem('selectedLanguage') || 'es';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('selectedLanguage', lang);
    document.documentElement.lang = lang;

    // Actualizar botones del selector de idiomas
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Traducir todos los elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Si tiene elementos hijos HTML como SVG o Span, tenemos cuidado
            const spanText = el.querySelector('span');
            if (spanText && spanText.getAttribute('data-i18n') === key) {
                spanText.textContent = translations[lang][key];
            } else if (el.querySelector('svg')) {
                // Si el elemento tiene un SVG interno (como botones), reemplazamos el primer nodo de texto
                // o buscamos si hay texto suelto y lo cambiamos sin tocar el SVG
                const textNodes = Array.from(el.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                if (textNodes.length > 0) {
                    textNodes[0].textContent = translations[lang][key];
                } else {
                    // Si no hay nodo de texto pero tiene span, se traduce el span
                    const firstSpan = el.querySelector('span');
                    if (firstSpan) firstSpan.textContent = translations[lang][key];
                }
            } else {
                // Si el texto a inyectar contiene HTML (como tags <span> para colores), usamos innerHTML
                if (translations[lang][key].includes('<')) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        }
    });

    // Traducir todos los placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    // Traducir metadatos de SEO
    if (translations[lang]) {
        document.title = translations[lang].seo_title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', translations[lang].seo_desc);
        }
    }

    // Actualizar tooltips del mapa
    if (typeof markersList !== 'undefined' && markersList.length > 0) {
        markersList.forEach(item => {
            item.marker.setTooltipContent(translations[lang][item.country.nameKey]);
        });
    }

    // Actualizar reseñas si ya están cargadas
    if (typeof updateReviewsLanguage === 'function') {
        updateReviewsLanguage();
    }
}

// Escuchar clicks en el selector de idiomas
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
    });
});



// ==========================================
// MENÚ MÓVIL Y SCROLL DEL HEADER
// ==========================================
const header = document.getElementById('main-header');
const hamburger = document.getElementById('hamburger-menu');
const navMenu = document.getElementById('nav-menu-list');
const navLinks = document.querySelectorAll('.nav-link');
const techSphere = document.querySelector('.tech-sphere');

// Scroll del header y efecto parallax
let targetTranslateY = 0;
let currentTranslateY = 0;

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Actualizar nav active en base a la sección visible
    let current = '';
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 150)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });

    // Controlar el estado flotante de la esfera 3D
    if (techSphere) {
        if (window.scrollY > 120) {
            techSphere.classList.add('floating-bg');
        } else {
            techSphere.classList.remove('floating-bg');
        }
    }

    // Parallax del canvas de red (constelación de fondo)
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
        const scrollPercent = window.scrollY / scrollHeight;
        targetTranslateY = scrollPercent * 150; // Desplazamiento máximo de 150px hacia abajo
    }
});

// Toggle del menú hamburguesa
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Animación de las barras del menú móvil
    const spans = hamburger.querySelectorAll('span');
    if (hamburger.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Cerrar menú al hacer clic en un enlace
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans.forEach(span => span.style.transform = 'none');
        spans[1].style.opacity = '1';
    });
});

// ==========================================
// FONDO DINÁMICO DE RED (CANVAS)
// ==========================================
const canvas = document.getElementById('network-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = window.innerWidth < 768 ? 40 : 80;
const connectionDistance = 120;
let mouse = { x: null, y: null, radius: 150 };

// Redimensionar Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Capturar movimiento del ratón
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Clase Partícula (Nodos de Red)
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.7; // Ligeramente más rápidos para fluidez
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1.5;
    }

    update() {
        // Mover
        this.x += this.vx;
        this.y += this.vy;

        // Rebotar bordes
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Atracción suave al ratón con ajuste por traslación del canvas
        if (mouse.x !== null) {
            const screenY = this.y + currentTranslateY;
            const dx = mouse.x - this.x;
            const dy = mouse.y - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                this.x += (dx / dist) * force * 0.45;
                this.y += (dy / dist) * force * 0.45;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 111, 0, 0.4)'; // Siempre naranja corporativo en ambos modos
        ctx.fill();
    }
}

// Inicializar partículas
function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}
initParticles();

// ==========================================
// RENDERIZADO DE GLOBO HOLOGRÁFICO 3D (HERO)
// ==========================================
const sphereCanvas = document.getElementById('sphere-canvas');
const sphereCtx = sphereCanvas ? sphereCanvas.getContext('2d') : null;

// Ajuste para pantallas de alta densidad de píxeles (Retina / High DPI)
if (sphereCanvas && sphereCtx) {
    const dpr = window.devicePixelRatio || 1;
    sphereCanvas.width = 320 * dpr;
    sphereCanvas.height = 320 * dpr;
    sphereCtx.scale(dpr, dpr);
}

const spherePoints = [];
const numLat = 8;
const numLong = 12;
const sphereRadius = 85;
let rotX = 0;
let rotY = 0;

if (sphereCanvas && sphereCtx) {
    // Generar coordenadas de puntos en 3D sobre la esfera
    for (let i = 0; i <= numLat; i++) {
        const lat = (i * Math.PI) / numLat - Math.PI / 2;
        for (let j = 0; j < numLong; j++) {
            const lon = (j * 2 * Math.PI) / numLong;
            const x = sphereRadius * Math.cos(lat) * Math.cos(lon);
            const y = sphereRadius * Math.sin(lat);
            const z = sphereRadius * Math.cos(lat) * Math.sin(lon);
            spherePoints.push({ x, y, z });
        }
    }
}

function drawSphereLine(p1, p2) {
    if (!sphereCtx) return;
    if (p1.z > 20 && p2.z > 20) return; // Ocultar líneas lejanas/traseras
    
    sphereCtx.beginPath();
    sphereCtx.moveTo(p1.x, p1.y);
    sphereCtx.lineTo(p2.x, p2.y);
    
    const zAvg = (p1.z + p2.z) / 2;
    const alpha = Math.max(0.04, 1 - (zAvg + sphereRadius) / (2 * sphereRadius));
    
    const isLight = document.body.classList.contains('light-mode');
    sphereCtx.strokeStyle = isLight 
        ? `rgba(0, 0, 0, ${alpha * 0.65})` // Negro puro y más definido para modo claro
        : `rgba(255, 111, 0, ${alpha * 0.25})`; // Naranja en modo oscuro
        
    sphereCtx.stroke();
}

function updateAndDraw3DSphere() {
    if (!sphereCanvas || !sphereCtx) return;
    
    sphereCtx.clearRect(0, 0, sphereCanvas.width, sphereCanvas.height);
    const centerX = sphereCanvas.width / 2;
    const centerY = sphereCanvas.height / 2;
    const d = 200; // Distancia focal
    
    // Velocidad de rotación base
    let speedX = 0.002;
    let speedY = 0.005;
    
    // Interacción leve con la posición del mouse
    if (mouse.x !== null) {
        const dx = (mouse.x - window.innerWidth / 2) * 0.00003;
        const dy = (mouse.y - window.innerHeight / 2) * 0.00003;
        speedY += dx;
        speedX += dy;
    }
    
    rotY += speedY;
    rotX += speedX;
    
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    
    const projected = spherePoints.map(p => {
        // Rotar Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;
        // Rotar X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;
        
        // Proyectar
        const scale = 200 / (z2 + d);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;
        return { x: px, y: py, z: z2 };
    });
    
    // Dibujar enlaces
    const isLight = document.body.classList.contains('light-mode');
    sphereCtx.lineWidth = isLight ? 2.2 : 1.0; // Grosor incrementado a 2.2 en modo claro para máxima legibilidad
    for (let i = 0; i < projected.length; i++) {
        const nextLong = (i + 1) % numLong === 0 ? i - numLong + 1 : i + 1;
        drawSphereLine(projected[i], projected[nextLong]);
        
        const nextLat = i + numLong;
        if (nextLat < projected.length) {
            drawSphereLine(projected[i], projected[nextLat]);
        }
    }
    
    // Dibujar nodos brillantes frontales
    projected.forEach(p => {
        if (p.z < 15) {
            sphereCtx.beginPath();
            const nodeRadius = isLight ? 4.5 : 2.5; // Nodos más grandes (diámetro 9px) en modo claro para un look tecnológico premium
            sphereCtx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
            const alpha = 1 - (p.z + sphereRadius) / (2 * sphereRadius);
            
            if (isLight) {
                sphereCtx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.85})`; // Nodos negro puro
                sphereCtx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                sphereCtx.shadowBlur = 3;
            } else {
                sphereCtx.fillStyle = `rgba(255, 160, 0, ${alpha * 0.8})`; // Naranja en modo oscuro
                sphereCtx.shadowColor = '#ff6f00';
                sphereCtx.shadowBlur = 4;
            }
            
            sphereCtx.fill();
            sphereCtx.shadowBlur = 0;
        }
    });
}

// Loop de Animación
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desplazamiento Parallax suavizado (LERP)
    currentTranslateY += (targetTranslateY - currentTranslateY) * 0.08;
    canvas.style.transform = `translateY(${currentTranslateY}px)`;

    // 2. Dibujar Globo 3D en la sección hero
    updateAndDraw3DSphere();

    // 3. Actualizar y dibujar partículas
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // 4. Dibujar conexiones
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                const alpha = (1 - (dist / connectionDistance)) * 0.15;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(255, 160, 0, ${alpha})`; // Siempre naranja corporativo en ambos modos
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animateParticles);
}
animateParticles();

// ==========================================
// CARRUSEL INTERACTIVO DE PROYECTOS (RACKS)
// ==========================================
const carouselContainer = document.getElementById('project-carousel');
const carouselTrack = document.getElementById('carousel-track');
const carouselSlides = document.querySelectorAll('.carousel-slide');
const carouselPrevBtn = document.getElementById('carousel-prev');
const carouselNextBtn = document.getElementById('carousel-next');
const currentSlideNum = document.getElementById('current-slide-num');
const totalSlidesNum = document.getElementById('total-slides-num');
const carouselDots = document.querySelectorAll('.carousel-dot');

let currentSlide = 0;
const totalSlides = carouselSlides.length;
let carouselInterval = null;
const SLIDE_DURATION = 3000; // 3 segundos exactos por imagen

if (totalSlidesNum) {
    totalSlidesNum.textContent = totalSlides;
}

function goToSlide(index) {
    if (index < 0) {
        currentSlide = totalSlides - 1;
    } else if (index >= totalSlides) {
        currentSlide = 0;
    } else {
        currentSlide = index;
    }

    // Mover pista con transform para máxima fluidez
    if (carouselTrack) {
        carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    // Actualizar clases activas en slides
    carouselSlides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentSlide);
    });

    // Actualizar puntos de navegación
    carouselDots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
    });

    // Actualizar contador numérico
    if (currentSlideNum) {
        currentSlideNum.textContent = currentSlide + 1;
    }
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

// Event Listeners de botones
if (carouselNextBtn) {
    carouselNextBtn.addEventListener('click', () => {
        nextSlide();
        resetCarouselTimer();
    });
}

if (carouselPrevBtn) {
    carouselPrevBtn.addEventListener('click', () => {
        prevSlide();
        resetCarouselTimer();
    });
}

// Event Listeners de Dots
carouselDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
        const slideIdx = parseInt(e.currentTarget.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
        resetCarouselTimer();
    });
});

// Auto-play (cada 3 segundos)
function startCarouselTimer() {
    stopCarouselTimer();
    carouselInterval = setInterval(nextSlide, SLIDE_DURATION);
}

function stopCarouselTimer() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function resetCarouselTimer() {
    stopCarouselTimer();
    startCarouselTimer();
}

if (carouselContainer) {
    // Pausar con hover
    carouselContainer.addEventListener('mouseenter', stopCarouselTimer);
    carouselContainer.addEventListener('mouseleave', startCarouselTimer);

    // Navegación por teclado
    carouselContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetCarouselTimer();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetCarouselTimer();
        }
    });

    // Soporte táctil móvil (Swipe Touch)
    let touchStartX = 0;
    let touchEndX = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopCarouselTimer();
    }, { passive: true });

    carouselContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        startCarouselTimer();
    }, { passive: true });

    startCarouselTimer();
}

// ==========================================
// FORMULARIO DE CONTACTO
// ==========================================
const contactForm = document.getElementById('contact-form');
const btnFormSubmit = document.getElementById('btn-form-submit');
const formAlert = document.getElementById('form-alert');
const txtDescription = document.getElementById('form-desc');

// Envío del formulario con soporte híbrido de pruebas (cliente directo a Web3Forms) y producción (PHP a Hostinger)
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const t = translations[currentLang] || translations['es'];
    
    // Cambiar estado del botón a cargando
    const originalText = btnFormSubmit.innerHTML;
    const loadingText = t.js_alert_sending || 'Enviando...';
    btnFormSubmit.innerHTML = `${loadingText} <div style="display:inline-block; width:12px; height:12px; border:2px solid #ff6f00; border-radius:50%; border-top-color:transparent; animation:rotate 0.8s linear infinite; margin-left:8px;"></div>`;
    btnFormSubmit.disabled = true;

    // Obtener campos del formulario
    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const phone = document.getElementById('form-phone') ? document.getElementById('form-phone').value.trim() : '';
    const deptSelect = document.getElementById('form-dept');
    const department = deptSelect ? deptSelect.value : 'Cotizaciones y Ventas';
    const description = document.getElementById('form-desc').value.trim();

    const clientData = { name, email, phone, department, description };

    // MODO DE EJECUCIÓN DEL CLIENTE:
    // - 'testing': Envía de forma directa al API de Web3Forms desde el navegador del usuario (evita bloqueos de IP del servidor Hostinger).
    // - 'production': Envía los datos al archivo local send_quote.php en Hostinger (para cuando ya tengas tu dominio corporativo activo).
    const mailMode = 'testing'; 
    const web3formsAccessKey = '40153525-1fdf-482f-84cd-3e588b2b6b0d';

    if (mailMode === 'testing') {
        // Enviar directamente al API de Web3Forms desde el cliente
        const payload = {
            access_key: web3formsAccessKey,
            name: name,
            email: email,
            phone: phone || 'No proporcionado',
            department: department,
            subject: (currentLang === 'en' ? 'RACON INGENIERIA - Quote Request: ' : 'RACON INGENIERIA - Solicitud de Presupuesto: ') + `[${department}] ` + name,
            message: `Cliente: ${name}\nDepartamento: ${department}\nEmail de contacto: ${email}\nTeléfono: ${phone || 'No proporcionado'}\n\n-------------------------\nDETALLE DEL PRESUPUESTO:\n-------------------------\n${description}`,
            from_name: 'RACON INGENIERIA Web'
        };

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al enviar la solicitud');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showContactSuccessCard(clientData);
                contactForm.reset();
            } else {
                throw new Error(data.message || 'Error en la API');
            }
        })
        .catch(error => {
            console.error('Error al enviar:', error);
            formAlert.style.display = 'block';
            formAlert.className = 'form-alert error form-message';
            formAlert.textContent = currentLang === 'en'
                ? 'Unable to process your request at this time. Please try again later.'
                : 'No se pudo procesar la solicitud en este momento. Por favor intente más tarde.';
        })
        .finally(() => {
            btnFormSubmit.innerHTML = originalText;
            btnFormSubmit.disabled = false;
        });
    } else {
        // Modo Producción: Envío a través de send_quote.php en Hostinger
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('department', department);
        formData.append('description', description);
        formData.append('lang', currentLang);

        fetch('send_quote.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error de red');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showContactSuccessCard(clientData);
                contactForm.reset();
            } else {
                throw new Error(data.message || 'Error en el servidor');
            }
        })
        .catch(error => {
            console.warn('Error en el envío:', error);
            formAlert.style.display = 'block';
            formAlert.className = 'form-alert error form-message';
            formAlert.textContent = error.message || 'Ocurrió un error al enviar el presupuesto.';
        })
        .finally(() => {
            btnFormSubmit.innerHTML = originalText;
            btnFormSubmit.disabled = false;
        });
    }
});

// Renderizar tarjeta de éxito con botones directos para WhatsApp y Llamada
function showContactSuccessCard(clientData) {
    const t = translations[currentLang] || translations.es;
    const raconPhoneClean = '34627837298';

    // Construcción del mensaje pre-armado de WhatsApp
    let waText = `*SOLICITUD DE COTIZACIÓN - RACON INGENIERÍA*\n`;
    waText += `*Departamento:* ${clientData.department}\n`;
    waText += `*Cliente:* ${clientData.name}\n`;
    waText += `*Email:* ${clientData.email}\n`;
    if (clientData.phone) {
        waText += `*Teléfono:* ${clientData.phone}\n`;
    }
    waText += `\n*Detalles del Proyecto:*\n${clientData.description}`;

    const waUrl = `https://wa.me/${raconPhoneClean}?text=${encodeURIComponent(waText)}`;
    const telUrl = `tel:+${raconPhoneClean}`;

    formAlert.style.display = 'block';
    formAlert.className = 'form-message';
    formAlert.innerHTML = `
        <div class="contact-success-card">
            <div class="contact-success-header">
                <div class="contact-success-icon">&#10004;</div>
                <div>
                    <h4 class="contact-success-title">${t.contact_success_title || '¡Solicitud de Cotización Recibida!'}</h4>
                    <p class="contact-success-subtitle">${t.contact_success_subtitle || 'Su requerimiento técnico ha sido enviado a nuestro equipo por correo. Para una atención inmediata, elija cómo desea comunicarse ahora:'}</p>
                </div>
            </div>
            
            <div class="contact-dept-pill">
                <span>${t.contact_target_dept || 'Departamento:'}</span> <strong>${clientData.department}</strong>
            </div>

            <div class="contact-actions-grid">
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-contact-action btn-action-whatsapp">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.025 14.09 1 11.99 1c-5.45 0-9.875 4.374-9.879 9.803-.002 1.758.465 3.479 1.355 5.027l-.988 3.606 3.73-.978zm11.233-6.04c-.3-.15-1.771-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.414-1.492-.893-.797-1.495-1.78-1.67-2.08-.175-.3-.019-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.676-1.63-.926-2.235-.244-.589-.492-.51-.676-.518-.174-.007-.375-.007-.575-.007-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.113 3.227 5.12 4.527.714.31 1.272.495 1.706.633.717.227 1.37.195 1.887.118.575-.085 1.771-.725 2.021-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
                    </svg>
                    <span>${t.contact_btn_whatsapp || 'Abrir Chat de WhatsApp'}</span>
                </a>
                <a href="${telUrl}" class="btn-contact-action btn-action-call">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>${t.contact_btn_call || 'Llamar al Departamento'}</span>
                </a>
            </div>
        </div>
    `;

    // Desplazamiento suave para que el usuario vea la tarjeta de contacto
    formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Configurar enlace rápido de WhatsApp antes de enviar
const quickLinkWa = document.getElementById('quick-link-whatsapp');
if (quickLinkWa) {
    quickLinkWa.addEventListener('click', () => {
        const nameVal = document.getElementById('form-name')?.value.trim();
        const deptVal = document.getElementById('form-dept')?.value;
        const descVal = document.getElementById('form-desc')?.value.trim();
        
        let msg = `Hola RACON INGENIERÍA.`;
        if (deptVal) msg += ` Me comunico con el departamento de ${deptVal}.`;
        if (nameVal) msg += ` Mi nombre es ${nameVal}.`;
        if (descVal) msg += `\n\nConsulta:\n${descVal}`;
        
        quickLinkWa.href = `https://wa.me/34627837298?text=${encodeURIComponent(msg)}`;
    });
}

// ==========================================
// MAPA INTERACTIVO (LEAFLET.JS)
// ==========================================
let map;
let currentTileLayer;
const markersList = [];

function updateMapTileLayer(isLight) {
    if (!map) return;
    
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    const tileUrl = isLight 
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        
    currentTileLayer = L.tileLayer(tileUrl, {
        maxZoom: 16
    });
    
    currentTileLayer.addTo(map);
}

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Inicializar mapa centrado en Europa central y desactivar la atribución para eliminar enlaces
    map = L.map('map', {
        center: [52.0, 10.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 6,
        zoomControl: true,
        attributionControl: false, // Ocultar barra de copyright inferior
        scrollWheelZoom: false // Evita interferir con el scroll de la página
    });

    // Cargar capa de mapa según el tema activo
    updateMapTileLayer(document.body.classList.contains('light-mode'));

    // Datos de los países
    const countriesData = [
        {
            id: 'spain',
            coords: [40.416775, -3.703790],
            nameKey: 'map_country_spain'
        },
        {
            id: 'belgium',
            coords: [50.850340, 4.351710],
            nameKey: 'map_country_belgium'
        },
        {
            id: 'netherlands',
            coords: [52.367573, 4.904138],
            nameKey: 'map_country_netherlands'
        },
        {
            id: 'poland',
            coords: [52.229676, 21.012229],
            nameKey: 'map_country_poland'
        },
        {
            id: 'croatia',
            coords: [45.815011, 15.981919],
            nameKey: 'map_country_croatia'
        },
        {
            id: 'norway',
            coords: [59.913869, 10.752245],
            nameKey: 'map_country_norway'
        }
    ];

    // Cargar marcadores con tooltips permanentes bilingües
    countriesData.forEach(country => {
        const customIcon = L.divIcon({
            className: 'map-pulse-marker',
            html: '<div class="pulse-ring"></div><div class="pulse-dot"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker(country.coords, { icon: customIcon }).addTo(map);
        
        // Tooltip de texto permanente y con diseño personalizado
        marker.bindTooltip(translations[currentLang][country.nameKey], {
            permanent: true,
            direction: 'bottom',
            className: 'custom-map-tooltip',
            offset: [0, 8]
        });

        // Click en marcador
        marker.on('click', () => {
            map.panTo(country.coords);
        });

        markersList.push({ marker, country });
    });
}

// Intentar cargar e inicializar el mapa de manera segura
try {
    if (typeof L !== 'undefined') {
        initMap();
    }
} catch (e) {
    console.warn('Leaflet map initialization failed:', e);
}

// ==========================================
// MÓDULO DE RESEÑAS Y TESTIMONIOS (CARRUSEL ROTATIVO DE 10 + API SEGURA)
// ==========================================
const reviewsCarouselTrack = document.getElementById('reviews-carousel-track');
const reviewsCarouselViewport = document.getElementById('reviews-carousel-viewport');
const revCarouselPrev = document.getElementById('rev-carousel-prev');
const revCarouselNext = document.getElementById('rev-carousel-next');
const reviewsCarouselDots = document.getElementById('reviews-carousel-dots');
const reviewsRotationTag = document.getElementById('reviews-rotation-tag');

const btnScrollReview = document.getElementById('btn-scroll-review');
const formSubmitReview = document.getElementById('form-submit-review');
const btnSubmitReview = document.getElementById('btn-submit-review');
const reviewFormStatusAlert = document.getElementById('review-form-status-alert');
const starPickBtns = document.querySelectorAll('.star-pick-btn');
const formReviewRatingInput = document.getElementById('form-review-rating');
const reviewCsrfTokenInput = document.getElementById('review_csrf_token');

let allReviewsData = [];
let dailyReviewsData = [];
let activeCsrfToken = '';
let currentRevSlide = 0;
let carouselAutoplayTimer = null;

// Obtener URL de la API de reseñas dinámica (Soporta file:/// y servidor local o remoto)
function getReviewsApiUrl() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost/racon/api_reviews.php';
    }
    return 'api_reviews.php';
}

function getInitials(name) {
    if (!name) return 'RC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function renderStarsHtml(rating) {
    let starsHtml = '';
    const safeRating = Math.max(1, Math.min(5, parseInt(rating) || 5));
    for (let i = 1; i <= 5; i++) {
        starsHtml += i <= safeRating ? '&#9733;' : '&#9734;';
    }
    return starsHtml;
}

// Algoritmo de rotación diaria: Día 1 muestra 1 a 10, Día 2 muestra 11 a 20, etc.
function getDailyRotatingReviews(allReviews) {
    if (!allReviews || allReviews.length === 0) return [];
    if (allReviews.length <= 10) return allReviews;

    const pageSize = 10;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const numBatches = Math.ceil(allReviews.length / pageSize);
    const batchIndex = dayOfYear % numBatches;
    const startIndex = batchIndex * pageSize;

    const daily = [];
    for (let i = 0; i < pageSize; i++) {
        const idx = (startIndex + i) % allReviews.length;
        daily.push(allReviews[idx]);
    }
    return daily;
}

function getCardsPerView() {
    if (window.innerWidth < 700) return 1;
    if (window.innerWidth < 1060) return 2;
    return 3;
}

function getMaxSlideIndex() {
    const cardsPerView = getCardsPerView();
    return Math.max(0, dailyReviewsData.length - cardsPerView);
}

function updateCarouselPosition() {
    if (!reviewsCarouselTrack || !reviewsCarouselViewport) return;

    const maxSlide = getMaxSlideIndex();
    if (currentRevSlide > maxSlide) currentRevSlide = maxSlide;
    if (currentRevSlide < 0) currentRevSlide = 0;

    const firstCard = reviewsCarouselTrack.querySelector('.review-card');
    if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24;
        const offset = currentRevSlide * (cardWidth + gap);
        reviewsCarouselTrack.style.transform = `translateX(-${offset}px)`;
    }

    // Actualizar botones prev/next
    if (revCarouselPrev) revCarouselPrev.disabled = currentRevSlide === 0;
    if (revCarouselNext) revCarouselNext.disabled = currentRevSlide >= maxSlide;

    // Actualizar dots
    renderCarouselDots();
}

function renderCarouselDots() {
    if (!reviewsCarouselDots) return;
    const maxSlide = getMaxSlideIndex();
    const totalDots = maxSlide + 1;

    let dotsHtml = '';
    for (let i = 0; i < totalDots; i++) {
        dotsHtml += `<button type="button" class="reviews-dot ${i === currentRevSlide ? 'active' : ''}" data-index="${i}" aria-label="Ir a página ${i + 1}"></button>`;
    }
    reviewsCarouselDots.innerHTML = dotsHtml;

    reviewsCarouselDots.querySelectorAll('.reviews-dot').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRevSlide = parseInt(btn.getAttribute('data-index')) || 0;
            updateCarouselPosition();
        });
    });
}

function renderDailyCarousel(reviews) {
    if (!reviewsCarouselTrack) return;

    if (!reviews || reviews.length === 0) {
        const t = translations[currentLang] || translations['es'];
        reviewsCarouselTrack.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; width: 100%;">${t.reviews_empty_msg || 'Aún no hay reseñas registradas.'}</div>`;
        return;
    }

    reviewsCarouselTrack.innerHTML = reviews.map(r => {
        const initials = getInitials(r.name);
        const stars = renderStarsHtml(r.rating);
        const dateStr = r.created_at ? r.created_at.split(' ')[0] : '2026';

        return `
            <div class="review-card" data-id="${r.id}">
                <div>
                    <div class="review-card-header">
                        <div class="review-avatar">${initials}</div>
                        <div class="review-author-info">
                            <h4 class="review-author-name">${r.name}</h4>
                            <p class="review-author-company">${r.company || 'Cliente Corporativo'}</p>
                        </div>
                    </div>
                    <div class="review-stars">${stars}</div>
                    <p class="review-comment">"${r.comment}"</p>
                </div>
                <div class="review-footer-date">
                    <span>${dateStr}</span>
                    <span style="color: var(--secondary); font-weight:600;">${r.rating}.0 / 5.0</span>
                </div>
            </div>
        `;
    }).join('');

    currentRevSlide = 0;
    setTimeout(() => {
        updateCarouselPosition();
    }, 50);
}

// Navegación de botones prev y next
if (revCarouselPrev) {
    revCarouselPrev.addEventListener('click', () => {
        if (currentRevSlide > 0) {
            currentRevSlide--;
            updateCarouselPosition();
        }
    });
}

if (revCarouselNext) {
    revCarouselNext.addEventListener('click', () => {
        const maxSlide = getMaxSlideIndex();
        if (currentRevSlide < maxSlide) {
            currentRevSlide++;
            updateCarouselPosition();
        }
    });
}

// Soporte táctil / swipe en móviles
if (reviewsCarouselViewport) {
    let startX = 0;
    let isTouching = false;

    reviewsCarouselViewport.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isTouching = true;
    }, { passive: true });

    reviewsCarouselViewport.addEventListener('touchend', (e) => {
        if (!isTouching) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (diff > 45) {
            // Swipe izquierda -> Siguiente
            const maxSlide = getMaxSlideIndex();
            if (currentRevSlide < maxSlide) {
                currentRevSlide++;
                updateCarouselPosition();
            }
        } else if (diff < -45) {
            // Swipe derecha -> Anterior
            if (currentRevSlide > 0) {
                currentRevSlide--;
                updateCarouselPosition();
            }
        }
        isTouching = false;
    }, { passive: true });
}

window.addEventListener('resize', () => {
    updateCarouselPosition();
});

// Calcular promedio de calificación real basado en las reseñas de la base de datos
function updateKpiRating(reviews) {
    const kpiScoreVal = document.getElementById('kpi-score-val');
    const kpiStarsRow = document.getElementById('kpi-stars-row');
    if (!kpiScoreVal && !kpiStarsRow) return;

    if (!reviews || reviews.length === 0) {
        if (kpiScoreVal) kpiScoreVal.textContent = '5.0 / 5.0';
        if (kpiStarsRow) {
            let defaultStars = '';
            for (let i = 1; i <= 5; i++) {
                defaultStars += '<span class="kpi-star">&#9733;</span>';
            }
            kpiStarsRow.innerHTML = defaultStars;
        }
        return;
    }

    const totalRatings = reviews.reduce((sum, r) => sum + (parseFloat(r.rating) || 5), 0);
    const avg = totalRatings / reviews.length;
    const formattedAvg = avg.toFixed(1);

    if (kpiScoreVal) {
        kpiScoreVal.textContent = `${formattedAvg} / 5.0`;
    }

    if (kpiStarsRow) {
        const roundedStars = Math.round(avg);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="kpi-star">${i <= roundedStars ? '&#9733;' : '&#9734;'}</span>`;
        }
        kpiStarsRow.innerHTML = starsHtml;
    }
}

// Cargar reseñas directamente desde la base de datos MySQL (Sin datos estáticos en código)
function fetchReviews() {
    fetch(getReviewsApiUrl())
        .then(res => {
            if (!res.ok) throw new Error('API status: ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data && data.success && Array.isArray(data.reviews)) {
                allReviewsData = data.reviews;
                activeCsrfToken = data.csrf_token || '';
            } else {
                allReviewsData = [];
            }
            if (reviewCsrfTokenInput && activeCsrfToken) {
                reviewCsrfTokenInput.value = activeCsrfToken;
            }
            dailyReviewsData = getDailyRotatingReviews(allReviewsData);
            renderDailyCarousel(dailyReviewsData);
            updateKpiRating(allReviewsData);
        })
        .catch(err => {
            console.warn('Conexión con la base de datos de reseñas:', err);
            allReviewsData = [];
            dailyReviewsData = [];
            renderDailyCarousel(dailyReviewsData);
            updateKpiRating(allReviewsData);
        });
}

function updateReviewsLanguage() {
    if (dailyReviewsData && dailyReviewsData.length > 0) {
        renderDailyCarousel(dailyReviewsData);
    }
}

// Desplazamiento fluido al formulario inline cuando se pulsa "Dejar una Reseña"
if (btnScrollReview) {
    btnScrollReview.addEventListener('click', (e) => {
        e.preventDefault();
        const targetForm = document.getElementById('formulario-resena');
        if (targetForm) {
            targetForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const nameInput = document.getElementById('form-review-name');
                if (nameInput) nameInput.focus();
            }, 500);
        }
    });
}

// Selector interactivo de estrellas
starPickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-rating')) || 5;
        if (formReviewRatingInput) {
            formReviewRatingInput.value = rating;
        }
        updateStarPickerUI(rating);
    });

    btn.addEventListener('mouseenter', () => {
        const rating = parseInt(btn.getAttribute('data-rating')) || 5;
        updateStarPickerUI(rating);
    });
});

const starsPickerContainer = document.getElementById('stars-picker');
if (starsPickerContainer) {
    starsPickerContainer.addEventListener('mouseleave', () => {
        const currentRating = parseInt(formReviewRatingInput?.value) || 5;
        updateStarPickerUI(currentRating);
    });
}

function updateStarPickerUI(rating) {
    starPickBtns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-rating')) || 1;
        if (r <= rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Envío del formulario de reseña
if (formSubmitReview) {
    formSubmitReview.addEventListener('submit', (e) => {
        e.preventDefault();

        const t = translations[currentLang] || translations['es'];
        const nameVal = document.getElementById('form-review-name')?.value.trim();
        const commentVal = document.getElementById('form-review-comment')?.value.trim();

        if (!nameVal || nameVal.length < 2) {
            showReviewStatus(false, 'Por favor ingrese su nombre (mínimo 2 caracteres).');
            return;
        }

        if (!commentVal || commentVal.length < 10) {
            showReviewStatus(false, 'Por favor escriba una reseña detallada (mínimo 10 caracteres).');
            return;
        }

        const originalBtnHtml = btnSubmitReview.innerHTML;
        btnSubmitReview.disabled = true;
        btnSubmitReview.innerHTML = `<span>${t.reviews_form_sending || 'Publicando...'}</span> <div style="display:inline-block; width:12px; height:12px; border:2px solid #ff6f00; border-radius:50%; border-top-color:transparent; animation:rotate 0.8s linear infinite; margin-left:8px;"></div>`;

        const formData = new FormData(formSubmitReview);
        if (!formData.get('csrf_token') && activeCsrfToken) {
            formData.set('csrf_token', activeCsrfToken);
        }

        fetch(getReviewsApiUrl(), {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            btnSubmitReview.disabled = false;
            btnSubmitReview.innerHTML = originalBtnHtml;

            if (data.success) {
                const currentT = translations[currentLang] || translations.es;
                const successMsg = (currentLang === 'en' && currentT.reviews_form_success_pending) 
                    ? currentT.reviews_form_success_pending 
                    : (data.message || currentT.reviews_form_success_pending || '¡Reseña registrada con éxito! Será evaluada por nuestro equipo antes de su publicación.');
                showReviewStatus(true, successMsg);
                
                if (data.new_token) {
                    activeCsrfToken = data.new_token;
                    if (reviewCsrfTokenInput) reviewCsrfTokenInput.value = data.new_token;
                }

                // Solo agregar de inmediato al carrusel si el estatus ya es aprobado
                if (data.status === 'approved' && data.review) {
                    allReviewsData.unshift(data.review);
                    dailyReviewsData = getDailyRotatingReviews(allReviewsData);
                    renderDailyCarousel(dailyReviewsData);
                    updateKpiRating(allReviewsData);
                }

                formSubmitReview.reset();
                if (formReviewRatingInput) formReviewRatingInput.value = 5;
                updateStarPickerUI(5);

                setTimeout(() => {
                    if (reviewFormStatusAlert) {
                        reviewFormStatusAlert.style.display = 'none';
                    }
                }, 6000);
            } else {
                showReviewStatus(false, data.error || 'Ocurrió un error al registrar la reseña en la base de datos.');
            }
        })
        .catch(err => {
            btnSubmitReview.disabled = false;
            btnSubmitReview.innerHTML = originalBtnHtml;
            showReviewStatus(false, 'No se pudo conectar con el backend local. Asegúrese de que Apache y MySQL estén iniciados en XAMPP.');
        });
    });
}

function showReviewStatus(isSuccess, message) {
    if (!reviewFormStatusAlert) return;
    reviewFormStatusAlert.style.display = 'block';
    reviewFormStatusAlert.className = `form-message ${isSuccess ? 'success' : 'error'}`;
    reviewFormStatusAlert.textContent = message;
}

// INICIALIZACIÓN GLOBAL DE APLICACIÓN
fetchReviews();
setLanguage(currentLang);


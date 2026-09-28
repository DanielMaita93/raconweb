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

    // Actualizar cotizador si las funciones ya están definidas
    if (typeof calculateTotal === 'function') {
        calculateTotal();
    }

    // Actualizar tooltips del mapa
    if (typeof markersList !== 'undefined' && markersList.length > 0) {
        markersList.forEach(item => {
            item.marker.setTooltipContent(translations[lang][item.country.nameKey]);
        });
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
// COTIZADOR INTERACTIVO DE RED
// ==========================================
const nodesInput = document.getElementById('nodes-input');
const nodesDisplay = document.getElementById('nodes-val-display');
const distanceInput = document.getElementById('distance-input');
const distanceDisplay = document.getElementById('distance-val-display');
const categorySelect = document.getElementById('category-select');

// Opciones
const optRack = document.getElementById('opt-rack');
const optCert = document.getElementById('opt-cert');
const optTub = document.getElementById('opt-tub');

// Tarjetas contenedoras de checkbox para efecto visual seleccionado
const optionCardRack = document.getElementById('option-card-rack');
const optionCardCert = document.getElementById('option-card-cert');
const optionCardTub = document.getElementById('option-card-tub');

// Visualizadores de Resumen y Total
const priceDisplay = document.getElementById('total-price-display');
const sumBaseDisplay = document.getElementById('sum-base');
const sumMetersDisplay = document.getElementById('sum-meters');
const sumCableDisplay = document.getElementById('sum-cable');
const sumRackDisplay = document.getElementById('sum-rack');
const sumCertDisplay = document.getElementById('sum-cert');
const sumTubDisplay = document.getElementById('sum-tub');

// Elementos de comparación por categoría
const compCat6 = document.getElementById('comp-cat6');
const compCat6a = document.getElementById('comp-cat6a');
const compFiber = document.getElementById('comp-fiber');
const compRowCat6 = document.getElementById('comp-row-cat6');
const compRowCat6a = document.getElementById('comp-row-cat6a');
const compRowFiber = document.getElementById('comp-row-fiber');

// Lógica de cálculo
function calculateTotal() {
    const nodes = parseInt(nodesInput.value);
    const distance = parseInt(distanceInput.value);
    const cableType = categorySelect.value;
    
    // Traducciones dinámicas
    const t = translations[currentLang] || translations['es'];
    
    nodesDisplay.textContent = `${nodes} ${t.js_points}`;
    distanceDisplay.textContent = `${distance} ${t.js_meters}`;

    // 1. Costo Base Mano de Obra: $25 por punto de red
    const baseManoObra = nodes * 25;
    sumBaseDisplay.textContent = `€${baseManoObra.toFixed(2)}`;

    // 2. Metros de cable y cálculo por categoría
    const totalMeters = nodes * distance;
    sumMetersDisplay.textContent = `${totalMeters.toLocaleString()} m`;

    // Tarifas por metro
    const priceCat6 = 0.65;
    const priceCat6a = 0.70;
    const priceFiber = 1.70;

    // Calcular costos totales de cable por categoría
    const costCat6 = totalMeters * priceCat6;
    const costCat6a = totalMeters * priceCat6a;
    const costFiber = totalMeters * priceFiber;

    // Actualizar tabla comparativa en la interfaz
    compCat6.textContent = `€${costCat6.toFixed(2)}`;
    compCat6a.textContent = `€${costCat6a.toFixed(2)}`;
    compFiber.textContent = `€${costFiber.toFixed(2)}`;

    // Resetear fila activa
    compRowCat6.classList.remove('active');
    compRowCat6a.classList.remove('active');
    compRowFiber.classList.remove('active');

    // Seleccionar costo de la categoría activa
    let totalCable = 0;
    let cableLabel = '';
    let cableName = '';

    if (cableType === 'cat6') {
        totalCable = costCat6;
        cableName = 'Cat6 UTP';
        compRowCat6.classList.add('active');
    } else if (cableType === 'cat6a') {
        totalCable = costCat6a;
        cableName = 'Cat6A F/UTP';
        compRowCat6a.classList.add('active');
    } else if (cableType === 'fiber') {
        totalCable = costFiber;
        cableName = currentLang === 'es' ? 'Fibra Multimodo' : 'Multi-mode Fiber';
        compRowFiber.classList.add('active');
    }
    
    cableLabel = `${cableName} (€${totalCable.toFixed(2)})`;
    sumCableDisplay.textContent = cableLabel;

    // 3. Adicionales
    let totalRack = 0;
    if (optRack.checked) {
        totalRack = 300 + (nodes * 3);
        sumRackDisplay.textContent = `${t.js_included} (€${totalRack.toFixed(2)})`;
        optionCardRack.classList.add('selected');
    } else {
        sumRackDisplay.textContent = t.js_not_requested;
        optionCardRack.classList.remove('selected');
    }

    let totalCert = 0;
    if (optCert.checked) {
        totalCert = Math.max(150, nodes * 8);
        sumCertDisplay.textContent = `${t.js_included} (€${totalCert.toFixed(2)})`;
        optionCardCert.classList.add('selected');
    } else {
        sumCertDisplay.textContent = t.js_not_requested;
        optionCardCert.classList.remove('selected');
    }

    let totalTub = 0;
    if (optTub.checked) {
        totalTub = nodes * 15;
        sumTubDisplay.textContent = `${t.js_included} (€${totalTub.toFixed(2)})`;
        optionCardTub.classList.add('selected');
    } else {
        sumTubDisplay.textContent = t.js_not_requested;
        optionCardTub.classList.remove('selected');
    }

    // Total Final
    const totalFinal = baseManoObra + totalCable + totalRack + totalCert + totalTub;
    
    // Animación suave en cambio de precio
    animatePriceDisplay(totalFinal);
}

// Animación de conteo del precio
let currentPriceValue = 0;
function animatePriceDisplay(targetValue) {
    const duration = 400; // ms
    const startTime = performance.now();
    const startValue = currentPriceValue;

    function updatePrice(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
            priceDisplay.textContent = Math.round(targetValue).toLocaleString();
            currentPriceValue = targetValue;
        } else {
            const progress = elapsedTime / duration;
            // Easing de desaceleración
            const easeProgress = 1 - Math.pow(1 - progress, 3); 
            const currentValue = startValue + (targetValue - startValue) * easeProgress;
            priceDisplay.textContent = Math.round(currentValue).toLocaleString();
            requestAnimationFrame(updatePrice);
        }
    }
    requestAnimationFrame(updatePrice);
}

// Event Listeners para Cotizador
nodesInput.addEventListener('input', calculateTotal);
distanceInput.addEventListener('input', calculateTotal);
categorySelect.addEventListener('change', calculateTotal);
optRack.addEventListener('change', calculateTotal);
optCert.addEventListener('change', calculateTotal);
optTub.addEventListener('change', calculateTotal);

// Permitir hacer clic en la tarjeta del checkbox completa
optionCardRack.addEventListener('click', (e) => {
    if (e.target !== optRack) {
        optRack.checked = !optRack.checked;
        calculateTotal();
    }
});
optionCardCert.addEventListener('click', (e) => {
    if (e.target !== optCert) {
        optCert.checked = !optCert.checked;
        calculateTotal();
    }
});
optionCardTub.addEventListener('click', (e) => {
    if (e.target !== optTub) {
        optTub.checked = !optTub.checked;
        calculateTotal();
    }
});

// Inicialización del cotizador
calculateTotal();

// ==========================================
// FORMULARIO DE CONTACTO E INTEGRACIÓN
// ==========================================
const contactForm = document.getElementById('contact-form');
const btnFormSubmit = document.getElementById('btn-form-submit');
const formAlert = document.getElementById('form-alert');
const txtDescription = document.getElementById('form-desc');
const btnCalcRequest = document.getElementById('btn-calc-request');

// Integrar cotizador con formulario de contacto
function generateQuoteDescription() {
    const nodes = nodesInput.value;
    const distance = distanceInput.value;
    const totalMeters = nodes * distance;
    
    // Obtener texto de categoría de cable actual
    const cableType = categorySelect.options[categorySelect.selectedIndex].text;
    
    const t = translations[currentLang] || translations['es'];
    
    let extras = [];
    if (optRack.checked) {
        extras.push(currentLang === 'es' ? "Instalación de Rack/Patch Panels" : "Rack & Patch Panels Installation");
    }
    if (optCert.checked) {
        extras.push(currentLang === 'es' ? "Certificación Fluke" : "Fluke Certification");
    }
    if (optTub.checked) {
        extras.push(currentLang === 'es' ? "Canalizaciones/PVC" : "Conduits/PVC");
    }
    
    const extrasStr = extras.join(', ') || t.js_quote_msg_none;
    const totalEst = priceDisplay.textContent;

    txtDescription.value = `${t.js_quote_msg_header}
- ${t.js_quote_msg_points}: ${nodes}
- ${t.js_quote_msg_distance}: ${distance} m (${t.js_quote_msg_total_cable}: ${totalMeters.toLocaleString()} m)
- ${t.js_quote_msg_category}: ${cableType}
- ${t.js_quote_msg_services}: ${extrasStr}
- ${t.js_quote_msg_est}: EUR €${totalEst}

${t.js_quote_msg_waiting}`;
}

btnCalcRequest.addEventListener('click', () => {
    generateQuoteDescription();
});

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
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const description = document.getElementById('form-desc').value;

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
            subject: (currentLang === 'en' ? 'RACON INGENIERIA - Quote Request: ' : 'RACON INGENIERIA - Solicitud de Presupuesto: ') + name,
            message: `Cliente: ${name}\nEmail: ${email}\n\n-------------------------\nDETALLE DEL PRESUPUESTO:\n-------------------------\n${description}`,
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
                formAlert.style.display = 'block';
                formAlert.className = 'form-alert success form-message';
                formAlert.textContent = t.js_alert_success_local || '¡Presupuesto solicitado con éxito! Nos pondremos en contacto con usted a la brevedad posible.';
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
            setTimeout(() => {
                formAlert.style.display = 'none';
            }, 8000);
        });
    } else {
        // Modo Producción: Envío a través de send_quote.php en Hostinger
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
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
                formAlert.style.display = 'block';
                formAlert.className = 'form-alert success form-message';
                formAlert.textContent = data.message;
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
            setTimeout(() => {
                formAlert.style.display = 'none';
            }, 8000);
        });
    }
});

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
        ? 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
        
    currentTileLayer = L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 20
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

// Inicializar el idioma al cargar la página
setLanguage(currentLang);

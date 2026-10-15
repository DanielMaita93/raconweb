// ==========================================
// RACON INGENIERÍA - LÓGICA DE HUB DE RESEÑAS (resenas.js)
// ==========================================

// 1. Año Actual y Configuración de Tema
const currentYearEl = document.getElementById('current-year');
if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

let currentTheme = localStorage.getItem('selectedTheme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
}

const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('selectedTheme', isLight ? 'light' : 'dark');
    });
}

// 2. Sistema de Idiomas (i18n)
let currentLang = localStorage.getItem('selectedLanguage') || 'es';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('selectedLanguage', lang);
    document.documentElement.lang = lang;

    // Actualizar botones de selector
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Traducir atributos data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            const spanText = el.querySelector('span');
            if (spanText && spanText.getAttribute('data-i18n') === key) {
                spanText.textContent = translations[lang][key];
            } else if (el.querySelector('svg')) {
                const textNodes = Array.from(el.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                if (textNodes.length > 0) {
                    textNodes[0].textContent = translations[lang][key];
                } else {
                    const firstSpan = el.querySelector('span');
                    if (firstSpan) firstSpan.textContent = translations[lang][key];
                }
            } else {
                if (translations[lang][key].includes('<')) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        }
    });

    // Traducir placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    if (translations[lang]) {
        document.title = translations[lang].reviews_page_seo_title || document.title;
    }

    applyFiltersAndRender();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
    });
});

// Menú Móvil
const hamburger = document.getElementById('hamburger-menu');
const navMenu = document.getElementById('nav-menu-list');
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 3. Fondo Canvas Dinámico de Partículas
const canvas = document.getElementById('network-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = window.innerWidth < 768 ? 28 : 55;
    const maxDistance = 140;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6f00';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateNetwork() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 111, 0, ${0.18 * (1 - dist / maxDistance)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateNetwork);
    }
    animateNetwork();
}

// 4. Módulo de Carga, Filtrado y Reseñas
const hubReviewsGrid = document.getElementById('hub-reviews-grid');
const hubSearchInput = document.getElementById('hub-search-input');
const hubFilterPills = document.querySelectorAll('.hub-pill-btn');

let allHubReviews = [];
let activeRatingFilter = 'all';
let searchQuery = '';

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
    let html = '';
    const r = Math.max(1, Math.min(5, parseInt(rating) || 5));
    for (let i = 1; i <= 5; i++) {
        html += i <= r ? '&#9733;' : '&#9734;';
    }
    return html;
}

function applyFiltersAndRender() {
    if (!hubReviewsGrid) return;

    let filtered = allHubReviews.slice();

    // Filtro por calificación
    if (activeRatingFilter !== 'all') {
        if (activeRatingFilter === '3-or-less') {
            filtered = filtered.filter(item => parseInt(item.rating) <= 3);
        } else {
            const targetRating = parseInt(activeRatingFilter);
            filtered = filtered.filter(item => parseInt(item.rating) === targetRating);
        }
    }

    // Filtro por búsqueda de texto
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item => {
            const name = (item.name || '').toLowerCase();
            const company = (item.company || '').toLowerCase();
            const comment = (item.comment || '').toLowerCase();
            return name.includes(query) || company.includes(query) || comment.includes(query);
        });
    }

    if (filtered.length === 0) {
        hubReviewsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <p style="font-size: 1.1rem; margin-bottom: 10px;">No se encontraron reseñas con los filtros seleccionados.</p>
                <button type="button" class="btn-primary" style="margin-top: 14px;" onclick="resetHubFilters()">Ver Todas las Reseñas</button>
            </div>
        `;
        return;
    }

    hubReviewsGrid.innerHTML = filtered.map(r => {
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
}

window.resetHubFilters = function() {
    activeRatingFilter = 'all';
    searchQuery = '';
    if (hubSearchInput) hubSearchInput.value = '';
    hubFilterPills.forEach(pill => {
        if (pill.getAttribute('data-rating') === 'all') pill.classList.add('active');
        else pill.classList.remove('active');
    });
    applyFiltersAndRender();
};

if (hubSearchInput) {
    hubSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFiltersAndRender();
    });
}

hubFilterPills.forEach(btn => {
    btn.addEventListener('click', () => {
        hubFilterPills.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        activeRatingFilter = btn.getAttribute('data-rating') || 'all';
        applyFiltersAndRender();
    });
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

// Cargar reseñas desde la API protegida (Conexión Directa a MySQL)
function fetchHubReviews() {
    fetch(getReviewsApiUrl())
        .then(res => {
            if (!res.ok) throw new Error('API status: ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data && data.success && Array.isArray(data.reviews)) {
                allHubReviews = data.reviews;
            } else {
                allHubReviews = [];
            }
            applyFiltersAndRender();
            updateKpiRating(allHubReviews);
        })
        .catch(err => {
            console.warn('Conexión con la base de datos de reseñas:', err);
            allHubReviews = [];
            applyFiltersAndRender();
            updateKpiRating(allHubReviews);
        });
}

// Inicializar
fetchHubReviews();
setLanguage(currentLang);

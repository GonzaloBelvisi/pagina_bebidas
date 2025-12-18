// Carrusel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const totalSlides = slides.length;

// Función para actualizar el carrusel
function updateCarousel() {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    carouselWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Función para ir al slide anterior
function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

// Función para ir al slide siguiente
function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

// Event listeners para los botones
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Event listeners para los indicadores
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentSlide = index;
        updateCarousel();
    });
});

// Soporte para gestos táctiles (swipe)
let touchStartX = 0;
let touchEndX = 0;
const carouselContainer = document.querySelector('.carousel-container');

carouselContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

carouselContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe izquierda - siguiente slide
            nextSlide();
        } else {
            // Swipe derecha - slide anterior
            prevSlide();
        }
    }
}

// Auto-play opcional (descomentar si se desea)
// let autoPlayInterval = setInterval(nextSlide, 5000);

// Pausar auto-play al interactuar
// carouselContainer.addEventListener('mouseenter', () => {
//     clearInterval(autoPlayInterval);
// });

// carouselContainer.addEventListener('mouseleave', () => {
//     autoPlayInterval = setInterval(nextSlide, 5000);
// });

// Inicializar
updateCarousel();

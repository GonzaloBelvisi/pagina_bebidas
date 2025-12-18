// Navegación entre artboards
function showArtboard(artboardId) {
    // Ocultar todos los artboards
    const artboards = document.querySelectorAll('.artboard');
    artboards.forEach(artboard => {
        artboard.classList.remove('active');
    });
    
    // Mostrar el artboard seleccionado
    const targetArtboard = document.getElementById(artboardId);
    if (targetArtboard) {
        targetArtboard.classList.add('active');
    }
}

// Carrusel con scroll infinito
class InfiniteCarousel {
    constructor(container, track) {
        this.container = container;
        this.track = track;
        this.items = track.querySelectorAll('.carousel-item');
        this.currentIndex = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.offset = 0;
        this.itemWidth = 180 + 30; // width + gap
        this.animationId = null;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        // Event listeners para touch
        this.track.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
        this.track.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        this.track.addEventListener('touchend', (e) => this.handleEnd(e), { passive: false });
        
        // Event listeners para mouse (para desarrollo/testing)
        this.track.addEventListener('mousedown', (e) => this.handleStart(e));
        this.track.addEventListener('mousemove', (e) => this.handleMove(e));
        this.track.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.track.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
        // Click en items
        this.items.forEach(item => {
            item.addEventListener('click', (e) => this.handleItemClick(e, item));
        });
        
        // Auto-scroll suave inicial
        this.startAutoScroll();
    }
    
    getEventX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }
    
    handleStart(e) {
        this.isDragging = true;
        const eventX = this.getEventX(e);
        this.startX = eventX;
        this.currentX = eventX;
        this.lastX = eventX;
        this.lastTime = Date.now();
        this.velocity = 0;
        this.initialOffset = this.offset; // Guardar offset inicial
        
        // Cancelar auto-scroll
        this.stopAutoScroll();
        
        // Prevenir scroll de la página
        e.preventDefault();
    }
    
    handleMove(e) {
        if (!this.isDragging) return;
        
        this.currentX = this.getEventX(e);
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTime;
        
        // Calcular velocidad para momentum scrolling (reducida)
        if (timeDelta > 0) {
            this.velocity = (this.currentX - this.lastX) / timeDelta * 0.3; // Reducir sensibilidad
        }
        
        this.lastX = this.currentX;
        this.lastTime = currentTime;
        
        // Aplicar transformación desde el offset inicial
        const deltaX = this.currentX - this.startX;
        const newOffset = this.initialOffset + deltaX;
        this.setTransform(newOffset);
        
        e.preventDefault();
    }
    
    handleEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Verificar límites antes de aplicar momentum
        this.checkBounds();
        
        // Aplicar momentum scrolling
        this.applyMomentum();
        
        // Reanudar auto-scroll después de un momento
        setTimeout(() => this.startAutoScroll(), 2000);
    }
    
    applyMomentum() {
        const friction = 0.92;
        const minVelocity = 0.05;
        const maxVelocity = 2.0; // Limitar velocidad máxima
        
        // Limitar la velocidad inicial
        if (Math.abs(this.velocity) > maxVelocity) {
            this.velocity = this.velocity > 0 ? maxVelocity : -maxVelocity;
        }
        
        const animate = () => {
            if (Math.abs(this.velocity) < minVelocity) {
                this.velocity = 0;
                this.snapToNearest();
                return;
            }
            
            // Reducir el multiplicador de velocidad para hacerlo más suave
            this.offset += this.velocity * 5;
            this.velocity *= friction;
            
            this.setTransform(this.offset);
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    snapToNearest() {
        const itemCount = this.items.length / 2; // 5 items originales
        const snapOffset = Math.round(this.offset / this.itemWidth) * this.itemWidth;
        
        // Asegurar que estamos en el rango correcto
        let finalOffset = snapOffset;
        const maxOffset = -(itemCount - 1) * this.itemWidth; // -4 * 210 = -840px
        
        // Si estamos fuera de los límites, ajustar al rango válido
        if (finalOffset > 0) {
            finalOffset = maxOffset;
        } else if (finalOffset < maxOffset) {
            finalOffset = 0;
        }
        
        // Animación suave al snap
        this.animateTo(finalOffset);
    }
    
    animateTo(targetOffset) {
        const startOffset = this.offset;
        const distance = targetOffset - startOffset;
        const duration = 300;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            this.offset = startOffset + (distance * ease);
            this.setTransform(this.offset);
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.offset = targetOffset;
                this.checkBounds();
            }
        };
        
        animate();
    }
    
    setTransform(offset) {
        this.offset = offset;
        this.track.style.transform = `translateX(${offset}px)`;
        this.checkBounds();
    }
    
    checkBounds() {
        const itemCount = this.items.length / 2; // 5 items originales
        const maxOffset = -(itemCount - 1) * this.itemWidth; // -4 * 210 = -840px (último item original)
        const minOffset = -itemCount * this.itemWidth; // -5 * 210 = -1050px (inicio de duplicados)
        
        // Scroll infinito: cuando pasamos el último item original, saltamos al inicio sin transición
        // Solo hacer el salto cuando no estamos arrastrando para evitar saltos visibles
        if (!this.isDragging) {
            if (this.offset > 0) {
                // Si vamos hacia la derecha más allá del inicio, saltamos al final
                this.offset = maxOffset;
                this.track.style.transition = 'none';
                this.track.style.transform = `translateX(${this.offset}px)`;
                // Forzar reflow para que el navegador aplique el cambio
                void this.track.offsetHeight;
                setTimeout(() => {
                    this.track.style.transition = '';
                }, 0);
            } else if (this.offset <= minOffset) {
                // Si vamos hacia la izquierda más allá del final, saltamos al inicio
                this.offset = 0;
                this.track.style.transition = 'none';
                this.track.style.transform = `translateX(${this.offset}px)`;
                // Forzar reflow para que el navegador aplique el cambio
                void this.track.offsetHeight;
                setTimeout(() => {
                    this.track.style.transition = '';
                }, 0);
            }
        }
    }
    
    startAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }
        
        // Auto-scroll más suave y lento
        this.autoScrollInterval = setInterval(() => {
            if (!this.isDragging && Math.abs(this.velocity) < 0.1) {
                this.offset -= 1; // Scroll muy lento (1px por frame)
                this.setTransform(this.offset);
            }
        }, 20);
    }
    
    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }
    
    handleItemClick(e, item) {
        // Solo navegar si no hubo drag significativo
        const dragDistance = Math.abs(this.currentX - this.startX);
        if (dragDistance < 15 && !this.isDragging) {
            const target = item.getAttribute('data-target');
            if (target) {
                // Pequeña animación de click
                item.style.transition = 'transform 0.15s ease';
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = '';
                    setTimeout(() => {
                        item.style.transition = '';
                        showArtboard(target);
                    }, 150);
                }, 150);
            }
        }
    }
    
    navigate(direction) {
        const itemCount = this.items.length / 2;
        const currentItem = Math.round(-this.offset / this.itemWidth);
        
        if (direction === 'left') {
            // Mover hacia la izquierda (siguiente item)
            const targetOffset = -(currentItem + 1) * this.itemWidth;
            this.animateTo(targetOffset);
        } else if (direction === 'right') {
            // Mover hacia la derecha (item anterior)
            const targetOffset = -(currentItem - 1) * this.itemWidth;
            this.animateTo(targetOffset);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar carrusel
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.getElementById('carouselTrack');
    
    let carouselInstance = null;
    if (carouselContainer && carouselTrack) {
        carouselInstance = new InfiniteCarousel(carouselContainer, carouselTrack);
    }
    
    // Botones de navegación del carrusel
    const carouselLeft = document.getElementById('carouselLeft');
    const carouselRight = document.getElementById('carouselRight');
    
    if (carouselLeft && carouselInstance) {
        carouselLeft.addEventListener('click', () => {
            carouselInstance.navigate('left');
        });
    }
    
    if (carouselRight && carouselInstance) {
        carouselRight.addEventListener('click', () => {
            carouselInstance.navigate('right');
        });
    }
    
    // Botón de pulsera
    const pulseraButton = document.getElementById('pulseraButton');
    if (pulseraButton) {
        pulseraButton.addEventListener('click', () => {
            const target = pulseraButton.getAttribute('data-target');
            if (target) {
                // Animación de pulsar
                pulseraButton.style.opacity = '0.7';
                setTimeout(() => {
                    pulseraButton.style.opacity = '';
                    showArtboard(target);
                }, 150);
            }
        });
    }
});

// Prevenir scroll de la página completamente
document.addEventListener('touchmove', (e) => {
    // Solo permitir scroll en el carrusel
    const carousel = document.querySelector('.carousel-container');
    if (!carousel || !carousel.contains(e.target)) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });


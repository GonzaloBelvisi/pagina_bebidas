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
        this.itemWidth = 280 + 30; // width + gap
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
        this.startX = this.getEventX(e);
        this.currentX = this.startX;
        this.lastX = this.startX;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        // Cancelar auto-scroll
        this.stopAutoScroll();
        
        // Prevenir scroll de la página
        e.preventDefault();
    }
    
    handleMove(e) {
        if (!this.isDragging) return;
        
        this.currentX = this.getEventX(e);
        const deltaX = this.currentX - this.startX;
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTime;
        
        // Calcular velocidad para momentum scrolling
        if (timeDelta > 0) {
            this.velocity = (this.currentX - this.lastX) / timeDelta;
        }
        
        this.lastX = this.currentX;
        this.lastTime = currentTime;
        
        // Aplicar transformación
        const newOffset = this.offset + deltaX;
        this.setTransform(newOffset);
        
        e.preventDefault();
    }
    
    handleEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Aplicar momentum scrolling
        this.applyMomentum();
        
        // Reanudar auto-scroll después de un momento
        setTimeout(() => this.startAutoScroll(), 2000);
    }
    
    applyMomentum() {
        const friction = 0.95;
        const minVelocity = 0.1;
        
        const animate = () => {
            if (Math.abs(this.velocity) < minVelocity) {
                this.velocity = 0;
                this.snapToNearest();
                return;
            }
            
            this.offset += this.velocity * 10;
            this.velocity *= friction;
            
            this.setTransform(this.offset);
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    snapToNearest() {
        const itemCount = this.items.length / 2; // Dividir por 2 porque están duplicados
        const snapOffset = Math.round(this.offset / this.itemWidth) * this.itemWidth;
        
        // Asegurar que estamos en el rango correcto
        let finalOffset = snapOffset;
        const maxOffset = -(itemCount - 1) * this.itemWidth;
        
        if (finalOffset > 0) {
            finalOffset = -itemCount * this.itemWidth;
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
        const itemCount = this.items.length / 2;
        const maxOffset = -(itemCount - 1) * this.itemWidth;
        const minOffset = -itemCount * this.itemWidth;
        
        // Si estamos fuera de los límites, saltar al otro lado (scroll infinito)
        if (this.offset > 0) {
            this.offset = maxOffset;
            this.track.style.transition = 'none';
            this.track.style.transform = `translateX(${this.offset}px)`;
            setTimeout(() => {
                this.track.style.transition = '';
            }, 50);
        } else if (this.offset < minOffset) {
            this.offset = 0;
            this.track.style.transition = 'none';
            this.track.style.transform = `translateX(${this.offset}px)`;
            setTimeout(() => {
                this.track.style.transition = '';
            }, 50);
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar carrusel
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.getElementById('carouselTrack');
    
    if (carouselContainer && carouselTrack) {
        new InfiniteCarousel(carouselContainer, carouselTrack);
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


// Variable global para el temporizador de retorno automático
let autoReturnTimer = null;

// Navegación entre artboards
function showArtboard(artboardId) {
    // Cancelar cualquier temporizador existente
    if (autoReturnTimer) {
        clearTimeout(autoReturnTimer);
        autoReturnTimer = null;
    }
    
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
    
    // Si no es el artboard principal, iniciar temporizador para volver
    if (artboardId !== 'artboard1') {
        // Tiempo aleatorio entre 30 y 40 segundos (30000-40000 ms)
        const returnTime = 30000 + Math.random() * 10000; // 30-40 segundos
        
        autoReturnTimer = setTimeout(() => {
            // Verificar que todavía estamos en un artboard secundario
            const currentActive = document.querySelector('.artboard.active');
            if (currentActive && currentActive.id !== 'artboard1') {
                showArtboard('artboard1');
            }
        }, returnTime);
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
        this.itemWidth = 180 + 30; // width + gap
        this.animationId = null;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        this.hasMoved = false; // Para detectar si hubo movimiento real
        this.touchStartTime = 0; // Para detectar taps rápidos
        
        // Iniciar en la primera copia para permitir scroll infinito en ambas direcciones
        const itemCount = this.items.length / 4; // 5 items originales
        this.offset = -itemCount * this.itemWidth; // -1050px (inicio de primera copia)
        this.track.style.transform = `translateX(${this.offset}px)`;
        
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
        
        // Click y touch en items - usar ambos para mejor compatibilidad
        this.items.forEach(item => {
            item.addEventListener('click', (e) => this.handleItemClick(e, item));
            item.addEventListener('touchend', (e) => this.handleItemTouchEnd(e, item));
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
        this.hasMoved = false; // Resetear flag de movimiento
        this.touchStartTime = Date.now(); // Guardar tiempo de inicio
        
        // Cancelar auto-scroll
        this.stopAutoScroll();
        
        // Prevenir scroll de la página
        e.preventDefault();
    }
    
    handleMove(e) {
        if (!this.isDragging) return;
        
        this.currentX = this.getEventX(e);
        const deltaX = Math.abs(this.currentX - this.startX);
        
        // Marcar que hubo movimiento si es significativo
        if (deltaX > 5) {
            this.hasMoved = true;
        }
        
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTime;
        
        // Calcular velocidad para momentum scrolling (reducida)
        if (timeDelta > 0) {
            this.velocity = (this.currentX - this.lastX) / timeDelta * 0.3; // Reducir sensibilidad
        }
        
        this.lastX = this.currentX;
        this.lastTime = currentTime;
        
        // Aplicar transformación desde el offset inicial
        const deltaXTotal = this.currentX - this.startX;
        const newOffset = this.initialOffset + deltaXTotal;
        this.setTransform(newOffset);
        
        e.preventDefault();
    }
    
    handleEnd(e) {
        if (!this.isDragging) return;
        
        const wasDragging = this.hasMoved; // Guardar si realmente hubo drag
        
        this.isDragging = false;
        this.hasMoved = false;
        
        // Si hubo drag real, aplicar momentum
        if (wasDragging) {
            // Verificar límites antes de aplicar momentum
            this.checkBounds();
            
            // Aplicar momentum scrolling
            this.applyMomentum();
            
            // Reanudar auto-scroll después de un momento
            setTimeout(() => this.startAutoScroll(), 2000);
        } else {
            // Si fue solo un tap, reanudar auto-scroll inmediatamente
            setTimeout(() => this.startAutoScroll(), 500);
        }
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
        const itemCount = this.items.length / 4; // 5 items originales (hay 4 sets: 1 original + 3 copias)
        const snapOffset = Math.round(this.offset / this.itemWidth) * this.itemWidth;
        
        // Asegurar que estamos en el rango correcto
        let finalOffset = snapOffset;
        const maxScrollOffset = -itemCount * 3 * this.itemWidth; // -3150px (inicio de tercera copia)
        const jumpForwardOffset = -itemCount * this.itemWidth; // -1050px (inicio de primera copia)
        const jumpBackwardOffset = -itemCount * 2 * this.itemWidth; // -2100px (inicio de segunda copia)
        
        // Si estamos fuera de los límites, ajustar al rango válido
        if (finalOffset > 0) {
            finalOffset = jumpBackwardOffset; // Saltar al inicio de la segunda copia
        } else if (finalOffset <= maxScrollOffset) {
            finalOffset = jumpForwardOffset; // Saltar al inicio de la primera copia
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
        const itemCount = this.items.length / 4; // 5 items originales (hay 4 sets: 1 original + 3 copias)
        
        // Límites para el scroll infinito
        // Empezamos en offset 0 (primer item original)
        // Primera copia empieza en: -itemCount * itemWidth = -5 * 210 = -1050px
        // Segunda copia empieza en: -itemCount * 2 * itemWidth = -10 * 210 = -2100px
        // Tercera copia empieza en: -itemCount * 3 * itemWidth = -15 * 210 = -3150px
        
        // Para scroll infinito suave:
        // - Permitimos scroll desde 0 hasta el inicio de la tercera copia (-3150px)
        // - Cuando llegamos a -3150px, saltamos a -1050px (inicio de primera copia, que es igual al original)
        // - Cuando vamos hacia atrás más allá de 0, saltamos a -2100px (inicio de segunda copia)
        
        const jumpForwardOffset = -itemCount * this.itemWidth; // -1050px (inicio de primera copia)
        const jumpBackwardOffset = -itemCount * 2 * this.itemWidth; // -2100px (inicio de segunda copia)
        const maxScrollOffset = -itemCount * 3 * this.itemWidth; // -3150px (inicio de tercera copia)
        
        // Scroll infinito: hacer el salto solo cuando no estamos arrastrando
        if (!this.isDragging) {
            if (this.offset > 0) {
                // Si vamos hacia la derecha más allá del inicio, saltamos al inicio de la segunda copia
                // Esto permite seguir scrolleando hacia la izquierda sin notar el salto
                this.offset = jumpBackwardOffset;
                this.track.style.transition = 'none';
                this.track.style.transform = `translateX(${this.offset}px)`;
                void this.track.offsetHeight;
                setTimeout(() => {
                    this.track.style.transition = '';
                }, 0);
            } else if (this.offset <= maxScrollOffset) {
                // Si vamos hacia la izquierda más allá del límite, saltamos al inicio de la primera copia
                // Esto crea el efecto infinito: cuando llegamos al final, volvemos al inicio de las copias
                this.offset = jumpForwardOffset;
                this.track.style.transition = 'none';
                this.track.style.transform = `translateX(${this.offset}px)`;
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
                const itemCount = this.items.length / 4;
                const maxScrollOffset = -itemCount * 3 * this.itemWidth; // -3150px (inicio de tercera copia)
                const jumpForwardOffset = -itemCount * this.itemWidth; // -1050px (inicio de primera copia)
                
                // Solo hacer scroll si no hemos llegado al límite
                if (this.offset > maxScrollOffset) {
                    this.offset -= 1; // Scroll muy lento (1px por frame)
                    this.setTransform(this.offset);
                } else {
                    // Si llegamos al límite, saltar al inicio de la primera copia (efecto infinito)
                    this.offset = jumpForwardOffset;
                    this.track.style.transition = 'none';
                    this.track.style.transform = `translateX(${this.offset}px)`;
                    void this.track.offsetHeight;
                    setTimeout(() => {
                        this.track.style.transition = '';
                    }, 0);
                }
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
        const timeSinceStart = this.touchStartTime > 0 ? Date.now() - this.touchStartTime : 0;
        
        // Permitir click si el movimiento fue menor a 15px (tap, no drag)
        if (dragDistance < 15) {
            e.preventDefault();
            e.stopPropagation();
            
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
    
    handleItemTouchEnd(e, item) {
        // Manejar touch end específicamente para tablets
        const dragDistance = Math.abs(this.currentX - this.startX);
        const timeSinceStart = this.touchStartTime > 0 ? Date.now() - this.touchStartTime : 0;
        
        // Si fue un tap (no drag), procesar la navegación
        if (dragDistance < 15 && timeSinceStart < 500) {
            e.preventDefault();
            e.stopPropagation();
            
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
        // Detener auto-scroll temporalmente
        this.stopAutoScroll();
        
        const itemCount = this.items.length / 4; // 5 items originales (hay 4 sets: 1 original + 3 copias)
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
        
        // Reanudar auto-scroll después de la animación
        setTimeout(() => this.startAutoScroll(), 2500);
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


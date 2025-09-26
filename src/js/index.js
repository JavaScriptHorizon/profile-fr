const App = {
    // Configuration
    config: {
        cardRotationInterval: 2000,
        transitionDuration: 600,
        autoRotate: true,
        enableKeyboard: true,
        enableTouch: true
    },

    // State management
    state: {
        isRotationPaused: false,
        currentTimer: null,
        isAnimating: false
    },

    // DOM elements cache
    elements: {
        pr: null,
        cards: []
    },

    // Initialize the application
    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.Foto();
            this.Teams();
            this.setupAccessibility();
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    },

    // Cache DOM elements for better performance
    cacheElements() {
        this.elements.pr = document.querySelector("#teams .pr");
        if (this.elements.pr) {
            this.elements.cards = Array.from(this.elements.pr.children);
        }
    },

    // Foto section functionality
    Foto() {
        try {
            const fotoSection = document.querySelector('#foto');
            if (!fotoSection) return;

            // Add intersection observer for animation
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateFotoSection(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(fotoSection);

        } catch (error) {
            console.error('Error in Foto section:', error);
        }
    },

    // Animate foto section when it comes into view
    animateFotoSection(section) {
        const img = section.querySelector('img');
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.opacity = '1';
        }
    },

    // Teams section functionality - Enhanced card rotation
    Teams() {
        if (!this.elements.pr || this.elements.cards.length === 0) {
            console.warn('Teams section not found or no cards available');
            return;
        }

        this.setupCardRotation();
        this.setupCardInteractions();
        this.setupCardAccessibility();
    },

    // Setup card rotation system
    setupCardRotation() {
        if (!this.config.autoRotate) return;

        const rotateCards = () => {
            if (this.state.isRotationPaused || this.state.isAnimating) return;

            this.state.isAnimating = true;
            this.rotateCardsForward();

            // Reset animation flag after transition
            setTimeout(() => {
                this.state.isAnimating = false;
            }, this.config.transitionDuration);
        };

        // Start auto-rotation
        this.startAutoRotation(rotateCards);
    },

    // Rotate cards forward
    rotateCardsForward() {
        this.elements.pr.style.transition = `transform ${this.config.transitionDuration}ms ease`;
        this.elements.pr.prepend(this.elements.pr.lastElementChild);
        this.updateCardPositions();
    },

    // Rotate cards backward
    rotateCardsBackward() {
        this.elements.pr.style.transition = `transform ${this.config.transitionDuration}ms ease`;
        this.elements.pr.appendChild(this.elements.pr.firstElementChild);
        this.updateCardPositions();
    },

    // Update card positions and accessibility attributes
    updateCardPositions() {
        this.elements.cards = Array.from(this.elements.pr.children);
        this.elements.cards.forEach((card, index) => {
            card.setAttribute('data-position', index);
            card.setAttribute('aria-posinset', index + 1);
            card.setAttribute('aria-setsize', this.elements.cards.length);
        });
    },

    // Start auto-rotation timer
    startAutoRotation(rotationFunction) {
        if (this.state.currentTimer) {
            clearInterval(this.state.currentTimer);
        }

        this.state.currentTimer = setInterval(rotationFunction, this.config.cardRotationInterval);
    },

    // Pause auto-rotation
    pauseRotation() {
        this.state.isRotationPaused = true;
        if (this.state.currentTimer) {
            clearInterval(this.state.currentTimer);
            this.state.currentTimer = null;
        }
    },

    // Resume auto-rotation
    resumeRotation() {
        this.state.isRotationPaused = false;
        if (this.config.autoRotate) {
            this.startAutoRotation(() => {
                if (!this.state.isRotationPaused && !this.state.isAnimating) {
                    this.rotateCardsForward();
                }
            });
        }
    },

    // Setup card interactions (hover, click, etc.)
    setupCardInteractions() {
        if (!this.elements.pr) return;

        // Mouse events
        this.elements.pr.addEventListener('mouseenter', () => this.pauseRotation());
        this.elements.pr.addEventListener('mouseleave', () => this.resumeRotation());

        // Touch events for mobile
        if (this.config.enableTouch) {
            this.setupTouchInteractions();
        }

        // Keyboard navigation
        if (this.config.enableKeyboard) {
            this.setupKeyboardNavigation();
        }

        // Card click events
        this.elements.cards.forEach(card => {
            card.addEventListener('click', () => this.handleCardClick(card));
        });
    },

    // Setup touch interactions for mobile devices
    setupTouchInteractions() {
        let touchStartX = 0;
        let touchEndX = 0;

        this.elements.pr.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            this.pauseRotation();
        }, { passive: true });

        this.elements.pr.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
            setTimeout(() => this.resumeRotation(), 3000);
        }, { passive: true });
    },

    // Handle swipe gestures
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.rotateCardsForward(); // Swipe left
            } else {
                this.rotateCardsBackward(); // Swipe right
            }
        }
    },

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.elements.pr.contains(document.activeElement)) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.pauseRotation();
                    this.rotateCardsBackward();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.pauseRotation();
                    this.rotateCardsForward();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleRotation();
                    break;
                case 'Escape':
                    this.resumeRotation();
                    break;
            }
        });
    },

    // Toggle rotation pause/play
    toggleRotation() {
        if (this.state.isRotationPaused) {
            this.resumeRotation();
        } else {
            this.pauseRotation();
        }
    },

    // Handle card click
    handleCardClick(card) {
        const position = parseInt(card.getAttribute('data-position'));

        // If card is not centered, center it
        if (position !== 2) { // Assuming center position is index 2
            this.centerCard(card);
        } else {
            // If already centered, trigger card action
            this.activateCard(card);
        }

        this.pauseRotation();
    },

    // Center a specific card
    centerCard(card) {
        const currentIndex = this.elements.cards.indexOf(card);
        const centerIndex = 2;
        const movesNeeded = (currentIndex - centerIndex + this.elements.cards.length) % this.elements.cards.length;

        for (let i = 0; i < movesNeeded; i++) {
            this.rotateCardsBackward();
        }
    },

    // Activate card (example functionality)
    activateCard(card) {
        card.classList.add('active');
        setTimeout(() => card.classList.remove('active'), 1000);
        console.log('Card activated:', card.textContent);
    },

    // Setup accessibility features
    setupAccessibility() {
        if (!this.elements.pr) return;

        this.elements.pr.setAttribute('role', 'region');
        this.elements.pr.setAttribute('aria-label', 'Project carousel');
        this.elements.pr.setAttribute('aria-live', 'polite');

        this.elements.cards.forEach((card, index) => {
            card.setAttribute('role', 'article');
            card.setAttribute('aria-label', `Project ${index + 1}`);
            card.setAttribute('tabindex', '0');
        });
    },

    // Setup global event listeners
    setupEventListeners() {
        // Pause animation when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRotation();
            } else {
                this.resumeRotation();
            }
        });

        // Handle window resize
        window.addEventListener('resize', this.throttle(() => {
            this.handleResize();
        }, 250));
    },

    // Handle window resize
    handleResize() {
        // Adjust card sizes or layout on resize if needed
        console.log('Window resized - adjust layout if necessary');
    },

    // Throttle function for performance
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Destroy method for cleanup
    destroy() {
        this.pauseRotation();

        // Remove event listeners
        if (this.elements.pr) {
            this.elements.pr.replaceWith(this.elements.pr.cloneNode(true));
        }

        console.log('App destroyed');
    }
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
// FAVELLA 1 Landing Page - JavaScript
// Animazioni e interattività

// ===== TYPING ANIMATION =====
const textToType = "Scrivi storie, non codice.";
const typingSpeed = 100; // millisecondi per carattere
const startDelay = 500; // ritardo iniziale

function typeText() {
    const typedTextElement = document.getElementById('typed-text');
    let charIndex = 0;

    function type() {
        if (charIndex < textToType.length) {
            typedTextElement.textContent += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(type, typingSpeed);
        }
    }

    setTimeout(type, startDelay);
}

// Avvia l'animazione quando la pagina è caricata
document.addEventListener('DOMContentLoaded', typeText);

// ===== LOG ACCORDION =====
function toggleLog(button) {
    const logItem = button.parentElement;
    const isActive = logItem.classList.contains('active');
    
    // Chiudi tutti gli altri log
    document.querySelectorAll('.log-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle del log corrente
    if (!isActive) {
        logItem.classList.add('active');
    }
}

// ===== COPY CODE FUNCTIONALITY =====
function copyCode(button) {
    const codeBlock = button.nextElementSibling;
    const code = codeBlock.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        // Feedback visivo
        const originalText = button.textContent;
        button.textContent = '✓ Copiato!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Errore nella copia:', err);
        button.textContent = '✗ Errore';
        setTimeout(() => {
            button.textContent = 'Copia';
        }, 2000);
    });
}

// ===== SMOOTH SCROLL WITH OFFSET FOR FIXED NAV =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== NAVBAR SCROLL EFFECT =====
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ===== INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Applica l'animazione fade-in alle sezioni
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

// ===== GLOW EFFECT ON HOVER FOR INTERACTIVE ELEMENTS =====
document.addEventListener('DOMContentLoaded', () => {
    const glowElements = document.querySelectorAll('.btn, .nav-link, .contribute-card');
    
    glowElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
});

// ===== EASTER EGG: KONAMI CODE =====
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Easter egg attivato!
        const terminal = document.querySelector('.terminal-body');
        const originalContent = terminal.innerHTML;
        
        terminal.innerHTML = '<span class="terminal-prompt">favella@v0.0.9.2:~$</span> <span style="color: #00e5ff;">Hai scoperto il segreto! 🎮✨</span><span class="cursor">_</span>';
        
        setTimeout(() => {
            terminal.innerHTML = originalContent;
            typeText();
        }, 3000);
        
        konamiCode = [];
    }
});

// ===== CONSOLE MESSAGE =====
console.log('%c🎮 FAVELLA 1 ', 'background: #1a237e; color: #00e5ff; font-size: 20px; padding: 10px; font-family: monospace;');
console.log('%cScrivi storie, non codice.', 'color: #9fa8da; font-size: 14px; font-family: monospace;');
console.log('%cProgetto open-source: https://github.com/tuo-utente/favella1', 'color: #00e5ff; font-size: 12px;');
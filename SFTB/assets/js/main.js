/**
 * ============================================================
 * START FROM THE BOTTOM — Global JavaScript
 * Milky Way Idle Guild
 * ============================================================
 */

 (function() {
    'use strict';

    // ============================================================
    // 1. STARS CANVAS (twinkling starfield)
    // ============================================================
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let stars = [];
        let w, h;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let animationId = null;

        function resizeStars() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = document.documentElement.scrollHeight;
            buildStars();
        }

        function buildStars() {
            stars = [];
            const count = Math.floor((w * h) / 10000);
            for (let i = 0; i < count; i++) {
                // Density higher near top (sky), lower near bottom (earth)
                const y = Math.random() * h;
                const depthFactor = 1 - (y / h);
                if (Math.random() > depthFactor * 0.8 + 0.15) continue;
                stars.push({
                    x: Math.random() * w,
                    y: y,
                    r: Math.random() * 1.4 + 0.3,
                    o: Math.random() * 0.5 + 0.4,
                    tw: Math.random() * 0.025 + 0.005,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        function drawStars(timestamp) {
            ctx.clearRect(0, 0, w, h);
            for (const s of stars) {
                const flicker = Math.sin(timestamp * s.tw + s.phase) * 0.25 + 0.75;
                ctx.globalAlpha = s.o * flicker;
                ctx.fillStyle = '#f3ead8';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            if (!reduceMotion) {
                animationId = requestAnimationFrame(drawStars);
            }
        }

        // Initial setup
        resizeStars();
        window.addEventListener('resize', resizeStars);

        // Handle scroll height changes (dynamic content)
        const resizeObserver = new ResizeObserver(() => {
            resizeStars();
        });
        resizeObserver.observe(document.body);

        // Start animation
        if (!reduceMotion) {
            animationId = requestAnimationFrame(drawStars);
        } else {
            // Draw once for reduced motion
            drawStars(0);
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            resizeObserver.disconnect();
        });
    }

    // ============================================================
    // 2. HAMBURGER MENU (mobile nav toggle)
    // ============================================================
    (function setupMobileMenu() {
        // Create hamburger button if it doesn't exist
        const header = document.querySelector('header');
        if (!header) return;

        // Check if a toggle button already exists
        let toggleBtn = document.querySelector('.nav-toggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'nav-toggle';
            toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = '☰';
            // Style inline (we rely on CSS, but add minimal inline for fallback)
            toggleBtn.style.display = 'none';
            toggleBtn.style.background = 'none';
            toggleBtn.style.border = 'none';
            toggleBtn.style.color = 'var(--star)';
            toggleBtn.style.fontSize = '1.6rem';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.style.padding = '4px 8px';
            header.appendChild(toggleBtn);
        }

        const nav = document.querySelector('nav');
        if (!nav) return;

        // Check if we're on mobile (width < 640px) and toggle visibility
        function checkMobile() {
            const isMobile = window.innerWidth < 640;
            if (isMobile) {
                toggleBtn.style.display = 'block';
                // If nav is not explicitly shown, hide it (unless it's open)
                if (!nav.classList.contains('nav-open')) {
                    nav.style.display = 'none';
                }
            } else {
                toggleBtn.style.display = 'none';
                nav.style.display = 'block';
                nav.classList.remove('nav-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.innerHTML = '☰';
            }
        }

        // Toggle function
        function toggleNav() {
            const isOpen = nav.classList.toggle('nav-open');
            if (isOpen) {
                nav.style.display = 'block';
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.innerHTML = '✕';
            } else {
                nav.style.display = 'none';
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.innerHTML = '☰';
            }
        }

        // Event listeners
        toggleBtn.addEventListener('click', toggleNav);

        // Close nav when clicking outside
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 640) {
                const isClickInside = header.contains(e.target);
                if (!isClickInside && nav.classList.contains('nav-open')) {
                    toggleNav();
                }
            }
        });

        // Close nav on link click (for single-page navigation)
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth < 640 && nav.classList.contains('nav-open')) {
                    toggleNav();
                }
            });
        });

        // Handle resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(checkMobile, 150);
        });

        // Initial check
        checkMobile();
    })();

    // ============================================================
    // 3. TOAST NOTIFICATIONS
    // ============================================================
    window.showToast = function(message, type) {
        type = type || 'info'; // 'success', 'error', 'info', 'warning'

        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                width: 100%;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'alert');

        // Color mapping
        const colors = {
            success: { bg: 'rgba(34, 197, 94, 0.20)', border: '#22c55e', icon: '✓' },
            error: { bg: 'rgba(239, 68, 68, 0.20)', border: '#ef4444', icon: '✕' },
            warning: { bg: 'rgba(234, 179, 8, 0.20)', border: '#eab308', icon: '⚠' },
            info: { bg: 'rgba(59, 130, 246, 0.20)', border: '#3b82f6', icon: 'ℹ' }
        };

        const style = colors[type] || colors.info;

        toast.style.cssText = `
            background: ${style.bg};
            backdrop-filter: blur(8px);
            border: 1px solid ${style.border};
            border-radius: 10px;
            padding: 16px 20px;
            color: var(--star, #f3ead8);
            font-family: var(--font-body, 'Inter', sans-serif);
            font-size: 0.95rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            transform: translateX(calc(100% + 40px));
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        `;

        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.textContent = style.icon;
        iconSpan.style.cssText = `
            font-size: 1.2rem;
            flex-shrink: 0;
            margin-top: 2px;
        `;
        toast.appendChild(iconSpan);

        // Message
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        msgSpan.style.flex = '1';
        toast.appendChild(msgSpan);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--star-dim, #b9ae9a);
            font-size: 0.9rem;
            cursor: pointer;
            padding: 0 4px;
            flex-shrink: 0;
            transition: color 0.2s;
        `;
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('mouseenter', function() {
            this.style.color = 'var(--star, #f3ead8)';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.color = 'var(--star-dim, #b9ae9a)';
        });
        toast.appendChild(closeBtn);

        // Add to container
        container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(function() {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Auto-remove after 4.5 seconds
        let timeoutId = setTimeout(function() {
            removeToast(toast);
        }, 4500);

        // Remove on close button click
        closeBtn.addEventListener('click', function() {
            clearTimeout(timeoutId);
            removeToast(toast);
        });

        // Remove on click outside (optional)
        toast.addEventListener('click', function(e) {
            if (e.target === toast || e.target === msgSpan) {
                // Don't close on message click
                return;
            }
        });

        function removeToast(el) {
            el.style.transform = 'translateX(calc(100% + 40px))';
            el.style.opacity = '0';
            setTimeout(function() {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                // Remove container if empty
                if (container && container.children.length === 0) {
                    container.parentNode?.removeChild(container);
                }
            }, 400);
        }
    };

    // ============================================================
    // 4. FORMAT NUMBER (1.2K, 2.5M, etc.)
    // ============================================================
    window.formatNumber = function(n) {
        if (n === undefined || n === null || isNaN(n)) return '—';

        const num = Number(n);
        if (num < 0) return '-' + window.formatNumber(Math.abs(num));

        if (num < 1000) return num.toString();

        const units = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(num) / 3);
        const scaled = num / Math.pow(1000, tier);

        // Round to 1 decimal if < 10, else no decimal
        let formatted;
        if (scaled < 10) {
            formatted = scaled.toFixed(1);
        } else {
            formatted = scaled.toFixed(0);
        }

        return formatted + units[tier];
    };

    // ============================================================
    // 5. ACTIVE NAV LINK (highlight current page)
    // ============================================================
    (function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a, header a');

        navLinks.forEach(function(link) {
            const href = link.getAttribute('href');
            if (!href) return;

            // Skip external links or hash links
            if (href.startsWith('http') || href.startsWith('#')) return;

            // Normalize paths
            const linkPath = href.split('?')[0].split('#')[0];
            const current = currentPath.split('?')[0].split('#')[0];

            // Handle index.html vs / or empty
            const linkNormalized = linkPath.replace(/\/index\.html$/, '/') || '/';
            const currentNormalized = current.replace(/\/index\.html$/, '/') || '/';

            if (linkNormalized === currentNormalized) {
                link.classList.add('current');
            } else {
                link.classList.remove('current');
            }
        });
    })();

    // ============================================================
    // 6. INITIALIZATION LOG (optional)
    // ============================================================
    console.log('🌌 SFTB — Start From The Bottom');
    console.log('📦 Global functions available: showToast(), formatNumber()');

})();
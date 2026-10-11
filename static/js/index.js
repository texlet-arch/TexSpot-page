window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

// Lightweight results carousel: arrows, dots, keyboard, swipe, autoplay.
// Autoplay advances every `interval` ms while the user is idle. Any manual
// navigation delays the next auto-advance by `idleDelay` ms; another manual
// action within that window restarts the full `idleDelay` wait.
function setupResultsCarousel(root, interval, idleDelay) {
    const items = Array.from(root.querySelectorAll(':scope > .item'));
    if (items.length === 0) return;

    // Build DOM: viewport > track > items
    const viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';
    const track = document.createElement('div');
    track.className = 'carousel-track';
    items.forEach(item => track.appendChild(item));
    viewport.appendChild(track);
    root.appendChild(viewport);

    const icon = dir => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="' +
        (dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6') + '"/></svg>';
    const makeArrow = (dir, label) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel-arrow ' + dir;
        b.setAttribute('aria-label', label);
        b.innerHTML = icon(dir);
        root.appendChild(b);
        return b;
    };
    const prevBtn = makeArrow('prev', 'Previous slide');
    const nextBtn = makeArrow('next', 'Next slide');

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'carousel-dots';
    const dots = items.map((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'carousel-dot';
        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        d.addEventListener('click', () => { goTo(i); userActed(); });
        dotsWrap.appendChild(d);
        return d;
    });
    root.appendChild(dotsWrap);

    let index = 0;
    let timer = null;

    function goTo(i) {
        index = (i + items.length) % items.length;
        track.style.transform = 'translateX(' + (-100 * index) + '%)';
        dots.forEach((d, k) => {
            const active = k === index;
            d.classList.toggle('is-active', active);
            if (active) d.setAttribute('aria-current', 'true');
            else d.removeAttribute('aria-current');
        });
        items.forEach((it, k) => it.setAttribute('aria-hidden', k === index ? 'false' : 'true'));
    }

    function stop() {
        if (timer) { clearTimeout(timer); timer = null; }
    }
    // Schedule the next auto-advance after `delay`; subsequent ones use `interval`.
    function schedule(delay) {
        stop();
        if (document.hidden) return;
        timer = setTimeout(() => {
            goTo(index + 1);
            schedule(interval);
        }, delay);
    }
    // Manual navigation: wait the longer idle delay before resuming autoplay.
    function userActed() {
        schedule(idleDelay);
    }

    prevBtn.addEventListener('click', () => { goTo(index - 1); userActed(); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); userActed(); });

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { goTo(index - 1); userActed(); }
        else if (e.key === 'ArrowRight') { goTo(index + 1); userActed(); }
    });

    // Touch swipe
    let startX = null;
    viewport.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    viewport.addEventListener('touchend', e => {
        if (startX !== null) {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
        }
        startX = null;
        userActed();
    });

    // Pause when the tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : schedule(interval); });

    goTo(0);
    schedule(interval);
}

// Initialize without depending on jQuery (CDN may be blocked in some regions)
function initPage() {

    document.querySelectorAll('.results-carousel').forEach(function (el) {
        setupResultsCarousel(el, 5000, 15000);
    });

    if (typeof bulmaSlider !== 'undefined') {
        bulmaSlider.attach();
    }
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

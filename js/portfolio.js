document.addEventListener('DOMContentLoaded', function () {
    var chips = Array.from(document.querySelectorAll('.portfolio-chip'));
    var work = document.getElementById('panel-work');
    var explorations = document.getElementById('panel-explorations');
    var details = Array.from(work.querySelectorAll('details'));
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var explorationIds = ['freeze-card', 'hide-chats'];
    var sideProjects = document.getElementById('panel-side-projects');
    var revealAnimations = new Set();
    var category = 'work';
    var chipStrip = document.querySelector('.portfolio-chips');
    var preview = document.querySelector('.work-preview');
    var previewAvailable = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    var previewSummary = null;

    function hidePreview(summary) {
        if (summary && summary !== previewSummary) return;
        previewSummary = null;
        preview.classList.remove('is-visible');
    }

    function showPreview(item, summary) {
        if (!previewAvailable.matches || category !== 'work' || details.some(function (entry) { return entry.open; })) return;
        var listTop = work.getBoundingClientRect().top;
        var rightEdge = Math.max.apply(null, details.map(function (entry) {
            return entry.querySelector('summary').getBoundingClientRect().right;
        }));
        var viewportWidth = document.documentElement.clientWidth;
        var left = Math.max(viewportWidth / 2 + 32, rightEdge + 40);
        var availableWidth = viewportWidth - left - 24;
        var top = Math.max(16, listTop);
        var width = Math.min(400, availableWidth, (window.innerHeight - top - 16) * 4 / 3);
        if (availableWidth < 280 || width < 160) {
            hidePreview();
            return;
        }
        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        preview.style.width = width + 'px';
        preview.querySelectorAll('[data-preview-image]').forEach(function (image) {
            image.classList.toggle('is-active', image.dataset.previewImage === item.dataset.preview);
        });
        previewSummary = summary;
        preview.classList.add('is-visible');
    }

    work.querySelectorAll('[data-preview]').forEach(function (item) {
        var summary = item.querySelector('summary');
        summary.addEventListener('pointerenter', function () { showPreview(item, summary); });
        summary.addEventListener('pointerleave', function () {
            if (!summary.matches(':focus-visible')) hidePreview(summary);
        });
        summary.addEventListener('focus', function () { showPreview(item, summary); });
        summary.addEventListener('blur', function () { hidePreview(summary); });
    });
    window.addEventListener('scroll', function () {
        if (previewSummary && previewSummary.matches(':focus-visible, :hover')) {
            showPreview(previewSummary.closest('[data-preview]'), previewSummary);
        } else hidePreview();
    }, { passive: true });
    window.addEventListener('resize', function () { hidePreview(); });
    previewAvailable.addEventListener('change', function () { hidePreview(); });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') hidePreview();
    });

    function updateScrollEdges() {
        var left = chipStrip.scrollLeft > 1;
        var right = chipStrip.scrollLeft + chipStrip.clientWidth < chipStrip.scrollWidth - 1;
        chipStrip.dataset.overflow = left && right ? 'both' : left ? 'left' : right ? 'right' : 'none';
    }

    chipStrip.addEventListener('scroll', updateScrollEdges, { passive: true });
    new ResizeObserver(updateScrollEdges).observe(chipStrip);

    function arrangeProjects() {
        details.forEach(function (item) {
            item.querySelector('.work-index__detail').appendChild(document.getElementById(item.dataset.project));
        });
        ['winline', 'ddx-fitness'].forEach(function (id) { sideProjects.appendChild(document.getElementById(id)); });
        if (category === 'explorations') {
            explorationIds.forEach(function (id) { explorations.appendChild(document.getElementById(id)); });
        }
    }

    function reveal(elements) {
        elements.forEach(function (element, index) {
            if (reducedMotion.matches) return;
            var animation = element.animate([
                { opacity: 0, transform: 'translateY(10px)', filter: 'blur(5px)' },
                { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
            ], {
                duration: 480,
                delay: index * 65,
                easing: 'cubic-bezier(0.2, 0, 0, 1)',
                fill: 'backwards'
            });
            revealAnimations.add(animation);
            animation.onfinish = animation.oncancel = function () { revealAnimations.delete(animation); };
        });
    }

    function selectCategory(chip) {
        if (chip.disabled || chip.dataset.category === category) return;
        hidePreview();
        category = chip.dataset.category;
        history.replaceState(history.state, '', '#' + category);
        details.forEach(function (item) { item.open = false; });
        arrangeProjects();
        chips.forEach(function (item) {
            var active = item === chip;
            item.setAttribute('aria-selected', String(active));
            item.tabIndex = active ? 0 : -1;
            document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
        });
        var strip = chip.parentElement;
        var stripBounds = strip.getBoundingClientRect();
        var chipBounds = chip.getBoundingClientRect();
        var inset = parseFloat(getComputedStyle(strip).paddingLeft);
        var offset = chipBounds.right > stripBounds.right - inset ? chipBounds.right - stripBounds.right + inset :
            chipBounds.left < stripBounds.left + inset ? chipBounds.left - stripBounds.left - inset : 0;
        if (offset) strip.scrollBy({ left: offset, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        reveal(Array.from(document.getElementById(chip.getAttribute('aria-controls')).children));
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () { selectCategory(chip); });
        chip.addEventListener('keydown', function (event) {
            var available = chips.filter(function (item) { return !item.disabled; });
            var index = available.indexOf(chip);
            if (event.key === 'ArrowRight') index = (index + 1) % available.length;
            else if (event.key === 'ArrowLeft') index = (index - 1 + available.length) % available.length;
            else if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = available.length - 1;
            else return;
            event.preventDefault();
            available[index].focus();
            selectCategory(available[index]);
        });
    });

    details.forEach(function (item) {
        item.querySelector('summary').addEventListener('click', function (event) {
            // Keep the work index preview-only until case pages are ready.
            event.preventDefault();
        });
    });

    arrangeProjects();
    updateScrollEdges();
    function restoreCategory() {
        var chip = chips.find(function (item) { return '#' + item.dataset.category === location.hash; });
        if (!chip) return;
        selectCategory(chip);
        chipStrip.scrollIntoView({ block: 'start' });
    }
    restoreCategory();
    window.addEventListener('hashchange', restoreCategory);
    reveal(Array.from(document.querySelectorAll('.intro__header, .intro__body > p, .portfolio-chips, .work-index__item')));

    // Only play media that is actually on screen, including expanded work items.
    var mediaVisibility = new Map();
    function syncPlayback() {
        mediaVisibility.forEach(function (visible, video) {
            video.controls = reducedMotion.matches;
            if (visible && !document.hidden && !reducedMotion.matches) {
                video.play().catch(function () { video.controls = true; });
            } else video.pause();
        });
    }
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { mediaVisibility.set(entry.target, entry.isIntersecting); });
        syncPlayback();
    }, { threshold: 0.1 });
    document.querySelectorAll('video').forEach(function (video) {
        video.autoplay = false;
        video.pause();
        observer.observe(video);
    });
    document.addEventListener('visibilitychange', syncPlayback);
    reducedMotion.addEventListener('change', function () {
        if (reducedMotion.matches) revealAnimations.forEach(function (animation) { animation.finish(); });
        syncPlayback();
    });
});

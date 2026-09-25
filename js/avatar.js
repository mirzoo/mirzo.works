// Unmodified sound module from mishanaer/sound, commit 5642f509b8cf20176c25f0d237db79f45ebad182.
import { playUISound } from './ui-sounds.js';

document.addEventListener('DOMContentLoaded', async function () {
    var image = document.querySelector('img.intro__avatar');
    if (!image) return;

    // Keep the image as a static fallback if the SVG cannot be loaded inline.
    var avatar;
    try {
        var response = await fetch(image.src);
        if (!response.ok) return;
        var documentSvg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        if (documentSvg.querySelector('parsererror')) return;
        avatar = document.importNode(documentSvg.documentElement, true);
        if (avatar.localName !== 'svg') return;
    } catch (error) {
        return;
    }

    var eyes = avatar.querySelector('#eyes');
    var eyelids = avatar.querySelectorAll('#eye-left, #eye-right');
    if (!eyes || eyelids.length !== 2) return;

    avatar.classList.add('intro__avatar');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.setAttribute('focusable', 'false');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'intro__avatar-button';
    button.setAttribute('aria-label', 'React and play a sound');
    button.appendChild(avatar);
    image.replaceWith(button);

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var inView = true;
    var blinkTimer;
    var blinks = [];
    var pointerFrame = null;
    var previousFrame = 0;
    var pointer = null;
    var target = { x: 0, y: 0 };
    var gaze = { x: 0, y: 0, tilt: 0 };
    var glance = { x: 0, y: 0 };
    var glanceDirections = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    var lastGlanceDirection = -1;
    var glanceTimer;
    var glanceReturnTimer;
    var windowActive = true;
    var lastActivation = -Infinity;
    var recentTaps = [];
    var lastEmotion = '';
    var reactionTimer;

    function canAnimate() {
        return !reducedMotion.matches && !document.hidden && inView && windowActive;
    }

    function resetExpression() {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = null;
        previousFrame = 0;
        gaze = { x: 0, y: 0, tilt: 0 };
        avatar.classList.remove('is-curious');
        avatar.style.removeProperty('--head-tilt');
        eyes.style.removeProperty('transform');
    }

    function clamp(value, limit) {
        return Math.max(-limit, Math.min(limit, value));
    }

    function moveGaze(time) {
        pointerFrame = null;
        if (!canAnimate()) return;
        var dt = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 1 / 60;
        previousFrame = time;
        // The independent look leads; the pointer adds a small offset within it.
        var cursorWeight = glance.x || glance.y ? 0.22 : 0.45;
        var x = clamp(glance.x + target.x * cursorWeight, 3.2);
        var y = clamp(glance.y + target.y * cursorWeight, 2.2);
        var tilt = x / 3.2 * 2.5;
        // Frame-rate-independent follow: eyes catch up first, the head a little later.
        var eyeFollow = 1 - Math.exp(-dt / 0.16);
        var headFollow = 1 - Math.exp(-dt / 0.28);
        gaze.x += (x - gaze.x) * eyeFollow;
        gaze.y += (y - gaze.y) * eyeFollow;
        gaze.tilt += (tilt - gaze.tilt) * headFollow;
        var settled = Math.abs(x - gaze.x) + Math.abs(y - gaze.y) + Math.abs(tilt - gaze.tilt) < 0.005;
        if (settled) gaze = { x: x, y: y, tilt: tilt };
        eyes.style.transform = 'translate(' + gaze.x.toFixed(3) + 'px, ' + gaze.y.toFixed(3) + 'px)';
        avatar.style.setProperty('--head-tilt', gaze.tilt.toFixed(3) + 'deg');
        if (!settled) pointerFrame = requestAnimationFrame(moveGaze);
        else previousFrame = 0;
    }

    function startGaze() {
        if (canAnimate() && pointerFrame === null) pointerFrame = requestAnimationFrame(moveGaze);
    }

    function updatePointerTarget() {
        target = { x: 0, y: 0 };
        if (pointer && canAnimate()) {
            // Normalize each direction to its viewport edge; there is no distance cutoff.
            var bounds = button.getBoundingClientRect();
            var cx = bounds.left + bounds.width / 2;
            var cy = bounds.top + bounds.height / 2;
            var dx = pointer.x - cx;
            var dy = pointer.y - cy;
            target.x = clamp(dx / Math.max(1, dx < 0 ? cx : innerWidth - cx), 1) * 2.4;
            target.y = clamp(dy / Math.max(1, dy < 0 ? cy : innerHeight - cy), 1) * 1.6;
            avatar.classList.toggle('is-curious', Math.hypot(dx, dy) < 220);
        } else avatar.classList.remove('is-curious');
        startGaze();
    }

    function releasePointer() {
        pointer = null;
        updatePointerTarget();
    }

    function scheduleGlance() {
        clearTimeout(glanceTimer);
        if (!canAnimate()) return;
        glanceTimer = setTimeout(function () {
            if (!canAnimate()) return;
            // Pick a different diagonal, with slight variation rather than a fixed loop.
            lastGlanceDirection = lastGlanceDirection < 0
                ? Math.floor(Math.random() * 4)
                : (lastGlanceDirection + 1 + Math.floor(Math.random() * 3)) % 4;
            var direction = glanceDirections[lastGlanceDirection];
            glance.x = direction[0] * (2.1 + Math.random() * 0.25);
            glance.y = direction[1] * (1.35 + Math.random() * 0.2);
            startGaze();
            glanceReturnTimer = setTimeout(function () {
                glance = { x: 0, y: 0 };
                startGaze();
                scheduleGlance();
            }, 1800 + Math.random() * 1400);
        }, 2400 + Math.random() * 2400);
    }

    function stopBlink() {
        clearTimeout(blinkTimer);
        blinks.forEach(function (animation) { animation.cancel(); });
        blinks = [];
    }

    function animateEyes(targets, duration, iterations) {
        blinks = Array.from(targets, function (eye) {
            return eye.animate([
                { transform: 'scaleY(1)', offset: 0 },
                { transform: 'scaleY(0.08)', offset: 0.3 },
                { transform: 'scaleY(0.08)', offset: 0.42 },
                { transform: 'scaleY(1)', offset: 0.75 },
                { transform: 'scaleY(1)', offset: 1 }
            ], { duration: duration, iterations: iterations, easing: 'ease-in-out' });
        });
    }

    function scheduleBlink() {
        clearTimeout(blinkTimer);
        if (!canAnimate()) return;

        blinkTimer = setTimeout(function () {
            if (!canAnimate()) return;
            animateEyes(eyelids, 220, Math.random() < 0.2 ? 2 : 1);
            scheduleBlink();
        }, 3500 + Math.random() * 3000);
    }

    function stopReaction() {
        clearTimeout(reactionTimer);
        avatar.removeAttribute('data-emotion');
    }

    function react(emotion) {
        stopBlink();
        stopReaction();
        avatar.setAttribute('data-emotion', emotion);
        if (emotion === 'wink') animateEyes([eyelids[1]], 480, 1);
        reactionTimer = setTimeout(function () {
            stopReaction();
            scheduleBlink();
        }, emotion === 'skeptical' ? 1400 : 1000);
    }

    function syncMotion() {
        stopBlink();
        stopReaction();
        recentTaps = [];
        clearTimeout(glanceTimer);
        clearTimeout(glanceReturnTimer);
        glance = { x: 0, y: 0 };
        resetExpression();
        updatePointerTarget();
        scheduleBlink();
        scheduleGlance();
    }

    window.addEventListener('pointermove', function (event) {
        if (event.pointerType === 'touch') {
            releasePointer();
            return;
        }
        if (!canAnimate()) return;
        pointer = { x: event.clientX, y: event.clientY };
        updatePointerTarget();
    }, { passive: true });
    window.addEventListener('pointerout', function (event) {
        if (!event.relatedTarget) releasePointer();
    });
    window.addEventListener('pointercancel', releasePointer);
    window.addEventListener('blur', function () {
        windowActive = false;
        pointer = null;
        syncMotion();
    });
    window.addEventListener('focus', function () {
        windowActive = true;
        syncMotion();
    });
    window.addEventListener('scroll', updatePointerTarget, { passive: true });
    window.addEventListener('resize', updatePointerTarget, { passive: true });

    button.addEventListener('pointerdown', function () {
        button.classList.add('is-pointer-focused');
    });
    function restoreKeyboardFocus() {
        button.classList.remove('is-pointer-focused');
    }
    button.addEventListener('keydown', restoreKeyboardFocus);
    button.addEventListener('blur', restoreKeyboardFocus);

    button.addEventListener('click', function () {
        var now = performance.now();
        if (now - lastActivation < 120) return;
        lastActivation = now;
        recentTaps = recentTaps.filter(function (time) { return now - time < 1200; });
        recentTaps.push(now);
        var emotion;
        if (recentTaps.length >= 3) {
            emotion = 'skeptical';
        } else {
            var choices = ['wink', 'smile', 'surprised'].filter(function (name) {
                return name !== lastEmotion;
            });
            emotion = choices[Math.floor(Math.random() * choices.length)];
        }
        lastEmotion = emotion;
        var sounds = { wink: 'click', smile: 'tap', surprised: 'toggle', skeptical: 'tick' };
        playUISound(sounds[emotion], 0.7);
        if (!canAnimate()) return;
        react(emotion);
    });
    reducedMotion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            inView = entries[0].isIntersecting;
            syncMotion();
        }).observe(avatar);
    }

    syncMotion();
});

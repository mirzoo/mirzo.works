// Unmodified sound module from mishanaer/sound, commit 5642f509b8cf20176c25f0d237db79f45ebad182.
import { playUISound } from './ui-sounds.js';
import { avatarSettings as settings } from './avatar-settings.js';

document.addEventListener('DOMContentLoaded', async function () {
    var image = document.querySelector('img.intro__avatar');
    if (!image) return;

    // Keep the image as a static fallback if the SVG cannot be loaded inline.
    var avatar;
    try {
        var response = await fetch(image.src, { cache: 'no-cache' });
        if (!response.ok) return;
        var documentSvg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
        if (documentSvg.querySelector('parsererror')) return;
        avatar = document.importNode(documentSvg.documentElement, true);
        if (avatar.localName !== 'svg') return;
    } catch (error) {
        return;
    }

    var eyes = avatar.querySelector('#eyes');
    var lowerFace = avatar.querySelector('#lower-face');
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

    var browZones = ['left', 'right'].map(function (side) {
        var brow = avatar.querySelector('#brow-' + side);
        if (!brow) return null;
        var bounds = brow.getBBox();
        return { side: side, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    }).filter(Boolean);
    var nearBrow = null;
    var raisedBrow = null;
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
    var lastActivation = -Infinity;
    var recentTaps = [];
    var lastEmotion = '';
    var reactionTimer;

    function canAnimate() {
        // Keep idle motion alive when the window loses focus. Hidden tabs may be
        // throttled by the browser, but we do not stop or reset their idle cycle.
        return !reducedMotion.matches && inView;
    }

    function resetExpression() {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = null;
        previousFrame = 0;
        gaze = { x: 0, y: 0, tilt: 0 };
        nearBrow = null;
        raisedBrow = null;
        avatar.classList.remove('is-curious-left', 'is-curious-right');
        avatar.style.removeProperty('--head-tilt');
        eyes.style.removeProperty('transform');
        if (lowerFace) lowerFace.style.removeProperty('transform');
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
        var cursorWeight = glance.x || glance.y ? settings.glanceCursorWeight : 1;
        var x = clamp(glance.x * settings.glanceStrength + target.x * cursorWeight, 4.5);
        var y = clamp(glance.y * settings.glanceStrength + target.y * cursorWeight, 2.8);
        var tilt = x / 4.5 * settings.headTilt;
        // Frame-rate-independent follow: eyes catch up first, the head a little later.
        var eyeFollow = 1 - Math.exp(-dt / (settings.followDelay / 1000));
        var headFollow = 1 - Math.exp(-dt / (settings.followDelay / 1000 + 0.12));
        gaze.x += (x - gaze.x) * eyeFollow;
        gaze.y += (y - gaze.y) * eyeFollow;
        gaze.tilt += (tilt - gaze.tilt) * headFollow;
        var settled = Math.abs(x - gaze.x) + Math.abs(y - gaze.y) + Math.abs(tilt - gaze.tilt) < 0.005;
        if (settled) gaze = { x: x, y: y, tilt: tilt };
        eyes.style.transform = 'translate(' + gaze.x.toFixed(3) + 'px, ' + gaze.y.toFixed(3) + 'px)';
        // Move the mouth and facial hair together, with less travel than the eyes.
        if (lowerFace) lowerFace.style.transform = 'translate(' + (gaze.x * 0.25).toFixed(3) + 'px, ' + (gaze.y * 0.25).toFixed(3) + 'px)';
        avatar.style.setProperty('--head-tilt', gaze.tilt.toFixed(3) + 'deg');
        if (!settled) pointerFrame = requestAnimationFrame(moveGaze);
        else previousFrame = 0;
    }

    function startGaze() {
        if (canAnimate() && pointerFrame === null) pointerFrame = requestAnimationFrame(moveGaze);
    }

    function updateEyebrow() {
        var nextBrow = null;
        if (pointer && settings.curious && canAnimate()) {
            // Use the stable button bounds, so a raised brow cannot move its own hit area.
            var bounds = button.getBoundingClientRect();
            var viewBox = avatar.viewBox.baseVal;
            var x = viewBox.x + (pointer.x - bounds.left) / bounds.width * viewBox.width;
            var y = viewBox.y + (pointer.y - bounds.top) / bounds.height * viewBox.height;
            var distances = browZones.map(function (brow) {
                return { side: brow.side, distance: Math.hypot(x - brow.x, y - brow.y) };
            }).sort(function (a, b) { return a.distance - b.distance; });
            var current = distances.find(function (brow) { return brow.side === nearBrow; });
            // A small exit margin avoids repeated rolls along the edge or centre line.
            if (current && current.distance < 26 && current.distance <= distances[0].distance + 4) {
                nextBrow = current.side;
            } else if (distances.length && distances[0].distance < 20) {
                nextBrow = distances[0].side;
            }
        }
        if (nextBrow !== nearBrow) {
            nearBrow = nextBrow;
            raisedBrow = nextBrow && Math.random() < 0.4 ? nextBrow : null;
        }
        avatar.classList.toggle('is-curious-left', raisedBrow === 'left');
        avatar.classList.toggle('is-curious-right', raisedBrow === 'right');
    }

    function updatePointerTarget() {
        target = { x: 0, y: 0 };
        if (pointer && settings.cursorEnabled && canAnimate()) {
            // Reach full movement near the face while continuing to listen across the viewport.
            var bounds = button.getBoundingClientRect();
            var cx = bounds.left + bounds.width / 2;
            var cy = bounds.top + bounds.height / 2;
            var dx = pointer.x - cx;
            var dy = pointer.y - cy;
            target.x = clamp(dx / settings.cursorRadius, 1) * 3 * settings.cursorStrength;
            target.y = clamp(dy / settings.cursorRadius, 1) * 2 * settings.cursorStrength;
        }
        updateEyebrow();
        startGaze();
    }

    function releasePointer() {
        pointer = null;
        updatePointerTarget();
    }

    function scheduleGlance() {
        clearTimeout(glanceTimer);
        if (!canAnimate() || !settings.autonomous) return;
        glanceTimer = setTimeout(function () {
            if (!canAnimate() || !settings.autonomous) return;
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
            }, settings.glanceHold * (0.8 + Math.random() * 0.4));
        }, settings.glancePause * (0.75 + Math.random() * 0.5));
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
        if (!canAnimate() || !settings.blinking || avatar.hasAttribute('data-emotion')) return;

        blinkTimer = setTimeout(function () {
            if (!canAnimate() || !settings.blinking) return;
            animateEyes(eyelids, settings.blinkDuration, Math.random() < settings.doubleBlink ? 2 : 1);
            scheduleBlink();
        }, settings.blinkInterval * (0.7 + Math.random() * 0.6));
    }

    function stopReaction() {
        clearTimeout(reactionTimer);
        avatar.removeAttribute('data-emotion');
    }

    function react(emotion) {
        stopBlink();
        stopReaction();
        avatar.setAttribute('data-emotion', emotion);
        if (emotion === 'wink') animateEyes([eyelids[Math.random() < 0.5 ? 0 : 1]], 480, 1);
        reactionTimer = setTimeout(function () {
            stopReaction();
            scheduleBlink();
        }, settings.reactionDuration * (emotion === 'skeptical' ? 1.4 : 1));
    }

    function playReaction(emotion) {
        var sounds = { wink: 'click', smile: 'tap', surprised: 'toggle', skeptical: 'tick' };
        if (settings.sound && settings.volume > 0) playUISound(sounds[emotion], settings.volume);
        if (canAnimate() && settings.reactions) react(emotion);
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
    window.addEventListener('blur', releasePointer);
    window.addEventListener('focus', updatePointerTarget);
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
        recentTaps = recentTaps.filter(function (time) { return now - time < settings.rapidTapWindow; });
        recentTaps.push(now);
        var emotion;
        if (recentTaps.length >= settings.rapidTapCount) {
            emotion = 'skeptical';
        } else {
            var choices = ['wink', 'smile', 'surprised'].filter(function (name) {
                return name !== lastEmotion;
            });
            emotion = choices[Math.floor(Math.random() * choices.length)];
        }
        lastEmotion = emotion;
        playReaction(emotion);
    });
    reducedMotion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', function () {
        previousFrame = 0;
        if (document.hidden) releasePointer();
        else updatePointerTarget();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            inView = entries[0].isIntersecting;
            syncMotion();
        }).observe(avatar);
    }

    syncMotion();
});

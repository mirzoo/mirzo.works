document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('lottie-design-system');

    var LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
    var lottieLoading = null;

    // Load the Lottie library only when the animation is about to be shown.
    function loadLottie() {
        if (typeof lottie !== 'undefined') return Promise.resolve();
        if (!lottieLoading) {
            lottieLoading = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = LOTTIE_SRC;
                script.onload = resolve;
                script.onerror = function () { lottieLoading = null; reject(); };
                document.head.appendChild(script);
            });
        }
        return lottieLoading;
    }

    if (container) {
        var animation = null;
        var visible = false;
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        function syncPlayback() {
            var active = visible && !document.hidden && !container.closest('[hidden], details:not([open])');
            if (active && !animation && typeof lottie === 'undefined') {
                loadLottie().then(syncPlayback, function () {});
                return;
            }
            if (active && !animation) {
                animation = lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    path: 'assets/designsystemProfinansy.json',
                    rendererSettings: {
                        preserveAspectRatio: 'xMidYMid meet'
                    }
                });
            }
            if (!animation) return;
            if (active && !reducedMotion.matches) animation.play();
            else animation.pause();
        }

        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            syncPlayback();
        }, { threshold: 0.1 }).observe(container);
        container.closest('details').addEventListener('toggle', syncPlayback);
        document.addEventListener('visibilitychange', syncPlayback);
        reducedMotion.addEventListener('change', syncPlayback);
    }
});

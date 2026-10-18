document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('lottie-design-system');

    if (container && typeof lottie !== 'undefined') {
        var animation = null;
        var visible = false;
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        function syncPlayback() {
            var active = visible && !document.hidden && !container.closest('[hidden], details:not([open])');
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

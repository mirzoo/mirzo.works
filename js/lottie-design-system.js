document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('lottie-design-system');

    if (container && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/designsystemProfinansy.json',
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet'
            }
        });
    }
});

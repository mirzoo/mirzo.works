document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.phone-showcase video').forEach(function (video) {
        var ambient = video.closest('.phone-showcase--ambient');
        if (ambient && video.poster) {
            ambient.style.setProperty('--showcase-backdrop', 'url(' + JSON.stringify(video.poster) + ')');
        }

        video.addEventListener('error', function () {
            // Reset the failed source so the native poster stays visible.
            video.dataset.failed = 'true';
            video.pause();
            video.controls = false;
            video.removeAttribute('src');
            video.load();
        });
    });
});

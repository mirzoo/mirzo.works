// English is the static fallback; keep translations beside their original markup.
var articleLanguageControl = document.querySelector('.case-language');
var articleTranslations = [];
var articleLanguageAnimations = new Set();
['text', 'aria-label', 'alt', 'content'].forEach(function (attribute) {
    var key = attribute === 'text' ? 'data-ru' : 'data-ru-' + attribute;
    document.querySelectorAll('[' + key + ']').forEach(function (element) {
        articleTranslations.push({
            element: element,
            attribute: attribute,
            en: attribute === 'text' ? element.textContent : element.getAttribute(attribute),
            ru: element.getAttribute(key)
        });
    });
});

function setArticleLanguage(language, animate) {
    articleLanguageAnimations.forEach(function (animation) { animation.cancel(); });
    articleTranslations.forEach(function (translation) {
        if (translation.attribute === 'text') translation.element.textContent = translation[language];
        else translation.element.setAttribute(translation.attribute, translation[language]);

        if (!animate || articleMotion.matches || translation.attribute !== 'text') return;
        var element = translation.element;
        var bounds = element.getBoundingClientRect();
        if (!bounds.height || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
        // Moving the last sidebar link would create temporary scroll overflow.
        var offset = element.closest('.case-navigation') ? 'translateY(0)' : 'translateY(3px)';
        var animation = element.animate([
            { opacity: 0, filter: 'blur(6px)', transform: offset },
            { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
        ], {
            duration: 360,
            easing: 'cubic-bezier(0.2, 0, 0, 1)'
        });
        articleLanguageAnimations.add(animation);
        articleAnimations.add(animation);
        animation.onfinish = animation.oncancel = function () {
            articleLanguageAnimations.delete(animation);
            articleAnimations.delete(animation);
        };
    });
    document.documentElement.lang = language;
    articleLanguageControl.dataset.language = language;
    articleLanguageControl.querySelectorAll('input').forEach(function (input) {
        input.checked = input.value === language;
    });
}

var articleLanguage = new URL(window.location.href).searchParams.get('lang');
if (articleLanguage !== 'ru' && articleLanguage !== 'en') {
    try { articleLanguage = localStorage.getItem('article-language'); } catch (error) { /* Storage may be disabled. */ }
}
setArticleLanguage(articleLanguage === 'ru' ? 'ru' : 'en');
articleLanguageControl.hidden = false;
articleLanguageControl.addEventListener('change', function (event) {
    var language = event.target.value;
    if (language !== 'ru' && language !== 'en') return;
    setArticleLanguage(language, true);
    try { localStorage.setItem('article-language', language); } catch (error) { /* The selector still works without storage. */ }
    var url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    window.history.replaceState(null, '', url);
    scheduleArticleLocation();
});

var articleMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
var articleAnimations = new Set();

// Animate content without hiding it if JavaScript or observation is unavailable.
var articleObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        articleObserver.unobserve(entry.target);
        if (articleMotion.matches) return;
        // Individual children preserve the figure's centering transform.
        Array.from(entry.target.children).forEach(function (element, index) {
            var animation = element.animate([
                { opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' },
                { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
            ], {
                duration: 480,
                delay: index * 55,
                easing: 'cubic-bezier(0.2, 0, 0, 1)',
                fill: 'backwards'
            });
            articleAnimations.add(animation);
            animation.onfinish = animation.oncancel = function () {
                articleAnimations.delete(animation);
            };
        });
    });
}, { threshold: 0.08 });

document.querySelectorAll('[data-reveal]').forEach(function (element) {
    articleObserver.observe(element);
});

articleMotion.addEventListener('change', function () {
    if (articleMotion.matches) articleAnimations.forEach(function (animation) { animation.finish(); });
});

var articleSections = Array.from(document.querySelectorAll('[data-case-section]'));
var articleLinks = Array.from(document.querySelectorAll('.case-toc a'));
var articleScrollFrame = null;

function updateArticleLocation() {
    articleScrollFrame = null;
    var current = null;
    articleSections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= 96) current = section;
    });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = articleSections[articleSections.length - 1];
    }
    articleLinks.forEach(function (link) {
        if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
    });
}

function scheduleArticleLocation() {
    if (articleScrollFrame === null) articleScrollFrame = requestAnimationFrame(updateArticleLocation);
}

window.addEventListener('scroll', scheduleArticleLocation, { passive: true });
window.addEventListener('resize', scheduleArticleLocation);
window.addEventListener('pageshow', scheduleArticleLocation);
updateArticleLocation();

// Keep a manually started demo from playing after the reader leaves it behind.
var articleVideoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (!entry.isIntersecting) entry.target.pause();
    });
});
document.querySelectorAll('.case-video').forEach(function (video) {
    video.muted = true;
    articleVideoObserver.observe(video);
});
document.addEventListener('visibilitychange', function () {
    if (document.hidden) document.querySelectorAll('.case-video').forEach(function (video) { video.pause(); });
});

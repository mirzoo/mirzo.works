# mirzo.works

Портфолио продуктового дизайнера Мирзомансура Охунова. Чистый HTML/CSS/JS без фреймворков и сборки.

## Структура

- `index.html` — главная: интро, вкладки Work / Side projects / Explorations
- `work/<slug>/index.html` — страницы кейсов (Amid, Winline, DDX Fitness), двуязычные EN/RU
- `style/` — `variables.css` (токены), `styles.css` (главная), `article.css` (кейсы)
- `js/` — `portfolio.js` (вкладки, раскрытие работ, ховер-превью), `phone-showcase.js`, `lottie-design-system.js` (Lottie грузится только при показе), `avatar.js`, `article.js`
- `assets/` — картинки, видео, OG-картинки (`og-image.jpg`, `<case>/og-image.jpg`)

Как добавлять новые работы — в `PORTFOLIO_GUIDE.md` и `PHONE-SHOWCASE-TEMPLATE.md`.

## Локальный запуск

```bash
python3 -m http.server 8000
```

Открыть http://localhost:8000.

## Деплой

Сайт на Vercel. Всё, что попадает в ветку `master`, автоматически выкладывается на https://mirzo.works. Для каждого pull request Vercel собирает превью-ссылку.

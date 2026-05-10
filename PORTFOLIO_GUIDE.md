# Portfolio Guide

Use this guide when adding or editing portfolio cases.

## Page Structure

The page is intentionally simple:

```html
<section class="intro">...</section>
<section class="work-list">
  <div class="work-list-block">...</div>
</section>
<footer class="footer">...</footer>
```

Keep new content inside `work-list` unless it is global intro/footer content. Add new cases at the top of `work-list`.

## Case Structure

Each case should use this structure:

```html
<div class="work-list-block">
  <section class="phone-showcase">
    <!-- video, image, or lottie media -->
  </section>
  <p>Case title <span>• Company</span></p>
  <p>Short case description.</p>
  <a href="#" class="work-list-block__link">Read case study ↗</a>
</div>
```

If there is no company, omit the `<span>• Company</span>`.
If there is no case page yet, omit the link.

## Text Rules

- Case titles are bold.
- The company part after `•` stays secondary gray but is also bold.
- Descriptions are regular weight.
- Use `Read case study ↗` for case links.
- Keep descriptions concise: one paragraph, ideally 1-2 lines on desktop.

## Spacing Rules

- `.work-list` gap between cases: `50px`.
- Media to case title: `16px`.
- Case title to description: `8px`.
- Description to link: `8px`.
- Footer top margin: `100px`.
- Container padding: `80px 40px`.

## Color Rules

- Primary text: `--text-primary`.
- Secondary text: `--text-secondary`, currently `rgba(17, 17, 17, 0.4)`.
- Do not introduce new grays for secondary labels unless the color system changes.

## Video Rules

For video cases, prefer a `poster` image:

```html
<section class="phone-showcase phone-showcase--full-video" data-ready="false">
  <div class="phone-showcase__media-frame">
    <video
      src="assets/example.mp4"
      poster="assets/example-poster.png"
      class="phone-showcase__video phone-showcase__video--full"
      preload="metadata"
      autoplay
      loop
      muted
      playsinline
      webkit-playsinline
    ></video>
  </div>
</section>
```

For phone-framed videos, use the phone mockup frame:

```html
<section class="phone-showcase">
  <div class="phone-showcase__content">
    <div class="phone-showcase__phone-container">
      <div class="phone-showcase__phone">
        <img src="assets/phoneMockup.png" alt="" class="phone-showcase__frame-img" width="227.5" height="450" aria-hidden="true">
        <div class="phone-showcase__phone-content phone-showcase__phone-content--video" data-ready="false">
          <div class="phone-showcase__player">
            <div class="phone-showcase__player-inner">
              <video
                src="assets/example.mp4"
                poster="assets/example-poster.png"
                class="phone-showcase__video"
                preload="metadata"
                autoplay
                loop
                muted
                playsinline
                webkit-playsinline
              ></video>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

For phone-framed images, swap the inner video for an image:

```html
<video
  ...
></video>
```

becomes:

```html
<img
  src="assets/example.png"
  alt="Short useful description"
  class="phone-showcase__video"
>
```

The poster appears while the video is loading. Do not add a separate `<img>` just for loading unless a custom layered interaction is needed.

## Media Checklist

Before finishing a new case:

- Media is inside `.phone-showcase`.
- Video has `muted`, `playsinline`, `webkit-playsinline`, `loop`, and `autoplay`.
- Video has a `poster` when a matching static preview exists.
- Full-width video uses `.phone-showcase--full-video`, `.phone-showcase__media-frame`, and `.phone-showcase__video--full`.
- Mobile layout does not overlap text.
- Case title, description, and link follow the spacing rules above.

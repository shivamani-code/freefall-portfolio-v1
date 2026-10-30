# Freefall Portfolio (V1)

Mani's first cinematic scroll portfolio: a scroll-scrubbed film (fall → impact → portal) drawn frame by frame on canvas, with his 4 projects as case studies.

Live: https://mani-freefall.sites.tab.bot/

## What's inside
- `site/`: the page (`index.html`, `app.js`, `style.css`), `frames.js` (frame manifest), posters and project images
- `frame-hosts/f1` … `f4`: the WebP film frames and the tiny edge worker that serves them; the live site loads frames from these hosts (URLs in `site/frames.js`)

## Run locally
```bash
cd site && python3 -m http.server 8080
# open http://localhost:8080
```
Frames stream from the live frame hosts, so you need internet.

## Tech
Vanilla JS, Canvas 2D frame scrubbing, Lenis smooth scroll (MIT), Web Audio. Film shots were AI-generated and cut into WebP frame sequences with ffmpeg.

Inspired by the scroll-film style of freefall-portfolio by gireeshkumarreddy. That repo has no licence, so none of its code or assets are used here; this is our own engine.

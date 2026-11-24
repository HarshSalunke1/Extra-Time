# Extra Time ⚽ 📻

> A single-page live football & music radio site.
> Plain HTML5, CSS3, and JavaScript — zero dependencies, no build step.

## Features

- **Live Stadium Atmosphere:** Dark atmospheric stadium visualizer featuring animated floodlight beams that accelerate like a live equalizer during playback (`#031210`, Brunswick Green `#0C4137`, Emerald `#06D6A0`, and Polar `#E6FBF6`).
- **ET Radio Playlist Always on Shuffle:** Curated 18-track anthem & football soundtrack playlist (`PLZHNkTV1FW4c`) played seamlessly on shuffle via the YouTube IFrame API.
- **Continuous Looping & Error Resilience:** Automatically advances through shuffled tracks and loops infinitely. If an embed is restricted or unavailable, it gracefully skips to the next track.
- **Interactive Audio Controls:** Previous track, play/pause, next track, and mute/unmute buttons with dynamic track title and animated soundwave visualizer.
- **My Playlist Drawer:** Slide-out drawer where visitors can add their own YouTube links or local audio files, saved locally in `localStorage`.
- **Responsive 3D Parallax:** Multi-layered stage depth with subtle mouse-tracking parallax.

## Project Structure

```
├── index.html        # Semantic HTML5 single-page application
├── style.css         # Custom CSS styling, animations, and typography
├── script.js         # Audio engine, YouTube API integration & playlist logic
├── assets/           # Background photography and stadium graphics
├── .gitignore
└── README.md
```

## Running Locally

Because the YouTube IFrame API requires an HTTP/HTTPS origin (and blocks `file://`), run a local web server:

```bash
# Using Python
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in any modern web browser.

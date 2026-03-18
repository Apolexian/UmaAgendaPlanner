# DEPRECATED

Note, this has been archived as it was incorporated and improved in https://uma.guide/agenda-planner/.

# Uma Agenda - Umamusume Race Planner

A small static web app for planning Umamusume race schedules with epithets tracking, G1 item banners, and save/load features.

## Features

- Load `Race List - Sheet1.csv` race data
- Interactive schedule calendar grouped by year/month/half
- Filter by grade (G1/G2/G3), surface (Turf/Dirt), length (Short/Mile/Medium/Long)
- Click races to build a plan with auto epithets recognition
- G1 race banners displayed where assets exist
- Non-banner race cards keep consistent sizing with banner tiles
- G1s sorted to top in each month slot
- Save plan to JSON file, load JSON file, localStorage persistence
- Reset plan button

## Files

- `index.html` - app UI
- `styles.css` - app style
- `app.js` - app logic
- `Race List - Sheet1.csv` - source data (project root)
- `races/` - banner images named for G1 races
- `README.md` - this doc

## Setup (local server recommended)

1. Open terminal in project folder:
   - Windows/Linux/macOS: `cd path/to/planner_uma`
2. Run local server:
   - Python 3: `python -m http.server 8000`
3. Open browser: `http://localhost:8000`
4. Use controls:
   - `Reload CSV` re-loads `Race List - Sheet1.csv`
   - `Save JSON` downloads current plan
   - `Load JSON` loads previously saved plan
   - `Reset Plan` clears selected races and localStorage

## Notes/sample troubleshooting

- If CSV fails in browser, ensure you are running through local server (file:// blocks fetch).
- If a race banner is missing, the card is shown as text fallback.

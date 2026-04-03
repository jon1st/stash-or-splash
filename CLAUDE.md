# CLAUDE.md

## Project Overview

**Stash or Splash** is a browser-based, two-player board game about earning, saving, and spending money wisely. It is a static website deployed to GitHub Pages — no build step, no backend.

## Repository Structure

```
stash-or-splash/
├── .github/
│   └── workflows/
│       └── static.yml    # GitHub Pages deployment workflow
├── index.html            # Main HTML entry point
├── style.css             # All styles (dark theme, responsive)
├── game.js               # Game engine — state, logic, rendering
└── CLAUDE.md             # This file
```

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks)
- **Hosting**: GitHub Pages (static site)
- **CI/CD**: GitHub Actions — auto-deploys on push to `main`
- **No build step**: The entire repository root is uploaded as-is to GitHub Pages

## Game Architecture

### State Management (`game.js`)
- Global `state` object tracks: `season`, `currentPlayer`, `phase`, `players[]`, and `log[]`
- Each player has: `name`, `stash`, `splash`, `path`, `position`, `pathSquares[]`
- Game phases: `path-choice` → `rolling` → `stash-splash` → repeats per season → `game-over`

### Game Flow
1. Each season, both players pick a path (Trailblazer or Treasure Hunter)
2. Players roll dice to move through path squares (chore/chance/club)
3. After both finish, pocket money is given, then each player splits their Splash into Stash/Splash
4. Stash earns 50% interest at season start
5. After 4 seasons, highest total (Stash + Splash) wins

### Key Constants
- `SEASONS = 4`, `POCKET_MONEY = £10`, `STASH_INTEREST = 50%`, `CHORE_BASE = £3 × dice roll`
- `STARTING_SPLASH = £10`

### Square Types
| Type | Effect |
|------|--------|
| Chore | Earn £3 × dice roll |
| Chance | Random event (+£4–12 or -£3–10) |
| Club | Pay a fee (£3–6) if affordable |
| Start/Finish | No monetary effect |

### UI Structure
- **Screens**: Start → Game → End (toggled via `.active` class)
- **Overlays**: Path choice modal, Stash/Splash slider modal
- **Board**: Dynamic `div`-based path track with player markers
- **Dashboard**: "Budget Master" event log (newest first)

## Development Workflow

### Branching

- `main` is the production branch — pushes trigger deployment to GitHub Pages
- Feature branches should be created off `main` and merged via pull request

### Deployment

Deployment is automatic via `.github/workflows/static.yml`:
1. Push to `main` triggers the workflow
2. The full repository is uploaded as a GitHub Pages artifact
3. Content is deployed to the GitHub Pages environment
4. Only one deployment runs at a time (concurrency group: `"pages"`)

### Local Development

Since this is a static site with no build step, open HTML files directly in a browser or use a local server:

```sh
# Python
python3 -m http.server 8000

# Node.js (if npx available)
npx serve .
```

## Conventions

- No package manager or build tooling — all vanilla HTML/CSS/JS
- Files live in the repository root (flat structure)
- CSS uses custom properties (CSS variables) in `:root` for theming
- JavaScript uses `const`/`let`, template literals, arrow functions (modern ES6+)
- DOM queries use `$` / `$$` shorthand wrappers around `querySelector`
- Keep the deployment path as `.` (entire repo) unless a build output directory is introduced

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `static.yml` | Push to `main`, manual dispatch | Deploy to GitHub Pages |

## Notes for AI Assistants

- No linting, testing, or formatting tools are configured yet
- Any new tooling (package.json, linters, test frameworks) should be proposed before adding
- The site has no build step; all files are served as-is from the repo root
- Game balance values (pocket money, interest rate, chore base) are constants at top of `game.js`
- Chance events and club events are JSON arrays in `game.js` — easy to extend

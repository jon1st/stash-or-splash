# CLAUDE.md

## Project Overview

**Stash or Splash** is a static website deployed to GitHub Pages. The project is in its early stages — currently only CI/CD infrastructure exists.

## Repository Structure

```
stash-or-splash/
├── .github/
│   └── workflows/
│       └── static.yml    # GitHub Pages deployment workflow
└── CLAUDE.md             # This file
```

## Tech Stack

- **Hosting**: GitHub Pages (static site)
- **CI/CD**: GitHub Actions — auto-deploys on push to `main`
- **No build step**: The entire repository root is uploaded as-is to GitHub Pages

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

- No package manager or build tooling is configured yet — add as needed when the project grows
- Static assets (HTML, CSS, JS, images) go in the repository root or organized subdirectories
- Keep the deployment path as `.` (entire repo) unless a build output directory is introduced

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `static.yml` | Push to `main`, manual dispatch | Deploy to GitHub Pages |

## Notes for AI Assistants

- This is an early-stage project — expect minimal existing code
- No linting, testing, or formatting tools are configured yet
- Any new tooling (package.json, linters, test frameworks) should be proposed before adding
- The site has no build step; all files are served as-is from the repo root

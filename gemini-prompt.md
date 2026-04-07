# Prompt: Build "Stash or Splash" Board Game

Build a complete browser-based, two-player board game called **Stash or Splash** about earning, saving, and spending money wisely. It should be a static website with no build step, no backend, and no frameworks — just vanilla HTML, CSS, and JavaScript in three files: `index.html`, `style.css`, and `game.js`.

## Game Rules

### Overview
Two players compete over 4 seasons. Each season they choose a path, move through squares by rolling dice, earn and lose money, then decide how to split their money between savings (Stash) and spending money (Splash). The player with the highest total (Stash + Splash) after 4 seasons wins.

### Starting Conditions
- Each player starts with £0 Stash and £10 Splash.

### Season Flow
1. **Path Choice**: Each player picks one of two paths:
   - **Trailblazer** (steady): Start → 4 Chore squares → 1 Chance square → 1 Club square → Finish
   - **Treasure Hunter** (risky): Start → 3 Chance squares → 2 Chore squares → 1 Club square → Finish
2. **Rolling Phase**: Player 1 goes first. Roll a six-sided die to advance along the path. Keep rolling until reaching the Finish square. Then Player 2 does the same.
3. **Pocket Money**: After both players finish, each receives £10 pocket money added to their Splash.
4. **Stash or Splash Decision**: Each player uses a slider to split their current Splash between Stash (savings) and Splash (spending money). If a player has £0 Splash, skip the slider automatically.
5. **Interest**: At the start of the next season, each player's Stash earns 50% interest (rounded down to whole pounds).
6. **Repeat** for 4 seasons. After the final stash/splash split, apply one last round of 50% interest, then the player with the highest total (Stash + Splash) wins.

### Square Types
| Type | Effect |
|------|--------|
| **Chore** | Earn £3 × dice roll |
| **Chance** | Random event — either gain (£4–12) or lose (£3–10). If losing, clamp to available Splash (can't go negative). |
| **Club** | Pay a fee (£3–6) if the player can afford it. If not, skip with a message. |
| **Start/Finish** | No monetary effect |

### Chance Events (include all of these)
**Positive:**
- "Birthday money from Grandma!" +£10 🎂
- "Found a £5 note on the ground!" +£5 🍀
- "Won a scratch card!" +£8 🎰
- "Got paid for helping a neighbour." +£6 🏡
- "Sold old toys at a car boot sale!" +£7 🧸
- "Prize money from a school competition!" +£12 🏆
- "Granny slipped you a fiver at dinner!" +£5 👵
- "Refund from a returned item!" +£4 📦

**Negative:**
- "Oh no — you broke a window! Pay for repairs." -£8 💔
- "Your phone screen cracked!" -£10 📱
- "Lost your wallet on the bus!" -£6 😰
- "Had to pay a library fine." -£3 📚
- "Your bike got a puncture — repair costs." -£5 🚲
- "Accidentally broke a friend's headphones." -£7 🎧
- "Treat yourself — you bought snacks!" -£4 🍕
- "Unexpected vet bill for your pet!" -£9 🐾

### Club Events (include all of these)
- "Football club membership fee" £5 ⚽
- "Art class supplies" £4 🎨
- "Swimming lesson" £3 🏊
- "Cinema trip with friends" £6 🎬
- "Music lesson" £5 🎵
- "Coding club subscription" £4 💻
- "Dance class" £5 💃
- "Skateboard park entry" £3 🛹

## UI Requirements

### Theme
Dark theme with these CSS custom properties:
- Background: `#0f1923`, Surface: `#1a2738`, Surface2: `#243447`
- Accent (green): `#00e5a0`, Accent2 (cyan): `#00b8d4`
- Danger: `#ff5252`, Warning: `#ffab40`
- Player 1 color: `#00e5a0` (green), Player 2 color: `#00b8d4` (cyan)
- Square colors — Chore: `#4caf50`, Chance: `#ff9800`, Club: `#e91e63`

### Three Screens
1. **Start Screen**: Title "Stash or Splash" (Stash in green, Splash in red), game description, two name inputs (max 16 chars, default to "Player 1"/"Player 2"), Start button.
2. **Game Screen**: Season badge, turn indicator (colored by current player), two player cards showing Stash/Splash/Total and chosen path, a board area with the path track (squares rendered as 80×80px colored tiles with emoji icons), an action panel with message area, animated dice display, and roll button, plus a "Budget Master" event log sidebar (newest entries first, color-coded: green border = positive, red = negative, cyan = neutral, purple = special).
3. **End Screen**: "Game Over!" heading, winner announcement (or "It's a tie!"), final score cards for each player showing Stash, Splash, and Total, and a Play Again button.

### Two Modal Overlays
1. **Path Choice**: Shows player name, path descriptions with emoji icons and square breakdowns, click-to-select cards with green border highlight, confirm button (disabled until selection).
2. **Stash/Splash Slider**: Shows player name, available amount, interest reminder ("Stashed money earns 50% interest next season!"), a range slider from 0 to available amount, live-updating split display, confirm button.

### Board Rendering
- Path squares displayed as a flex-wrap row of tiles.
- Each square shows an emoji icon and label (Chore, Chance, Club, Start, Finish).
- Current square has a scale(1.1) transform and glow effect.
- Player markers are small colored circles (16px) with player number, positioned below their current square.

### Dice Animation
- Shake animation on roll (alternating rotation ±12deg with scale).
- Rapid cycling through dice face emojis (⚀⚁⚂⚃⚄⚅) for ~800ms before landing on result.

### Responsive
At viewport width ≤900px: stack the board area and dashboard vertically, stack player cards vertically, stack path choice cards vertically, reduce square size to 64px.

## Code Architecture

### JavaScript (`game.js`)
- Use `const`/`let`, template literals, arrow functions (modern ES6+).
- Define `$` and `$$` as shorthand wrappers for `querySelector` and `querySelectorAll`.
- Global `state` object with: `season`, `currentPlayer`, `phase` (path-choice | rolling | stash-splash | game-over), `turnStep`, `players[]`, `log[]`.
- Each player object: `name`, `stash`, `splash`, `path`, `position`, `pathSquares[]`.
- Constants at top: `SEASONS = 4`, `POCKET_MONEY = 10`, `STASH_INTEREST = 0.5`, `CHORE_BASE = 3`, `STARTING_SPLASH = 10`.

### Security
- **Never use `innerHTML` with user-provided data** (player names). Use `textContent` or safe DOM construction to prevent XSS.

### Display
- When displaying negative monetary amounts, always use `Math.abs()` with an explicit sign prefix to avoid double-negative display (e.g., show "-£8" not "-£-8").
- Clamp negative chance events to available Splash so the log reflects actual money lost.

### Cross-browser
- Style both `::-webkit-slider-thumb` and `::-moz-range-thumb` for range inputs.

## File Structure
```
index.html    — all HTML markup including both overlays
style.css     — all styles, dark theme, responsive breakpoint at 900px
game.js       — all game logic, state management, rendering, event handlers
```

Produce all three files with complete, working code.

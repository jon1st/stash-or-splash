# Prompt: Build "Stash or Splash"

Build a browser-based, two-player board game called **Stash or Splash**. It teaches kids about earning, saving, and spending money. No frameworks, no build step — just vanilla HTML, CSS, and JavaScript (`index.html`, `style.css`, `game.js`).

## The Game

Two players compete over 4 seasons. Each season they:

1. **Choose a path** — either Trailblazer (more chore squares, steady income) or Treasure Hunter (more chance squares, higher risk/reward). Each path has 8 squares: Start, a mix of Chore/Chance/Club squares, and Finish.
2. **Roll dice to move** — Player 1 goes first, rolling a six-sided die repeatedly to advance square by square until reaching Finish. Then Player 2 does the same.
3. **Land on squares** that affect their money:
   - **Chore**: Earn £3 × the dice roll.
   - **Chance**: A random event — could be good (finding money, birthday gifts, selling toys — gaining £4–12) or bad (breaking things, losing a wallet, vet bills — losing £3–10). A player's money can't go below zero.
   - **Club**: Pay a fee (£3–6) for an activity like football, swimming, or coding club. If they can't afford it, they skip it.
4. **Receive £10 pocket money** after both finish the path.
5. **Decide how to split** their spending money (Splash) between savings (Stash) and keeping it as Splash. This is the core decision — because Stash earns 50% interest at the start of the next season, but you can't spend it.

After 4 seasons (with a final interest payout), whoever has the most total money (Stash + Splash) wins.

Players start with £0 Stash and £10 Splash.

## Look and Feel

- Dark theme, modern and clean. Think dark navy backgrounds with green and cyan accent colors.
- A start screen with the game title, player name inputs, and a start button.
- During gameplay: player cards showing each player's Stash, Splash, and Total; a visual board track showing the path squares with emoji icons; a dice with a rolling animation; and an event log sidebar showing what's happened.
- Modal overlays for path selection (click to pick, then confirm) and the stash/splash split (a slider to drag).
- An end screen showing the winner and final scores.
- Responsive — works on mobile by stacking things vertically.

Make it fun and polished with little touches like dice shake animations, glowing current squares, and color-coded log entries.

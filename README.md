# Forms of Communication

A classroom team-building activity for Brook Hill Alliance. Two teams (Boys vs. Girls), a short tongue-in-cheek presentation about who "communicates better," then three rounds where each team gets one messenger to complete a task under a different communication constraint.

**Live:** https://brook-hill-forms-of-communication.web.app

## The activity
1. **Presentation** — swipeable slide deck teeing up the friendly debate.
2. **Round 1 · No Words** — hands flat on the table, only faces and groans; beat the timer.
3. **Round 2 · Heads Up** — describe the card without saying the word; tap Correct/Skip.
4. **Round 3 · Written Only** — no talking; write step-by-step instructions on paper.
5. **Finale** — final score + winner reveal with confetti, plus the real takeaway.

## Running it live (leader controls)
- Tap a team's name in the top scoreboard to give a point (right-click / long-press to subtract).
- Each round has its own timer with preset durations, plus a random prompt generator.
- Arrow keys advance the presentation slides.

## Tech
Plain static HTML/CSS/JS. No build step. Hosted on Firebase Hosting (site
`brook-hill-forms-of-communication` inside the shared `brookhill-disco-2026` project).

## Deploy
```bash
firebase deploy --only hosting:brook-hill-forms-of-communication
```

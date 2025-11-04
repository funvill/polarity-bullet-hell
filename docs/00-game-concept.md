# Game Concept

Make a 'bullet hell' game with using threejs

- docs\01-technica-gameplay-brief.md
- docs\02-interface-design.md

## Core Concept

A vertically scrolling 'bullet hell' where survival depends not on raw dodging skill alone, but on mastering polarity — a mechanic that turns enemy bullets into resources through clever alignment of color and timing.

### Start up rules

Its all about your polarity

- Right click to change polarity (Black/White)
- Absorbe bullets of the same polarity to increase energy
- Your bullets only harm ships of different polarity (black bullets hurt white ships)
- When your energy is full, use the space bar to trigger bomb
- Left click to fire main weapon
- High score wins

## Tech stack

- https://threejs.org/

## Core Gameplay Features

- Vertical-scrolling bullet hell shooter (top-down, fixed camera).
- Two-polarity system (Black/White) — the defining mechanic.
  - Switch polarity instantly at any time.
  - Absorb bullets of the same color (safe) to charge weapons
  - Deal double damage to enemies of the opposite color.
- Energy absorption and discharge:
  - Absorbing bullets charges a special weapon meter.
- Precision hitbox: only the ship’s core is vulnerable, allowing tight dodges.
- Chain combo system:
  - Destroy three enemies of the same color consecutively to start a chain.
  - Maintain color order to increase multiplier.
  - Breaking the sequence resets the chain.
- Enemy and bullet polarity:
  - Enemies and their bullets are always black or white.
  - Bullet patterns are choreographed around polarity contrast.
- Deterministic bullet patterns:
  - Every wave is pre-scripted, no randomness.
  - Designed for memorization and mastery.

## Controls

- A - Normal weapon fire
- B - Special weapon fire
- X - Polarity switch
- left, right, up, down - Movement around the screen

## Questions and Answers

### 1. Visual Style: What should be the primary visual aesthetic for the game to ensure clarity and focus on the polarity mechanic?

- **D) Hand-Drawn Cel Shaded:** An organic, illustrative style that feels like a moving comic book.

### 2. Soundtrack Genre: What genre of music will best complement the fast-paced, pattern-based gameplay?

- **C) Retro Chiptune:** Classic 8-bit or 16-bit era music to reinforce a nostalgic arcade experience.

### 3. Special Weapon Behavior: When the special weapon meter is full and activated, what should it do?

- **A) Polarity Bomb:** Unleashes a screen-clearing explosion that converts all on-screen bullets to the player's current polarity, absorbing them for points.
- *Note: There will be many different special weapons throughout the game.*

### 4. Difficulty Progression: How should the game's difficulty curve be structured?

- **D) Survival Mode Only:** A single, endless mode where difficulty ramps up continuously until the player is defeated.

### 5. Scoring System Focus: What action should be the primary driver for achieving a high score?

- **A) Chain Combo Multiplier:** The score is heavily weighted by the length and value of the chain combo multiplier, rewarding precise, color-coordinated destruction.

### 6. Player Health System: How should the player's survivability be managed?

- **C) Health Bar:** A traditional health bar that depletes with each hit.
- *Note: Three hits, can be refilled if the bullet absorption is full.*

### 7. Boss Encounter Design: What should be the defining feature of boss fights?

- **B) Phase-Based Combat:** Bosses with multiple, distinct phases, each introducing entirely new attack patterns.

### 8. Level Structure: How should the game's levels be organized?

- **C) Large, Continuous World:** A single, large scrolling level with different zones and mini-bosses, similar to a caravan shooter.

### 9. Narrative Emphasis: How much story should be integrated into the game?

- **A) Minimalist Narrative:** A simple opening and ending cutscene to frame the action, with no dialogue or story during gameplay. The focus is purely on mechanics.

### 10. Player Ship Customization: Should the player be able to alter their ship's abilities?

- **D) In-Run Power-ups:** Temporary power-ups (e.g., side shots, options) are dropped by enemies during gameplay.

### 11. Polarity Switch Feedback: How should the game instantly communicate a successful polarity switch?

- **A) Color Shift & Sound Effect:** The ship and its bullets instantly change color, accompanied by a distinct, satisfying sound effect and a subtle screen particle effect.
- **B) Character Animation:** The ship model performs a quick, transformative animation.

### 12. Chain Combo Visualizer: How should the current chain combo status be displayed to the player?

- **A) On-Screen Counter & Aura:** A prominent multiplier (e.g., "x4") appears near the player ship, which gains a subtle, glowing aura that intensifies as the chain grows.
- **C) Sound-Based Cue:** The pitch of the background music or a specific sound effect rises with each successful chain hit.

### 13. Game Over Options: What should happen when the player runs out of lives?

- **D) Roguelike Reset:** The player is sent back to the very beginning of the game, losing all progress for that run.

### 14. Tutorial Implementation: How should new players learn the core mechanics?

- **A) Integrated First Level:** The first level is designed as a safe, guided experience where mechanics (movement, shooting, polarity switching, absorption) are introduced one by one through on-screen prompts and simple enemy patterns.

### 15. Target Platform: What should be the primary target platform for initial development?

- **D) Web Browser (WebGL):** Build for maximum accessibility, allowing anyone to play instantly without downloads.
- *Note: Using three.js.*

### 16. Enemy Introduction: How should new enemy types be introduced to the player?

- **A) In Isolation:** A new enemy type first appears alone or in a very simple wave, allowing the player to safely learn its attack pattern and behavior before it's integrated into more complex formations.

### 17. Co-operative Play: Should a two-player mode be considered?

- **A) Single-Player Focus:** Design the entire game exclusively for a single-player experience to ensure tight, balanced, and uncompromised level design.

### 18. Color Palette Beyond B&W: Aside from black and white, how should color be used?

- **A) Accent for Effect:** Use a single, vibrant accent color (e.g., neon cyan or magenta) exclusively for explosions, the special weapon, and critical UI elements to make them stand out.

### 19. Control Scheme Customization: How flexible should the controls be?

- **C) Fixed Controls:** The controls are fixed and cannot be changed.

### 20. Post-Launch Content: What is the ideal plan for content after the initial release?

- **D) No Post-Launch Content:** The game is released as a complete, self-contained package with no planned updates.


# AGENTS.md

This file provides AI coding agents with detailed context about the Polarity Bullet Hell game project.

## Project Overview

**Polarity Bullet Hell** is a vertically scrolling bullet hell shooter built with three.js and vanilla JavaScript. The core mechanic revolves around polarity switching (Black/White) inspired by Ikaruga (2001). Players must strategically switch polarities to absorb same-color bullets for energy while damaging opposite-color enemies.

**Tech Stack:**
- three.js (3D WebGL rendering engine)
- Vite (build tool and dev server)
- Vanilla JavaScript (ES6+ modules)
- Web Audio API (procedurally generated sound effects)

## Project Structure

```
polarity-bullet-hell/
├── docs/                  # Design documents and development plan
└── src/
    ├── main.js            # Entry point, initializes game
    ├── core/
    │   ├── Game.js        # Main game loop, state management, collision
    │   └── Input.js       # Keyboard/mouse input handling
    ├── entities/
    │   ├── Player.js      # Player ship with polarity switching
    │   ├── Enemy.js       # Base enemy class
    │   ├── Bullet.js      # Bullet entity with trails
    │   ├── Boss.js        # Boss encounters with phases
    │   ├── PowerUp.js     # Power-up items
    │   └── SpecialEnemy.js # Special enemy types (sniper, tank, etc.)
    ├── systems/
    │   ├── AudioManager.js     # Procedural audio generation
    │   ├── ChainSystem.js      # Combo chain tracking
    │   ├── ParticleEffects.js  # Visual effects (explosions, etc.)
    │   ├── ScoreSystem.js      # Score calculation and popups
    │   └── SpawnSystem.js      # Enemy wave spawning
    └── ui/
        └── HUD.js         # Heads-up display updates
```

## Core Game Mechanics

### Polarity System
- Player can be **WHITE** or **BLACK** polarity
- Switch with **Right Mouse Button**
- Same-polarity bullets are absorbed (grant +2 energy, max 100)
- Opposite-polarity bullets damage player (3 lives total)
- Player bullets deal 2x damage to opposite-polarity enemies

### Controls
- **WASD / Arrow Keys:** Movement (8-directional)
- **Mouse Movement:** Aim ship direction
- **Left Mouse Button:** Fire continuous stream (5 shots/sec)
- **Right Mouse Button:** Switch polarity
- **Space Bar:** Special weapon (requires 100 energy)

## Code Style & Conventions

### JavaScript Standards
- ES6+ modules with explicit imports
- Class-based architecture for entities and systems
- **No semicolons** (but acceptable if used consistently)
- Use `const` and `let` (never `var`)
- Functional patterns where appropriate

### Naming Conventions
- Classes: `PascalCase` (e.g., `Game`, `Player`, `SpawnSystem`)
- Files: `PascalCase.js` matching class name
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` for true constants
- Private methods: prefix with underscore (optional)

### Three.js Patterns
- Always dispose of geometries and materials when removing entities
- Use object pooling for bullets (implemented)
- Scene graph: Add entities as children of parent for relative transforms
- Orthographic camera for 2D view
- Z-axis: 0 for gameplay, -1 for background, +1 for UI effects

### Game Loop Architecture
- Fixed timestep updates (60 Hz target)
- Delta time capping to prevent large jumps
- Update → Collision → Render separation
- Entity lifecycle: create → update → destroy

### Performance Targets

- **60 FPS minimum** with 200+ bullets on screen
- **< 100ms input latency** for polarity switch
- **< 3 seconds** initial load time
- Object pooling active for bullets and particles

## Common Development Tasks

### Adding a New Enemy Type
1. Extend `Enemy` or `SpecialEnemy` class in `src/entities/`
2. Define behavior in constructor config
3. Override `update()` for custom movement
4. Override `fire()` for custom attack patterns
5. Add to `SpawnSystem.createSpecialEnemy()` type list

### Adding New Sound Effects
1. Add method to `AudioManager` class
2. Use Web Audio API oscillators (no external files)
3. Call from appropriate entity (e.g., `game.audio.playExplosion()`)

### Adding New Visual Effects
1. Create class in `ParticleEffects.js` extending base pattern
2. Implement `update(deltaTime)` returning true when complete
3. Implement `destroy()` to clean up scene objects
4. Push to `game.effects` array

### Modifying Difficulty Curve
1. Edit `SpawnSystem.updateDifficulty()`
2. Adjust `scoreThreshold` (default: 5000)
3. Modify multipliers in `getDifficultyMultipliers()`

## Deployment

### GitHub Pages
The game is deployable to GitHub Pages:
1. Build: `npm run build`
2. Push `dist/` contents to `gh-pages` branch
3. Enable GitHub Pages in repo settings

## Known Issues & Gotchas

1. **Boss Debris Spawning:** Fixed to force `size: 'small'` to prevent huge debris enemies
2. **Bullet Collision:** Same-polarity bullets now correctly pass through same-color enemies
3. **Camera Shake:** Decay implemented to prevent permanent offset
4. **Energy Bar:** Uses gradient colors matching polarity (cyan/orange)
5. **Special Enemy Spawns:** Only after wave 5, 20% chance per enemy

## Build Output

Vite bundles to optimized files:
- `index.html` - Entry point
- `assets/index-[hash].js` - Bundled JavaScript
- `assets/index-[hash].css` - Inline styles extracted
- three.js vendored into bundle (no CDN)

## References

- [three.js Documentation](https://threejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Game Design Docs](./docs/)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

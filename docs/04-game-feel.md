##** The Art of Screenshake:** 30 Tiny Tricks to Improve Your Action Game

https://www.youtube.com/watch?v=AJdEqssNZ-U

This video features Jan Willem Nijman from Vlambeer discussing practical tips and tricks to enhance the "feel" of action games, moving beyond abstract theory to offer concrete advice. He renames his talk "30 Tiny Tricks That Will Make Your Action Game Better" and demonstrates these tricks by transforming a basic, unengaging shooter into a more dynamic and satisfying experience.

Key points covered include:

- **Basic Animations and Sound:** Adding simple animations (like hair movement) and sound effects (using tools like sfxr) significantly improves the game's feel.
- **Enemy Health and Rate of Fire:** Lowering enemy HP and increasing the player's rate of fire makes the game immediately more fun.
- **Bullet Size and Muzzle Flash:** Making bullets larger and adding a muzzle flash provides better visual feedback and impact.
- **Impact Effects and Enemy Knockback:** Implementing visual effects when bullets hit walls or enemies, and adding slight knockback to enemies, enhances the sense of impact and creates dynamic combat situations.
- **Permanence:** Leaving corpses and shell casings on the battlefield creates a sense of history and accomplishment.
- **Camera Lurp and Positioning:** Smoothing camera movements and strategically positioning the camera to focus on the action improves the player's experience.
- **Screenshake:** Adding subtle screenshake makes the game feel more responsive and impactful.
- **Player Knockback:** Implementing player knockback when firing can add a strategic element to movement and shooting.
- **Sleep (Pausing):** Briefly pausing the game on impact (using a "sleep" command) allows the brain to process the action, making it feel more significant.
- **Adding Bass to Sound Effects:** Increasing the bass in gunshot sound effects can make weapons feel more powerful.
- **Random Explosions:** Adding a chance for enemies to explode on death can create exciting and unpredictable moments.
- **Camera Kick:** Moving the camera slightly in the opposite direction of the player's fire direction adds impact.
- **Big Explosions:** Following the advice to "make really big explosions" to enhance the visual spectacle.
- **Adding Meaning:** The most important step is to add meaning to the game by programming a game over state.

## Core Player Feedback

- Dynamic Hit Sounds: Different sounds for hitting enemies vs. obstacles help communicate what’s happening without visual overload.
- Variable Pitch & Volume: Randomly vary sound pitch/volume slightly to avoid “ear fatigue” from repetitive fire sounds.
- Visual Hit Confirmation: Use quick flash shaders or color tinting (e.g., enemies flash white or red when hit).
- Directional Damage Indicators: Small UI or sprite cues showing where incoming damage originates.
- Weapon Recoil Animations: Slight gun “kick” and sprite recoil synced to each shot improve tactile feel.
- Bullet Trails / Glow: Faint particle trails behind bullets add velocity perception and make dodging clearer.
- Slow-Mo on Kill / Boss Break: Brief time dilation when killing a boss or finishing a wave intensifies drama.

## 🧠 Player Control and Flow

- Buffering Input: Register inputs a few frames early to make controls feel responsive without jank.
- Grace Frames / Bullet Grazing: Allow near-misses that reward the player (e.g., score or meter gain) — common in Touhou.
- Charge and Release Weapons: Give alternate fire modes or charge attacks to break repetition and reward skill.
- Momentum vs. Precision: Add optional “focus mode” (slower movement, tighter hitbox, higher accuracy).

## 💥 Visual Impact and Environment

- Destructible Scenery: Explosive barrels, breakable walls, or particle debris to enrich feedback loops.
- Persistent Particles: Smoke, dust, or sparks that fade slowly make battles look “lived in.”
- Lighting Flashes: Quick ambient light bursts during explosions or weapon fire to emphasize intensity.
- Enemy Death Variety: Mix ragdoll, pixel burst, implosion, or scorch effects for diversity.
- Dynamic Shadows: Subtle moving shadows under bullets and enemies help ground the action visually.
- Color Grading / Palette Shifts: Change hue or saturation slightly during high-intensity moments for emotional tone.

## 🎵 Audio and Rhythm

- Adaptive Music Layers: Music intensity scales with bullet density, combo count, or boss phases.
- Rhythmic Sync: Fire sounds or explosion peaks synchronized with beat or BPM heighten immersion.
- Environmental Ambience: Low-volume drones or hums create tension in “quiet” phases.
- Dynamic Compression: Subtle ducking of background music when loud effects play — improves clarity and punch.

## 📸 Camera & Presentation

- Dynamic UI Overlays: Score combo meter pulses or shakes slightly when increased.

## 🧩 Systems and Meta-Feedback

- Combo Chains / Streaks: Encourage aggression and skill by rewarding quick successive kills.
- Risk-Reward Power-ups: Drop high-value items near danger zones to drive tension.
- Difficulty Flow: Add dynamic difficulty (adaptive bullet density based on player survival rate).
- End-of-Level Screens: Display stylish breakdowns (accuracy, grazing, time survived, near-miss count).

## 🔮 Subtle Psychological Tricks

- Anticipation Frames: Brief startup before major attacks builds tension and fairness.
- Player Invincibility Sparkle: Short invulnerability after respawn feels merciful, not frustrating.
- Coyote Time for Dodging: Allow brief late dodges — improves fairness subconsciously.
- Tiny Random Delay in Bullet Patterns: Avoids perfect grids that feel robotic.
- Micro-Shake on Critical Hits: A few frames of extra shake communicates importance subconsciously.

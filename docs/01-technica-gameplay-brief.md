# ⚙️ Technical Gameplay Brief

## 1. Scene Setup

**Stage:** 1 – "Ideal" (Intro Stage)  
**Environment:** Vertical scroll at constant rate `scrollSpeed = 4.5 units/sec`  
**Player Ship:**
- Hitbox radius: `4px` (center-core only)
- Movement speed: `5.0 units/sec` (8-directional, analog or digital)
- Fire rate: `10 shots/sec`
- Polarity state: `{BLACK | WHITE}`
- Input buffer: ≤ 1 frame latency

**Enemy Types in Scene:**
- `E1` – White Drone (HP: 1, emits white bullets)
- `E2` – Black Drone (HP: 1, emits black bullets)
- `E3` – Polarity Cruiser (HP: 8, alternates polarity every 3 seconds)

---

## 2. Gameplay Loop (Second-by-Second Breakdown)

### **T = 0–3s: Opening Wave**
- **Input:** Player holds `FIRE_BUTTON` → continuous shot stream.
- **System:** Spawn 3× `E1` (White Drones) in formation pattern A.
- **Behavior:**
  - Each drone emits a fan spread of 5 white bullets (velocity = 3 units/sec).
  - Player switches polarity to **WHITE** (`SWITCH_BUTTON`) to absorb bullets.
- **Result:**
  - Bullets within hitbox radius `r=4px` trigger `Absorb()` event.
  - Each absorbed bullet adds `+2%` to `energyMeter`.
  - Destroying 3 white drones consecutively triggers `Chain +1` event.

### **T = 3–7s: Polarity Alternation**
- System spawns 2× `E2` (Black Drones) entering from top-left/right.
- Player must switch polarity to **BLACK** for optimal damage output (`damageMultiplier = 2x`).
- Opposite-colored bullets (white) are now lethal; contact triggers `PlayerDeath()`.
- Collision check frequency: `per frame (60Hz)` using circular bounding overlap.

### **T = 8–12s: Mixed Color Pattern**
- Mixed stream of white and black bullets emitted alternately by `E3`.
- Pattern function:
  ```text
  emissionInterval = 0.2s
  bulletColor = (frame % 2 == 0) ? WHITE : BLACK
  ```
- Player alternates polarity rhythmically to absorb safely and maintain continuous fire.
- If polarity switch timing < 0.1s window before bullet impact → bullet absorbed successfully.

---

## 3. Energy and Special Weapon Logic

**Absorption Logic:**
```text
onBulletAbsorbed(color):
    if color == player.polarity:
        player.energy += 2
        if player.energy >= 100:
            player.energy = 100
            player.canUseSpecial = True
```

**Special Weapon (Homing Burst):**
- Triggered by pressing `SPECIAL_BUTTON`.
- Launches 8 homing projectiles.
- Each projectile damage = `1.5x normal shot`.
- Target priority: nearest enemy with opposite polarity first.
- Consumes full energy meter → resets to 0.

---

## 4. Chain Combo and Scoring System

**Chain Rules:**
- Destroy 3 enemies of identical polarity consecutively → +1 chain.
- Sequence tracking implemented as FIFO queue `[last3Kills]`.
- Color mismatch clears queue and resets chain multiplier.

**Scoring Formula:**
```text
baseScore = enemy.value
chainMultiplier = (chainCount)^2
totalScore += baseScore * chainMultiplier
```

**Example:**
- Kill sequence: White → White → White → Chain = 1 (x1 multiplier)
- Next sequence continues → Chain = 2 (x4 multiplier), etc.

**Maximum chain per stage:** 50+ possible, dependent on route optimization.

---

## 5. Boss Phase Example

**Boss Name:** "Butsutekkai"  
**HP:** 500 units  
**Phases:** 3  
**Polarity Behavior:** Alternates every 10 seconds or on HP threshold.

**Bullet Pattern Function:**
```text
phase1: radialBurst(36 bullets, interval=0.2s, color=polarity)
phase2: spiralWave(speed=5.5, acceleration=0.2)
phase3: latticePattern(crossColor=true)
```

**Player Objective:**
- Absorb same-color bullets to recharge energy.
- Switch to opposite color for offensive burst phases.
- Memorize pattern rhythm to survive; minimal RNG ensures repeatability.

---

## 6. System Feedback and HUD

**HUD Elements:**
- Polarity indicator (top-left icon color)
- Energy meter (0–100%)
- Chain counter (numeric + visual pulse)
- Score display (real-time updates)
- Lives remaining

**Feedback Events:**
- Polarity switch → short 200ms audio ping, color inversion flash
- Chain complete → chime sound, HUD pulse
- Energy full → low hum loop until special weapon used

---

## 7. Summary: Player Technical Skill Loop

| Loop | Input | System Response | Player Reward |
|------|--------|------------------|----------------|
| **Polarity Switch** | `SWITCH_BUTTON` | Color inversion, immunity change | Safety or damage boost |
| **Absorption** | Collision with same-color bullet | +Energy | Resource for homing attack |
| **Chain Combo** | Timed enemy destruction | +Score Multiplier | Performance optimization |
| **Energy Discharge** | `SPECIAL_BUTTON` | Homing burst | Tactical burst damage |
| **Movement Precision** | `DIRECTIONAL_INPUT` | 1px collision detection | Survival in dense patterns |

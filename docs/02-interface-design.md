# 🧭 Interface & HUD Design

## 1. Design Philosophy

The HUD is designed for **clarity amid chaos**.  
In a bullet hell game where hundreds of projectiles occupy the screen, the player’s focus must remain on survival and pattern recognition — not information scanning.  

Therefore, the interface is:
- **Minimalist** — only essential gameplay data is displayed.
- **Peripheral-readable** — positioned at the screen edges to minimize eye travel.  
- **Polarity-coherent** — every UI element reflects the current polarity (black or white).  

The goal: deliver real-time tactical information without distracting from the bullet field.

---

## 2. Screen Layout Overview

### Visual Wireframe Mockup (Text-Based)

```
┌──────────────────────────────────────────────┐
│ SCORE: 000564210                             │
│----------------------------------------------│
│ Chain: 08      Stage: 1 – IDEAL   [NORMAL]   │
│ Energy: ████████████▒▒▒▒▒▒▒▒▒▒▒▒             │
│                                              │
│                                              │
│                                              │
│               [ PLAY AREA ]                  │
│                                              │
│   (Enemies + Bullet Patterns)                │
│                                              │
│                                              │
│ Lives: ♥ ♥ ♥           [⚪ Polarity: WHITE]  │
└──────────────────────────────────────────────┘
```

### Screen Composition:
- **Play Area:** 90% of screen height; central vertical field for gameplay.  
- **HUD Margins:** 5% borders on sides for meters and indicators.  
- **Color Scheme:** All HUD elements invert color when polarity switches.

---

## 3. HUD Components

### A. Polarity Indicator
- **Location:** Bottom-right corner.  
- **Type:** Icon (half-circle yin-yang style).  
- **Function:**  
  - Displays current ship polarity: *White* or *Black*.  
  - Animates during polarity switch (200ms fade/crossfade).  
  - Color affects all UI accents (meter frames, icons, and score highlights).  

### B. Energy Meter
- **Location:** Right edge of screen, vertical bar.  
- **Representation:**  
  - Fills upward as bullets are absorbed.  
  - White polarity = glowing white fill; Black polarity = deep blue/black fill.  
  - At 100%, bar pulses softly to indicate “Special Ready.”  

### C. Score Display
- **Location:** Top-center or top-left (varies by platform).  
- **Display:**  
  - Current score (large font).  
  - Chain multiplier and rank beneath (smaller font).  
- **Style:** Monospaced, high contrast.  

### D. Chain Counter
- **Location:** Left edge, near score.  
- **Purpose:**  
  - Displays current chain count (integer).  
  - Optional “×n” multiplier indicator.  
- **Visual Feedback:**  
  - Pulses on every successful chain sequence.  

### E. Lives / Continues
- **Location:** Bottom-left corner.  
- **Representation:** Small ship or heart icons (one per life).  
- **Behavior:**  
  - Fades out when life is lost, replenishes on continue.  

### F. Stage & Difficulty Indicator
- **Location:** Top-right corner.  
- **Information:**  
  - Displays current stage and difficulty.  
  - Optional timer for score attack modes.  

---

## 4. Color and Polarity Integration

| State | Primary UI Color | Accent Color | HUD Effects |
|--------|------------------|---------------|--------------|
| **White Polarity** | White | Cyan | Background HUD panels fade to black; bright energy effects. |
| **Black Polarity** | Black | Orange | Background HUD panels fade to white; dark pulse outlines. |

All UI elements invert color dynamically when polarity switches.

---

## 5. Audio & Haptic Feedback Integration

| Event | Audio Feedback | Visual Feedback | Haptic |
|--------|----------------|-----------------|---------|
| **Polarity Switch** | “Phase invert” tone | Quick color inversion | Light vibration |
| **Chain Complete** | High-pitched chime | HUD pulse | Medium rumble |
| **Energy Full** | Low hum loop | Meter glow pulse | Soft vibration loop |
| **Energy Used** | Discharge sound | Energy bar drain | Short heavy pulse |
| **Player Hit** | Impact sound | Screen flash | Strong rumble |

---

## 6. Accessibility Considerations

- **Colorblind Mode:** Adds shape or symbol outlines to polarity bullets and UI indicators.  
- **Minimal UI Mode:** Allows expert players to hide non-critical HUD elements.  
- **High Contrast Option:** Enhances brightness differential for readability.  

---

## 7. Technical Specifications

| Element | Update Rate | Layer | Notes |
|----------|--------------|-------|-------|
| Score & Chain | 30 Hz | Overlay | Smooth interpolated updates. |
| Energy Meter | 60 Hz | Overlay | Frame-synced to absorption events. |
| Polarity Icon | Event-driven | Overlay | Shader-driven transition blend. |
| Lives Indicator | Event-driven | Base HUD | Updated only on life change. |

HUD rendering is drawn last in the frame pipeline to ensure clarity over gameplay visuals.

---

## 8. Overall UX Goal

The HUD aims to:
- **Convey essentials instantly** — polarity, energy, score, survival.  
- **Reinforce duality** — visual and auditory feedback mirrors polarity.  
- **Disappear in motion** — readable peripherally, not demanding attention.  

When executed correctly, the player perceives the HUD as part of the rhythm — a *visual tempo* in sync with the chaos.

---

## 9. Questions and Answers

### 1. HUD Layout Philosophy: The current layout uses top, bottom, and side elements. To further enhance focus on the play area, how should we refine this?

- **A) Consolidate to Top & Bottom:** Move all HUD elements to the top and bottom screen edges, leaving the vertical sides completely clear. This maximizes horizontal awareness for dodging.

### 2. Polarity Indicator's Immediacy: The design specifies a yin-yang icon. How can we make the polarity switch even more unmissable?

- **B) Full Screen Color Wash:** Briefly wash the entire screen with a semi-transparent color overlay for a fraction of a second.

### 3. Energy Meter Location: The meter is currently a vertical bar on the right. What is a potential drawback of this position?

- **D) Not Wide Enough:** A vertical bar is too thin to convey the energy level with sufficient precision.

### 4. Chain Counter Feedback: The design mentions a "pulse." How can we make this feedback more rewarding as the chain grows?

- **D) Text Animation:** Animate the numbers to "flip" over like a classic scoreboard with each increase.

### 5. Lives Indicator Style: The document suggests heart or ship icons. Which style better fits the "clarity amid chaos" philosophy?

- **C) Classic Heart Icons:** Stick with the universally understood heart symbol.

### 6. Colorblind Mode Implementation: The design proposes adding shapes to bullets. How should this be applied to the HUD?

- **A) Pattern Overlay on Meters:** In addition to color, apply a distinct pattern (e.g., diagonal lines for White, dots for Black) to the fill of the Energy Meter and other colored UI elements.

### 7. "Energy Full" Feedback: A low hum and soft pulse are proposed. How can we make this state clearer without being annoying?

- **D) Screen-Edge Glow:** Make the entire border of the screen pulse with a soft glow.

### 8. Score Display Readability: The score is critical for replayability. How can we ensure it's always readable but not distracting?

- *User Note: Keep it at the top of the screen.*

### 9. Minimal UI Mode: For expert players, what is the most critical element to keep on screen in a minimal mode?

- **A) Polarity Indicator:** Polarity is the central mechanic and is essential for survival and scoring, making its current state non-negotiable information.
- **D) Energy Meter:** The availability of the special weapon is key tactical information.

### 10. Haptic Feedback for Player Hit: The design specifies a "strong rumble." How can we use haptics more informatively?

- **D) No Rumble:** Disable rumble on hits to avoid startling the player.

### 11. Text-Based Wireframe Mockup: The mockup shows a mix of information at the top. How could this be better organized?

- **A) Group Related Info:** Place `Score` and `Chain` on the left, and `Stage` and `Difficulty` on the right, creating logical "scoring" and "session" groups.

### 12. Accent Color Choice: The document proposes Cyan for White and Orange for Black. Why is this a strong choice?

- **A) High Contrast & Association:** Cyan (cool) and Orange (warm) are near-complementary and offer high contrast against both black and white backgrounds, making them easily distinguishable.

### 13. HUD Update Rate: The score updates at 30Hz. What is the primary benefit of this specific rate?

- **D) It's an Arbitrary Number:** There is no specific benefit to 30Hz over, say, 20Hz or 40Hz.

### 14. Accessibility - High Contrast Option: What would be the most effective way to implement a "High Contrast" mode?

- **D) Use Only Black and White:** Remove the Cyan and Orange accent colors entirely.

### 15. Polarity Switch Animation: The design specifies a 200ms fade. What feeling does this duration aim to create?

- **A) Instant & Snappy:** 200ms is fast enough to feel near-instantaneous and responsive, ensuring the UI doesn't lag behind the player's input during fast-paced action.

### 16. Energy Meter Representation: The meter fills with the polarity's color. What's an alternative that could show both absorbed energy and the current polarity in one element?

- **B) Striped Fill:** The fill is striped with both the polarity color and a neutral color.

### 17. Overall UX Goal - "Disappear in Motion": Which design choice most directly serves this goal?

- **B) Minimalist Component Selection:** Only showing essential information reduces the cognitive load.

### 18. Audio Feedback for Chain Complete: A high-pitched chime is suggested. How could this be improved for long-term play?

- **C) Spoken Word:** Have a voiceover say "Chain Complete" or "Multiplier Increased."

### 19. Technical Specs - Layering: Why is it critical that the HUD is "drawn last in the frame pipeline"?

- **A) Guaranteed Visibility:** Drawing it last ensures that no in-game explosions, effects, or enemies can ever render on top of the HUD, guaranteeing it is never obscured.

### 20. Reframing the "Energy" Label: The word "Energy" is functional. What alternative label could add more thematic flavor?

- *User Note: Use "Energy".*



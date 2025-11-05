# 05 - Clean up

This is a list of general clean up tasks for the game

## Round 1

- [x] Game area should scale to the size of the window
- [x] Ship icon should be half of the size, so its just barly larger then the hit box
- [x] When a points pop up after killing a bad guy, these points text should disapear by moving up to the score counter then disapearing. as if adding to the score counter
- [x] The energy bar should be on the side of the screen full height.
- [x] The Chain should be below the score. When it changes size it should pulse from the left to the right. This prevents clipping off screen.
- [x] The Chain should always be visiable, but Zero when there is zero chain.
- [x] Have a pause button (p)
- [x] When you lose a life, become invinciple for 3 seconds, the your ship should blink rapidly to show invincible.
- [x] The polarity indicator for black in the bottom right, should show the same orange that the ship is in.
- [x] Show version number (from package.json) bottom right side of the screen. (v1.0.1)
- [x] Game over screen should show stats about your run. How many bad guys you killed, types of bad guys, shooting accurecy, bullets absorbed, etc...
- [x] Bad guys should always enter from off screen, they should not appear in the play area
- [x] Persitance, destroyed ships should stick on the background as gray broken bits. The opasitiy should be 50% and they should be on a lower level then the alive ships. They should look like destroyed ships.
- [x] The boss should also be able to flip polarity, when it does it should also change color to indicate what polarity its currently in.
- [x] Use the same seed for every run so all of the bad guys actions are perdictable.
- [ ] The different powerups should change your weapon. Bullets, three bullets, laser.
- [x] The help box with controls, overlaps the energy bar. Move the help controls slightly left so they don't overlap.

## Round 2

- [ ] Make the cubes move 20% faster then the player, we don't want the player to be able to out run the cubes.
- [ ] When the player is hit, breifly show a red glow around the outside of the screen 30 wide. This shows that we got hurt.
- [ ] In the hud, the money value should have a golden glow
- [ ] Use this music pack for the background music https://shononoki.itch.io/bullet-hell-music-pack 

### [x] Weapon vs shield energy

- [x] We are going to split the energy into two forms. White energy is shields, Black energy is used for the special weapon.
- [x] Collecting white bullets increases the shields bar, collecting black bullets increases the special weapon bar.
- [x] The black energy is shown in a bar on the right, the white energy is shown as a bar on the left side of the screen.
- [x] Remove the "lives" instead every time you get hit your sheilds are lowered. If your shields ever reach zero, its game over. You start the game with 50% shields.

### [x] Enemy drops

- [x] When an enemy dies, it drops a glowing cube, that stays in place. When a user gets close to these cubes they are attracted to the player. When a player collects these cubes it adds to the players money. The amount of cubes that are dropped is depenent on the difficulty of a enemy. Bosses drop more cubes.
- [x] Add a new counter in the score box for money.

## High score local storage

- [x] Store the high score into local storage, then show the high score with a date on the game over page.

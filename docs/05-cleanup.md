# 05 - Clean up

This is a list of general clean up tasks for the game

- [x] Game area should scale to the size of the window
- [x] Ship icon should be half of the size, so its just barly larger then the hit box
- [x] When a points pop up after killing a bad guy, these points text should disapear by moving up to the score counter then disapearing. as if adding to the score counter
- [x] The energy bar should be on the side of the screen full height.
- [x] The Chain should be below the score. When it changes size it should pulse from the left to the right. This prevents clipping off screen.
- [x] The Chain should always be visiable, but Zero when there is zero chain.
- [x] Have a pause button
- [x] When you lose a life, become invinciple for 3 seconds, the your ship should blink rapidly to show invincible.
- [x] The polarity indicator for black in the bottom right, should show the same orange that the ship is in.
- [x] Show version number (from package.json) bottom right side of the screen. (v1.0.1)
- [x] Game over screen should show stats about your run. How many bad guys you killed, types of bad guys, shooting accurecy, bullets absorbed, etc...
- [x] Bad guys should always enter from off screen, they should not appear in the play area
- [x] Persitance, destroyed ships should stick on the background as gray broken bits. The opasitiy should be 50% and they should be on a lower level then the alive ships. They should look like destroyed ships.
- [x] The boss should also be able to flip polarity, when it does it should also change color to indicate what polarity its currently in.
- [x] Use the same seed for every run so all of the bad guys actions are perdictable.
- [ ] The different powerups should change your weapon. Bullets, three bullets, laser.
- The help box with controls, overlaps the energy bar. Move the help controls slightly left so they don't overlap.

## High score local storage

- [x] Store the high score into local storage, then show the high score with a date on the game over page.

## Sound 

Use this music pack for the sound effects https://shononoki.itch.io/bullet-hell-music-pack 
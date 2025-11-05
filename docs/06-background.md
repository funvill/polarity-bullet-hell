## Background

- true camera-locked shooter
- [x] Use Open Street Maps as the background.
- [x] Use Carto's "No Labels" vector tiles for cleaner map without text/icons
- [x] Apply Assassin's Creed IV dark style (darker, desaturated, teal/gray tones)
- [x] The map should scroll in the direction of the ship travling. it should scroll slowly across the cites.
- [x] The map should start in Vancouver, BC, Canada pointing south.
- [x] The Persitance dead ships should be fixed to the map, as the map scrolls so do the dead ships. it looks like they crashed into the map.
- [x] The map should be washed out, to reduce the distraction.
- [x] The player needs to start in the center of the map, Vertial center and horazonal center.
- [x] As the player moves it should feel like they are moving the world around them, I should be able to approch bad guys, and run into bullets, etc...

~~Use this style for the map
https://snazzymaps.com/style/72543/assassins-creed-iv~~

Note: The Assassin's Creed IV style uses Google Maps API which requires payment. Instead, we're using Carto's free "No Labels" tiles with CSS filters to approximate the dark style:
- `brightness(0.4)` - Darkens the map significantly
- `contrast(1.2)` - Increases contrast for better definition
- `saturate(0.6)` - Reduces color saturation for muted tones
- `sepia(0.2)` - Adds slight warm tint

Color palette used:
- Water: `#2b3638` (dark teal)
- Landscape: `#4d6059` (dark gray-green)
- Roads: `#7f8d89` (light gray)
- Background: `#24282b` (very dark gray)

## Technical Implementation

### Dynamic Tile Loading System

The background uses a dynamic tile loading system that loads OpenStreetMap tiles on-demand as the player moves:

**Architecture:**

- **Tile Grid**: 9×9 grid of tiles (81 tiles) centered on the player's current position
- **Tile Caching**: `Map<key, tileData>` caches loaded tiles to avoid re-downloading
- **Active Tiles**: Only tiles currently visible are added to the scene (memory efficient)
- **Throttled Updates**: Tile visibility recalculated every 5 frames for performance

**Coordinate System:**

- Tiles positioned using **absolute tile coordinates** relative to Vancouver start position (49.2827°N, 123.1207°W, zoom level 11)
- Each tile's world position: `(tileX - startTileX) * worldUnitsPerTile`
- `worldUnitsPerTile` calculated as `playArea.width / tilesWide`
- Tile container moves with `worldOffset` (same as all game entities)

**Key Formula:**

```javascript
// Convert world offset to tile coordinates
tileOffsetX = Math.floor(-worldX / worldUnitsPerTile)  // Negative for correct direction
tileOffsetY = Math.floor(worldY / worldUnitsPerTile)
centerTile = startTile + tileOffset
```

**Critical Fix:** Tiles must be positioned based on their absolute tile coordinates relative to the start position, NOT relative to the current center tile. This ensures tiles stay in fixed world positions as the container moves.

### Tile Sources

- **Provider**: Carto CDN (free, no API key required)
- **URL Pattern**: `https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{zoom}/{x}/{y}.png`
- **Tile Size**: 256×256 pixels
- **Attribution**: © OpenStreetMap contributors, CARTO

### Camera-Locked Movement

- Player mesh always at `(0, 0, 0)` - never moves
- All entities (enemies, bullets, powerups, debris) moved by `-player.velocity * deltaTime` each frame
- `worldOffset` accumulates these movements to track total world displacement
- Background `tileContainer` positioned at `worldOffset` to move with entities
- Result: Player appears fixed at screen center, world moves around them

### Debug Panel

Bottom-right debug panel shows:

- **World Offset**: Current accumulated world movement (x, y)
- **Center Tile**: OSM tile coordinates at current center
- **Active Tiles**: Number of tiles currently in scene
- **Cached Tiles**: Total tiles loaded (including off-screen cached tiles)
- **Player Pos**: Player mesh position (should always be 0, 0)
- **Tile Size**: World units per tile


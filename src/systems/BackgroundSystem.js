import * as THREE from 'three';

export class BackgroundSystem {
    constructor(game) {
        this.game = game;
        this.scrollSpeed = 20; // Pixels per second, slow scroll
        this.currentOffset = 0;
        this.playerOffset = { x: 0, y: 0 }; // Track player movement for map scrolling
        
        // Vancouver, BC coordinates
        this.startLat = 49.2827;
        this.startLon = -123.1207;
        this.zoom = 11; // OSM zoom level (11 is zoomed out more, shows larger area)
        
        // Tile management
        this.tileCache = new Map(); // Cache loaded tiles by "x,y" key
        this.activeTiles = new Map(); // Currently visible tiles
        this.tileSize = 256; // OSM tiles are 256x256
        this.tilesWide = 9; // Number of tiles to show horizontally (increased for better coverage)
        this.tilesHigh = 9; // Number of tiles to show vertically (increased for better coverage)
        
        // Calculate world units per tile
        this.worldUnitsPerTile = this.game.playArea.width / this.tilesWide;
        
        // Create container for tile meshes
        this.tileContainer = new THREE.Group();
        this.tileContainer.position.z = -2; // Behind debris layer (-1)
        this.game.scene.add(this.tileContainer);
        
        // Throttle tile updates
        this.tileUpdateCounter = 0;
        this.tileUpdateInterval = 5; // Update tiles every 5 frames
        
        // Load initial tiles
        this.updateVisibleTiles();
        
        console.log('Background system initialized with dynamic tile loading');
        console.log('Map centered on Vancouver, BC (49.2827°N, 123.1207°W)');
    }
    
    // Convert lat/lon to OSM tile coordinates
    latLonToTile(lat, lon, zoom) {
        const n = Math.pow(2, zoom);
        const xtile = Math.floor((lon + 180) / 360 * n);
        const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
        return { x: xtile, y: ytile };
    }
    
    // Get tile coordinates based on world offset
    worldOffsetToTile(worldX, worldY) {
        const centerTile = this.latLonToTile(this.startLat, this.startLon, this.zoom);
        
        // Convert world offset to tile offset
        // Negate to match movement direction (moving right increases worldOffset.x, should show tiles to the right)
        const tileOffsetX = Math.floor(-worldX / this.worldUnitsPerTile);
        const tileOffsetY = Math.floor(worldY / this.worldUnitsPerTile);
        
        return {
            x: centerTile.x + tileOffsetX,
            y: centerTile.y + tileOffsetY
        };
    }
    
    // Load a single tile
    loadTile(tileX, tileY) {
        const key = `${tileX},${tileY}`;
        
        // Check if already loaded
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }
        
        console.log(`Loading tile: ${tileX}, ${tileY}`);
        
        // Create canvas for this tile
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Fill with dark placeholder
        ctx.fillStyle = '#2b3638';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create mesh for this tile
        const geometry = new THREE.PlaneGeometry(this.worldUnitsPerTile, this.worldUnitsPerTile);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: false,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Store in cache
        const tileData = { mesh, texture, canvas, ctx, loaded: false };
        this.tileCache.set(key, tileData);
        
        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/${this.zoom}/${tileX}/${tileY}.png`;
        
        img.onload = () => {
            ctx.filter = 'brightness(0.4) contrast(1.2) saturate(0.6) sepia(0.2)';
            ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
            ctx.filter = 'none';
            texture.needsUpdate = true;
            tileData.loaded = true;
            console.log(`✓ Tile loaded: ${tileX}, ${tileY}`);
        };
        
        img.onerror = () => {
            console.warn(`✗ Failed to load tile ${tileX}, ${tileY}`);
            this.drawFallbackTile(ctx, 0, 0, this.tileSize);
            texture.needsUpdate = true;
            tileData.loaded = true;
        };
        
        return tileData;
    }
    
    // Update visible tiles based on world offset
    updateVisibleTiles() {
        const worldX = this.game.worldOffset.x;
        const worldY = this.game.worldOffset.y;
        
        // Get center tile
        const centerTile = this.worldOffsetToTile(worldX, worldY);
        
        // Log first time and every 60 frames to help debug
        if (!this.debugCounter) this.debugCounter = 0;
        this.debugCounter++;
        if (this.debugCounter === 1 || this.debugCounter % 60 === 0) {
            console.log(`World: (${worldX.toFixed(1)}, ${worldY.toFixed(1)}) -> Tile: (${centerTile.x}, ${centerTile.y})`);
        }
        
        // Calculate which tiles should be visible
        const visibleTiles = new Set();
        const halfWidth = Math.ceil(this.tilesWide / 2);
        const halfHeight = Math.ceil(this.tilesHigh / 2);
        
        for (let ty = -halfHeight; ty <= halfHeight; ty++) {
            for (let tx = -halfWidth; tx <= halfWidth; tx++) {
                const tileX = centerTile.x + tx;
                const tileY = centerTile.y + ty;
                const key = `${tileX},${tileY}`;
                visibleTiles.add(key);
                
                // Load tile if not already active
                if (!this.activeTiles.has(key)) {
                    const tileData = this.loadTile(tileX, tileY);
                    
                    // Position the tile mesh based on absolute tile coordinates
                    // relative to the start position (Vancouver center)
                    const startTile = this.latLonToTile(this.startLat, this.startLon, this.zoom);
                    const offsetX = tileX - startTile.x;
                    const offsetY = tileY - startTile.y;
                    
                    tileData.mesh.position.x = offsetX * this.worldUnitsPerTile;
                    tileData.mesh.position.y = -offsetY * this.worldUnitsPerTile;
                    
                    this.tileContainer.add(tileData.mesh);
                    this.activeTiles.set(key, tileData);
                }
            }
        }
        
        // Remove tiles that are no longer visible
        for (const [key, tileData] of this.activeTiles) {
            if (!visibleTiles.has(key)) {
                this.tileContainer.remove(tileData.mesh);
                this.activeTiles.delete(key);
            }
        }
    }
    
    drawFallbackTile(ctx, x, y, size) {
        // Draw a dark fallback pattern matching Assassin's Creed style
        ctx.fillStyle = '#4d6059'; // Landscape color from the style
        ctx.fillRect(x, y, size, size);
        
        ctx.strokeStyle = '#7f8d89'; // Road color
        ctx.lineWidth = 1;
        
        // Draw simple road grid pattern
        for (let i = 0; i < size; i += 32) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y + size);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x, y + i);
            ctx.lineTo(x + size, y + i);
            ctx.stroke();
        }
    }
    
    update(deltaTime) {
        if (!this.game.player) return;
        
        // Throttle tile updates to every N frames for performance
        this.tileUpdateCounter++;
        if (this.tileUpdateCounter >= this.tileUpdateInterval) {
            this.updateVisibleTiles();
            this.tileUpdateCounter = 0;
        }
        
        // Position tile container based on world offset (every frame for smooth scrolling)
        this.tileContainer.position.x = this.game.worldOffset.x;
        this.tileContainer.position.y = this.game.worldOffset.y;
        
        // Track offset for debris positioning
        this.playerOffset.x = this.game.worldOffset.x;
        this.playerOffset.y = this.game.worldOffset.y;
    }
    
    getMapOffset() {
        // Return current world offset for debris positioning
        return this.game.worldOffset;
    }
    
    destroy() {
        // Clean up all cached tiles
        for (const [key, tileData] of this.tileCache) {
            if (tileData.mesh.geometry) tileData.mesh.geometry.dispose();
            if (tileData.mesh.material) {
                if (tileData.mesh.material.map) tileData.mesh.material.map.dispose();
                tileData.mesh.material.dispose();
            }
        }
        
        // Remove container from scene
        if (this.tileContainer) {
            this.game.scene.remove(this.tileContainer);
        }
        
        this.tileCache.clear();
        this.activeTiles.clear();
    }
}

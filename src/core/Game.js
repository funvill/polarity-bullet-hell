import * as THREE from 'three';
import { Input } from './Input.js';
import { SeededRandom } from './SeededRandom.js';
import { Player } from '../entities/Player.js';
import { HUD } from '../ui/HUD.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { BackgroundSystem } from '../systems/BackgroundSystem.js';
import { ParticleEffect, ExplosionEffect, AbsorptionEffect } from '../systems/ParticleEffects.js';
import { ChainSystem } from '../systems/ChainSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { PowerUp, PowerUpTypes } from '../entities/PowerUp.js';
import { AudioManager } from '../systems/AudioManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'START_SCREEN'; // START_SCREEN, PLAYING, GAME_OVER
        
        // Game state
        this.score = 0;
        this.chain = 0;
        this.maxChain = 0;
        this.chainPolarity = null; // Track active chain polarity
        this.lives = 3;
        this.energy = 0;
        
        // Game stats
        this.stats = {
            enemiesKilled: 0,
            enemyTypes: {},
            shotsFired: 0,
            shotsHit: 0,
            bulletsAbsorbed: 0
        };
        
        // Timing
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        this.currentFPS = 60;
        this.restartKeyWasPressed = false; // Track restart key state
        
        // Time scale for hit freeze effects
        this.timeScale = 1.0;
        this.freezeTimer = 0;
        
        // World offset for camera-centered gameplay
        this.worldOffset = { x: 0, y: 0 };
        
                // Camera effects
        this.cameraShakeAmount = 0;
        this.cameraShakeDecay = 0.9;
        this.cameraKickX = 0;
        this.cameraKickY = 0;
        this.cameraKickDecay = 0.85;
        
        // Play area dimensions - will be updated based on camera view
        this.playArea = {
            width: 600,
            height: 600,
            left: -300,
            right: 300,
            top: 300,
            bottom: -300
        };
        
        // Entity collections
        this.entities = [];
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.effects = [];
        this.debris = []; // Persistent destroyed ship remains
        
        // Seeded random for predictable gameplay
        this.random = new SeededRandom(42); // Fixed seed for predictable runs
        
        // Initialize systems
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        this.input = new Input(this.canvas);
        this.hud = new HUD(this);
        this.spawnSystem = new SpawnSystem(this);
        this.chainSystem = new ChainSystem(this);
        this.scoreSystem = new ScoreSystem(this);
        this.audio = new AudioManager();
        this.backgroundSystem = new BackgroundSystem(this);
        
        // Create player
        this.player = new Player(this);
        this.entities.push(this.player);
        
        // Debug helpers
        this.showDebug = true;
        this.createDebugHelpers();
        
        console.log('Game initialized');
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000);
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }
    
    initCamera() {
        // Orthographic camera for top-down 2D view - scale to window
        const aspect = window.innerWidth / window.innerHeight;
        
        // Use base height, scale width to aspect ratio
        const viewHeight = 600;
        const viewWidth = viewHeight * aspect;
        
        this.camera = new THREE.OrthographicCamera(
            -viewWidth / 2,
            viewWidth / 2,
            viewHeight / 2,
            -viewHeight / 2,
            0.1,
            1000
        );
        
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);
        
        // Update play area to match camera view
        this.updatePlayArea(viewWidth, viewHeight);
    }
    
    updatePlayArea(width, height) {
        this.playArea = {
            width: width,
            height: height,
            left: -width / 2,
            right: width / 2,
            top: height / 2,
            bottom: -height / 2
        };
    }
    
    initLights() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light for depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(0, 0, 10);
        this.scene.add(directionalLight);
    }
    
    createDebugHelpers() {
        // Play area boundary visualization (optional - can be disabled)
        // Uncomment to show boundary lines for debugging
        /*
        const boundaryGeometry = new THREE.EdgesGeometry(
            new THREE.PlaneGeometry(this.playArea.width, this.playArea.height)
        );
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            linewidth: 2
        });
        this.boundaryHelper = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
        this.scene.add(this.boundaryHelper);
        */
    }
    
    start() {
        this.isRunning = true;
        this.clock.start();
        this.animate();
        console.log('Game started');
    }
    
    startGame() {
        // Transition from start screen to playing
        this.gameState = 'PLAYING';
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
        
        // Initialize audio on first user interaction
        this.audio.init();
        
        console.log('Game started - entering play mode');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseElement = document.getElementById('pause-screen');
        if (pauseElement) {
            pauseElement.style.display = this.isPaused ? 'flex' : 'none';
        }
        
        console.log(this.isPaused ? 'Game paused' : 'Game resumed');
    }
    
    restart() {
        // Reset game state
        this.score = 0;
        this.chain = 0;
        this.maxChain = 0;
        this.chainPolarity = null; // Reset chain polarity
        this.lives = 3;
        this.energy = 0;
        this.gameState = 'PLAYING';
        
        // Reset stats
        this.stats = {
            enemiesKilled: 0,
            enemyTypes: {},
            shotsFired: 0,
            shotsHit: 0,
            bulletsAbsorbed: 0
        };
        
        // Hide game over screen
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        
        // Clear all entities except player
        for (const bullet of this.bullets) {
            if (bullet.mesh && bullet.mesh.parent) {
                this.scene.remove(bullet.mesh);
            }
        }
        for (const enemy of this.enemies) {
            if (enemy.mesh && enemy.mesh.parent) {
                this.scene.remove(enemy.mesh);
            }
        }
        for (const effect of this.effects) {
            effect.destroy();
        }
        for (const powerUp of this.powerUps) {
            powerUp.destroy();
        }
        
        // Clear debris
        for (const debris of this.debris) {
            this.scene.remove(debris.mesh);
            debris.geometry.dispose();
            debris.material.dispose();
        }
        
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.effects = [];
        this.debris = [];
        this.entities = [this.player];
        
        // Reset seeded random for consistent gameplay
        this.random.reset();
        
        // Reset player
        this.player.reset();
        
        // Reset spawn system
        this.spawnSystem.spawnTimer = 2; // Start spawning again after 2 seconds
        this.spawnSystem.waveNumber = 0;
        this.spawnSystem.difficultyLevel = 1;
        this.spawnSystem.spawnInterval = this.spawnSystem.baseSpawnInterval;
        this.spawnSystem.bossActive = false;
        
        // Reset chain system
        if (this.chainSystem) {
            this.chainSystem.chainCount = 0;
            this.chainSystem.chainQueue = [];
            this.chainSystem.maxChain = 0;
        }
        
        // Reset score system (clear popups)
        if (this.scoreSystem) {
            this.scoreSystem.clear();
        }
        
        // Update HUD
        this.hud.update();
        this.hud.hideGameOver();
        
        console.log('Game restarted');
    }
    
    animate = () => {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate);
        
        this.deltaTime = this.clock.getDelta();
        
        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.1;
        }
        
        // Update FPS counter
        this.frameCount++;
        this.fpsUpdateTime += this.deltaTime;
        if (this.fpsUpdateTime >= 0.5) {
            this.currentFPS = Math.round(this.frameCount / this.fpsUpdateTime);
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
        }
        
        // Update game
        if (this.gameState === 'START_SCREEN') {
            // Check for space key to start the game
            const spaceKeyPressed = this.input.isKeyPressed('Space');
            if (spaceKeyPressed) {
                this.startGame();
            }
        } else if (this.gameState === 'PLAYING') {
            // Check for pause
            if (this.input.isPausePressed()) {
                this.togglePause();
            }
            
            if (!this.isPaused) {
                this.update(this.deltaTime);
            }
        } else if (this.gameState === 'GAME_OVER') {
            // Handle restart in game over state
            const rKeyPressed = this.input.isKeyPressed('KeyR');
            if (rKeyPressed) {
                this.restart();
            }
        }
        
        // Always render
        this.render();
    }
    
    update(deltaTime) {
        // Apply time freeze effect
        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime;
            deltaTime *= 0.1; // Slow down to 10% speed during freeze
        } else {
            deltaTime *= this.timeScale;
        }
        
        // Update world offset based on player velocity (player stays centered, world moves)
        if (this.player && this.player.velocity) {
            // Calculate movement delta (inverse of player movement)
            const worldMovementX = -this.player.velocity.x * deltaTime;
            const worldMovementY = -this.player.velocity.y * deltaTime;
            
            // No boundary limits - allow infinite scrolling
            this.worldOffset.x += worldMovementX;
            this.worldOffset.y += worldMovementY;
            
            // Move all enemies
            for (let i = 0; i < this.enemies.length; i++) {
                this.enemies[i].mesh.position.x += worldMovementX;
                this.enemies[i].mesh.position.y += worldMovementY;
            }
            
            // Move all bullets
            for (let i = 0; i < this.bullets.length; i++) {
                this.bullets[i].mesh.position.x += worldMovementX;
                this.bullets[i].mesh.position.y += worldMovementY;
            }
            
            // Move all power-ups
            for (let i = 0; i < this.powerUps.length; i++) {
                this.powerUps[i].mesh.position.x += worldMovementX;
                this.powerUps[i].mesh.position.y += worldMovementY;
            }
            
            // Move all debris
            for (let i = 0; i < this.debris.length; i++) {
                this.debris[i].mesh.position.x += worldMovementX;
                this.debris[i].mesh.position.y += worldMovementY;
            }
            
            // Move all effects
            for (let i = 0; i < this.effects.length; i++) {
                if (this.effects[i].mesh) {
                    this.effects[i].mesh.position.x += worldMovementX;
                    this.effects[i].mesh.position.y += worldMovementY;
                }
            }
        }
        
        // Update all entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.update) {
                entity.update(deltaTime);
            }
            
            // Remove dead entities
            if (entity.isDead && entity.isDead()) {
                this.removeEntity(entity);
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // Remove bullets that are out of bounds
            if (this.isOutOfBounds(bullet.mesh.position)) {
                this.removeBullet(bullet);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // Remove enemies that are out of bounds
            if (enemy.mesh.position.y < this.playArea.bottom - 50) {
                this.removeEnemy(enemy);
            }
        }
        
        // Update spawn system
        this.spawnSystem.update(deltaTime);
        
        // Update background scrolling
        if (this.backgroundSystem) {
            this.backgroundSystem.update(deltaTime);
            
            // Debris positions are in world space, no need to update them
            // They'll move naturally with the camera
            // Just remove debris that are too far from camera view
            for (let i = this.debris.length - 1; i >= 0; i--) {
                const debris = this.debris[i];
                
                // Remove debris that are too far from view (based on world coordinates)
                const relativeX = debris.mesh.position.x - this.worldOffset.x;
                const relativeY = debris.mesh.position.y - this.worldOffset.y;
                
                if (relativeY < this.playArea.bottom - 200 ||
                    relativeY > this.playArea.top + 200 ||
                    relativeX < this.playArea.left - 200 ||
                    relativeX > this.playArea.right + 200) {
                    this.scene.remove(debris.mesh);
                    debris.geometry.dispose();
                    debris.material.dispose();
                    this.debris.splice(i, 1);
                }
            }
        }
        
        // Update score system (popups)
        this.scoreSystem.update(deltaTime);
        
        // Update music mode based on game state
        this.updateMusicMode();
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            const isDead = powerUp.update(deltaTime);
            
            if (isDead || this.isOutOfBounds(powerUp.mesh.position)) {
                powerUp.destroy();
                this.powerUps.splice(i, 1);
            }
        }
        
        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const isDone = effect.update(deltaTime);
            if (isDone) {
                effect.destroy();
                this.effects.splice(i, 1);
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update HUD
        this.hud.update();
    }
    
    render() {
        // Apply camera shake and camera kick
        if (this.cameraShakeAmount > 0.1 || Math.abs(this.cameraKickX) > 0.1 || Math.abs(this.cameraKickY) > 0.1) {
            const shakeX = (Math.random() - 0.5) * this.cameraShakeAmount;
            const shakeY = (Math.random() - 0.5) * this.cameraShakeAmount;
            
            this.camera.position.x = shakeX + this.cameraKickX;
            this.camera.position.y = shakeY + this.cameraKickY;
            
            this.cameraShakeAmount *= this.cameraShakeDecay;
            this.cameraKickX *= this.cameraKickDecay;
            this.cameraKickY *= this.cameraKickDecay;
        } else {
            this.camera.position.x = 0;
            this.camera.position.y = 0;
            this.cameraShakeAmount = 0;
            this.cameraKickX = 0;
            this.cameraKickY = 0;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.owner !== 'player') continue;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCircleCollision(bullet.mesh.position, bullet.radius, 
                                             enemy.mesh.position, enemy.radius)) {
                    
                    // Same polarity bullets pass through / don't damage same color enemies
                    if (bullet.polarity === enemy.polarity) {
                        console.log(`${bullet.polarity} bullet has no effect on ${enemy.polarity} enemy`);
                        continue; // Bullet passes through, no damage
                    }
                    
                    // Opposite polarity = 2x damage
                    const damage = 2;
                    
                    // Track shot hit
                    this.stats.shotsHit++;
                    
                    // Add knockback effect
                    const knockbackForce = 15;
                    const bulletDir = bullet.velocity.clone().normalize();
                    enemy.mesh.position.x += bulletDir.x * knockbackForce;
                    enemy.mesh.position.y += bulletDir.y * knockbackForce;
                    
                    enemy.takeDamage(damage);
                    this.removeBullet(bullet);
                    
                    // If enemy is destroyed, add to score
                    if (enemy.isDead()) {
                        // Track enemy kill
                        this.stats.enemiesKilled++;
                        const enemyType = enemy.constructor.name;
                        this.stats.enemyTypes[enemyType] = (this.stats.enemyTypes[enemyType] || 0) + 1;
                        
                        // Call onDestroy before removing to spawn children
                        if (enemy.onDestroy) {
                            enemy.onDestroy();
                        }
                        
                        // Use ScoreSystem for advanced scoring
                        this.scoreSystem.onEnemyDestroyed(enemy);
                        this.chainSystem.onEnemyDestroyed(enemy.polarity);
                        
                        // Scale explosion by enemy size
                        const explosionSize = enemy.size || 'medium';
                        this.createExplosion(enemy.mesh.position, enemy.polarity, explosionSize);
                        
                        // Create persistent debris
                        this.createDebris(enemy.mesh.position, enemy.polarity, explosionSize);
                        
                        // Chance to drop power-up
                        this.tryDropPowerUp(enemy.mesh.position);
                        
                        this.removeEnemy(enemy);
                    }
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.owner !== 'enemy') continue;
            
            // Check shield collision first (absorb same-polarity bullets)
            if (this.checkCircleCollision(bullet.mesh.position, bullet.radius,
                                         this.player.mesh.position, this.player.shieldRadius)) {
                // Check polarity
                if (bullet.polarity === this.player.polarity) {
                    // Absorb bullet at shield
                    this.absorbBullet(bullet.polarity, bullet.mesh.position);
                    this.removeBullet(bullet);
                    continue;
                }
            }
            
            // Check core hitbox collision (opposite bullets damage)
            if (this.checkCircleCollision(bullet.mesh.position, bullet.radius,
                                         this.player.mesh.position, this.player.hitboxRadius)) {
                this.removeBullet(bullet);
                
                // Check polarity - opposite bullets that reach core still damage
                if (bullet.polarity !== this.player.polarity) {
                    // Take damage
                    this.playerHit();
                    this.removeBullet(bullet);
                }
            }
        }
        
        // Power-ups vs player
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkCircleCollision(powerUp.mesh.position, powerUp.radius,
                                         this.player.mesh.position, this.player.visualRadius)) {
                powerUp.collect(this.player);
                powerUp.destroy();
                this.powerUps.splice(i, 1);
                
                // Play power-up sound
                this.audio.playPowerUp();
            }
        }
        
        // Player vs enemies collision
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.checkCircleCollision(this.player.mesh.position, this.player.visualRadius,
                                         enemy.mesh.position, enemy.radius)) {
                // Player is locked at center - push the enemy away instead
                const dx = this.player.mesh.position.x - enemy.mesh.position.x;
                const dy = this.player.mesh.position.y - enemy.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Calculate push distance
                    const pushDistance = (this.player.visualRadius + enemy.radius) - distance;
                    const pushX = (dx / distance) * pushDistance;
                    const pushY = (dy / distance) * pushDistance;
                    
                    // Push the enemy away (not the player)
                    enemy.mesh.position.x -= pushX;
                    enemy.mesh.position.y -= pushY;
                }
            }
        }
    }
    
    checkCircleCollision(pos1, radius1, pos2, radius2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (radius1 + radius2);
    }
    
    absorbBullet(polarity, position) {
        this.energy = Math.min(this.energy + 2, 100);
        
        // Track bullet absorption
        this.stats.bulletsAbsorbed++;
        
        // Create absorption effect
        const color = polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        const effect = new AbsorptionEffect(this, position, color);
        this.effects.push(effect);
        
        // Subtle screen shake for feedback
        this.cameraShake(0.5);
        
        // Play absorption sound
        this.audio.playAbsorb();
        
        console.log(`Bullet absorbed! Energy: ${this.energy}`);
    }
    
    createExplosion(position, polarity, size = 'medium') {
        const color = polarity === 'WHITE' ? 0xffffff : 0x333333;
        const explosion = new ExplosionEffect(this, position, color, size);
        this.effects.push(explosion);
        
        // Create particle burst - scale by size
        const particleColor = polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        const particleCount = size === 'large' ? 24 : size === 'medium' ? 12 : 8;
        const particleSpeed = size === 'large' ? 200 : size === 'medium' ? 150 : 100;
        
        const particles = new ParticleEffect(this, {
            position: position,
            color: particleColor,
            particleCount: particleCount,
            lifetime: 0.8,
            speed: particleSpeed,
            size: size === 'large' ? 6 : 4
        });
        this.effects.push(particles);
        
        // Play explosion sound - size affects sound
        const soundSize = size === 'large' ? 'large' : 'medium';
        this.audio.playExplosion(soundSize);
    }
    
    createDebris(position, polarity, size = 'medium') {
        // Create a gray, semi-transparent debris mesh
        const debrisSize = size === 'large' ? 25 : size === 'medium' ? 15 : 10;
        
        // Create irregular debris shape (broken ship pieces)
        const debrisGeometry = new THREE.CircleGeometry(debrisSize, 6); // Hexagonal broken shape
        const debrisMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444, // Dark gray
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const debrisMesh = new THREE.Mesh(debrisGeometry, debrisMaterial);
        debrisMesh.position.copy(position);
        debrisMesh.position.z = -1; // Lower level than gameplay (background layer)
        
        // Random rotation for variety using seeded random
        debrisMesh.rotation.z = this.random.nextFloat(0, Math.PI * 2);
        
        this.scene.add(debrisMesh);
        
        // Store debris reference - position is already in world space
        this.debris.push({
            mesh: debrisMesh,
            geometry: debrisGeometry,
            material: debrisMaterial
        });
        
        // Limit debris count to prevent performance issues (keep last 50 pieces)
        if (this.debris.length > 50) {
            const oldDebris = this.debris.shift();
            this.scene.remove(oldDebris.mesh);
            oldDebris.geometry.dispose();
            oldDebris.material.dispose();
        }
    }
    
    playerHit() {
        // Skip damage if invincible
        if (this.player.invincible) {
            return;
        }
        
        this.lives--;
        this.chainSystem.breakChain(); // Break chain on hit
        console.log(`Player hit! Lives: ${this.lives}`);
        
        // Activate invincibility
        this.player.activateInvincibility();
        
        // Play hit sound
        this.audio.playHit();
        
        // Camera shake
        this.cameraShake(5);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    updateMusicMode() {
        // Don't change music mode during boss fights
        if (this.spawnSystem.bossActive) return;
        
        // Update music intensity based on bullet count
        this.audio.updateMusicIntensity(this.bullets.length, 100);
        
        // Check for danger mode (low lives or many bullets)
        if (this.lives <= 1 || this.bullets.length > 80) {
            this.audio.setMusicMode('danger');
        } else {
            this.audio.setMusicMode('normal');
        }
    }
    
    tryDropPowerUp(position) {
        // 15% chance to drop a power-up using seeded random
        if (this.random.chance(0.15)) {
            const types = Object.values(PowerUpTypes);
            const randomType = this.random.choose(types);
            
            const powerUp = new PowerUp(this, {
                x: position.x,
                y: position.y,
                type: randomType
            });
            
            this.powerUps.push(powerUp);
            console.log(`Power-up dropped: ${randomType}`);
        }
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        this.maxChain = Math.max(this.maxChain, this.chain);
        
        // Save high score
        this.saveHighScore();
        
        this.hud.showGameOver();
        console.log('Game Over!');
    }
    
    saveHighScore() {
        const highScores = this.getHighScores();
        
        // Add current score
        const newScore = {
            score: this.score,
            maxChain: this.maxChain
        };
        
        highScores.push(newScore);
        
        // Sort by score descending
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 5
        const top5 = highScores.slice(0, 5);
        
        localStorage.setItem('polarityHighScores', JSON.stringify(top5));
        console.log('Saved high scores:', top5);
    }
    
    getHighScores() {
        const stored = localStorage.getItem('polarityHighScores');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    }
    
    getHighScore() {
        // Legacy method for compatibility
        const scores = this.getHighScores();
        if (scores.length > 0) {
            return scores[0];
        }
        return { score: 0, maxChain: 0 };
    }
    
    addScore(points) {
        this.score += points;
    }
    
    isOutOfBounds(position) {
        return position.x < this.playArea.left - 50 ||
               position.x > this.playArea.right + 50 ||
               position.y < this.playArea.bottom - 50 ||
               position.y > this.playArea.top + 50;
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
        if (entity.mesh && entity.mesh.parent) {
            this.scene.remove(entity.mesh);
        }
    }
    
    removeBullet(bullet) {
        const index = this.bullets.indexOf(bullet);
        if (index > -1) {
            this.bullets.splice(index, 1);
        }
        if (bullet.mesh && bullet.mesh.parent) {
            this.scene.remove(bullet.mesh);
        }
    }
    
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        if (enemy.mesh && enemy.mesh.parent) {
            this.scene.remove(enemy.mesh);
        }
        
        // Check if it was a boss
        if (enemy.constructor.name === 'Boss') {
            this.spawnSystem.onBossDefeated();
        }
    }
    
    cameraShake(intensity = 5) {
        this.cameraShakeAmount = intensity;
    }
    
    cameraKick(x, y) {
        this.cameraKickX = x;
        this.cameraKickY = y;
    }
    
    hitFreeze(duration = 0.05) {
        // Brief freeze/pause for impactful moments
        this.freezeTimer = duration;
    }
    
    onResize() {
        // Update camera to scale with window
        const aspect = window.innerWidth / window.innerHeight;
        
        // Use base height, scale width to aspect ratio
        const viewHeight = 600;
        const viewWidth = viewHeight * aspect;
        
        this.camera.left = -viewWidth / 2;
        this.camera.right = viewWidth / 2;
        this.camera.top = viewHeight / 2;
        this.camera.bottom = -viewHeight / 2;
        this.camera.updateProjectionMatrix();
        
        // Update play area to match camera view
        this.updatePlayArea(viewWidth, viewHeight);
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

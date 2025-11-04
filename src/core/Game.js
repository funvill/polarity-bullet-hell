import * as THREE from 'three';
import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { HUD } from '../ui/HUD.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
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
        this.lives = 3;
        this.energy = 0;
        
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
        
                // Camera effects
        this.cameraShakeAmount = 0;
        this.cameraShakeDecay = 0.9;
        this.cameraKickX = 0;
        this.cameraKickY = 0;
        this.cameraKickDecay = 0.85;
        
        // Play area dimensions
        this.playArea = {
            width: 400,
            height: 600,
            left: -200,
            right: 200,
            top: 300,
            bottom: -300
        };
        
        // Entity collections
        this.entities = [];
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.effects = [];
        
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
        // Orthographic camera for top-down 2D view
        const aspect = window.innerWidth / window.innerHeight;
        const viewHeight = this.playArea.height;
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
        // Play area boundary visualization
        const boundaryGeometry = new THREE.EdgesGeometry(
            new THREE.PlaneGeometry(this.playArea.width, this.playArea.height)
        );
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            linewidth: 2
        });
        this.boundaryHelper = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
        this.scene.add(this.boundaryHelper);
        
        // Grid helper - at z = -1 so player renders on top
        const gridHelper = new THREE.GridHelper(600, 20, 0x222222, 0x111111);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = -1;
        this.scene.add(gridHelper);
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
    
    restart() {
        // Reset game state
        this.score = 0;
        this.chain = 0;
        this.maxChain = 0;
        this.lives = 3;
        this.energy = 0;
        this.gameState = 'PLAYING';
        
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
        
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.effects = [];
        this.entities = [this.player];
        
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
        } else if (!this.isPaused && this.gameState === 'PLAYING') {
            this.update(this.deltaTime);
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
                    
                    // Add knockback effect
                    const knockbackForce = 15;
                    const bulletDir = bullet.velocity.clone().normalize();
                    enemy.mesh.position.x += bulletDir.x * knockbackForce;
                    enemy.mesh.position.y += bulletDir.y * knockbackForce;
                    
                    enemy.takeDamage(damage);
                    this.removeBullet(bullet);
                    
                    // If enemy is destroyed, add to score
                    if (enemy.isDead()) {
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
                // Push player away from enemy
                const dx = this.player.mesh.position.x - enemy.mesh.position.x;
                const dy = this.player.mesh.position.y - enemy.mesh.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Normalize and push player away
                    const pushDistance = (this.player.visualRadius + enemy.radius) - distance;
                    const pushX = (dx / distance) * pushDistance;
                    const pushY = (dy / distance) * pushDistance;
                    
                    this.player.mesh.position.x += pushX;
                    this.player.mesh.position.y += pushY;
                    
                    // Clamp to play area
                    this.player.mesh.position.x = Math.max(
                        this.playArea.left + this.player.visualRadius,
                        Math.min(this.player.mesh.position.x, this.playArea.right - this.player.visualRadius)
                    );
                    this.player.mesh.position.y = Math.max(
                        this.playArea.bottom + this.player.visualRadius,
                        Math.min(this.player.mesh.position.y, this.playArea.top - this.player.visualRadius)
                    );
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
    
    playerHit() {
        this.lives--;
        this.chainSystem.breakChain(); // Break chain on hit
        console.log(`Player hit! Lives: ${this.lives}`);
        
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
        // 15% chance to drop a power-up
        if (Math.random() < 0.15) {
            const types = Object.values(PowerUpTypes);
            const randomType = types[Math.floor(Math.random() * types.length)];
            
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
        this.hud.showGameOver();
        console.log('Game Over!');
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
        // Update camera
        const aspect = window.innerWidth / window.innerHeight;
        const viewHeight = this.playArea.height;
        const viewWidth = viewHeight * aspect;
        
        this.camera.left = -viewWidth / 2;
        this.camera.right = viewWidth / 2;
        this.camera.top = viewHeight / 2;
        this.camera.bottom = -viewHeight / 2;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

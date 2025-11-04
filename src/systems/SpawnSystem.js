import { Enemy } from '../entities/Enemy.js';
import { SpecialEnemy } from '../entities/SpecialEnemy.js';
import { Boss } from '../entities/Boss.js';
import * as THREE from 'three';

export class SpawnSystem {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.baseSpawnInterval = 3.0; // Increased from 1.5 to 3 seconds between spawns
        this.spawnInterval = this.baseSpawnInterval;
        this.waveNumber = 0;
        
        // Boss tracking
        this.bossActive = false;
        this.bossWaveInterval = 10; // Boss every 10 waves
        
        // Difficulty scaling
        this.difficultyLevel = 1;
        this.scoreThreshold = 5000; // Score needed for next difficulty
        
        // Define spawn patterns
        this.patterns = [
            this.spawnFromTop.bind(this),
            this.spawnFromSides.bind(this),
            this.spawnCircle.bind(this),
            this.spawnDiagonal.bind(this),
            this.spawnSurrounding.bind(this)
        ];
    }
    
    update(deltaTime) {
        this.spawnTimer -= deltaTime;
        
        // Update difficulty based on score
        this.updateDifficulty();
        
        if (this.spawnTimer <= 0) {
            this.spawnWave();
            this.spawnTimer = this.spawnInterval;
        }
    }
    
    updateDifficulty() {
        const newLevel = Math.floor(this.game.score / this.scoreThreshold) + 1;
        if (newLevel !== this.difficultyLevel) {
            this.difficultyLevel = newLevel;
            console.log(`Difficulty increased to level ${this.difficultyLevel}`);
            
            // Reduce spawn interval (faster spawns) but cap minimum at 2 seconds
            this.spawnInterval = Math.max(2.0, this.baseSpawnInterval - (this.difficultyLevel * 0.1));
        }
    }
    
    getDifficultyMultipliers() {
        return {
            enemySpeed: 0.3 + (this.difficultyLevel - 1) * 0.05, // Start at 30% of player speed, max ~50%
            enemyHP: 1, // Always 1 HP - one shot kills
            bulletSpeed: 0.3 + (this.difficultyLevel - 1) * 0.04, // Start at 30% of player speed
            fireRate: 0.5 + (this.difficultyLevel - 1) * 0.1, // Increased fire rate as difficulty increases
            enemyCount: 1 // Keep constant - don't multiply enemies
        };
    }
    
    spawnWave() {
        this.waveNumber++;
        
        // Check if it's time for a boss
        if (this.waveNumber % this.bossWaveInterval === 0 && !this.bossActive) {
            this.spawnBoss();
            return;
        }
        
        // Alternate between white and black enemies
        const polarity = this.waveNumber % 2 === 0 ? 'WHITE' : 'BLACK';
        
        // Choose a random spawn pattern
        const pattern = this.patterns[this.waveNumber % this.patterns.length];
        pattern(polarity);
        
        console.log(`Wave ${this.waveNumber}: ${polarity} enemies`);
    }
    
    spawnBoss() {
        const polarity = this.waveNumber % 2 === 0 ? 'WHITE' : 'BLACK';
        const bossLevel = Math.floor(this.waveNumber / this.bossWaveInterval);
        
        const boss = new Boss(this.game, {
            x: 0,
            y: this.game.playArea.top + 100,
            polarity: polarity,
            hp: 50 + (bossLevel * 30), // Scaling HP with boss level
            value: 5000 + (bossLevel * 2000)
        });
        
        this.game.enemies.push(boss);
        this.bossActive = true;
        
        // Change music to boss mode
        this.game.audio.setMusicMode('boss');
        
        console.log(`=== BOSS WAVE ${this.waveNumber} ===`);
        console.log(`Boss spawned with ${boss.maxHp} HP`);
    }
    
    onBossDefeated() {
        this.bossActive = false;
        
        // Return music to normal
        this.game.audio.setMusicMode('normal');
        
        console.log('Boss defeated! Regular waves resuming...');
    }
    
    spawnFromTop(polarity) {
        // Spawn enemies from the top in a line formation - reduced from 3 to 2
        const count = 2;
        for (let i = 0; i < count; i++) {
            const xPos = -50 + (i * 100);
            this.createEnemy({
                x: xPos,
                y: this.game.playArea.top + 50,
                polarity: polarity,
                movementPattern: 'straight',
                direction: new THREE.Vector3(0, -1, 0)
            });
        }
    }
    
    spawnFromSides(polarity) {
        // Spawn enemies from left and right sides - reduced positions
        const yPositions = [0, 100];
        
        yPositions.forEach(y => {
            // From left
            this.createEnemy({
                x: this.game.playArea.left - 50,
                y: y,
                polarity: polarity,
                movementPattern: 'straight',
                direction: new THREE.Vector3(1, -0.5, 0).normalize()
            });
            
            // From right
            this.createEnemy({
                x: this.game.playArea.right + 50,
                y: y,
                polarity: polarity,
                movementPattern: 'straight',
                direction: new THREE.Vector3(-1, -0.5, 0).normalize()
            });
        });
    }
    
    spawnCircle(polarity) {
        // Spawn enemies in a circle formation that move through the center and off screen - reduced from 8 to 5
        const count = 5;
        const radius = 250;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            this.createEnemy({
                x: x,
                y: y,
                polarity: polarity,
                movementPattern: 'straight',
                direction: new THREE.Vector3(-Math.cos(angle), -Math.sin(angle), 0).normalize()
            });
        }
    }
    
    spawnDiagonal(polarity) {
        // Spawn enemies that move diagonally across the screen - reduced from 4 to 2
        const positions = [
            { x: -220, y: 320, dir: new THREE.Vector3(0.5, -1, 0).normalize() },
            { x: 220, y: 320, dir: new THREE.Vector3(-0.5, -1, 0).normalize() }
        ];
        
        positions.forEach(pos => {
            this.createEnemy({
                x: pos.x,
                y: pos.y,
                polarity: polarity,
                movementPattern: 'straight',
                direction: pos.dir
            });
        });
    }
    
    spawnSurrounding(polarity) {
        // Spawn enemies from all four sides - reduced from 7 to 4
        const sides = [
            // Top
            { x: -100, y: this.game.playArea.top + 50, dir: new THREE.Vector3(0.2, -1, 0).normalize() },
            { x: 100, y: this.game.playArea.top + 50, dir: new THREE.Vector3(-0.2, -1, 0).normalize() },
            // Left
            { x: this.game.playArea.left - 50, y: 100, dir: new THREE.Vector3(1, -0.5, 0).normalize() },
            // Right
            { x: this.game.playArea.right + 50, y: 100, dir: new THREE.Vector3(-1, -0.5, 0).normalize() }
        ];
        
        sides.forEach(side => {
            this.createEnemy({
                x: side.x,
                y: side.y,
                polarity: polarity,
                movementPattern: 'straight',
                direction: side.dir
            });
        });
    }
    
    createEnemy(config) {
        const multipliers = this.getDifficultyMultipliers();
        
        // Determine if this should be a special enemy (20% chance at wave 5+)
        const shouldBeSpecial = this.waveNumber >= 5 && Math.random() < 0.2;
        
        if (shouldBeSpecial && !config.forceNormal) {
            return this.createSpecialEnemy(config, multipliers);
        }
        
        // Randomly choose enemy size - higher levels spawn larger enemies
        let size = config.size || 'medium';
        if (!config.size) {
            const rand = Math.random();
            if (this.difficultyLevel >= 3) {
                if (rand < 0.2) size = 'large';
                else if (rand < 0.5) size = 'medium';
                else size = 'small';
            } else if (this.difficultyLevel >= 2) {
                if (rand < 0.3) size = 'medium';
                else size = 'small';
            }
        }
        
        const enemy = new Enemy(this.game, {
            position: { 
                x: config.x, 
                y: config.y, 
                z: 0 
            },
            polarity: config.polarity,
            size: size,
            hp: multipliers.enemyHP,
            value: size === 'large' ? 300 : size === 'medium' ? 100 : 50,
            speed: 50 * multipliers.enemySpeed * (size === 'large' ? 0.8 : size === 'medium' ? 1.0 : 1.2),
            fireRate: multipliers.fireRate * (size === 'large' ? 0.7 : 1.0),
            movementPattern: config.movementPattern || 'straight',
            direction: config.direction || new THREE.Vector3(0, -1, 0),
            target: config.target,
            bulletSpeed: 75 * multipliers.bulletSpeed
        });
        
        this.game.enemies.push(enemy);
        return enemy;
    }
    
    createSpecialEnemy(config, multipliers) {
        // Choose a random special enemy type
        const types = ['sniper', 'sprayer', 'kamikaze', 'tank', 'dodger'];
        const enemyType = types[Math.floor(Math.random() * types.length)];
        
        const specialEnemy = new SpecialEnemy(this.game, {
            position: { 
                x: config.x, 
                y: config.y, 
                z: 0 
            },
            polarity: config.polarity,
            size: 'medium',
            hp: 1,
            value: 150,
            speed: 50 * multipliers.enemySpeed,
            fireRate: multipliers.fireRate,
            movementPattern: config.movementPattern || 'straight',
            direction: config.direction || new THREE.Vector3(0, -1, 0),
            target: config.target,
            bulletSpeed: 75 * multipliers.bulletSpeed,
            enemyType: enemyType
        });
        
        this.game.enemies.push(specialEnemy);
        console.log(`Spawned special enemy: ${enemyType}`);
        return specialEnemy;
    }
    
    spawnEnemyAt(x, y, polarity) {
        const enemy = new Enemy(this.game, {
            position: { x, y, z: 0 },
            polarity: polarity,
            hp: 1,
            value: 100,
            speed: 50,
            fireRate: 0.5
        });
        
        this.game.enemies.push(enemy);
        return enemy;
    }
}

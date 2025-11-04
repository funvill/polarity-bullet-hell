import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { Bullet } from './Bullet.js';

/**
 * SpecialEnemy - Enhanced enemies with unique behaviors
 */
export class SpecialEnemy extends Enemy {
    constructor(game, config) {
        super(game, config);
        
        // Initialize visualRadius from parent's radius
        this.visualRadius = this.radius;
        
        this.enemyType = config.enemyType || 'normal';
        this.setupSpecialBehavior();
    }
    
    setupSpecialBehavior() {
        switch (this.enemyType) {
            case 'sniper':
                // Slow movement, long-range accurate shots
                this.speed *= 0.5;
                this.fireRate = 2.0; // Slower fire rate
                this.bulletSpeed *= 1.5;
                this.value *= 1.5;
                this.createSniperVisual();
                break;
                
            case 'sprayer':
                // Moderate speed, shoots multiple bullets at once
                this.fireRate = 1.5;
                this.bulletSpeed *= 0.8;
                this.value *= 1.3;
                this.createSprayerVisual();
                break;
                
            case 'kamikaze':
                // Fast movement, doesn't shoot, rams player
                this.speed *= 2.0;
                this.fireRate = 0; // Doesn't shoot
                this.value *= 1.2;
                this.damage = 2; // Deals double damage on collision
                this.createKamikazeVisual();
                break;
                
            case 'tank':
                // Slow, high HP, big target
                this.hp = 3;
                this.speed *= 0.6;
                this.visualRadius *= 1.5;
                this.value *= 2.0;
                this.createTankVisual();
                break;
                
            case 'dodger':
                // Erratic movement, dodges bullets
                this.speed *= 1.3;
                this.value *= 1.4;
                this.dodgeTimer = 0;
                this.dodgeCooldown = 0.5;
                this.createDodgerVisual();
                break;
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Special behavior updates
        if (this.enemyType === 'dodger') {
            this.updateDodger(deltaTime);
        } else if (this.enemyType === 'kamikaze') {
            this.updateKamikaze(deltaTime);
        }
    }
    
    updateDodger(deltaTime) {
        this.dodgeTimer -= deltaTime;
        
        if (this.dodgeTimer <= 0) {
            // Check for nearby player bullets
            const nearbyBullets = this.game.bullets.filter(bullet => {
                if (bullet.owner === 'player') {
                    const dist = this.mesh.position.distanceTo(bullet.mesh.position);
                    return dist < 50; // Detection range
                }
                return false;
            });
            
            if (nearbyBullets.length > 0) {
                // Dodge perpendicular to bullet direction
                const bullet = nearbyBullets[0];
                const dodgeDir = new THREE.Vector3(
                    -bullet.velocity.y,
                    bullet.velocity.x,
                    0
                ).normalize();
                
                // Apply dodge impulse to position
                this.mesh.position.x += dodgeDir.x * this.speed * 2 * deltaTime;
                this.mesh.position.y += dodgeDir.y * this.speed * 2 * deltaTime;
                
                this.dodgeTimer = this.dodgeCooldown;
            }
        }
    }
    
    updateKamikaze(deltaTime) {
        // Always move toward player
        if (!this.game.player || !this.game.player.mesh) return;
        
        const playerPos = this.game.player.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(playerPos, this.mesh.position)
            .normalize();
        
        // Set velocity directly (Enemy class has velocity property)
        this.mesh.position.x += direction.x * this.speed * deltaTime;
        this.mesh.position.y += direction.y * this.speed * deltaTime;
        
        // Visual indicator - pulse faster as it gets closer
        const dist = this.mesh.position.distanceTo(playerPos);
        const pulseSpeed = 5 + (200 - Math.min(dist, 200)) / 20;
        const pulse = Math.sin(Date.now() * pulseSpeed / 1000) * 0.3 + 0.7;
        this.mesh.scale.setScalar(pulse);
    }
    
    fire() {
        if (this.enemyType === 'sprayer') {
            // Fire 3 bullets in a spread pattern
            this.fireSpread();
        } else if (this.enemyType === 'sniper') {
            // Fire single accurate bullet
            this.fireAccurate();
        } else if (this.enemyType !== 'kamikaze') {
            super.fire();
        }
    }
    
    fireSpread() {
        const playerPos = this.game.player.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(playerPos, this.mesh.position)
            .normalize();
        
        // Create 3 bullets with spread
        const spreadAngles = [-0.3, 0, 0.3]; // Radians
        
        spreadAngles.forEach(angleOffset => {
            const rotatedDir = direction.clone();
            const angle = Math.atan2(rotatedDir.y, rotatedDir.x) + angleOffset;
            rotatedDir.set(Math.cos(angle), Math.sin(angle), 0);
            
            const bullet = new Bullet(this.game, {
                position: this.mesh.position.clone(),
                velocity: rotatedDir.multiplyScalar(this.bulletSpeed),
                polarity: this.polarity,
                owner: 'enemy'
            });
            this.game.bullets.push(bullet);
        });
        
        if (this.game.audio) {
            this.game.audio.playShoot(this.polarity);
        }
    }
    
    fireAccurate() {
        // Check if player exists
        if (!this.game.player || !this.game.player.mesh || !this.game.player.velocity) {
            return;
        }
        
        // Predict player position
        const playerPos = this.game.player.mesh.position;
        const playerVel = this.game.player.velocity;
        const timeToHit = this.mesh.position.distanceTo(playerPos) / this.bulletSpeed;
        const predictedPos = playerPos.clone().add(playerVel.clone().multiplyScalar(timeToHit));
        
        const direction = new THREE.Vector3()
            .subVectors(predictedPos, this.mesh.position)
            .normalize();
        
        const bullet = new Bullet(this.game, {
            position: this.mesh.position.clone(),
            velocity: direction.multiplyScalar(this.bulletSpeed),
            polarity: this.polarity,
            owner: 'enemy'
        });
        this.game.bullets.push(bullet);
        
        if (this.game.audio) {
            this.game.audio.playShoot(this.polarity);
        }
    }
    
    createSniperVisual() {
        // Diamond shape for snipers
        this.mesh.geometry.dispose();
        const vertices = new Float32Array([
            0, this.visualRadius, 0,
            -this.visualRadius * 0.5, 0, 0,
            0, -this.visualRadius, 0,
            this.visualRadius * 0.5, 0, 0
        ]);
        this.mesh.geometry = new THREE.BufferGeometry();
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.mesh.geometry.setIndex([0, 1, 2, 2, 3, 0]);
    }
    
    createSprayerVisual() {
        // Star shape for sprayers
        this.mesh.geometry.dispose();
        const points = 5;
        const vertices = [];
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? this.visualRadius : this.visualRadius * 0.5;
            vertices.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
        }
        this.mesh.geometry = new THREE.BufferGeometry();
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        
        const indices = [];
        for (let i = 0; i < points * 2; i++) {
            indices.push(0, i, (i + 1) % (points * 2));
        }
        this.mesh.geometry.setIndex(indices);
    }
    
    createKamikazeVisual() {
        // Triangle pointing down
        this.mesh.geometry.dispose();
        const vertices = new Float32Array([
            0, this.visualRadius * 1.2, 0,
            -this.visualRadius * 0.7, -this.visualRadius * 0.6, 0,
            this.visualRadius * 0.7, -this.visualRadius * 0.6, 0
        ]);
        this.mesh.geometry = new THREE.BufferGeometry();
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.mesh.geometry.setIndex([0, 1, 2]);
    }
    
    createTankVisual() {
        // Square for tanks
        this.mesh.geometry.dispose();
        const r = this.visualRadius;
        const vertices = new Float32Array([
            -r, r, 0,
            r, r, 0,
            r, -r, 0,
            -r, -r, 0
        ]);
        this.mesh.geometry = new THREE.BufferGeometry();
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this.mesh.geometry.setIndex([0, 1, 2, 2, 3, 0]);
    }
    
    createDodgerVisual() {
        // Octagon for dodgers
        this.mesh.geometry.dispose();
        const sides = 8;
        const vertices = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides;
            vertices.push(
                Math.cos(angle) * this.visualRadius,
                Math.sin(angle) * this.visualRadius,
                0
            );
        }
        this.mesh.geometry = new THREE.BufferGeometry();
        this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        
        const indices = [];
        for (let i = 1; i < sides - 1; i++) {
            indices.push(0, i, i + 1);
        }
        this.mesh.geometry.setIndex(indices);
    }
}

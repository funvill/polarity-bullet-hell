import * as THREE from 'three';
import { Bullet } from './Bullet.js';

// Import enemy sprite textures
import enemySmallUrl from '../assets/enemy_small.png';
import enemyMediumUrl from '../assets/enemy_medium.png';
import enemyLargeUrl from '../assets/enemy_large.png';
import enemySmallDeadUrl from '../assets/enemy_small_dead.png';
import enemyMediumDeadUrl from '../assets/enemy_medium_dead.png';
import enemyLargeDeadUrl from '../assets/enemy_large_dead.png';

export class Enemy {
    constructor(game, config) {
        this.game = game;
        this.polarity = config.polarity || 'WHITE';
        this.hp = config.hp || 1;
        this.maxHp = this.hp;
        this.value = config.value || 100; // score value
        this.size = config.size || 'medium'; // small, medium, large
        this.radius = this.getRadiusFromSize(this.size);
        this.speed = config.speed || 50; // units per second
        
        // Movement pattern
        this.movementPattern = config.movementPattern || 'straight';
        this.direction = config.direction || new THREE.Vector3(0, -1, 0);
        this.target = config.target || null;
        this.spawnPosition = new THREE.Vector3(config.position.x, config.position.y, 0);
        this.timeAlive = 0;
        
        // Firing
        this.fireRate = config.fireRate || 1; // shots per second
        this.fireTimer = this.game.random.next() * (1 / this.fireRate); // Random initial delay
        this.fireInterval = 1 / this.fireRate;
        this.bulletSpeed = config.bulletSpeed || 100; // Bullet speed
        
        // Add slight randomness to fire interval for variety
        this.fireIntervalVariation = 0.9 + this.game.random.next() * 0.2; // 90% to 110%
        
        // Rotation tracking for smooth rotation towards target
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 3; // Radians per second - adjust for faster/slower rotation
        
        // Load texture
        this.textureLoader = new THREE.TextureLoader();
        this.texture = null;
        this.deadTexture = null;
        this.textureLoaded = false;
        this.deadTextureLoaded = false;
        
        this.loadTexture();
        this.loadDeadTexture();
        this.createMesh(config.position);
    }
    
    getRadiusFromSize(size) {
        switch (size) {
            case 'small': return 8;
            case 'medium': return 15;
            case 'large': return 25;
            default: return 15;
        }
    }
    
    getTextureUrlFromSize(size) {
        switch (size) {
            case 'small': return enemySmallUrl;
            case 'medium': return enemyMediumUrl;
            case 'large': return enemyLargeUrl;
            default: return enemyMediumUrl;
        }
    }
    
    getDeadTextureUrlFromSize(size) {
        switch (size) {
            case 'small': return enemySmallDeadUrl;
            case 'medium': return enemyMediumDeadUrl;
            case 'large': return enemyLargeDeadUrl;
            default: return enemyMediumDeadUrl;
        }
    }
    
    loadTexture() {
        const textureUrl = this.getTextureUrlFromSize(this.size);
        this.textureLoader.load(textureUrl, (texture) => {
            this.texture = texture;
            this.textureLoaded = true;
            this.updateSprite();
        });
    }
    
    loadDeadTexture() {
        const textureUrl = this.getDeadTextureUrlFromSize(this.size);
        this.textureLoader.load(textureUrl, (texture) => {
            this.deadTexture = texture;
            this.deadTextureLoaded = true;
        });
    }
    
    updateSprite() {
        if (!this.textureLoaded || !this.material) return;
        
        // Set texture
        this.material.map = this.texture;
        
        // Tint color based on polarity
        const baseColor = this.polarity === 'WHITE' ? 0xffffff : 0x333333;
        this.material.color.setHex(baseColor);
        
        this.material.needsUpdate = true;
    }
    
    createMesh(position) {
        // Create enemy sprite
        const material = new THREE.SpriteMaterial({
            map: null, // Will be set when texture loads
            color: this.polarity === 'WHITE' ? 0xffffff : 0x333333,
            transparent: true,
            opacity: 1.0
        });
        
        const sprite = new THREE.Sprite(material);
        const spriteSize = this.radius * 2;
        sprite.scale.set(spriteSize, spriteSize, 1);
        
        // Create container
        this.mesh = new THREE.Object3D();
        this.mesh.position.copy(position);
        this.mesh.add(sprite);
        
        this.sprite = sprite;
        this.material = material;
        
        this.game.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.timeAlive += deltaTime;
        
        // Update position based on movement pattern
        this.updateMovement(deltaTime);
        
        // Smoothly rotate sprite towards target rotation
        this.updateRotation(deltaTime);
        
        // Update firing
        this.fireTimer -= deltaTime;
        if (this.fireTimer <= 0) {
            this.fire();
            // Apply variation to next fire interval
            this.fireTimer = this.fireInterval * this.fireIntervalVariation;
            // Generate new variation for next time
            this.fireIntervalVariation = 0.9 + this.game.random.next() * 0.2;
        }
    }
    
    updateRotation(deltaTime) {
        // Calculate direction to player for target rotation
        if (this.game.player && this.game.player.mesh) {
            const direction = new THREE.Vector3();
            direction.subVectors(this.game.player.mesh.position, this.mesh.position);
            direction.normalize();
            
            // Calculate target angle
            this.targetRotation = Math.atan2(direction.x, direction.y);
        }
        
        // Smoothly interpolate current rotation towards target
        let rotationDiff = this.targetRotation - this.currentRotation;
        
        // Normalize angle difference to [-PI, PI]
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        // Apply rotation with speed limit
        const maxRotation = this.rotationSpeed * deltaTime;
        if (Math.abs(rotationDiff) < maxRotation) {
            this.currentRotation = this.targetRotation;
        } else {
            this.currentRotation += Math.sign(rotationDiff) * maxRotation;
        }
        
        // Apply rotation to sprite material
        if (this.material) {
            this.material.rotation = -this.currentRotation;
        }
    }
    
    updateMovement(deltaTime) {
        switch (this.movementPattern) {
            case 'straight':
                this.moveStraight(deltaTime);
                break;
            case 'sine':
                this.moveSine(deltaTime);
                break;
            case 'converge':
                this.moveConverge(deltaTime);
                break;
            case 'circular':
                this.moveCircular(deltaTime);
                break;
            case 'zigzag':
                this.moveZigzag(deltaTime);
                break;
            default:
                this.moveStraight(deltaTime);
        }
    }
    
    moveStraight(deltaTime) {
        // Move in a straight line in the given direction
        this.mesh.position.x += this.direction.x * this.speed * deltaTime;
        this.mesh.position.y += this.direction.y * this.speed * deltaTime;
    }
    
    moveSine(deltaTime) {
        // Move downward with a sine wave pattern
        this.mesh.position.y -= this.speed * deltaTime;
        this.mesh.position.x = this.spawnPosition.x + Math.sin(this.timeAlive * 3) * 80;
    }
    
    moveConverge(deltaTime) {
        // Move toward a target point (usually center)
        if (this.target) {
            const dx = this.target.x - this.mesh.position.x;
            const dy = this.target.y - this.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                this.mesh.position.x += (dx / distance) * this.speed * deltaTime;
                this.mesh.position.y += (dy / distance) * this.speed * deltaTime;
            }
        }
    }
    
    moveCircular(deltaTime) {
        // Move in a circular pattern around spawn point
        const radius = 100;
        const angle = this.timeAlive * 2;
        this.mesh.position.x = this.spawnPosition.x + Math.cos(angle) * radius;
        this.mesh.position.y = this.spawnPosition.y + Math.sin(angle) * radius;
    }
    
    moveZigzag(deltaTime) {
        // Move downward with zigzag pattern
        this.mesh.position.y -= this.speed * deltaTime;
        const zigzagSpeed = 100;
        const zigzagFrequency = 2;
        this.mesh.position.x = this.spawnPosition.x + 
            Math.sin(this.timeAlive * zigzagFrequency) * zigzagSpeed * (this.timeAlive * 0.5);
    }
    
    fire() {
        // Fire a bullet toward the player
        // Note: Rotation is handled smoothly in updateRotation()
        const direction = new THREE.Vector3();
        direction.subVectors(this.game.player.mesh.position, this.mesh.position);
        direction.normalize();
        direction.multiplyScalar(this.bulletSpeed);
        
        const bullet = new Bullet(this.game, {
            position: this.mesh.position.clone(),
            polarity: this.polarity,
            velocity: direction,
            owner: 'enemy',
            damage: 1
        });
        
        this.game.bullets.push(bullet);
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Enemy took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);
        
        // Visual feedback - flash
        const originalColor = this.material.color.getHex();
        this.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.material) {
                this.material.color.setHex(originalColor);
            }
        }, 50);
    }
    
    isDead() {
        return this.hp <= 0;
    }
    
    onDestroy() {
        // Normal enemies don't split - only bosses do
        // This method is here for compatibility but does nothing for normal enemies
    }
}

import * as THREE from 'three';
import { Bullet } from './Bullet.js';

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
        this.fireTimer = Math.random() * (1 / this.fireRate); // Random initial delay
        this.fireInterval = 1 / this.fireRate;
        this.bulletSpeed = config.bulletSpeed || 100; // Bullet speed
        
        // Add slight randomness to fire interval for variety
        this.fireIntervalVariation = 0.9 + Math.random() * 0.2; // 90% to 110%
        
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
    
    createMesh(position) {
        // Create enemy as a hexagon
        const geometry = new THREE.CircleGeometry(this.radius, 6);
        const color = this.polarity === 'WHITE' ? 0xeeeeee : 0x333333;
        this.material = new THREE.MeshBasicMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(position);
        
        // Add outline
        const outlineColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        const outlineGeometry = new THREE.EdgesGeometry(geometry);
        const outlineMaterial = new THREE.LineBasicMaterial({ 
            color: outlineColor,
            linewidth: 2
        });
        this.outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
        this.mesh.add(this.outline);
        
        this.game.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.timeAlive += deltaTime;
        
        // Update position based on movement pattern
        this.updateMovement(deltaTime);
        
        // Update firing
        this.fireTimer -= deltaTime;
        if (this.fireTimer <= 0) {
            this.fire();
            // Apply variation to next fire interval
            this.fireTimer = this.fireInterval * this.fireIntervalVariation;
            // Generate new variation for next time
            this.fireIntervalVariation = 0.9 + Math.random() * 0.2;
        }
        
        // Rotate slowly
        this.mesh.rotation.z += deltaTime * 0.5;
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
        // Fire a bullet downward toward player
        const bullet = new Bullet(this.game, {
            position: this.mesh.position.clone(),
            polarity: this.polarity,
            velocity: new THREE.Vector3(0, -this.bulletSpeed, 0), // Use enemy's bullet speed
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

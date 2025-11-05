import * as THREE from 'three';
import { Bullet } from './Bullet.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.polarity = 'WHITE'; // WHITE or BLACK
        this.speed = 150; // units per second
        this.hitboxRadius = 4;
        this.visualRadius = 8; // Reduced from 15 to 8 (just barely larger than hitbox)
        this.shieldRadius = this.visualRadius + 10; // Shield extends beyond ship
        
        // Velocity tracking for background scrolling
        this.velocity = { x: 0, y: 0 };
        
        // Invincibility
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 3; // 3 seconds
        this.blinkTimer = 0;
        this.blinkInterval = 0.1; // Blink every 100ms
        
        // Firing
        this.fireRate = 5; // Reduced from 10 to 5 shots per second
        this.fireTimer = 0;
        this.fireInterval = 1 / this.fireRate;
        
        this.createMesh();
        this.reset();
    }
    
    createMesh() {
        // Create ship as a triangle
        const shape = new THREE.Shape();
        const size = this.visualRadius;
        shape.moveTo(0, size);
        shape.lineTo(-size * 0.6, -size * 0.8);
        shape.lineTo(size * 0.6, -size * 0.8);
        shape.lineTo(0, size);
        
        const geometry = new THREE.ShapeGeometry(shape);
        this.material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.game.scene.add(this.mesh);
        
        // Create hitbox visualization (debug)
        const hitboxGeometry = new THREE.CircleGeometry(this.hitboxRadius, 16);
        const hitboxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.mesh.add(this.hitboxMesh);
        
        // Create polarity shield/ring
        this.createPolarityShield();
        
        // Create life indicator rings
        this.createLifeRings();
    }
    
    createLifeRings() {
        // Create 3 rings to represent lives (within the shield)
        this.lifeRings = [];
        // Shield is at visualRadius + 8 to visualRadius + 12
        // Place life rings inside the shield, closer to the ship
        const baseRadius = this.visualRadius + 2; // Start just outside the ship
        
        for (let i = 0; i < 3; i++) {
            const radius = baseRadius + (i * 2); // 2 units apart
            const ringGeometry = new THREE.RingGeometry(radius, radius + 1, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00, // Green
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            this.mesh.add(ring);
            this.lifeRings.push({
                mesh: ring,
                material: ringMaterial,
                baseRadius: radius
            });
        }
    }
    
    updateLifeRings() {
        // Show/hide rings based on current lives
        const lives = this.game.lives;
        for (let i = 0; i < this.lifeRings.length; i++) {
            this.lifeRings[i].mesh.visible = i < lives;
        }
    }
    
    createPolarityShield() {
        // Polarity shield removed per user request
        // Animation state
        this.shieldPulseTime = 0;
    }
    
    reset() {
        this.mesh.position.set(0, 0, 0); // Player always at center
        this.polarity = 'WHITE';
        this.updateColor();
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updateFiring(deltaTime);
        this.updateShieldAnimation(deltaTime);
        this.updateLifeRings();
        this.updateInvincibility(deltaTime);
    }
    
    updateInvincibility(deltaTime) {
        if (this.invincible) {
            this.invincibilityTimer -= deltaTime;
            this.blinkTimer += deltaTime;
            
            // Blink effect
            if (this.blinkTimer >= this.blinkInterval) {
                this.mesh.visible = !this.mesh.visible;
                this.blinkTimer = 0;
            }
            
            // End invincibility
            if (this.invincibilityTimer <= 0) {
                this.invincible = false;
                this.mesh.visible = true;
            }
        }
    }
    
    activateInvincibility() {
        this.invincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        this.blinkTimer = 0;
    }
    
    updateShieldAnimation(deltaTime) {
        // Shield animation removed per user request
        this.shieldPulseTime += deltaTime * 3;
    }
    
    handleInput(deltaTime) {
        // Movement - player visual stays at center, but we track velocity to move the world
        const movement = this.game.input.getMovementInput();
        
        // Update velocity for world movement
        this.velocity.x = movement.x * this.speed;
        this.velocity.y = movement.y * this.speed;
        
        // Player mesh NEVER moves - it stays at (0, 0)
        // The world moves around the player instead
        
        // Rotate ship to face mouse
        this.rotateTowardsMouse();
        
        // Polarity switch
        if (this.game.input.isPolaritySwitchPressed()) {
            this.switchPolarity();
        }
        
        // Special weapon
        if (this.game.input.isSpecialButtonPressed()) {
            this.useSpecialWeapon();
        }
    }
    
    rotateTowardsMouse() {
        // Get mouse position in screen space
        const mousePos = this.game.input.getMousePosition();
        
        // Convert mouse position to world space
        const worldPos = this.screenToWorld(mousePos.x, mousePos.y);
        
        // Calculate angle from ship to mouse
        const dx = worldPos.x - this.mesh.position.x;
        const dy = worldPos.y - this.mesh.position.y;
        const angle = Math.atan2(dx, dy);
        
        // Set ship rotation (ship points up by default, so no offset needed)
        this.mesh.rotation.z = -angle;
    }
    
    screenToWorld(screenX, screenY) {
        // Convert screen coordinates to normalized device coordinates (-1 to +1)
        const ndcX = (screenX / this.game.renderer.domElement.clientWidth) * 2 - 1;
        const ndcY = -(screenY / this.game.renderer.domElement.clientHeight) * 2 + 1;
        
        // Create a vector in NDC space at z=0 (camera plane)
        const vector = new THREE.Vector3(ndcX, ndcY, 0);
        
        // Unproject from camera space to world space
        vector.unproject(this.game.camera);
        
        return vector;
    }
    
    updateFiring(deltaTime) {
        this.fireTimer -= deltaTime;
        
        if (this.game.input.isFireButtonDown() && this.fireTimer <= 0) {
            this.fire();
            this.fireTimer = this.fireInterval;
        }
    }
    
    fire() {
        // Track shot fired
        this.game.stats.shotsFired++;
        
        // Calculate direction based on ship's rotation
        const angle = -this.mesh.rotation.z; // Negative because we inverted it in rotation
        const direction = new THREE.Vector3(
            Math.sin(angle),
            Math.cos(angle),
            0
        ).normalize();
        
        const bullet = new Bullet(this.game, {
            position: this.mesh.position.clone(),
            polarity: this.polarity,
            velocity: direction.multiplyScalar(300),
            owner: 'player',
            damage: 1
        });
        
        this.game.bullets.push(bullet);
        
        // Create muzzle flash
        this.createMuzzleFlash(direction);
        
        // Play shoot sound
        this.game.audio.playShoot(this.polarity);
    }
    
    createMuzzleFlash(direction) {
        // Create a small flash at gun tip
        const flashGeometry = new THREE.CircleGeometry(12, 8); // Increased from 8 to 12
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.polarity === 'WHITE' ? 0x00ffff : 0xff6600,
            transparent: true,
            opacity: 1.0 // Increased from 0.9 to 1.0
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position at ship front
        flash.position.copy(this.mesh.position);
        flash.position.x += direction.x * 20;
        flash.position.y += direction.y * 20;
        
        this.game.scene.add(flash);
        
        // Quick fade animation (4 frames instead of 3 for more visibility)
        let frames = 0;
        const animate = () => {
            frames++;
            flashMaterial.opacity -= 0.25; // Slower fade
            flash.scale.multiplyScalar(1.3); // Faster expansion from 1.2
            
            if (frames >= 4) { // Changed from 3 to 4
                this.game.scene.remove(flash);
                flashGeometry.dispose();
                flashMaterial.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    switchPolarity() {
        this.polarity = this.polarity === 'WHITE' ? 'BLACK' : 'WHITE';
        this.updateColor();
        console.log(`Polarity switched to ${this.polarity}`);
        
        // Play polarity switch sound
        this.game.audio.playPolaritySwitch();
        
        // Visual feedback - simple color flash
        this.createPolarityFlash();
    }
    
    createPolarityFlash() {
        // Create a brief expanding ring effect
        const ringGeometry = new THREE.RingGeometry(20, 25, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.polarity === 'WHITE' ? 0xffffff : 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.mesh.position);
        this.game.scene.add(ring);
        
        // Animate and remove
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            ring.scale.set(scale, scale, 1);
            ringMaterial.opacity -= 0.05;
            
            if (ringMaterial.opacity <= 0) {
                this.game.scene.remove(ring);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    updateColor() {
        const color = this.polarity === 'WHITE' ? 0xffffff : 0x000000;
        this.material.color.setHex(color);
        
        // Add a colored outline based on polarity
        if (this.outline) {
            this.mesh.remove(this.outline);
        }
        
        const outlineColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        const outlineGeometry = new THREE.EdgesGeometry(this.mesh.geometry);
        const outlineMaterial = new THREE.LineBasicMaterial({ 
            color: outlineColor,
            linewidth: 2
        });
        this.outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
        this.mesh.add(this.outline);
    }
    
    useSpecialWeapon() {
        if (this.game.energy < 100) {
            console.log('Not enough energy for special weapon');
            return;
        }
        
        console.log('POLARITY BOMB ACTIVATED!');
        
        // Play special weapon sound
        this.game.audio.playSpecialWeapon();
        
        // Convert all enemy bullets to player's polarity and absorb them
        let bulletsConverted = 0;
        for (let i = this.game.bullets.length - 1; i >= 0; i--) {
            const bullet = this.game.bullets[i];
            if (bullet.owner === 'enemy') {
                // Absorb the bullet for energy (capped at 100)
                // Create absorption effect
                const color = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
                const AbsorptionEffect = this.game.effects[0]?.constructor; // Get class reference
                if (AbsorptionEffect) {
                    const effect = new (require('../systems/ParticleEffects.js').AbsorptionEffect)(
                        this.game, 
                        bullet.mesh.position, 
                        color
                    );
                    this.game.effects.push(effect);
                }
                
                // Add score bonus
                this.game.addScore(10);
                bulletsConverted++;
                
                // Remove the bullet
                this.game.removeBullet(bullet);
            }
        }
        
        // Create screen-wide pulse effect
        this.createSpecialWeaponEffect();
        
        // Reset energy
        this.game.energy = 0;
        
        console.log(`Polarity Bomb: ${bulletsConverted} bullets converted!`);
    }
    
    createSpecialWeaponEffect() {
        // Create expanding ring from player
        const geometry = new THREE.RingGeometry(20, 30, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.polarity === 'WHITE' ? 0x00ffff : 0xff8800,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(this.mesh.position);
        this.game.scene.add(ring);
        
        // Animate expansion
        let scale = 1;
        const maxScale = 20;
        const animate = () => {
            scale += 0.5;
            ring.scale.set(scale, scale, 1);
            material.opacity -= 0.03;
            
            if (material.opacity <= 0 || scale >= maxScale) {
                this.game.scene.remove(ring);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    isDead() {
        return false; // Player doesn't get removed, just loses lives
    }
}

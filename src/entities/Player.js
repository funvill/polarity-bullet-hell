import * as THREE from 'three';
import { Bullet } from './Bullet.js';
import playerSpriteUrl from '../assets/player.png';

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
        this.invincibilityDuration = 1; // 1 second
        this.blinkTimer = 0;
        this.blinkInterval = 0.1; // Blink every 100ms
        
        // Firing
        this.fireRate = 5; // Reduced from 10 to 5 shots per second
        this.fireTimer = 0;
        this.fireInterval = 1 / this.fireRate;
        
        // Load texture
        this.textureLoader = new THREE.TextureLoader();
        this.shipTexture = null;
        this.textureLoaded = false;
        
        this.loadTexture();
        this.createMesh();
        this.reset();
    }
    
    loadTexture() {
        // Load player sprite texture (will be tinted for black polarity)
        this.textureLoader.load(playerSpriteUrl, (texture) => {
            this.shipTexture = texture;
            this.textureLoaded = true;
            this.updateSpriteTexture();
            console.log('Player texture loaded successfully');
        });
    }
    
    createMesh() {
        // Create sprite for player ship using texture
        const material = new THREE.SpriteMaterial({
            map: null, // Will be set when texture loads
            color: 0xffffff, // Start with white, will be tinted based on polarity
            transparent: true,
            opacity: 1.0,
            rotation: 0 // Sprite rotation (will be updated to face mouse)
        });
        
        this.sprite = new THREE.Sprite(material);
        // Scale sprite to match visualRadius (diameter = 2 * radius)
        const spriteSize = this.visualRadius * 2;
        this.sprite.scale.set(spriteSize, spriteSize, 1);
        
        // Create a container for the sprite and other elements
        this.mesh = new THREE.Object3D();
        this.mesh.add(this.sprite);
        this.game.scene.add(this.mesh);
        
        // Store reference to sprite material for updates
        this.material = material;
        
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
        // Create shield ring that shows shield energy level
        const ringGeometry = new THREE.RingGeometry(this.shieldRadius - 2, this.shieldRadius, 32);
        this.shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan for white/shields
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.shieldRing = new THREE.Mesh(ringGeometry, this.shieldMaterial);
        this.mesh.add(this.shieldRing);
        
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
        // Update shield opacity based on energy level
        if (this.shieldRing) {
            const energyPercent = this.game.whiteEnergy / 100;
            
            // Opacity varies with energy (0.3 to 0.8)
            const baseOpacity = 0.3 + (energyPercent * 0.5);
            
            // Add pulse effect
            this.shieldPulseTime += deltaTime * 2;
            const pulse = Math.sin(this.shieldPulseTime) * 0.1;
            
            this.shieldMaterial.opacity = baseOpacity + pulse;
            
            // Color shifts from red (low) to cyan (high)
            if (energyPercent < 0.3) {
                // Low energy - red warning
                this.shieldMaterial.color.setHex(0xff0000);
            } else if (energyPercent < 0.6) {
                // Medium energy - yellow
                this.shieldMaterial.color.setHex(0xffff00);
            } else {
                // High energy - cyan
                this.shieldMaterial.color.setHex(0x00ffff);
            }
        }
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
        
        // Update sprite rotation to match (sprites need rotation set on material)
        if (this.material) {
            this.material.rotation = -angle;
        }
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
    
    updateSpriteTexture() {
        // Update sprite texture and color based on polarity
        if (!this.textureLoaded || !this.material) return;
        
        // Set texture
        this.material.map = this.shipTexture;
        
        // Tint color based on polarity
        if (this.polarity === 'WHITE') {
            this.material.color.setHex(0xffffff); // White - no tint
        } else {
            this.material.color.setHex(0x333333); // Dark gray/black tint
        }
        
        this.material.needsUpdate = true;
    }
    
    updateColor() {
        // Update sprite texture and color tint
        this.updateSpriteTexture();
    }
    
    useSpecialWeapon() {
        console.log(`Special weapon triggered! Black Energy: ${this.game.blackEnergy}`);
        
        if (this.game.blackEnergy < 100) {
            console.log('Not enough energy for special weapon (need 100)');
            return;
        }
        
        console.log('POLARITY BOMB ACTIVATED!');
        
        // Consume black energy FIRST to prevent multiple activations
        this.game.blackEnergy = 0;
        
        // Play special weapon sound
        if (this.game.audio) {
            this.game.audio.playSpecialWeapon();
        }
        
        // Convert all enemy bullets and remove them
        let bulletsConverted = 0;
        for (let i = this.game.bullets.length - 1; i >= 0; i--) {
            const bullet = this.game.bullets[i];
            if (bullet.owner === 'enemy') {
                // Create simple particle effect at bullet position
                this.createAbsorptionParticle(bullet.mesh.position);
                
                // Add score bonus
                this.game.addScore(10);
                bulletsConverted++;
                
                // Remove the bullet
                this.game.removeBullet(bullet);
            }
        }
        
        // Create screen-wide pulse effect
        this.createSpecialWeaponEffect();
        
        console.log(`Polarity Bomb: ${bulletsConverted} bullets converted!`);
    }
    
    createAbsorptionParticle(position) {
        // Create a small expanding circle at the bullet position
        const geometry = new THREE.CircleGeometry(5, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.polarity === 'WHITE' ? 0x00ffff : 0xff8800,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        this.game.scene.add(particle);
        
        // Animate and remove
        let scale = 1;
        const animate = () => {
            scale += 0.2;
            particle.scale.setScalar(scale);
            material.opacity -= 0.15;
            
            if (material.opacity <= 0) {
                this.game.scene.remove(particle);
                geometry.dispose();
                material.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
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

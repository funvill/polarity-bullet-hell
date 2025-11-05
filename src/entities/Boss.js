import * as THREE from 'three';
import { Bullet } from './Bullet.js';

export class Boss {
    constructor(game, config) {
        this.game = game;
        this.polarity = config.polarity || 'WHITE';
        this.maxHp = config.hp || 100;
        this.hp = this.maxHp;
        this.value = config.value || 5000;
        this.radius = 40; // Larger than normal enemies
        
        // Movement
        this.speed = 30;
        this.position = new THREE.Vector3(config.x || 0, config.y || 200, 0);
        this.targetX = 0;
        this.timeAlive = 0;
        
        // Phase system
        this.currentPhase = 1;
        this.maxPhases = 3;
        
        // Attack patterns
        this.attackTimer = 0;
        this.attackInterval = 2.0; // 2 seconds between attacks
        this.currentAttack = 'spiral';
        
        this.createMesh();
    }
    
    createMesh() {
        // Create boss as a larger, more complex shape
        const geometry = new THREE.CircleGeometry(this.radius, 8);
        const color = this.polarity === 'WHITE' ? 0xeeeeee : 0x333333;
        this.material = new THREE.MeshBasicMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // Add multiple outline rings for boss look
        const outlineColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        
        this.outlineRings = []; // Store ring references for color updates
        for (let i = 0; i < 3; i++) {
            const ringRadius = this.radius + (i * 4);
            const outlineGeometry = new THREE.RingGeometry(ringRadius, ringRadius + 2, 8);
            const outlineMaterial = new THREE.LineBasicMaterial({ 
                color: outlineColor,
                transparent: true,
                opacity: 0.8 - (i * 0.2)
            });
            const ring = new THREE.Mesh(outlineGeometry, outlineMaterial);
            this.mesh.add(ring);
            this.outlineRings.push({ mesh: ring, material: outlineMaterial });
        }
        
        // Add core glow
        const glowGeometry = new THREE.CircleGeometry(this.radius * 0.5, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: 0.6
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMaterial = glowMaterial; // Store reference for color updates
        this.mesh.add(this.glow);
        
        // Create health bar
        this.createHealthBar();
        
        this.game.scene.add(this.mesh);
    }
    
    createHealthBar() {
        // Health bar background
        const barWidth = 80;
        const barHeight = 6;
        const barGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBarBg.position.y = this.radius + 15;
        this.mesh.add(this.healthBarBg);
        
        // Health bar fill
        const fillGeometry = new THREE.PlaneGeometry(barWidth - 2, barHeight - 2);
        const fillMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
        this.healthBarFill.position.z = 0.1;
        this.healthBarBg.add(this.healthBarFill);
    }
    
    update(deltaTime) {
        this.timeAlive += deltaTime;
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update attacks
        this.attackTimer -= deltaTime;
        if (this.attackTimer <= 0) {
            this.executeAttack();
            this.attackTimer = this.attackInterval;
        }
        
        // Rotate slowly for effect
        this.mesh.rotation.z += deltaTime * 0.3;
        
        // Pulse glow
        if (this.glow) {
            const pulse = Math.sin(this.timeAlive * 3) * 0.2 + 0.8;
            this.glow.scale.set(pulse, pulse, 1);
        }
        
        // Update health bar
        this.updateHealthBar();
        
        // Check for phase transition
        this.checkPhaseTransition();
    }
    
    updateMovement(deltaTime) {
        // Boss moves side to side at the top of the screen
        const amplitude = 150;
        const frequency = 0.5;
        this.targetX = Math.sin(this.timeAlive * frequency) * amplitude;
        
        // Smooth movement towards target
        const dx = this.targetX - this.mesh.position.x;
        this.mesh.position.x += dx * deltaTime * 2;
        
        // Keep at top third of play area
        const targetY = this.game.playArea.top - 100;
        const dy = targetY - this.mesh.position.y;
        this.mesh.position.y += dy * deltaTime * 1.5;
    }
    
    executeAttack() {
        // Choose attack based on phase using seeded random
        const attacks = this.getAttacksForPhase();
        this.currentAttack = this.game.random.choose(attacks);
        
        console.log(`Boss executing attack: ${this.currentAttack}`);
        
        // Show telegraph before attack
        this.showAttackTelegraph();
        
        // Delay the actual attack by 0.5 seconds
        setTimeout(() => {
            if (this.isDead()) return; // Don't attack if boss died during telegraph
            
            switch(this.currentAttack) {
                case 'spiral':
                    this.attackSpiral();
                    break;
                case 'burst':
                    this.attackBurst();
                    break;
                case 'aimed':
                    this.attackAimed();
                    break;
                case 'wave':
                    this.attackWave();
                    break;
                case 'ring':
                    this.attackRing();
                    break;
            }
        }, 500);
    }
    
    showAttackTelegraph() {
        // Create a visual warning ring that expands and fades
        const ringGeometry = new THREE.RingGeometry(40, 45, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.mesh.position);
        
        this.game.scene.add(ring);
        
        // Animate the telegraph
        const startTime = Date.now();
        const duration = 500; // 0.5 seconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Expand and pulse
                const scale = 1 + progress * 0.5;
                ring.scale.set(scale, scale, 1);
                ringMaterial.opacity = 0.8 * (1 - progress);
                
                // Pulse effect
                const pulse = Math.sin(progress * Math.PI * 4) * 0.2 + 1;
                ring.rotation.z += 0.1;
                
                requestAnimationFrame(animate);
            } else {
                // Clean up
                this.game.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
            }
        };
        animate();
        
        // Play warning sound
        if (this.game.audio) {
            this.game.audio.playBossWarning();
        }
    }
    
    getAttacksForPhase() {
        if (this.currentPhase === 1) {
            return ['spiral', 'burst'];
        } else if (this.currentPhase === 2) {
            return ['spiral', 'burst', 'aimed'];
        } else {
            return ['spiral', 'burst', 'aimed', 'wave', 'ring'];
        }
    }
    
    attackSpiral() {
        // Fire bullets in a spiral pattern
        const bulletCount = 8;
        const rotationOffset = this.timeAlive * 2;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 * i / bulletCount) + rotationOffset;
            const direction = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).normalize();
            
            this.fireBullet(direction, 120);
        }
    }
    
    attackBurst() {
        // Fire a burst of bullets in multiple directions
        const bulletCount = 16;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.PI * 2 * i / bulletCount;
            const direction = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).normalize();
            
            this.fireBullet(direction, 100);
        }
    }
    
    attackAimed() {
        // Fire bullets aimed at the player
        const bulletCount = 5;
        const spreadAngle = Math.PI / 6; // 30 degrees spread
        
        const playerPos = this.game.player.mesh.position;
        const directionToPlayer = new THREE.Vector3()
            .subVectors(playerPos, this.mesh.position)
            .normalize();
        
        const baseAngle = Math.atan2(directionToPlayer.y, directionToPlayer.x);
        
        for (let i = 0; i < bulletCount; i++) {
            const offset = (i - (bulletCount - 1) / 2) * (spreadAngle / bulletCount);
            const angle = baseAngle + offset;
            const direction = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).normalize();
            
            this.fireBullet(direction, 150);
        }
    }
    
    attackWave() {
        // Fire a wave pattern of bullets
        const bulletCount = 12;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.PI / 2 + (Math.sin(i * 0.5) * 0.5);
            const direction = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).normalize();
            
            this.fireBullet(direction, 110);
        }
    }
    
    attackRing() {
        // Fire concentric rings of bullets
        const rings = 3;
        const bulletsPerRing = 12;
        
        for (let ring = 0; ring < rings; ring++) {
            setTimeout(() => {
                for (let i = 0; i < bulletsPerRing; i++) {
                    const angle = Math.PI * 2 * i / bulletsPerRing;
                    const direction = new THREE.Vector3(
                        Math.cos(angle),
                        Math.sin(angle),
                        0
                    ).normalize();
                    
                    this.fireBullet(direction, 90 + ring * 10);
                }
            }, ring * 200);
        }
    }
    
    fireBullet(direction, speed) {
        const bullet = new Bullet(this.game, {
            position: this.mesh.position.clone(),
            polarity: this.polarity,
            velocity: direction.multiplyScalar(speed),
            owner: 'enemy',
            damage: 1
        });
        
        this.game.bullets.push(bullet);
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Boss took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);
        
        // Visual feedback - flash
        const originalColor = this.material.color.getHex();
        this.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.material) {
                this.material.color.setHex(originalColor);
            }
        }, 50);
        
        // Screen shake on hit
        if (this.game.cameraShake) {
            this.game.cameraShake(3);
        }
    }
    
    updateHealthBar() {
        if (!this.healthBarFill) return;
        
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        this.healthBarFill.scale.x = healthPercent;
        this.healthBarFill.position.x = -(1 - healthPercent) * (78 / 2);
        
        // Change color based on health
        if (healthPercent > 0.6) {
            this.healthBarFill.material.color.setHex(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBarFill.material.color.setHex(0xffff00);
        } else {
            this.healthBarFill.material.color.setHex(0xff0000);
        }
    }
    
    checkPhaseTransition() {
        const healthPercent = this.hp / this.maxHp;
        
        if (this.currentPhase === 1 && healthPercent <= 0.66) {
            this.enterPhase(2);
        } else if (this.currentPhase === 2 && healthPercent <= 0.33) {
            this.enterPhase(3);
        }
    }
    
    enterPhase(phase) {
        this.currentPhase = phase;
        console.log(`Boss entering phase ${phase}`);
        
        // Increase attack frequency
        this.attackInterval = Math.max(1.0, 2.0 - (phase - 1) * 0.4);
        
        // Visual feedback for phase change
        this.createPhaseTransitionEffect();
        
        // Switch polarity on phase change
        this.polarity = this.polarity === 'WHITE' ? 'BLACK' : 'WHITE';
        this.updateColor();
    }
    
    createPhaseTransitionEffect() {
        // Create expanding ring effect
        const ringGeometry = new THREE.RingGeometry(this.radius, this.radius + 5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.mesh.position);
        this.game.scene.add(ring);
        
        let scale = 1;
        const animate = () => {
            scale += 0.2;
            ring.scale.set(scale, scale, 1);
            ringMaterial.opacity -= 0.02;
            
            if (ringMaterial.opacity <= 0) {
                this.game.scene.remove(ring);
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    updateColor() {
        // Update main body color
        const color = this.polarity === 'WHITE' ? 0xeeeeee : 0x333333;
        this.material.color.setHex(color);
        
        // Update outline rings and glow color to match polarity
        const outlineColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        
        // Update all outline rings
        if (this.outlineRings) {
            for (const ring of this.outlineRings) {
                ring.material.color.setHex(outlineColor);
            }
        }
        
        // Update glow
        if (this.glowMaterial) {
            this.glowMaterial.color.setHex(outlineColor);
        }
        
        console.log(`Boss polarity switched to ${this.polarity} with color update`);
    }
    
    isDead() {
        return this.hp <= 0;
    }
    
    onDestroy() {
        console.log('Boss defeated!');
        
        // Create massive explosion
        if (this.game.createExplosion) {
            this.game.createExplosion(this.mesh.position, this.polarity, 'large');
        }
        
        // Award bonus score
        this.game.addScore(this.value);
        
        // Screen shake
        if (this.game.cameraShake) {
            this.game.cameraShake(15);
        }
        
        // Spawn smaller enemies as the boss "breaks apart"
        this.spawnDebris();
    }
    
    spawnDebris() {
        // Spawn 4-6 normal enemies as debris using seeded random
        const debrisCount = 4 + this.game.random.nextInt(0, 2);
        
        for (let i = 0; i < debrisCount; i++) {
            const angle = (Math.PI * 2 * i / debrisCount) + this.game.random.nextFloat(0, 0.5);
            const speed = 80 + this.game.random.nextFloat(0, 40);
            
            const direction = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            ).normalize();
            
            // Create debris enemy - force small size
            this.game.spawnSystem.createEnemy({
                x: this.mesh.position.x,
                y: this.mesh.position.y,
                polarity: this.polarity,
                size: 'small',
                movementPattern: 'straight',
                direction: direction
            });
        }
        
        console.log(`Boss spawned ${debrisCount} debris enemies`);
    }
}

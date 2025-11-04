import * as THREE from 'three';

export const PowerUpTypes = {
    SHIELD: 'shield',
    RAPID_FIRE: 'rapid_fire',
    ENERGY: 'energy',
    SCORE_MULTIPLIER: 'score_multiplier'
};

export class PowerUp {
    constructor(game, config) {
        this.game = game;
        this.type = config.type || PowerUpTypes.ENERGY;
        this.position = new THREE.Vector3(config.x, config.y, 0);
        this.radius = 12;
        this.speed = 50; // Fall speed
        this.lifetime = 10; // Seconds before disappearing
        this.age = 0;
        
        // Visual properties
        this.pulseTime = 0;
        
        this.createMesh();
    }
    
    createMesh() {
        // Create different shapes/colors for different power-ups
        const colors = {
            [PowerUpTypes.SHIELD]: 0x00ffff,      // Cyan
            [PowerUpTypes.RAPID_FIRE]: 0xff0000,   // Red
            [PowerUpTypes.ENERGY]: 0xffff00,       // Yellow
            [PowerUpTypes.SCORE_MULTIPLIER]: 0xff00ff // Magenta
        };
        
        const shapes = {
            [PowerUpTypes.SHIELD]: new THREE.CircleGeometry(this.radius, 32),
            [PowerUpTypes.RAPID_FIRE]: new THREE.CircleGeometry(this.radius, 3),
            [PowerUpTypes.ENERGY]: new THREE.CircleGeometry(this.radius, 4),
            [PowerUpTypes.SCORE_MULTIPLIER]: new THREE.CircleGeometry(this.radius, 5)
        };
        
        const geometry = shapes[this.type];
        this.material = new THREE.MeshBasicMaterial({
            color: colors[this.type],
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        this.game.scene.add(this.mesh);
        
        // Add glow ring
        const ringGeometry = new THREE.RingGeometry(this.radius + 2, this.radius + 5, 32);
        this.glowMaterial = new THREE.MeshBasicMaterial({
            color: colors[this.type],
            transparent: true,
            opacity: 0.4
        });
        this.glowRing = new THREE.Mesh(ringGeometry, this.glowMaterial);
        this.mesh.add(this.glowRing);
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        // Move downward
        this.mesh.position.y -= this.speed * deltaTime;
        
        // Pulse animation
        this.pulseTime += deltaTime * 3;
        const pulse = Math.sin(this.pulseTime) * 0.2 + 1;
        this.mesh.scale.set(pulse, pulse, 1);
        
        // Rotate
        this.mesh.rotation.z += deltaTime * 2;
        
        // Fade out when nearing end of life
        if (this.age > this.lifetime - 2) {
            const fadeAlpha = (this.lifetime - this.age) / 2;
            this.material.opacity = 0.8 * fadeAlpha;
            this.glowMaterial.opacity = 0.4 * fadeAlpha;
        }
        
        return this.age >= this.lifetime;
    }
    
    collect(player) {
        switch (this.type) {
            case PowerUpTypes.SHIELD:
                // Grant temporary invincibility or extra life
                if (this.game.lives < 5) {
                    this.game.lives++;
                    console.log('Extra life! Lives:', this.game.lives);
                }
                break;
                
            case PowerUpTypes.RAPID_FIRE:
                // Increase fire rate temporarily
                const originalFireRate = player.fireRate;
                player.fireRate *= 2;
                console.log('Rapid fire activated!');
                
                setTimeout(() => {
                    player.fireRate = originalFireRate;
                    console.log('Rapid fire ended');
                }, 5000); // 5 seconds
                break;
                
            case PowerUpTypes.ENERGY:
                // Add energy
                this.game.energy = Math.min(100, this.game.energy + 30);
                console.log('Energy boost! Energy:', this.game.energy);
                break;
                
            case PowerUpTypes.SCORE_MULTIPLIER:
                // Temporary score multiplier (could enhance ChainSystem)
                this.game.score += 500;
                console.log('Score bonus! +500');
                break;
        }
        
        // Create collection effect
        this.createCollectionEffect();
    }
    
    createCollectionEffect() {
        // Simple flash effect
        const flashGeometry = new THREE.CircleGeometry(this.radius * 2, 32);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.material.color,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(this.mesh.position);
        this.game.scene.add(flash);
        
        let scale = 1;
        const animate = () => {
            scale += 0.15;
            flash.scale.set(scale, scale, 1);
            flashMaterial.opacity -= 0.08;
            
            if (flashMaterial.opacity <= 0) {
                this.game.scene.remove(flash);
                flashGeometry.dispose();
                flashMaterial.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    destroy() {
        if (this.mesh && this.mesh.parent) {
            this.game.scene.remove(this.mesh);
        }
        if (this.material) {
            this.material.dispose();
        }
        if (this.glowMaterial) {
            this.glowMaterial.dispose();
        }
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
    }
    
    isDead() {
        return this.age >= this.lifetime;
    }
}

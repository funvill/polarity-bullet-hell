import * as THREE from 'three';

export class ParticleEffect {
    constructor(game, config) {
        this.game = game;
        this.position = config.position.clone();
        this.color = config.color || 0xffffff;
        this.particleCount = config.particleCount || 10;
        this.lifetime = config.lifetime || 0.8; // Increased from 0.5 to 0.8
        this.speed = config.speed || 100;
        this.size = config.size || 3;
        this.age = 0;
        
        this.particles = [];
        this.createParticles();
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (i / this.particleCount) * Math.PI * 2;
            const speedVariation = 0.5 + Math.random() * 0.5;
            
            const particle = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * this.speed * speedVariation,
                    Math.sin(angle) * this.speed * speedVariation,
                    0
                ),
                mesh: this.createParticleMesh()
            };
            
            particle.mesh.position.copy(this.position);
            this.game.scene.add(particle.mesh);
            this.particles.push(particle);
        }
    }
    
    createParticleMesh() {
        const geometry = new THREE.CircleGeometry(this.size, 6);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1
        });
        return new THREE.Mesh(geometry, material);
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        const progress = this.age / this.lifetime;
        
        for (const particle of this.particles) {
            // Update position
            particle.mesh.position.x += particle.velocity.x * deltaTime;
            particle.mesh.position.y += particle.velocity.y * deltaTime;
            
            // Fade out
            particle.mesh.material.opacity = 1 - progress;
            
            // Shrink
            const scale = 1 - progress;
            particle.mesh.scale.set(scale, scale, 1);
        }
        
        return this.age >= this.lifetime;
    }
    
    destroy() {
        for (const particle of this.particles) {
            this.game.scene.remove(particle.mesh);
        }
        this.particles = [];
    }
}

export class ExplosionEffect {
    constructor(game, position, color, size = 'medium') {
        this.game = game;
        this.position = position.clone();
        this.color = color || 0xffffff;
        this.size = size;
        this.age = 0;
        this.lifetime = 0.5; // Increased from 0.3 to 0.5
        
        // Scale parameters based on size
        this.ringInner = size === 'large' ? 10 : size === 'medium' ? 5 : 3;
        this.ringOuter = size === 'large' ? 16 : size === 'medium' ? 8 : 5;
        this.flashRadius = size === 'large' ? 30 : size === 'medium' ? 15 : 10;
        this.maxScale = size === 'large' ? 3 : size === 'medium' ? 2 : 1.5;
        
        this.createExplosion();
    }
    
    createExplosion() {
        // Create expanding ring
        const geometry = new THREE.RingGeometry(this.ringInner, this.ringOuter, 16);
        this.material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        this.game.scene.add(this.mesh);
        
        // Create flash
        const flashGeometry = new THREE.CircleGeometry(this.flashRadius, 16);
        this.flashMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.flash = new THREE.Mesh(flashGeometry, this.flashMaterial);
        this.flash.position.copy(this.position);
        this.game.scene.add(this.flash);
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        const progress = this.age / this.lifetime;
        
        // Expand ring - scale by size
        const scale = 1 + progress * this.maxScale;
        this.mesh.scale.set(scale, scale, 1);
        this.material.opacity = 1 - progress;
        
        // Fade flash
        this.flashMaterial.opacity = 0.8 * (1 - progress);
        this.flash.scale.set(1 + progress * 0.5, 1 + progress * 0.5, 1);
        
        return this.age >= this.lifetime;
    }
    
    destroy() {
        this.game.scene.remove(this.mesh);
        this.game.scene.remove(this.flash);
    }
}

export class AbsorptionEffect {
    constructor(game, position, color) {
        this.game = game;
        this.position = position.clone();
        this.color = color;
        this.age = 0;
        this.lifetime = 0.2;
        
        this.createEffect();
    }
    
    createEffect() {
        // Create converging particles
        const geometry = new THREE.CircleGeometry(2, 6);
        this.material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(this.position);
        this.game.scene.add(this.mesh);
        
        // Create a brief glow
        const glowGeometry = new THREE.CircleGeometry(8, 16);
        this.glowMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        this.glow = new THREE.Mesh(glowGeometry, this.glowMaterial);
        this.glow.position.copy(this.position);
        this.game.scene.add(this.glow);
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        const progress = this.age / this.lifetime;
        
        // Shrink to center
        const scale = 1 - progress;
        this.mesh.scale.set(scale, scale, 1);
        this.material.opacity = 1 - progress;
        
        // Fade glow
        this.glowMaterial.opacity = 0.6 * (1 - progress);
        
        return this.age >= this.lifetime;
    }
    
    destroy() {
        this.game.scene.remove(this.mesh);
        this.game.scene.remove(this.glow);
    }
}

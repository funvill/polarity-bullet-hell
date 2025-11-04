import * as THREE from 'three';

export class Bullet {
    constructor(game, config) {
        this.game = game;
        this.polarity = config.polarity; // WHITE or BLACK
        this.velocity = config.velocity || new THREE.Vector3(0, 1, 0);
        this.owner = config.owner || 'player'; // 'player' or 'enemy'
        this.damage = config.damage || 1;
        this.radius = this.owner === 'player' ? 4 : 3; // Increased player bullets from 3 to 4
        
        // Trail system
        this.trailPositions = [];
        this.maxTrailLength = 8;
        this.trailTimer = 0;
        this.trailInterval = 0.02; // Add trail point every 20ms
        
        this.createMesh(config.position);
    }
    
    createMesh(position) {
        const geometry = new THREE.CircleGeometry(this.radius, 8);
        const color = this.polarity === 'WHITE' ? 0xffffff : 0x222222;
        
        // Player bullets get emissive glow
        const material = this.owner === 'player' 
            ? new THREE.MeshBasicMaterial({ 
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            })
            : new THREE.MeshBasicMaterial({ 
                color: color,
                side: THREE.DoubleSide
            });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // Add a subtle glow/outline
        const outlineColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff8800;
        const glowIntensity = this.owner === 'player' ? 0.9 : 0.6; // Increased from 0.8
        const glowSize = this.owner === 'player' ? 3 : 1.5; // Increased from 2 to 3
        
        const outlineGeometry = new THREE.RingGeometry(this.radius, this.radius + glowSize, 8);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: glowIntensity,
            side: THREE.DoubleSide
        });
        this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this.mesh.add(this.outline);
        
        this.game.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // Update position based on velocity
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        
        // Optional: rotate the bullet for visual effect
        this.mesh.rotation.z += deltaTime * 2;
        
        // Pulse the glow for player bullets
        if (this.owner === 'player' && this.outline) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            this.outline.material.opacity = pulse;
        }
        
        // Update trail
        this.trailTimer += deltaTime;
        if (this.trailTimer >= this.trailInterval) {
            this.addTrailPoint();
            this.trailTimer = 0;
        }
    }
    
    addTrailPoint() {
        // Add current position to trail
        const trailPoint = {
            position: this.mesh.position.clone(),
            age: 0,
            maxAge: 0.3 // Trail fades over 300ms
        };
        
        this.trailPositions.push(trailPoint);
        
        // Limit trail length
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Create visual trail particle
        if (this.owner === 'player') {
            this.createTrailParticle(trailPoint.position);
        }
    }
    
    createTrailParticle(position) {
        const particleGeometry = new THREE.CircleGeometry(this.radius * 0.6, 6);
        const particleColor = this.polarity === 'WHITE' ? 0x00ffff : 0xff6600;
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: particleColor,
            transparent: true,
            opacity: 0.5
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        
        this.game.scene.add(particle);
        
        // Fade out particle
        const startTime = Date.now();
        const duration = 200; // 200ms lifetime
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                particleMaterial.opacity = 0.5 * (1 - progress);
                particle.scale.multiplyScalar(0.95);
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(particle);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };
        animate();
    }
}

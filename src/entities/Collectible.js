import * as THREE from 'three';

export class Collectible {
    constructor(game, position, value = 1) {
        this.game = game;
        this.value = value; // Money value
        this.attractionRadius = 80; // Distance at which it's attracted to player
        this.collectionRadius = 15; // Distance at which it's collected
        this.attractionSpeed = 180; // Speed when moving toward player (20% faster than player's 150)
        this.isAttracted = false;
        
        // Rotation for visual effect - different speeds on each axis for more dynamic spin
        this.rotationSpeedX = 3;
        this.rotationSpeedY = 2.5;
        this.rotationSpeedZ = 2;
        
        this.createMesh(position);
    }
    
    createMesh(position) {
        // Create glowing cube - LARGER SIZE
        const size = 8; // Increased from 3 to 8
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Yellow/gold color for money
        const material = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.game.scene.add(this.mesh);
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(size * 1.4, size * 1.4, size * 1.4);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.4
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);
    }
    
    update(deltaTime) {
        // Rotate for visual effect - spin on all three axes
        this.mesh.rotation.x += this.rotationSpeedX * deltaTime;
        this.mesh.rotation.y += this.rotationSpeedY * deltaTime;
        this.mesh.rotation.z += this.rotationSpeedZ * deltaTime;
        
        // Pulse glow
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.3;
        this.glow.material.opacity = pulse;
        
        // Check distance to player
        const dx = this.game.player.mesh.position.x - this.mesh.position.x;
        const dy = this.game.player.mesh.position.y - this.mesh.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Attract to player if close enough
        if (distance < this.attractionRadius) {
            this.isAttracted = true;
        }
        
        // Move toward player if attracted
        if (this.isAttracted) {
            const angle = Math.atan2(dy, dx);
            const moveSpeed = this.attractionSpeed * deltaTime;
            
            this.mesh.position.x += Math.cos(angle) * moveSpeed;
            this.mesh.position.y += Math.sin(angle) * moveSpeed;
        }
        
        // Check if collected
        if (distance < this.collectionRadius) {
            return true; // Signal for collection
        }
        
        return false;
    }
    
    destroy() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            if (this.glow) {
                this.glow.geometry.dispose();
                this.glow.material.dispose();
            }
        }
    }
}

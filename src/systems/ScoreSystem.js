import * as THREE from 'three';

export class ScorePopup {
    constructor(game, position, score, color = 0xffff00) {
        this.game = game;
        this.score = score;
        this.lifetime = 1.5; // seconds - increased for animation to score
        this.age = 0;
        
        // Create text sprite - 3x larger
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Increased from 256
        canvas.height = 192; // Increased from 64
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 120px Arial'; // Increased from 40px
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`+${score}`, 256, 96); // Adjusted positions
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(150, 37.5, 1); // 3x larger (was 50, 12.5)
        this.sprite.position.copy(position);
        
        this.game.scene.add(this.sprite);
        
        // Animation properties
        this.startPosition = position.clone();
        
        // Target is top-left of screen (where score counter is)
        // Convert from world space - approximate top-left area
        const camera = this.game.camera;
        this.targetPosition = new THREE.Vector3(
            camera.left + 100,  // Near left edge
            camera.top - 50,    // Near top edge
            position.z
        );
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        const progress = this.age / this.lifetime;
        
        if (progress < 0.3) {
            // First 30%: Float upward slowly
            this.sprite.position.y = this.startPosition.y + (progress / 0.3) * 30;
        } else {
            // Last 70%: Accelerate towards score counter
            const moveProgress = (progress - 0.3) / 0.7;
            const easedProgress = this.easeInQuad(moveProgress);
            
            this.sprite.position.x = this.startPosition.x + (this.targetPosition.x - this.startPosition.x) * easedProgress;
            this.sprite.position.y = this.startPosition.y + 30 + (this.targetPosition.y - this.startPosition.y - 30) * easedProgress;
        }
        
        // Fade out at the end
        if (progress > 0.8) {
            const fadeProgress = (progress - 0.8) / 0.2;
            this.sprite.material.opacity = 1 - fadeProgress;
        }
        
        // Scale down as it approaches target
        if (progress > 0.5) {
            const scaleProgress = (progress - 0.5) / 0.5;
            const scale = 1 - (scaleProgress * 0.7);
            this.sprite.scale.set(150 * scale, 37.5 * scale, 1); // Updated for 3x size
        }
        
        return this.age >= this.lifetime;
    }
    
    easeInQuad(t) {
        return t * t;
    }
    
    destroy() {
        this.game.scene.remove(this.sprite);
        this.sprite.material.map.dispose();
        this.sprite.material.dispose();
    }
}

export class ScoreSystem {
    constructor(game) {
        this.game = game;
        this.popups = [];
        
        // Scoring parameters
        this.baseEnemyScore = 100;
        this.distanceBonus = true; // Bonus for killing far enemies
        this.riskBonus = true; // Bonus for killing near enemies
    }
    
    update(deltaTime) {
        // Update score popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            if (popup.update(deltaTime)) {
                popup.destroy();
                this.popups.splice(i, 1);
            }
        }
    }
    
    calculateScore(enemy, playerPosition) {
        let score = this.baseEnemyScore;
        
        // Chain multiplier (from ChainSystem)
        const chainMultiplier = this.game.chainSystem.getMultiplier();
        score *= chainMultiplier;
        
        // Distance bonus/penalty
        if (this.distanceBonus && enemy.mesh && playerPosition) {
            const distance = enemy.mesh.position.distanceTo(playerPosition);
            const maxDistance = 400; // Play area diagonal
            const distanceFactor = distance / maxDistance;
            
            // Bonus for far enemies (sniper bonus)
            if (distanceFactor > 0.7) {
                score *= 1.5;
            }
        }
        
        // Risk bonus (close range)
        if (this.riskBonus && enemy.mesh && playerPosition) {
            const distance = enemy.mesh.position.distanceTo(playerPosition);
            if (distance < 50) {
                score *= 2.0; // Double score for dangerous kills
            }
        }
        
        return Math.floor(score);
    }
    
    addScore(amount, position, color = 0xffff00) {
        this.game.score += amount;
        
        // Create score popup
        if (position) {
            const popup = new ScorePopup(this.game, position, amount, color);
            this.popups.push(popup);
        }
    }
    
    onEnemyDestroyed(enemy) {
        const score = this.calculateScore(enemy, this.game.player.mesh.position);
        
        // Different colors for different multipliers
        let color = 0xffff00; // Yellow
        const multiplier = this.game.chainSystem.getMultiplier();
        if (multiplier >= 16) {
            color = 0xff00ff; // Magenta for huge chains
        } else if (multiplier >= 9) {
            color = 0xff0000; // Red for high chains
        } else if (multiplier >= 4) {
            color = 0xff8800; // Orange for medium chains
        }
        
        this.addScore(score, enemy.mesh.position, color);
    }
    
    clear() {
        for (const popup of this.popups) {
            popup.destroy();
        }
        this.popups = [];
    }
}

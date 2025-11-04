import * as THREE from 'three';

export class ScorePopup {
    constructor(game, position, score, color = 0xffff00) {
        this.game = game;
        this.score = score;
        this.lifetime = 1.0; // seconds
        this.age = 0;
        
        // Create text sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 40px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`+${score}`, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(50, 12.5, 1);
        this.sprite.position.copy(position);
        
        this.game.scene.add(this.sprite);
        
        // Animation properties
        this.startY = position.y;
        this.velocity = new THREE.Vector3(0, 50, 0); // Float upward
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        // Move upward
        this.sprite.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Fade out
        const alpha = 1 - (this.age / this.lifetime);
        this.sprite.material.opacity = alpha;
        
        return this.age >= this.lifetime;
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

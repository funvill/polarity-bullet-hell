export class HUD {
    constructor(game) {
        this.game = game;
        
        // Track previous values for change detection
        this.prevChain = 0;
        this.prevScore = 0;
        
        // Get DOM elements
        this.elements = {
            score: document.getElementById('score'),
            chain: document.getElementById('chain'),
            lives: document.getElementById('lives'),
            energy: document.getElementById('energy'),
            polarity: document.getElementById('polarity'),
            fps: document.getElementById('fps'),
            entityCount: document.getElementById('entity-count'),
            gameOver: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            maxChain: document.getElementById('max-chain'),
            energyBarFill: document.getElementById('energy-bar-fill'),
            chainDisplay: document.getElementById('chain-display')
        };
    }
    
    update() {
        // Update game state
        this.elements.score.textContent = this.game.score.toString().padStart(8, '0');
        
        // Pulse score on change
        if (this.game.score !== this.prevScore) {
            this.pulseElement(this.elements.score);
            this.prevScore = this.game.score;
        }
        
        this.elements.chain.textContent = this.game.chain;
        
        // Enhanced chain feedback on increase
        if (this.game.chain > this.prevChain && this.game.chain > 0) {
            this.pulseChain();
            this.prevChain = this.game.chain;
        } else if (this.game.chain < this.prevChain) {
            // Chain broken - show red flash
            this.flashChainBroken();
            this.prevChain = this.game.chain;
        }
        
        this.elements.lives.textContent = this.game.lives;
        this.elements.energy.textContent = this.game.energy;
        
        // Update energy bar
        this.elements.energyBarFill.style.width = `${this.game.energy}%`;
        if (this.game.energy >= 100) {
            this.elements.energyBarFill.classList.add('full');
        } else {
            this.elements.energyBarFill.classList.remove('full');
        }
        
        // Update energy bar color based on polarity
        const energyColor = this.game.player.polarity === 'WHITE' 
            ? 'linear-gradient(90deg, #00ffff, #0099ff)' 
            : 'linear-gradient(90deg, #ff8800, #ff4400)';
        this.elements.energyBarFill.style.background = energyColor;
        
        // Show/hide chain display
        if (this.game.chain > 0) {
            this.elements.chainDisplay.style.display = 'block';
        } else {
            this.elements.chainDisplay.style.display = 'none';
        }
        
        this.elements.polarity.textContent = this.game.player.polarity;
        
        // Update polarity color
        const polarityColor = this.game.player.polarity === 'WHITE' ? '#ffffff' : '#333333';
        const polarityBg = this.game.player.polarity === 'WHITE' ? '#000000' : '#ffffff';
        this.elements.polarity.style.color = polarityColor;
        this.elements.polarity.style.backgroundColor = polarityBg;
        this.elements.polarity.style.padding = '2px 8px';
        this.elements.polarity.style.fontWeight = 'bold';
        
        // Update stats
        this.elements.fps.textContent = this.game.currentFPS;
        const entityCount = this.game.entities.length + this.game.bullets.length + this.game.enemies.length;
        this.elements.entityCount.textContent = entityCount;
    }
    
    showGameOver() {
        this.elements.gameOver.style.display = 'block';
        this.elements.finalScore.textContent = this.game.score.toString().padStart(8, '0');
        this.elements.maxChain.textContent = this.game.maxChain;
    }
    
    hideGameOver() {
        this.elements.gameOver.style.display = 'none';
    }
    
    pulseElement(element) {
        element.style.transform = 'scale(1.2)';
        element.style.transition = 'transform 0.1s';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    }
    
    pulseChain() {
        const chainDisplay = this.elements.chainDisplay;
        
        // Scale up and brighten
        chainDisplay.style.transform = 'scale(1.3)';
        chainDisplay.style.filter = 'brightness(1.5)';
        chainDisplay.style.transition = 'all 0.2s';
        
        // Add glow based on chain level
        if (this.game.chain >= 16) {
            chainDisplay.style.textShadow = '0 0 20px #ff00ff, 0 0 10px #ff00ff';
            chainDisplay.style.color = '#ff00ff';
        } else if (this.game.chain >= 9) {
            chainDisplay.style.textShadow = '0 0 15px #ff4400, 0 0 8px #ff4400';
            chainDisplay.style.color = '#ffaa00';
        } else if (this.game.chain >= 4) {
            chainDisplay.style.textShadow = '0 0 10px #00ff00, 0 0 5px #00ff00';
            chainDisplay.style.color = '#00ff00';
        } else {
            chainDisplay.style.textShadow = '0 0 5px #ffffff';
            chainDisplay.style.color = '#ffffff';
        }
        
        setTimeout(() => {
            chainDisplay.style.transform = 'scale(1)';
            chainDisplay.style.filter = 'brightness(1)';
        }, 200);
    }
    
    flashChainBroken() {
        const chainDisplay = this.elements.chainDisplay;
        
        // Red flash for broken chain
        chainDisplay.style.color = '#ff0000';
        chainDisplay.style.textShadow = '0 0 10px #ff0000';
        
        setTimeout(() => {
            chainDisplay.style.color = '#ffffff';
            chainDisplay.style.textShadow = 'none';
        }, 200);
    }
}

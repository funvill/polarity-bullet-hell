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
            polarity: document.getElementById('polarity'),
            fps: document.getElementById('fps'),
            entityCount: document.getElementById('entity-count'),
            gameOver: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            maxChain: document.getElementById('max-chain'),
            energyBarFill: document.getElementById('energy-bar-fill'),
            chainDisplay: document.getElementById('chain-display'),
            statEnemiesKilled: document.getElementById('stat-enemies-killed'),
            statAccuracy: document.getElementById('stat-accuracy'),
            statBulletsAbsorbed: document.getElementById('stat-bullets-absorbed'),
            statEnemyTypes: document.getElementById('stat-enemy-types'),
            highScoresList: document.getElementById('high-scores-list'),
            // Debug panel elements
            debugWorldOffset: document.getElementById('debug-world-offset'),
            debugCenterTile: document.getElementById('debug-center-tile'),
            debugActiveTiles: document.getElementById('debug-active-tiles'),
            debugCachedTiles: document.getElementById('debug-cached-tiles'),
            debugPlayerPos: document.getElementById('debug-player-pos'),
            debugTileSize: document.getElementById('debug-tile-size')
        };
    }
    
    update() {
        // Update game state
        this.elements.score.textContent = this.game.score.toString().padStart(8, '0');
        
        // Pulse score on change
        if (this.game.score !== this.prevScore) {
            this.elements.score.classList.remove('pulse');
            // Trigger reflow to restart animation
            void this.elements.score.offsetWidth;
            this.elements.score.classList.add('pulse');
            this.prevScore = this.game.score;
        }
        
        this.elements.chain.textContent = this.game.chain;
        
        // Update chain color based on polarity
        if (this.game.chainPolarity === 'WHITE') {
            this.elements.chainDisplay.style.color = '#00ffff'; // Cyan
            this.elements.chainDisplay.style.textShadow = '0 0 10px #00ffff, 0 0 5px #00ffff';
        } else if (this.game.chainPolarity === 'BLACK') {
            this.elements.chainDisplay.style.color = '#ff8800'; // Orange
            this.elements.chainDisplay.style.textShadow = '0 0 10px #ff8800, 0 0 5px #ff8800';
        } else {
            // No active chain (neutral)
            this.elements.chainDisplay.style.color = '#ffffff';
            this.elements.chainDisplay.style.textShadow = 'none';
        }
        
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
        
        // Update energy bar (now vertical)
        this.elements.energyBarFill.style.height = `${this.game.energy}%`;
        if (this.game.energy >= 100) {
            this.elements.energyBarFill.classList.add('full');
        } else {
            this.elements.energyBarFill.classList.remove('full');
        }
        
        // Update energy bar color based on polarity (vertical gradient)
        const energyColor = this.game.player.polarity === 'WHITE' 
            ? 'linear-gradient(180deg, #00ffff, #0099ff)' 
            : 'linear-gradient(180deg, #ff8800, #ff4400)';
        this.elements.energyBarFill.style.background = energyColor;
        
        // Chain display is always visible
        this.elements.chainDisplay.style.display = 'block';
        
        this.elements.polarity.textContent = this.game.player.polarity;
        
        // Update polarity color - orange for BLACK, cyan for WHITE
        if (this.game.player.polarity === 'WHITE') {
            this.elements.polarity.style.color = '#00ffff';
            this.elements.polarity.style.backgroundColor = '#000000';
        } else {
            this.elements.polarity.style.color = '#ff8800';
            this.elements.polarity.style.backgroundColor = '#000000';
        }
        this.elements.polarity.style.padding = '2px 8px';
        this.elements.polarity.style.fontWeight = 'bold';
        
        // Update stats
        this.elements.fps.textContent = this.game.currentFPS;
        const entityCount = this.game.entities.length + this.game.bullets.length + this.game.enemies.length;
        this.elements.entityCount.textContent = entityCount;
        
        // Update debug panel
        if (this.elements.debugWorldOffset && this.game.backgroundSystem) {
            const wx = this.game.worldOffset.x.toFixed(1);
            const wy = this.game.worldOffset.y.toFixed(1);
            this.elements.debugWorldOffset.textContent = `${wx}, ${wy}`;
            
            // Get current center tile
            const centerTile = this.game.backgroundSystem.worldOffsetToTile(
                this.game.worldOffset.x, 
                this.game.worldOffset.y
            );
            this.elements.debugCenterTile.textContent = `${centerTile.x}, ${centerTile.y}`;
            
            this.elements.debugActiveTiles.textContent = this.game.backgroundSystem.activeTiles.size;
            this.elements.debugCachedTiles.textContent = this.game.backgroundSystem.tileCache.size;
            
            const px = this.game.player.mesh.position.x.toFixed(1);
            const py = this.game.player.mesh.position.y.toFixed(1);
            this.elements.debugPlayerPos.textContent = `${px}, ${py}`;
            
            this.elements.debugTileSize.textContent = this.game.backgroundSystem.worldUnitsPerTile.toFixed(1);
        }
    }
    
    showGameOver() {
        this.elements.gameOver.style.display = 'block';
        this.elements.finalScore.textContent = this.game.score.toString().padStart(8, '0');
        this.elements.maxChain.textContent = this.game.maxChain;
        
        // Display top 5 high scores with current score highlighted
        const highScores = this.game.getHighScores();
        const currentScore = this.game.score;
        
        // Create combined list to find current score's rank
        const allScores = [...highScores];
        let currentScoreEntry = { score: currentScore, maxChain: this.game.maxChain, isCurrent: true };
        
        // Find if current score is already in the list (shouldn't be, but just in case)
        const existingIndex = allScores.findIndex(s => s.score === currentScore && s.maxChain === this.game.maxChain);
        if (existingIndex === -1) {
            allScores.push(currentScoreEntry);
        } else {
            allScores[existingIndex].isCurrent = true;
        }
        
        // Sort and take top 5, plus current if outside top 5
        allScores.sort((a, b) => b.score - a.score);
        
        let displayScores = allScores.slice(0, 5);
        const currentInTop5 = displayScores.some(s => s.isCurrent);
        
        // If current score not in top 5, add it at the end
        if (!currentInTop5) {
            const currentRank = allScores.findIndex(s => s.isCurrent) + 1;
            displayScores.push({ ...currentScoreEntry, rank: currentRank });
        }
        
        // Generate HTML
        let html = '';
        displayScores.forEach((entry, index) => {
            const rank = entry.rank || (index + 1);
            const rankStr = rank.toString().padStart(2, ' ');
            const scoreStr = entry.score.toString().padStart(8, '0');
            const chainStr = `Chain: ${entry.maxChain}`;
            const cssClass = entry.isCurrent ? 'high-score-entry current' : 'high-score-entry';
            
            html += `<div class="${cssClass}">${rankStr}. ${scoreStr}  ${chainStr}</div>`;
        });
        
        this.elements.highScoresList.innerHTML = html;
        
        // Display stats
        this.elements.statEnemiesKilled.textContent = this.game.stats.enemiesKilled;
        
        // Calculate accuracy
        const accuracy = this.game.stats.shotsFired > 0 
            ? Math.round((this.game.stats.shotsHit / this.game.stats.shotsFired) * 100)
            : 0;
        this.elements.statAccuracy.textContent = accuracy;
        
        this.elements.statBulletsAbsorbed.textContent = this.game.stats.bulletsAbsorbed;
        
        // Display enemy types breakdown
        let typesHTML = '<p style="margin-top: 10px;">Enemy Types:</p>';
        for (const [type, count] of Object.entries(this.game.stats.enemyTypes)) {
            typesHTML += `<p style="margin-left: 20px;">${type}: ${count}</p>`;
        }
        this.elements.statEnemyTypes.innerHTML = typesHTML;
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
        
        // Scale up and brighten with left-to-right origin
        chainDisplay.style.transform = 'scale(1.3)';
        chainDisplay.style.filter = 'brightness(1.5)';
        chainDisplay.style.transition = 'all 0.2s';
        
        // Color stays based on polarity (already set in update())
        // Just increase glow intensity during pulse
        if (this.game.chainPolarity === 'WHITE') {
            chainDisplay.style.textShadow = '0 0 20px #00ffff, 0 0 10px #00ffff';
        } else if (this.game.chainPolarity === 'BLACK') {
            chainDisplay.style.textShadow = '0 0 20px #ff8800, 0 0 10px #ff8800';
        }
        
        setTimeout(() => {
            chainDisplay.style.transform = 'scale(1)';
            chainDisplay.style.filter = 'brightness(1)';
            
            // Reset to normal glow
            if (this.game.chainPolarity === 'WHITE') {
                chainDisplay.style.textShadow = '0 0 10px #00ffff, 0 0 5px #00ffff';
            } else if (this.game.chainPolarity === 'BLACK') {
                chainDisplay.style.textShadow = '0 0 10px #ff8800, 0 0 5px #ff8800';
            }
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

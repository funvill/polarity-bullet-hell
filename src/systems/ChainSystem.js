export class ChainSystem {
    constructor(game) {
        this.game = game;
        this.chainQueue = []; // Last 3 enemy kills
        this.chainCount = 0;
        this.maxChain = 0;
        this.chainPolarity = null; // Track which polarity the current chain is
    }
    
    onEnemyDestroyed(polarity) {
        // If we have an active chain and kill opposite polarity, break the chain
        if (this.chainPolarity && polarity !== this.chainPolarity) {
            this.breakChain();
        }
        
        // Add to queue
        this.chainQueue.push(polarity);
        
        // Keep only last 3
        if (this.chainQueue.length > 3) {
            this.chainQueue.shift();
        }
        
        // Check if we have 3 consecutive same-color kills
        if (this.chainQueue.length === 3) {
            const allSame = this.chainQueue.every(p => p === this.chainQueue[0]);
            
            if (allSame) {
                this.chainCount++;
                this.chainPolarity = polarity; // Set chain polarity
                this.maxChain = Math.max(this.maxChain, this.chainCount);
                this.game.chain = this.chainCount;
                this.game.maxChain = this.maxChain;
                this.game.chainPolarity = this.chainPolarity; // Expose to game
                
                console.log(`CHAIN: ${this.chainCount}! (${polarity})`);
                this.createChainEffect();
                
                // Reset queue to allow continuing the chain
                this.chainQueue = [polarity];
            }
        }
    }
    
    breakChain() {
        if (this.chainCount > 0) {
            console.log(`Chain broken at ${this.chainCount}`);
            this.chainCount = 0;
            this.chainQueue = [];
            this.chainPolarity = null; // Reset polarity
            this.game.chain = 0;
            this.game.chainPolarity = null;
        }
    }
    
    getMultiplier() {
        // Score multiplier based on chain: (chainCount)^2
        return Math.pow(this.chainCount + 1, 2);
    }
    
    createChainEffect() {
        // Create visual feedback for chain
        const color = this.chainQueue[0] === 'WHITE' ? 0x00ffff : 0xff8800;
        
        // Create text or effect showing chain increase
        // For now, just log it
        console.log(`Multiplier: x${this.getMultiplier()}`);
    }
}

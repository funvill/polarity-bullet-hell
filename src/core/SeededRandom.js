// Seeded random number generator for predictable gameplay
export class SeededRandom {
    constructor(seed = 12345) {
        this.seed = seed;
        this.originalSeed = seed;
    }
    
    // Linear Congruential Generator (LCG)
    // Returns a pseudo-random number between 0 and 1
    next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }
    
    // Returns random integer between min (inclusive) and max (inclusive)
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    // Returns random float between min and max
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
    
    // Returns true with given probability (0-1)
    chance(probability) {
        return this.next() < probability;
    }
    
    // Choose random element from array
    choose(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
    
    // Reset to original seed
    reset() {
        this.seed = this.originalSeed;
    }
    
    // Set new seed
    setSeed(newSeed) {
        this.seed = newSeed;
        this.originalSeed = newSeed;
    }
}

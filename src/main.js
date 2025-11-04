import * as THREE from 'three';
import { Game } from './core/Game.js';

// Initialize the game when DOM is ready
const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// Start the game
game.start();

// Handle window resize
window.addEventListener('resize', () => {
    game.onResize();
});

// Expose game to window for debugging
window.game = game;

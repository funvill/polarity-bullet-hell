export class Input {
    constructor(canvas) {
        this.keys = new Map();
        this.keysPressed = new Map();
        this.keysReleased = new Map();
        
        // Mouse state
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseButtons = new Map();
        this.mouseButtonsPressed = new Map();
        this.mouseButtonsReleased = new Map();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
    }
    
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to canvas coordinates
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }
    
    onMouseDown(event) {
        event.preventDefault();
        if (!this.mouseButtons.get(event.button)) {
            this.mouseButtonsPressed.set(event.button, true);
        }
        this.mouseButtons.set(event.button, true);
    }
    
    onMouseUp(event) {
        event.preventDefault();
        this.mouseButtons.set(event.button, false);
        this.mouseButtonsReleased.set(event.button, true);
    }
    
    onKeyDown(event) {
        if (!this.keys.get(event.code)) {
            this.keysPressed.set(event.code, true);
        }
        this.keys.set(event.code, true);
    }
    
    onKeyUp(event) {
        this.keys.set(event.code, false);
        this.keysReleased.set(event.code, true);
    }
    
    isKeyDown(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isKeyPressed(keyCode) {
        const pressed = this.keysPressed.get(keyCode) || false;
        this.keysPressed.set(keyCode, false);
        return pressed;
    }
    
    isKeyReleased(keyCode) {
        const released = this.keysReleased.get(keyCode) || false;
        this.keysReleased.set(keyCode, false);
        return released;
    }
    
    isMouseButtonDown(button) {
        return this.mouseButtons.get(button) || false;
    }
    
    isMouseButtonPressed(button) {
        const pressed = this.mouseButtonsPressed.get(button) || false;
        this.mouseButtonsPressed.set(button, false);
        return pressed;
    }
    
    isMouseButtonReleased(button) {
        const released = this.mouseButtonsReleased.get(button) || false;
        this.mouseButtonsReleased.set(button, false);
        return released;
    }
    
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }
    
    // Helper methods for common controls
    getMovementInput() {
        const movement = { x: 0, y: 0 };
        
        // Arrow keys and WASD
        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
            movement.x -= 1;
        }
        if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
            movement.x += 1;
        }
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) {
            movement.y += 1;
        }
        if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) {
            movement.y -= 1;
        }
        
        // Normalize diagonal movement
        if (movement.x !== 0 && movement.y !== 0) {
            const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            movement.x /= length;
            movement.y /= length;
        }
        
        return movement;
    }
    
    isFireButtonDown() {
        return this.isMouseButtonDown(0); // Left mouse button
    }
    
    isSpecialButtonPressed() {
        return this.isKeyPressed('Space');
    }
    
    isPolaritySwitchPressed() {
        return this.isMouseButtonPressed(2); // Right mouse button
    }
}

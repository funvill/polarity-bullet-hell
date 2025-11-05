import retroMetalUrl from '../assets/retro_metal.ogg';
import glitchUrl from '../assets/glitch.ogg';

export class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.volume = 0.3;
        this.musicVolume = 0.15;
        this.sounds = {};
        
        // Music system
        this.musicOscillators = [];
        this.musicGain = null;
        this.currentMusicMode = 'normal'; // normal, danger, boss
        
        // Background music tracks
        this.musicTracks = {
            retro: null,
            glitch: null
        };
        this.currentTrack = null;
        this.musicSource = null;
        
        // Initialize audio context on first user interaction
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // Load background music files
            this.loadMusicFiles();
            
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    async loadMusicFiles() {
        // Load the two music tracks
        try {
            const retroResponse = await fetch(retroMetalUrl);
            const retroBuffer = await retroResponse.arrayBuffer();
            this.musicTracks.retro = await this.context.decodeAudioData(retroBuffer);
            
            const glitchResponse = await fetch(glitchUrl);
            const glitchBuffer = await glitchResponse.arrayBuffer();
            this.musicTracks.glitch = await this.context.decodeAudioData(glitchBuffer);
            
            console.log('Music files loaded successfully');
            
            // Start playing retro_metal by default
            this.playBackgroundMusic('retro');
        } catch (e) {
            console.warn('Failed to load music files:', e);
            // Fall back to procedural music
            this.startMusic();
        }
    }
    
    playBackgroundMusic(track = 'retro') {
        if (!this.enabled || !this.initialized) return;
        if (!this.musicTracks[track]) {
            console.warn(`Music track "${track}" not loaded`);
            return;
        }
        
        // Stop current music if playing
        if (this.musicSource) {
            this.musicSource.stop();
        }
        
        // Create gain node for music volume control
        if (!this.musicGain) {
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.context.destination);
        }
        
        // Create and start new source
        this.musicSource = this.context.createBufferSource();
        this.musicSource.buffer = this.musicTracks[track];
        this.musicSource.loop = true;
        this.musicSource.connect(this.musicGain);
        this.musicSource.start(0);
        
        this.currentTrack = track;
        console.log(`Playing background music: ${track}`);
    }
    
    switchMusicTrack(track) {
        if (track !== this.currentTrack) {
            this.playBackgroundMusic(track);
        }
    }
    
    // Generate sound using oscillators - no external files needed
    playShoot(polarity) {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Create oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Different frequencies for different polarities with slight random variation
        const baseFreq = polarity === 'WHITE' ? 440 : 330;
        const pitchVariation = 0.9 + Math.random() * 0.2; // 90% to 110%
        const freq = baseFreq * pitchVariation;
        
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
        
        // Envelope with slight volume variation
        const volumeVariation = 0.8 + Math.random() * 0.4; // 80% to 120%
        gain.gain.setValueAtTime(this.volume * 0.3 * volumeVariation, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        // Connect and play
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    playExplosion(size = 'medium') {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Use noise for explosion
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        const gain = ctx.createGain();
        const volume = size === 'large' ? 0.5 : size === 'medium' ? 0.3 : 0.2;
        gain.gain.setValueAtTime(this.volume * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.3);
    }
    
    playAbsorb() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Rising tone for absorption
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    playPolaritySwitch() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Two-tone chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.05);
        osc.frequency.setValueAtTime(550, now + 0.1);
        
        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.setValueAtTime(this.volume * 0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    playSpecialWeapon() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Dramatic descending sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
        
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    playPowerUp() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Ascending arpeggio
        const frequencies = [523, 659, 784]; // C, E, G
        
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            const startTime = now + i * 0.08;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(this.volume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }
    
    playHit() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Quick descending tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    playBossWarning() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Create a dramatic rising tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        osc.type = 'sawtooth';
        
        // Pulsing envelope
        for (let i = 0; i < 5; i++) {
            const time = now + (i * 0.1);
            gain.gain.setValueAtTime(this.volume * 0.4, time);
            gain.gain.exponentialRampToValueAtTime(this.volume * 0.1, time + 0.08);
        }
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // Background music system
    startMusic() {
        if (!this.enabled || !this.initialized) return;
        
        const ctx = this.context;
        
        // Create master gain for music
        this.musicGain = ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(ctx.destination);
        
        // Create bass line - pentatonic scale
        this.createMusicLayer('bass', [110, 146.83, 164.81], 0.3, 'sine');
        
        // Create melody - higher octave
        this.createMusicLayer('melody', [440, 493.88, 554.37, 659.25], 0.15, 'triangle');
        
        console.log('Background music started');
    }
    
    createMusicLayer(name, notes, volume, waveType) {
        const ctx = this.context;
        const now = ctx.currentTime;
        
        // Create oscillator for each note with random timing
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = waveType;
            osc.frequency.value = freq;
            
            gain.gain.value = 0;
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(now);
            
            this.musicOscillators.push({ osc, gain, baseFreq: freq, layer: name });
            
            // Pulse the notes in and out
            this.pulseNote(gain, volume, i * 0.5);
        });
    }
    
    pulseNote(gain, maxVolume, offset = 0) {
        const ctx = this.context;
        const interval = 2.0; // 2 second pulse
        
        const pulse = () => {
            if (!this.enabled || !this.initialized) return;
            
            const now = ctx.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(maxVolume * this.musicVolume, now + interval / 2);
            gain.gain.linearRampToValueAtTime(0, now + interval);
            
            setTimeout(pulse, interval * 1000 + offset * 1000);
        };
        
        setTimeout(pulse, offset * 1000);
    }
    
    setMusicMode(mode) {
        if (!this.enabled || !this.initialized || this.musicMode === mode) return;
        
        this.musicMode = mode;
        
        // Adjust music parameters based on mode
        if (this.bassOsc && this.melodyOsc) {
            switch(mode) {
                case 'normal':
                    this.musicGain.gain.setValueAtTime(this.musicVolume * 0.8, this.context.currentTime);
                    break;
                case 'danger':
                    // Increase volume and tempo feel
                    this.musicGain.gain.setValueAtTime(this.musicVolume * 1.0, this.context.currentTime);
                    break;
                case 'boss':
                    // Maximum intensity
                    this.musicGain.gain.setValueAtTime(this.musicVolume * 1.2, this.context.currentTime);
                    break;
            }
        }
        
        console.log(`Music mode: ${mode}`);
    }
    
    // Dynamic music intensity based on bullet count
    updateMusicIntensity(bulletCount, maxBullets = 100) {
        if (!this.enabled || !this.initialized || !this.musicGain) return;
        
        // Scale music volume with bullet density
        const intensity = Math.min(bulletCount / maxBullets, 1.0);
        const targetVolume = this.musicVolume * (0.7 + intensity * 0.5); // 70% to 120% volume
        
        // Smooth transition
        this.musicGain.gain.linearRampToValueAtTime(
            targetVolume,
            this.context.currentTime + 0.5
        );
    }
    
    stopMusic() {
        // Stop file-based music
        if (this.musicSource) {
            try {
                this.musicSource.stop();
                this.musicSource = null;
                this.currentTrack = null;
            } catch(e) {
                // Already stopped
            }
        }
        
        // Stop procedural music oscillators
        if (this.musicOscillators.length) {
            this.musicOscillators.forEach(({ osc }) => {
                try {
                    osc.stop();
                } catch(e) {
                    // Already stopped
                }
            });
            this.musicOscillators = [];
        }
        
        console.log('Music stopped');
    }
}

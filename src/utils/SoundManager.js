class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('mlQuizMuted') === 'true';
        this.masterGain = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.updateMuteState();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('mlQuizMuted', this.muted);
        this.updateMuteState();
        return this.muted;
    }

    updateMuteState() {
        if (!this.masterGain) return;
        this.masterGain.gain.value = this.muted ? 0 : 0.3; // 0.3 master volume
    }

    play(type) {
        // Initialize on first interaction if needed
        if (!this.ctx) this.init();
        
        if (this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (type) {
            case 'correct':
                this.playTone(660, 'sine', 0.1);
                setTimeout(() => this.playTone(880, 'sine', 0.1), 100);
                break;
            case 'incorrect':
                this.playTone(150, 'sawtooth', 0.3);
                setTimeout(() => this.playTone(100, 'sawtooth', 0.3), 150);
                break;
            case 'levelUp':
                this.playMelody([523.25, 659.25, 783.99, 1046.50], 'square', 100);
                break;
            case 'buy':
                this.playTone(1200, 'triangle', 0.1);
                setTimeout(() => this.playTone(1600, 'sine', 0.2), 100);
                break;
            case 'click':
                // Click sound removed or can be added back if desired
                 this.playTone(400, 'sine', 0.05);
                break;
            default:
                break;
        }
    }

    playTone(freq, type, duration) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playMelody(notes, type, noteDurationMs) {
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, type, noteDurationMs / 1000);
            }, index * noteDurationMs);
        });
    }
}

export const soundManager = new SoundManager();

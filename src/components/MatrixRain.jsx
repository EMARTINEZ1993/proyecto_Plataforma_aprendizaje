import { useEffect, useRef } from 'react';

const MatrixRain = ({ active }) => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationFrameId;
        
        canvas.width = width;
        canvas.height = height;

        const fontSize = 16;
        let columns = Math.floor(width / fontSize);
        let drops = Array(columns).fill(1).map(() => Math.random() * -100);
        const chars = "01";

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                
                // Randomly make some characters white/brighter for effect
                if (Math.random() > 0.95) {
                    ctx.fillStyle = '#CCFFCC'; // Bright white-green
                } else {
                    ctx.fillStyle = '#0F0'; // Standard matrix green
                }

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly after it crosses screen
                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const intervalId = setInterval(draw, 33);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            
            // Re-calculate columns and reset drops
            columns = Math.floor(width / fontSize);
            drops = Array(columns).fill(1).map(() => Math.random() * -100);
            
            // Fill black initially to avoid transparency issues on resize
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', handleResize);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas 
            ref={canvasRef} 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
                background: 'transparent'
            }}
        />
    );
};

export default MatrixRain;

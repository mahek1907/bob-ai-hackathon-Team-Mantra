import React, { useEffect, useRef } from 'react';

export default function GridAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Precise grid substation nodes
    const nodes = [
      { id: 'TX-401', x: 0.22, y: 0.32, color: '#ef4444', label: 'TX-401 • 345kV' },
      { id: 'TX-102', x: 0.68, y: 0.26, color: '#f59e0b', label: 'TX-102 • 230kV' },
      { id: 'TX-303', x: 0.78, y: 0.64, color: '#3b82f6', label: 'TX-303 • 115kV' },
      { id: 'TX-205', x: 0.32, y: 0.74, color: '#10b981', label: 'TX-205 • 138kV' },
      { id: 'HUB-01', x: 0.48, y: 0.48, color: '#60a5fa', label: 'METRO INTERTIE' },
    ];

    const connections = [
      { from: 0, to: 4 },
      { from: 1, to: 4 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 0 },
    ];

    // Slow, subtle energy particles
    const particles = [];
    for (let i = 0; i < 22; i++) {
      particles.push({
        connIdx: Math.floor(Math.random() * connections.length),
        progress: Math.random(),
        speed: 0.0015 + Math.random() * 0.002, // Slow, professional movement
        size: 1.5 + Math.random() * 1.5,
        color: Math.random() > 0.3 ? '#60a5fa' : '#93c5fd',
      });
    }

    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Refined dark navy background
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#070c18');
      bg.addColorStop(0.6, '#0b1329');
      bg.addColorStop(1, '#050811');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle orthogonal grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.035)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Transmission lines
      connections.forEach(conn => {
        const n1 = nodes[conn.from];
        const n2 = nodes[conn.to];
        const x1 = n1.x * width;
        const y1 = n1.y * height;
        const x2 = n2.x * width;
        const y2 = n2.y * height;

        // Base line
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Inner subtle trace
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Slowly moving energy particles
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.connIdx = Math.floor(Math.random() * connections.length);
        }

        const conn = connections[p.connIdx];
        const n1 = nodes[conn.from];
        const n2 = nodes[conn.to];
        const x = n1.x * width + (n2.x * width - n1.x * width) * p.progress;
        const y = n1.y * height + (n2.y * height - n1.y * height) * p.progress;

        // Particle glow
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Nodes
      nodes.forEach((n, idx) => {
        const nx = n.x * width;
        const ny = n.y * height;

        // Subtle pulsing ring
        const ringRadius = 10 + Math.sin(pulseTime + idx * 1.5) * 3;
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 + Math.sin(pulseTime + idx * 1.5) * 0.2;
        ctx.beginPath();
        ctx.arc(nx, ny, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Node circle
        ctx.fillStyle = '#0b1329';
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Core dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fill();

        // Technical node label
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
        ctx.textAlign = 'left';
        ctx.fillText(n.label, nx + 12, ny + 3);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#070c18]">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}

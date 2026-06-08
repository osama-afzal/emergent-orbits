import { useEffect, useRef } from "react";
import { Simulation } from "./simulation/Simulation";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const sim = new Simulation(canvas.width, canvas.height, 100);

    const FIXED_TIMESTEP = 1000 / 60;
    let lastTime = performance.now();
    let accumulator = 0;

    function drawOrb(x: number, y: number, radius: number) {
      const gradient = ctx!.createRadialGradient(x, y, 0, x, y, radius * 4);

      gradient.addColorStop(0, "rgba(200, 230, 255, 1)");
      gradient.addColorStop(0.2, "rgba(140, 200, 255, 0.6)");
      gradient.addColorStop(1, "rgba(140, 200, 255, 0)");

      ctx!.fillStyle = gradient;

      ctx!.beginPath();
      ctx!.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx!.fill();
    }

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      accumulator += delta;

      while (accumulator >= FIXED_TIMESTEP) {
        sim.update();
        accumulator -= FIXED_TIMESTEP;
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      ctx!.fillStyle = "rgb(20, 15, 30)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (const orb of sim.orbs) {
        drawOrb(orb.x, orb.y, orb.radius);
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

export default App;
import { useEffect, useRef } from "react";
import { Simulation } from "./simulation/Simulation";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const sim = new Simulation(
      canvas.width,
      canvas.height,
      100
    );

    function animate() {
      sim.update();

      ctx!.clearRect(
        0,
        0,
        canvas!.width,
        canvas!.height
      );

      for (const orb of sim.orbs) {
        ctx!.beginPath();

        ctx!.arc(
          orb.x,
          orb.y,
          orb.radius,
          0,
          Math.PI * 2
        );

        ctx!.fillStyle = "white";
        ctx!.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return <canvas ref={canvasRef} />;
}

export default App;
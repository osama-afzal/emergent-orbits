import { Orb } from "./Orb";

export class Simulation {
  private width: number;
  private height: number;

  public orbs: Orb[] = [];

  constructor(width: number, height: number, orbCount: number) {
    this.width = width;
    this.height = height;

    for (let i = 0; i < orbCount; i++) {
      this.orbs.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 4,
      });
    }
  }

  update() {
    for (const orb of this.orbs) {
      orb.x += orb.vx;
      orb.y += orb.vy;

      if (orb.x < orb.radius) {
        orb.x = orb.radius;
        orb.vx *= -1;
      } else if (orb.x > this.width - orb.radius) {
        orb.x = this.width - orb.radius;
        orb.vx *= -1;
      }

      if (orb.y < orb.radius) {
        orb.y = orb.radius;
        orb.vy *= -1;
      } else if (orb.y > this.height - orb.radius) {
        orb.y = this.height - orb.radius;
        orb.vy *= -1;
      }
    }
  }
}

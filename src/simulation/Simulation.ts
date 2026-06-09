import { AttachmentStyle, Neighbor, Orb } from "./Orb";

export class Simulation {
  private width: number;
  private height: number;
  private currentFrame: number = 0;

  public orbs: Orb[] = [];
  public selectedOrbId: number | null = null;

  constructor(width: number, height: number, orbCount: number) {
    this.width = width;
    this.height = height;

    const activeStyles: AttachmentStyle[] = ["SECURE", "ANXIOUS", "AVOIDANT"];

    for (let i = 0; i < orbCount; i++) {
      const attachmentStyle =
        activeStyles[Math.floor(Math.random() * activeStyles.length)];

      let socialBattery = 80 + Math.random() * 20;
      let lonelinessIndex = Math.random() * 5;

      if (attachmentStyle === "ANXIOUS") {
        lonelinessIndex = 5 + Math.random() * 10; 
      } else if (attachmentStyle === "AVOIDANT") {
        socialBattery = 95 + Math.random() * 5;
      }

      this.orbs.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 6,
        neighbors: [],
        closestNeighbor: null,
        attachmentStyle,
        vitality: 100,
        socialBattery,
        lonelinessIndex,
        isInspected: false,
        surveillanceTimer: 0,
      });
    }
  }

  public selectOrb(id: number | null) {
    this.selectedOrbId = id;
    for (const orb of this.orbs) {
      if (orb.id === id) {
        orb.isInspected = true;
      } else {
        if (orb.isInspected) {
          orb.surveillanceTimer = 0;
        }
        orb.isInspected = false;
      }
    }
  }

  update() {
    this.currentFrame++;

    for (const orb of this.orbs) {
      orb.neighbors = this.sense(orb);
    }

    const INTIMATE_ZONE = 25;
    const ISOLATION_ZONE = 100;
    const MAX_SPEED = 2.0;

    for (const orb of this.orbs) {
      if (orb.vitality <= 0) {
        orb.vx = 0;
        orb.vy = 0;
        continue;
      }

      if (orb.isInspected) {
        orb.surveillanceTimer++;
      }

      let ax = 0;
      let ay = 0;

      const closest = orb.closestNeighbor;

      if (closest && orb.attachmentStyle !== "BLASE") {
        if (
          orb.attachmentStyle === "ANXIOUS" &&
          closest.distance > INTIMATE_ZONE
        ) {
          ax += (closest.dx / closest.distance) * 0.12;
          ay += (closest.dy / closest.distance) * 0.12;
        } else if (
          orb.attachmentStyle === "AVOIDANT" &&
          closest.distance < INTIMATE_ZONE * 1.8 
        ) {
          ax -= (closest.dx / closest.distance) * 0.25;
          ay -= (closest.dy / closest.distance) * 0.25;
        }
      }

      ax += (Math.random() - 0.5) * 0.08;
      ay += (Math.random() - 0.5) * 0.08;

      orb.vx += ax;
      orb.vy += ay;

      const speed = Math.hypot(orb.vx, orb.vy) || 1;
      if (speed > MAX_SPEED) {
        orb.vx = (orb.vx / speed) * MAX_SPEED;
        orb.vy = (orb.vy / speed) * MAX_SPEED;
      }

      if (closest && closest.distance < INTIMATE_ZONE) {
        orb.socialBattery = Math.max(0, orb.socialBattery - 0.1);

        const vulnerabilityMultiplier =
          orb.attachmentStyle === "AVOIDANT" ? 2.0 : 1.0;
        orb.vitality -= 0.01 * vulnerabilityMultiplier;

        if (orb.attachmentStyle === "ANXIOUS") {
          orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.2);
        }
      } else if (!closest || closest.distance > ISOLATION_ZONE) {
        orb.lonelinessIndex = Math.min(100, orb.lonelinessIndex + 0.1);

        const vulnerabilityMultiplier =
          orb.attachmentStyle === "ANXIOUS" ? 3.0 : 1.0;
        orb.vitality -= 0.003 * vulnerabilityMultiplier;

        if (orb.attachmentStyle === "AVOIDANT") {
          orb.socialBattery = Math.min(100, orb.socialBattery + 0.05);
        }
      } else {
        if (orb.attachmentStyle === "SECURE") {
          orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.1);
          orb.socialBattery = Math.min(100, orb.socialBattery + 0.1);
        } else if (orb.attachmentStyle === "ANXIOUS") {
          orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.05);
        } else if (orb.attachmentStyle === "AVOIDANT") {
          orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.05);
        }
      }

      if (
        orb.attachmentStyle === "SECURE" &&
        orb.socialBattery > 50 &&
        orb.lonelinessIndex < 20
      ) {
        orb.vitality = Math.min(100, orb.vitality + 0.05);
      }

      if (orb.socialBattery <= 5 && orb.attachmentStyle !== "BLASE") {
        orb.attachmentStyle = "BLASE";
      }

      orb.x += orb.vx;
      orb.y += orb.vy;

      this.handleBoundaries(orb);
    }
  }

  private sense(orb: Orb): Neighbor[] {
    const neighbors: Neighbor[] = [];
    let closestNeighbor: Neighbor | null = null;
    let minDistance = parseFloat("inf");

    for (const other of this.orbs) {
      if (other.id === orb.id) continue;

      const dx = other.x - orb.x;
      const dy = other.y - orb.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 120) {
        const neighborData = { id: other.id, distance, dx, dy };
        neighbors.push(neighborData);

        if (distance < minDistance) {
          minDistance = distance;
          closestNeighbor = neighborData;
        }
      }
    }

    orb.closestNeighbor = closestNeighbor;
    return neighbors;
  }

  private handleBoundaries(orb: Orb) {
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

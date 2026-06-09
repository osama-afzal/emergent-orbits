import { AttachmentStyle, Neighbor, Orb, Relationship } from "./Orb";

export class Simulation {
  private width: number;
  private height: number;
  private currentFrame: number = 0;

  public orbs: Orb[] = [];
  public selectedOrbId: number | null = null;

  public relationships: Map<string, Relationship> = new Map();

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

  private relKey(a: number, b: number) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  private getOrCreateRelationship(aId: number, bId: number): Relationship {
    const key = this.relKey(aId, bId);
    let rel = this.relationships.get(key);

    if (!rel) {
      rel = {
        aId,
        bId,
        bondStrength: 5,
        stability: 0.2,
        lastInteractionFrame: this.currentFrame,
        interactionCount: 1,
        state: "ACTIVE",
      };
      this.relationships.set(key, rel);
    }

    return rel;
  }

  private getActiveBond(orbId: number): Relationship | null {
    for (const rel of this.relationships.values()) {
      if (
        (rel.aId === orbId || rel.bId === orbId) &&
        (rel.state === "ACTIVE" || rel.state === "STABLE")
      ) {
        return rel;
      }
    }
    return null;
  }

  private updateRelationships() {
    const INTERACTION_RADIUS = 120;
    const DECAY_RATE = 0.02;
    const GROWTH_RATE = 0.08;

    for (const orb of this.orbs) {
      for (const other of this.orbs) {
        if (orb.id >= other.id) continue;

        if (orb.vitality <= 0 || other.vitality <= 0) continue;
        if (
          orb.attachmentStyle === "BLASE" ||
          other.attachmentStyle === "BLASE"
        )
          continue;

        // FIXED: The restrictive 75% entry gates have been completely excised.
        // Avoidant units can now naturally form relationships upon proximity,
        // preventing them from accumulating massive vitality deficits in early frames.

        const dx = other.x - orb.x;
        const dy = other.y - orb.y;
        const dist = Math.hypot(dx, dy);

        const key = this.relKey(orb.id, other.id);
        let rel = this.relationships.get(key);

        const inRange = dist < INTERACTION_RADIUS;

        if (inRange) {
          const existingA = this.getActiveBond(orb.id);
          const existingB = this.getActiveBond(other.id);

          if (
            existingA &&
            existingA.aId !== other.id &&
            existingA.bId !== other.id
          )
            continue;
          if (existingB && existingB.aId !== orb.id && existingB.bId !== orb.id)
            continue;

          rel = this.getOrCreateRelationship(orb.id, other.id);

          rel.interactionCount++;
          rel.lastInteractionFrame = this.currentFrame;
          rel.bondStrength = Math.min(100, rel.bondStrength + GROWTH_RATE);
          rel.stability = Math.min(1, rel.stability + 0.005);

          if (rel.bondStrength > 60 && rel.state !== "STABLE") {
            rel.state = "STABLE";
          }
        }

        if (rel && !inRange) {
          rel.bondStrength -= DECAY_RATE;

          if (rel.stability < 0.3) {
            rel.state = "UNSTABLE";
          }
        }

        if (rel && rel.bondStrength <= 0) {
          this.relationships.delete(key);
        }
      }
    }
  }

  update() {
    this.currentFrame++;

    // 1. Refresh localized sensor radars
    for (const orb of this.orbs) {
      orb.neighbors = this.sense(orb);
    }

    const INTIMATE_ZONE = 30;
    const ISOLATION_ZONE = 95;

    // Smooth slow-burn maximum speed ceiling
    const MAX_SPEED = 1.2;

    // 2. Execute Relationship Database Pipeline
    this.updateRelationships();

    // 3. Main State Evaluation Pass
    for (const orb of this.orbs) {
      if (orb.vitality <= 0) {
        orb.vx = 0;
        orb.vy = 0;
        continue;
      }

      if (orb.isInspected) {
        orb.surveillanceTimer++;
      }

      // Extract current cached targets and records
      const closest = orb.closestNeighbor;
      const currentBond = this.getActiveBond(orb.id);

      // --- 3A. CRITICAL DRIVE RELATIONAL BREAKAWAYS ---
      if (currentBond && orb.attachmentStyle !== "BLASE") {
        const relKey = this.relKey(currentBond.aId, currentBond.bId);
        let shouldShatter = false;

        // Anxious Exhaustion: Intimacy has drained battery below 20%. Must seek isolation to recharge.
        if (orb.attachmentStyle === "ANXIOUS" && orb.socialBattery < 20) {
          shouldShatter = true;
        }

        // Avoidant Relief: Relational contact has cooled loneliness below 25%. Reclaiming autonomy.
        if (orb.attachmentStyle === "AVOIDANT" && orb.lonelinessIndex < 25) {
          shouldShatter = true;
        }

        if (shouldShatter) {
          this.relationships.delete(relKey);

          // Inject a gentle kinetic recoil jolt to physically sling the orb away
          orb.vx += (Math.random() - 0.5) * 1.0;
          orb.vy += (Math.random() - 0.5) * 1.0;

          // Note: Continue removed here to ensure natural frame velocity flow straight down
        }
      }

      let ax = 0;
      let ay = 0;

      // --- 3B. DYNAMIC RELATIONAL STEERING ENGINE ---
      if (closest && orb.attachmentStyle !== "BLASE") {
        // CASE A: STABLE VELOCITY PHASE LOCK (Fluid Binary Star Systems)
        // CASE A: SYNCHRONIZED BINARY ORBIT LOCK (Graceful Star Systems)
        if (
          currentBond &&
          currentBond.state === "STABLE" &&
          (currentBond.aId === closest.id || currentBond.bId === closest.id)
        ) {
          // To rotate in the exact same circular direction, the orbs must use inverse normal vectors.
          // We assign clockwise paths to the lower ID, and counter-clockwise paths to the higher ID.
          const directionSign = orb.id < closest.id ? 1 : -1;

          const perpX = (-closest.dy / closest.distance) * directionSign;
          const perpY = (closest.dx / closest.distance) * directionSign;

          const ORBIT_SPEED = 0.8; // Calibrated circular cruise speed

          const idealDistance = 45;
          const distanceError = closest.distance - idealDistance;
          const springCorrection = distanceError * 0.025; // Gentle anchoring snap

          // Assign velocities directly. They will be cleanly stepped ONCE at the bottom of the loop.
          orb.vx =
            perpX * ORBIT_SPEED +
            (closest.dx / closest.distance) * springCorrection;
          orb.vy =
            perpY * ORBIT_SPEED +
            (closest.dy / closest.distance) * springCorrection;

          // We do not add coordinates here, and we do not call continue.
          // The loop flows naturally, skips the insecure chaser/runner lines, and updates once.
        }

        // CASE B: ACTIVE LINEAR SEEK / FLEE INTENT
        else {
          if (closest.distance < INTIMATE_ZONE) {
            if (
              orb.attachmentStyle === "AVOIDANT" &&
              orb.lonelinessIndex <= 40
            ) {
              ax -= (closest.dx / closest.distance) * 0.25;
              ay -= (closest.dy / closest.distance) * 0.25;
            } else if (orb.attachmentStyle === "ANXIOUS") {
              ax -= (closest.dx / closest.distance) * 0.05;
              ay -= (closest.dy / closest.distance) * 0.05;
            }
          } else if (closest.distance >= ISOLATION_ZONE) {
            if (orb.attachmentStyle === "ANXIOUS" && orb.socialBattery > 85) {
              ax += (closest.dx / closest.distance) * 0.15;
              ay += (closest.dy / closest.distance) * 0.15;
            }
          }

          // Avoidant Survival Chase: Active when loneliness crosses 40
          if (orb.attachmentStyle === "AVOIDANT" && orb.lonelinessIndex > 40) {
            ax += (closest.dx / closest.distance) * 0.25;
            ay += (closest.dy / closest.distance) * 0.25;
          }
        }
      }

      // Gentle ambient noise
      ax += (Math.random() - 0.5) * 0.05;
      ay += (Math.random() - 0.5) * 0.05;

      orb.vx += ax;
      orb.vy += ay;

      const speed = Math.hypot(orb.vx, orb.vy) || 1;
      if (speed > MAX_SPEED) {
        orb.vx = (orb.vx / speed) * MAX_SPEED;
        orb.vy = (orb.vy / speed) * MAX_SPEED;
      }

      orb.x += orb.vx;
      orb.y += orb.vy;

      // --- 3C. RECALIBRATED PSYCHOLOGICAL METRICS ENGINE ---
      if (currentBond) {
        const partnerId =
          currentBond.aId === orb.id ? currentBond.bId : currentBond.aId;
        const partner = this.orbs.find((o) => o.id === partnerId);

        // SECURE IMMUNITY & INFINITE RESONANCE CLAUSE
        if (orb.attachmentStyle === "SECURE") {
          if (partner && partner.attachmentStyle === "SECURE") {
            orb.socialBattery = Math.min(100, orb.socialBattery + 0.1); // Secure-Secure resonance
          } else {
            orb.socialBattery = orb.socialBattery; // Pure tax immunity when shielding insecure units
          }
        } else {
          // Standard relational cost for insecure profiles (Anxious / Avoidant)
          orb.socialBattery = Math.max(0, orb.socialBattery - 0.03);
        }

        // Intimacy successfully clears loneliness indices for all active profiles
        orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.35);
      } else if (closest && closest.distance < INTIMATE_ZONE) {
        // Condition B: Unattached but Crowded
        orb.socialBattery = Math.max(0, orb.socialBattery - 0.2);
        if (orb.attachmentStyle === "ANXIOUS") {
          orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.35);
        }
      } else if (!closest || closest.distance > ISOLATION_ZONE) {
        // Condition C: Unattached and Isolated Void
        orb.lonelinessIndex = Math.min(100, orb.lonelinessIndex + 0.08);

        if (
          orb.attachmentStyle === "AVOIDANT" ||
          orb.attachmentStyle === "ANXIOUS"
        ) {
          orb.socialBattery = Math.min(100, orb.socialBattery + 0.12);
        }
      } else {
        // Condition D: Unattached Sweet Spot
        orb.lonelinessIndex = Math.max(0, orb.lonelinessIndex - 0.25);
        if (
          orb.attachmentStyle === "SECURE" ||
          orb.attachmentStyle === "AVOIDANT"
        ) {
          orb.socialBattery = Math.min(100, orb.socialBattery + 0.1);
        }
      }

      // --- 3D. THE RELATIONSHIP LIFELINE (EXCLUSIVITY VITALITY REPAIR) ---
      if (currentBond) {
        const partnerId =
          currentBond.aId === orb.id ? currentBond.bId : currentBond.aId;
        const partner = this.orbs.find((o) => o.id === partnerId);
        const secureBonus =
          partner && partner.attachmentStyle === "SECURE" ? 2.0 : 1.0;

        // Passively reconstruct core vitality inside the active attachment
        orb.vitality = Math.min(100, orb.vitality + 0.15 * secureBonus);

        if (orb.attachmentStyle === "BLASE" && orb.socialBattery > 40) {
          orb.attachmentStyle = "SECURE";
        }
      } else {
        // The Slow Void Bleed: Isolation drains life-force cleanly away
        orb.vitality = Math.max(0, orb.vitality - 0.03);
      }

      // --- 3E. SYSTEMIC BREAKDOWN CONTRACT ---
      if (orb.socialBattery <= 3 && orb.attachmentStyle !== "BLASE") {
        orb.attachmentStyle = "BLASE";

        // Memory Purge: Instant relationship erasure upon hitting numbness threshold
        for (const [key, rel] of this.relationships.entries()) {
          if (rel.aId === orb.id || rel.bId === orb.id) {
            this.relationships.delete(key);
          }
        }
      }

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

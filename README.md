# Emergent Orbits

A small browser-based particle simulation exploring emergent behavior in simple agent systems.

## Overview

Emergent Orbits is an experimental canvas-based simulation where autonomous "orbs" move in a continuous 2D space following simple rules.

At this stage, the system is intentionally minimal:

- Orbs move with constant velocity
- They wrap around screen edges
- Rendering is done using HTML Canvas
- No interactions or AI yet

The goal is to gradually evolve this into a system with emergent behavior, where complex dynamics arise from simple local rules.

## Tech Stack

- React
- TypeScript
- Vite
- HTML Canvas API

## Current Behavior

Each orb has:

- Position `(x, y)`
- Velocity `(vx, vy)`
- Fixed radius

Each frame:

1. Position is updated using velocity
2. Orbs wrap around screen boundaries
3. All orbs are rendered as circles on a canvas

## Planned Experiments

Future iterations may explore:

- Local neighbor interactions (attraction / repulsion)
- Flocking behavior (Boids-style simulation)
- Energy-based survival systems
- Evolutionary traits (mutation + selection)
- Simple reinforcement learning agents

## Running the Project

```bash
npm install
npm run dev
```

Then open the local dev server shown in the terminal.

## Concept

This project is inspired by classic artificial life simulations and the idea that complex behavior can emerge from simple rules.

The long-term goal is to explore:

> What kinds of "worlds" can emerge from minimal physical and behavioral rules?
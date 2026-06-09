export type AttachmentStyle = 'ANXIOUS' | 'AVOIDANT' | 'SECURE' | 'BLASE';

export interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  
  neighbors?: Neighbor[];
  closestNeighbor?: Neighbor | null;

  attachmentStyle: AttachmentStyle;

  vitality: number;
  socialBattery: number;
  lonelinessIndex: number;

  isInspected: boolean;
  surveillanceTimer: number;
}

export interface Neighbor {
  id: number;
  distance: number;
  dx: number;
  dy: number;
}

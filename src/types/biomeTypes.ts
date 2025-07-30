export interface BiomeStyle {
  id: string;
  name: string;
  description: string;

  // Background colors
  backgroundColor: string;
  wallColor: string;
  wallBorderColor: string;

  // Floor pattern
  floorColor: string;
  floorOpacity: number;
  gridColor: string;
  gridOpacity: number;

  // Ambient particles
  particleColor: string;
  particleCount: number;
  particleSize: number;

  // Additional visual elements
  hasShadows: boolean;
  shadowColor: string;
  shadowOpacity: number;

  // Room-specific elements
  hasVines?: boolean;
  hasCrystals?: boolean;
  hasMoss?: boolean;
  hasSteam?: boolean;
}

export const Biomes: { [key: string]: BiomeStyle } = {
  laboratory: {
    id: "laboratory",
    name: "Laboratory",
    description: "Clean, sterile research environment",
    backgroundColor: "#1e293b",
    wallColor: "#475569",
    wallBorderColor: "#64748b",
    floorColor: "#334155",
    floorOpacity: 0.1,
    gridColor: "#94a3b8",
    gridOpacity: 0.2,
    particleColor: "#94a3b8",
    particleCount: 15,
    particleSize: 2,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },

  forest: {
    id: "forest",
    name: "Forest Biome",
    description: "Natural woodland environment",
    backgroundColor: "#1b4332",
    wallColor: "#2d5a3d",
    wallBorderColor: "#40916c",
    floorColor: "#2d5a3d",
    floorOpacity: 0.15,
    gridColor: "#74c69d",
    gridOpacity: 0.25,
    particleColor: "#95d5b2",
    particleCount: 20,
    particleSize: 3,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    hasVines: true,
    hasMoss: true,
  },

  cave: {
    id: "cave",
    name: "Cave System",
    description: "Dark, rocky underground environment",
    backgroundColor: "#1a1a1a",
    wallColor: "#2d2d2d",
    wallBorderColor: "#404040",
    floorColor: "#262626",
    floorOpacity: 0.2,
    gridColor: "#666666",
    gridOpacity: 0.3,
    particleColor: "#888888",
    particleCount: 12,
    particleSize: 2,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    hasCrystals: true,
  },

  swamp: {
    id: "swamp",
    name: "Swamp",
    description: "Wet, murky wetland environment",
    backgroundColor: "#1a2e1a",
    wallColor: "#2d4d2d",
    wallBorderColor: "#3d5a3d",
    floorColor: "#2d4d2d",
    floorOpacity: 0.25,
    gridColor: "#6b8e6b",
    gridOpacity: 0.35,
    particleColor: "#8fbc8f",
    particleCount: 25,
    particleSize: 2,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    hasSteam: true,
    hasMoss: true,
  },

  desert: {
    id: "desert",
    name: "Desert",
    description: "Arid, sandy environment",
    backgroundColor: "#fef3c7",
    wallColor: "#f59e0b",
    wallBorderColor: "#d97706",
    floorColor: "#fbbf24",
    floorOpacity: 0.3,
    gridColor: "#f59e0b",
    gridOpacity: 0.4,
    particleColor: "#fbbf24",
    particleCount: 30,
    particleSize: 1,
    hasShadows: false,
    shadowColor: "#000",
    shadowOpacity: 0,
  },

  arctic: {
    id: "arctic",
    name: "Arctic",
    description: "Cold, icy environment",
    backgroundColor: "#f0f9ff",
    wallColor: "#e0f2fe",
    wallBorderColor: "#bae6fd",
    floorColor: "#e0f2fe",
    floorOpacity: 0.2,
    gridColor: "#7dd3fc",
    gridOpacity: 0.3,
    particleColor: "#bae6fd",
    particleCount: 18,
    particleSize: 2,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    hasCrystals: true,
  },

  volcanic: {
    id: "volcanic",
    name: "Volcanic",
    description: "Hot, fiery environment",
    backgroundColor: "#450a0a",
    wallColor: "#7f1d1d",
    wallBorderColor: "#dc2626",
    floorColor: "#7f1d1d",
    floorOpacity: 0.3,
    gridColor: "#ef4444",
    gridOpacity: 0.4,
    particleColor: "#fca5a5",
    particleCount: 35,
    particleSize: 2,
    hasShadows: true,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    hasSteam: true,
  },
};

export type BiomeType = keyof typeof Biomes;

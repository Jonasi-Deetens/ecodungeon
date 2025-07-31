import {
  Room,
  IEntity,
  Plant,
  Herbivore,
  Carnivore,
  Position,
  EcosystemHealth,
} from "../types/gameTypes";

// Room difficulty levels
export const RoomDifficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export type RoomDifficultyValue =
  (typeof RoomDifficulty)[keyof typeof RoomDifficulty];

// Room configuration interface
export interface RoomConfig {
  id: string;
  name: string;
  difficulty: RoomDifficultyValue;
  biome: string;
  description: string;
  roomSize: {
    width: number;
    height: number;
  };
  creatureTypes: {
    plants: string[];
    herbivores: string[];
    carnivores: string[];
  };
  ecosystemSettings: {
    initialHealth: (typeof EcosystemHealth)[keyof typeof EcosystemHealth];
    growthRate: number;
    reproductionRate: number;
    hostilityLevel: number; // 0-10 scale
  };
  factionSettings: {
    hasFactions: boolean;
    factionCount: number;
    hostilityLevel: number; // 0-10 scale
  };
}

export class RoomController {
  private roomConfigs: Map<string, RoomConfig> = new Map();
  private activeRooms: Map<string, Room> = new Map();

  constructor() {
    this.initializeRoomConfigs();
  }

  // Initialize room configurations for different biomes
  private initializeRoomConfigs(): void {
    // Forest rooms (Easy) - Starting zone - Small size
    const forestConfig: RoomConfig = {
      id: "forest",
      name: "Ancient Forest",
      difficulty: RoomDifficulty.EASY,
      biome: "forest",
      description:
        "A peaceful forest with gentle creatures and a balanced ecosystem.",
      roomSize: {
        width: 800, // Small rooms - 1.6x grid size
        height: 600,
      },
      creatureTypes: {
        plants: ["moss", "fern", "mushroom", "flower"],
        herbivores: ["rabbit", "deer", "squirrel"],
        carnivores: ["fox", "owl"],
      },
      ecosystemSettings: {
        initialHealth: EcosystemHealth.GOOD,
        growthRate: 1.0,
        reproductionRate: 1.0,
        hostilityLevel: 2, // Very low hostility
      },
      factionSettings: {
        hasFactions: false,
        factionCount: 0,
        hostilityLevel: 1,
      },
    };

    // Desert rooms (Medium) - Second zone - Medium size
    const desertConfig: RoomConfig = {
      id: "desert",
      name: "Scorched Wasteland",
      difficulty: RoomDifficulty.MEDIUM,
      biome: "desert",
      description:
        "A harsh desert environment with resilient creatures and scarce resources.",
      roomSize: {
        width: 1200, // Medium rooms - 2.4x grid size
        height: 800,
      },
      creatureTypes: {
        plants: ["cactus", "desert_flower", "dry_grass"],
        herbivores: ["lizard", "snake", "scorpion"],
        carnivores: ["vulture", "coyote"],
      },
      ecosystemSettings: {
        initialHealth: EcosystemHealth.FAIR,
        growthRate: 0.7,
        reproductionRate: 0.8,
        hostilityLevel: 5, // Medium hostility
      },
      factionSettings: {
        hasFactions: true,
        factionCount: 2,
        hostilityLevel: 5,
      },
    };

    // Laboratory rooms (Hard) - Third zone - Large size
    const laboratoryConfig: RoomConfig = {
      id: "laboratory",
      name: "Abandoned Laboratory",
      difficulty: RoomDifficulty.HARD,
      biome: "laboratory",
      description:
        "A dangerous lab with mutated creatures and unstable ecosystems.",
      roomSize: {
        width: 1600, // Large rooms - 3.2x grid size
        height: 1200,
      },
      creatureTypes: {
        plants: ["mutated_moss", "glowing_fungus", "toxic_plant"],
        herbivores: ["mutated_rat", "glowing_worm"],
        carnivores: ["mutated_spider", "toxic_slime"],
      },
      ecosystemSettings: {
        initialHealth: EcosystemHealth.CRITICAL,
        growthRate: 1.8, // Very fast but very unstable
        reproductionRate: 1.5,
        hostilityLevel: 10, // Maximum hostility
      },
      factionSettings: {
        hasFactions: true,
        factionCount: 5,
        hostilityLevel: 10,
      },
    };

    // Store only the 3 progressive zone configurations
    this.roomConfigs.set("forest", forestConfig);
    this.roomConfigs.set("desert", desertConfig);
    this.roomConfigs.set("laboratory", laboratoryConfig);
  }

  // Get room configuration by biome
  public getRoomConfig(biome: string): RoomConfig | undefined {
    return this.roomConfigs.get(biome);
  }

  // Get all room configurations
  public getAllRoomConfigs(): RoomConfig[] {
    return Array.from(this.roomConfigs.values());
  }

  // Register a room with the controller
  public registerRoom(room: Room): void {
    this.activeRooms.set(room.id, room);
  }

  // Get room by ID
  public getRoom(roomId: string): Room | undefined {
    return this.activeRooms.get(roomId);
  }

  // Get all active rooms
  public getAllRooms(): Room[] {
    return Array.from(this.activeRooms.values());
  }

  // Populate a room with zone-specific creatures
  public populateRoom(room: Room): void {
    const config = this.getRoomConfig(room.biome);
    if (!config) {
      console.warn(`No configuration found for biome: ${room.biome}`);
      return;
    }

    const entities: IEntity[] = [];

    // Add plants based on biome
    const plantCount = 5 + Math.random() * 10;
    for (let i = 0; i < plantCount; i++) {
      const plantType =
        config.creatureTypes.plants[
          Math.floor(Math.random() * config.creatureTypes.plants.length)
        ];
      const plant = new Plant(
        `plant_${room.id}_${i}`,
        new Position(
          room.x + Math.random() * room.width,
          room.y + Math.random() * room.height
        ),
        plantType,
        room.id
      );
      entities.push(plant);
    }

    // Add herbivores based on biome and difficulty
    const herbivoreCount = 3 + Math.random() * 5;
    for (let i = 0; i < herbivoreCount; i++) {
      const herbivoreType =
        config.creatureTypes.herbivores[
          Math.floor(Math.random() * config.creatureTypes.herbivores.length)
        ];
      const herbivore = new Herbivore(
        `herbivore_${room.id}_${i}`,
        new Position(
          room.x + Math.random() * room.width,
          room.y + Math.random() * room.height
        ),
        herbivoreType,
        room.id
      );
      entities.push(herbivore);
    }

    // Add carnivores based on hostility level
    const carnivoreCount = Math.max(
      1,
      Math.floor(config.ecosystemSettings.hostilityLevel / 2)
    );
    for (let i = 0; i < carnivoreCount; i++) {
      const carnivoreType =
        config.creatureTypes.carnivores[
          Math.floor(Math.random() * config.creatureTypes.carnivores.length)
        ];
      const carnivore = new Carnivore(
        `carnivore_${room.id}_${i}`,
        new Position(
          room.x + Math.random() * room.width,
          room.y + Math.random() * room.height
        ),
        carnivoreType,
        room.id
      );
      entities.push(carnivore);
    }

    room.entities = entities;
  }

  // Update room ecosystem based on its configuration
  public updateRoomEcosystem(room: Room, deltaTime: number): void {
    const config = this.getRoomConfig(room.biome);
    if (!config) return;

    // Apply biome-specific growth rates
    room.entities.forEach((entity) => {
      if (entity instanceof Plant) {
        // Plants grow faster in some biomes
        entity.health = Math.min(
          entity.maxHealth,
          entity.health + config.ecosystemSettings.growthRate * deltaTime * 0.1
        );
      }
    });
  }

  // Get room difficulty
  public getRoomDifficulty(room: Room): RoomDifficultyValue {
    const config = this.getRoomConfig(room.biome);
    return config?.difficulty || RoomDifficulty.EASY;
  }

  // Get room hostility level
  public getRoomHostilityLevel(room: Room): number {
    const config = this.getRoomConfig(room.biome);
    return config?.ecosystemSettings.hostilityLevel || 1;
  }

  // Check if room has factions
  public hasFactions(room: Room): boolean {
    const config = this.getRoomConfig(room.biome);
    return config?.factionSettings.hasFactions || false;
  }

  // Get room description
  public getRoomDescription(room: Room): string {
    const config = this.getRoomConfig(room.biome);
    return config?.description || "An unknown area.";
  }

  // Get room name
  public getRoomName(room: Room): string {
    const config = this.getRoomConfig(room.biome);
    return config?.name || "Unknown Room";
  }

  // Get room size configuration
  public getRoomSize(biome: string): { width: number; height: number } {
    const config = this.getRoomConfig(biome);
    return config?.roomSize || { width: 500, height: 500 };
  }

  // Get progressive zone order
  public getZoneOrder(): string[] {
    return ["forest", "desert", "laboratory"];
  }

  // Check if a zone is unlocked based on player progress
  public isZoneUnlocked(biome: string, playerLevel: number): boolean {
    const zoneOrder = this.getZoneOrder();
    const zoneIndex = zoneOrder.indexOf(biome);

    if (zoneIndex === -1) return false; // Unknown zone

    // Forest is always unlocked
    if (zoneIndex === 0) return true;

    // Desert unlocked at level 5
    if (zoneIndex === 1) return playerLevel >= 5;

    // Laboratory unlocked at level 10
    if (zoneIndex === 2) return playerLevel >= 10;

    return false;
  }
}

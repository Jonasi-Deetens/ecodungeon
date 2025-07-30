import {
  Position,
  Plant,
  Herbivore,
  Carnivore,
  EntityType,
} from "../types/gameTypes";
import { BiomeType, Biomes } from "../types/biomeTypes";

export interface RoomTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  plantCount: number;
  herbivoreCount: number;
  carnivoreCount: number;
  herbivoreTypes: string[];
  carnivoreTypes: string[];
  plantTypes: string[];
  difficulty: "easy" | "medium" | "hard";
  description: string;
  biome: BiomeType;
}

export class RoomFactory {
  private static roomTemplates: RoomTemplate[] = [
    {
      id: "starter_room",
      name: "Starter Laboratory",
      width: 3000,
      height: 1500,
      plantCount: 20,
      herbivoreCount: 12,
      carnivoreCount: 6,
      herbivoreTypes: ["rabbit"],
      carnivoreTypes: ["rat"],
      plantTypes: ["moss"],
      difficulty: "easy",
      description: "A basic laboratory room with simple ecosystem",
      biome: "laboratory",
    },
    {
      id: "forest_room",
      name: "Forest Chamber",
      width: 4000,
      height: 2000,
      plantCount: 30,
      herbivoreCount: 18,
      carnivoreCount: 9,
      herbivoreTypes: ["rabbit", "deer"],
      carnivoreTypes: ["rat", "wolf"],
      plantTypes: ["moss", "grass"],
      difficulty: "medium",
      description: "A natural forest environment with diverse ecosystem",
      biome: "forest",
    },
    {
      id: "cave_room",
      name: "Cave System",
      width: 5000,
      height: 2500,
      plantCount: 25,
      herbivoreCount: 20,
      carnivoreCount: 12,
      herbivoreTypes: ["rabbit", "mouse"],
      carnivoreTypes: ["rat", "snake"],
      plantTypes: ["moss", "fern"],
      difficulty: "hard",
      description: "A dark cave environment with unique species",
      biome: "cave",
    },
    {
      id: "swamp_room",
      name: "Swamp Environment",
      width: 4500,
      height: 2200,
      plantCount: 35,
      herbivoreCount: 15,
      carnivoreCount: 10,
      herbivoreTypes: ["rabbit"],
      carnivoreTypes: ["rat", "snake"],
      plantTypes: ["moss", "grass"],
      difficulty: "medium",
      description: "A murky swamp with dense vegetation",
      biome: "swamp",
    },
    {
      id: "desert_room",
      name: "Desert Chamber",
      width: 5000,
      height: 2500,
      plantCount: 15,
      herbivoreCount: 12,
      carnivoreCount: 8,
      herbivoreTypes: ["rabbit", "mouse"],
      carnivoreTypes: ["rat", "snake"],
      plantTypes: ["grass"],
      difficulty: "medium",
      description: "A hot desert environment with sparse life",
      biome: "desert",
    },
    {
      id: "arctic_room",
      name: "Arctic Environment",
      width: 4000,
      height: 2000,
      plantCount: 10,
      herbivoreCount: 8,
      carnivoreCount: 6,
      herbivoreTypes: ["rabbit"],
      carnivoreTypes: ["rat", "wolf"],
      plantTypes: ["moss"],
      difficulty: "hard",
      description: "A cold arctic environment with limited life",
      biome: "arctic",
    },
    {
      id: "volcanic_room",
      name: "Volcanic Chamber",
      width: 5000,
      height: 2500,
      plantCount: 20,
      herbivoreCount: 10,
      carnivoreCount: 8,
      herbivoreTypes: ["rabbit"],
      carnivoreTypes: ["rat", "snake"],
      plantTypes: ["moss"],
      difficulty: "hard",
      description: "A hot volcanic environment with extreme conditions",
      biome: "volcanic",
    },
  ];

  static getRoomTemplate(templateId: string): RoomTemplate | null {
    return (
      this.roomTemplates.find((template) => template.id === templateId) || null
    );
  }

  static getAllTemplates(): RoomTemplate[] {
    return this.roomTemplates;
  }

  static generateRoom(
    templateId: string,
    worldX: number,
    worldY: number,
    worldWidth: number = 30000,
    worldHeight: number = 30000,
    roomId: string = ""
  ) {
    const template = this.getRoomTemplate(templateId);
    if (!template) {
      throw new Error(`Room template '${templateId}' not found`);
    }

    // Use the actual room dimensions from DungeonGenerator
    const actualRoomWidth = 4000;  // DungeonGenerator.ROOM_WIDTH
    const actualRoomHeight = 2000; // DungeonGenerator.ROOM_HEIGHT

    // Ensure room fits within world bounds
    const maxX = worldWidth - actualRoomWidth - 1000;
    const maxY = worldHeight - actualRoomHeight - 1000;
    const roomX = Math.max(1000, Math.min(maxX, worldX));
    const roomY = Math.max(1000, Math.min(maxY, worldY));

    const entities: any[] = [];

    // Generate plants - use actual room dimensions for positioning
    for (let i = 0; i < template.plantCount; i++) {
      const plantType =
        template.plantTypes[
          Math.floor(Math.random() * template.plantTypes.length)
        ];
      const x = roomX + 100 + Math.random() * (actualRoomWidth - 200);
      const y = roomY + 100 + Math.random() * (actualRoomHeight - 200);
      const plant = new Plant(
        `plant_${templateId}_${i}`,
        new Position(x, y),
        plantType,
        roomId
      );
      entities.push(plant);
    }

    // Generate herbivores - use actual room dimensions for positioning
    for (let i = 0; i < template.herbivoreCount; i++) {
      const herbivoreType =
        template.herbivoreTypes[
          Math.floor(Math.random() * template.herbivoreTypes.length)
        ];
      const x = roomX + 100 + Math.random() * (actualRoomWidth - 200);
      const y = roomY + 100 + Math.random() * (actualRoomHeight - 200);
      const herbivore = new Herbivore(
        `herbivore_${templateId}_${i}`,
        new Position(x, y),
        herbivoreType,
        roomId
      );
      entities.push(herbivore);
    }

    // Generate carnivores - use actual room dimensions for positioning
    for (let i = 0; i < template.carnivoreCount; i++) {
      const carnivoreType =
        template.carnivoreTypes[
          Math.floor(Math.random() * template.carnivoreTypes.length)
        ];
      const x = roomX + 100 + Math.random() * (actualRoomWidth - 200);
      const y = roomY + 100 + Math.random() * (actualRoomHeight - 200);
      const carnivore = new Carnivore(
        `carnivore_${templateId}_${i}`,
        new Position(x, y),
        carnivoreType,
        roomId
      );
      entities.push(carnivore);
    }

    return {
      id: roomId || `${templateId}_${Date.now()}`,
      x: roomX,
      y: roomY,
      width: actualRoomWidth,  // Use actual room dimensions
      height: actualRoomHeight, // Use actual room dimensions
      entities,
      template,
      biome: template.biome,
    };
  }

  static generateRandomRoom(
    worldX: number,
    worldY: number,
    roomId: string = ""
  ): any {
    const templates = this.getAllTemplates();
    if (templates.length === 0) {
      throw new Error("No room templates available");
    }
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)]!;
    return this.generateRoom(
      randomTemplate.id,
      worldX,
      worldY,
      30000,
      30000,
      roomId
    );
  }
}

import { Room, Teleporter } from "../types/gameTypes";
import { RoomFactory } from "./RoomFactory";
import { RoomController } from "../controllers/RoomController";

export interface DungeonRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  biome: string;
  connections: {
    [key: string]: string | undefined;
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  };
  roomData: any;
}

export class DungeonGenerator {
  private static readonly roomController = new RoomController();
  // Use a consistent grid size for positioning, but rooms can have different actual sizes
  private static readonly GRID_SIZE = 500; // Base grid size

  static generateDungeon(): Room[] {
    const rooms: DungeonRoom[] = [];

    // Create exactly 3 progressive zones in order: Forest -> Desert -> Laboratory
    const zoneConfigs = [
      { x: 0, y: 0, biome: "forest", template: "forest_room" },
      { x: 1, y: 0, biome: "desert", template: "desert_room" },
      { x: 3, y: 0, biome: "laboratory", template: "laboratory_room" }, // Skip space for larger desert room
    ];

    // Create each zone with proper positioning
    let currentX = 0;
    zoneConfigs.forEach((config, index) => {
      const room = this.createRoom(config.x, config.y, config.template);

      // Position room based on accumulated width of previous rooms
      room.x = currentX;
      room.y = config.y * this.GRID_SIZE;

      rooms.push(room);

      // Connect to previous room if not the first
      if (index > 0) {
        const previousRoom = rooms[index - 1];
        if (previousRoom) {
          this.connectRooms(previousRoom, room, "east");
        }
      }

      // Update currentX for next room positioning
      currentX += room.width;
    });

    // Convert to Room objects with teleporters
    return this.convertToRooms(rooms);
  }

  private static createRoom(
    x: number,
    y: number,
    templateId: string
  ): DungeonRoom {
    const roomId = `room_${x}_${y}`;

    // Extract biome from template ID (e.g., "forest_room" -> "forest")
    const biome = templateId.replace("_room", "");

    // Create room data with the specific biome
    const roomData = RoomFactory.generateRandomRoom(0, 0, roomId);
    roomData.biome = biome; // Override the random biome with the specific one

    // Get room size based on biome
    const roomSize = this.roomController.getRoomSize(biome);

    // Position will be set by the calling code based on room sizes
    return {
      id: roomId,
      x: 0, // Will be set by calling code
      y: 0, // Will be set by calling code
      width: roomSize.width,
      height: roomSize.height,
      biome: biome,
      connections: {},
      roomData: roomData,
    };
  }

  private static getAdjacentPosition(
    x: number,
    y: number,
    direction: string
  ): [number, number] {
    switch (direction) {
      case "north":
        return [x, y - 1];
      case "south":
        return [x, y + 1];
      case "east":
        return [x + 1, y];
      case "west":
        return [x - 1, y];
      default:
        return [x, y];
    }
  }

  private static connectRooms(
    room1: DungeonRoom,
    room2: DungeonRoom,
    direction: string
  ) {
    const oppositeDirection = this.getOppositeDirection(direction);

    room1.connections[direction] = room2.id;
    room2.connections[oppositeDirection] = room1.id;
  }

  private static getOppositeDirection(direction: string): string {
    switch (direction) {
      case "north":
        return "south";
      case "south":
        return "north";
      case "east":
        return "west";
      case "west":
        return "east";
      default:
        return direction;
    }
  }

  private static convertToRooms(dungeonRooms: DungeonRoom[]): Room[] {
    return dungeonRooms.map((dungeonRoom) => {
      const teleporters: Teleporter[] = [];

      // Create teleporters for each connection (positioned with padding from room edges)
      const teleporterPadding = 50; // Padding from room edges

      if (dungeonRoom.connections.north) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_north`,
          x: dungeonRoom.x + dungeonRoom.width / 2 - 50,
          y: dungeonRoom.y + teleporterPadding, // Teleporter with padding from top edge
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.north,
          direction: "north" as const,
        });
      }

      if (dungeonRoom.connections.south) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_south`,
          x: dungeonRoom.x + dungeonRoom.width / 2 - 50,
          y: dungeonRoom.y + dungeonRoom.height - 100 - teleporterPadding, // Teleporter with padding from bottom edge
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.south,
          direction: "south" as const,
        });
      }

      if (dungeonRoom.connections.east) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_east`,
          x: dungeonRoom.x + dungeonRoom.width - 100 - teleporterPadding, // Teleporter with padding from right edge
          y: dungeonRoom.y + dungeonRoom.height / 2 - 50,
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.east,
          direction: "east" as const,
        });
      }

      if (dungeonRoom.connections.west) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_west`,
          x: dungeonRoom.x + teleporterPadding, // Teleporter with padding from left edge
          y: dungeonRoom.y + dungeonRoom.height / 2 - 50,
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.west,
          direction: "west" as const,
        });
      }

      return {
        id: dungeonRoom.id,
        x: dungeonRoom.x,
        y: dungeonRoom.y,
        width: dungeonRoom.width,
        height: dungeonRoom.height,
        biome: dungeonRoom.biome,
        entities: dungeonRoom.roomData.entities,
        teleporters,
      };
    });
  }
}

import { Room, Teleporter } from "../types/gameTypes";
import { RoomFactory } from "./RoomFactory";

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
  private static readonly ROOM_WIDTH = 4000;
  private static readonly ROOM_HEIGHT = 2000;

  static generateDungeon(): Room[] {
    const rooms: DungeonRoom[] = [];
    const grid: { [key: string]: DungeonRoom } = {};

    // Start with a central room
    const startRoom = this.createRoom(0, 0, "starter_room");
    rooms.push(startRoom);
    grid["0,0"] = startRoom;

    // Generate a branching path of rooms
    const roomCount = 6; // Total rooms to generate
    let attempts = 0;
    const maxAttempts = 100;

    while (rooms.length < roomCount && attempts < maxAttempts) {
      attempts++;

      // Pick a random existing room to branch from
      const sourceRoom = rooms[Math.floor(Math.random() * rooms.length)];
      if (!sourceRoom) continue;

      const directions = this.getAvailableDirections(sourceRoom, grid);

      if (directions.length === 0) continue;

      // Pick a random direction
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
      if (!direction) continue;

      // Extract grid coordinates from room ID (format: room_x_y)
      const roomIdParts = sourceRoom.id.split("_");
      const gridX = parseInt(roomIdParts[1] || "0");
      const gridY = parseInt(roomIdParts[2] || "0");

      const [newX, newY] = this.getAdjacentPosition(gridX, gridY, direction);

      // Only allow positive coordinates
      if (newX < 0 || newY < 0) continue;

      const gridKey = `${newX},${newY}`;

      // Check if position is already occupied
      if (grid[gridKey]) continue;

      // Create new room
      const roomTemplate = this.getRandomRoomTemplate();
      const newRoom = this.createRoom(newX, newY, roomTemplate);

      // Connect the rooms
      this.connectRooms(sourceRoom, newRoom, direction);

      rooms.push(newRoom);
      grid[gridKey] = newRoom;
    }

    // Convert to Room objects with doors
    return this.convertToRooms(rooms);
  }

  private static createRoom(
    x: number,
    y: number,
    templateId: string
  ): DungeonRoom {
    const worldX = x * this.ROOM_WIDTH;
    const worldY = y * this.ROOM_HEIGHT;
    const roomId = `room_${x}_${y}`;

    const roomData = RoomFactory.generateRandomRoom(worldX, worldY, roomId);

    return {
      id: roomId,
      x: worldX,
      y: worldY,
      width: this.ROOM_WIDTH,
      height: this.ROOM_HEIGHT,
      biome: roomData.biome,
      connections: {},
      roomData: roomData,
    };
  }

  private static getRandomRoomTemplate(): string {
    const templates = [
      "forest_room",
      "cave_room",
      "swamp_room",
      "desert_room",
      "arctic_room",
      "volcanic_room",
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template || "forest_room";
  }

  private static getAvailableDirections(
    room: DungeonRoom,
    grid: { [key: string]: DungeonRoom }
  ): string[] {
    const directions = [];

    // Extract grid coordinates from room ID
    const roomIdParts = room.id.split("_");
    const gridX = parseInt(roomIdParts[1] || "0");
    const gridY = parseInt(roomIdParts[2] || "0");

    const positions = [
      { dir: "north", x: gridX, y: gridY - 1 },
      { dir: "south", x: gridX, y: gridY + 1 },
      { dir: "east", x: gridX + 1, y: gridY },
      { dir: "west", x: gridX - 1, y: gridY },
    ];

    for (const pos of positions) {
      // Only allow positive coordinates
      if (pos.x < 0 || pos.y < 0) continue;

      const gridKey = `${pos.x},${pos.y}`;
      if (!grid[gridKey]) {
        directions.push(pos.dir);
      }
    }

    return directions;
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

      // Create teleporters for each connection (positioned at room edges)
      if (dungeonRoom.connections.north) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_north`,
          x: dungeonRoom.x + dungeonRoom.width / 2 - 50,
          y: dungeonRoom.y + 100, // Teleporter 100px from the top edge of the room
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
          y: dungeonRoom.y + dungeonRoom.height - 200, // Teleporter 100px from the bottom edge of the room
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.south,
          direction: "south" as const,
        });
      }

      if (dungeonRoom.connections.east) {
        teleporters.push({
          id: `teleporter_${dungeonRoom.id}_east`,
          x: dungeonRoom.x + dungeonRoom.width - 200, // Teleporter 100px from the right edge of the room
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
          x: dungeonRoom.x + 100, // Teleporter 100px from the left edge of the room
          y: dungeonRoom.y + dungeonRoom.height / 2 - 50,
          width: 100,
          height: 100,
          connectedRoomId: dungeonRoom.connections.west,
          direction: "west" as const,
        });
      }

      console.log(`Room ${dungeonRoom.id}:`, {
        position: { x: dungeonRoom.x, y: dungeonRoom.y },
        size: { width: dungeonRoom.width, height: dungeonRoom.height },
        teleporters: teleporters.map((t) => ({
          id: t.id,
          position: { x: t.x, y: t.y },
          direction: t.direction,
        })),
      });

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

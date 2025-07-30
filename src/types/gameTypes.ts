// Core entity types for the eco-dungeon
export const EntityType = {
  PLANT: "plant",
  HERBIVORE: "herbivore",
  CARNIVORE: "carnivore",
  DECOMPOSER: "decomposer",
  PLAYER: "player",
  RESOURCE: "resource",
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

// Ecosystem health levels
export const EcosystemHealth = {
  CRITICAL: "critical",
  POOR: "poor",
  FAIR: "fair",
  GOOD: "good",
  EXCELLENT: "excellent",
} as const;

export type EcosystemHealthValue =
  (typeof EcosystemHealth)[keyof typeof EcosystemHealth];

// Player actions that can affect the ecosystem
export const PlayerAction = {
  MOVE: "move",
  GATHER: "gather",
  ATTACK: "attack",
  PLANT: "plant",
  OBSERVE: "observe",
  RESTORE: "restore",
} as const;

export type PlayerActionValue =
  (typeof PlayerAction)[keyof typeof PlayerAction];

// Entity states
export const EntityState = {
  ALIVE: "alive",
  DEAD: "dead",
  DECAYING: "decaying",
  GROWING: "growing",
  REPRODUCING: "reproducing",
  HUNTING: "hunting",
  FLEEING: "fleeing",
} as const;

export type EntityStateValue = (typeof EntityState)[keyof typeof EntityState];

// Position in the dungeon world (free movement)
export class Position {
  constructor(public x: number, public y: number) {}

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  distanceTo(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Manhattan distance for grid-like calculations
  manhattanDistance(other: Position): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
}

// Base entity interface
export interface IEntity {
  id: string;
  type: EntityTypeValue;
  position: Position;
  health: number;
  maxHealth: number;
  state: EntityStateValue;
  age: number;
  energy: number;
  maxEnergy: number;
  roomId: string; // Which room this entity belongs to
  update(deltaTime: number): void;
  canReproduce(): boolean;
}

// Base entity class
export abstract class Entity implements IEntity {
  public id: string;
  public type: EntityTypeValue;
  public position: Position;
  public health: number;
  public maxHealth: number;
  public state: EntityStateValue;
  public age: number;
  public energy: number;
  public maxEnergy: number;
  public roomId: string;

  constructor(
    id: string,
    type: EntityTypeValue,
    position: Position,
    health: number = 100,
    roomId: string = ""
  ) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.health = health;
    this.maxHealth = health;
    this.state = EntityState.ALIVE;
    this.age = 0;
    this.energy = 100;
    this.maxEnergy = 100;
    this.roomId = roomId;
  }

  update(deltaTime: number): void {
    this.age += deltaTime;
    this.energy = Math.max(0, this.energy - deltaTime * 0.1);

    if (this.energy <= 0) {
      this.health = Math.max(0, this.health - deltaTime * 0.5);
    }

    if (this.health <= 0 && this.state !== EntityState.DEAD) {
      this.state = EntityState.DEAD;
    }
  }

  canReproduce(): boolean {
    return (
      this.state === EntityState.ALIVE &&
      this.health > this.maxHealth * 0.7 &&
      this.energy > this.maxEnergy * 0.8
    );
  }
}

// Plant entity interface
export interface IPlant extends IEntity {
  species: string;
  growthRate: number;
  reproductionRate: number;
  oxygenProduction: number;
  foodValue: number;
}

// Plant entity
export class Plant extends Entity implements IPlant {
  public species: string;
  public growthRate: number;
  public reproductionRate: number;
  public oxygenProduction: number;
  public foodValue: number;

  constructor(
    id: string,
    position: Position,
    species: string = "moss",
    roomId: string = ""
  ) {
    super(id, EntityType.PLANT, position, 50, roomId);
    this.species = species;
    this.growthRate = 0.05; // Reduced growth rate
    this.reproductionRate = 0.0003; // Adjusted for 30 FPS (0.01/30)
    this.oxygenProduction = 1;
    this.foodValue = 10;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.health = Math.min(
        this.maxHealth,
        this.health + this.growthRate * deltaTime
      );

      // Reproduce occasionally (much less frequently)
      if (
        this.canReproduce() &&
        Math.random() < this.reproductionRate * deltaTime
      ) {
        this.state = EntityState.REPRODUCING;
      }
    }
  }
}

// Herbivore entity interface
export interface IHerbivore extends IEntity {
  species: string;
  speed: number;
  hunger: number;
  maxHunger: number;
  reproductionRate: number;
  foodValue: number;
  eat(food: IPlant): void;
}

// Herbivore entity
export class Herbivore extends Entity implements IHerbivore {
  public species: string;
  public speed: number;
  public hunger: number;
  public maxHunger: number;
  public reproductionRate: number;
  public foodValue: number;

  constructor(
    id: string,
    position: Position,
    species: string = "rabbit",
    roomId: string = ""
  ) {
    super(id, EntityType.HERBIVORE, position, 60, roomId);
    this.species = species;
    this.speed = 3; // Fast for escaping predators
    this.hunger = 0;
    this.maxHunger = 80;
    this.reproductionRate = 0.00027; // Adjusted for 30 FPS (0.008/30)
    this.foodValue = 20;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.hunger += deltaTime * 2.0; // Much faster hunger increase for testing

      if (this.hunger > this.maxHunger) {
        this.health -= deltaTime * 0.5;
      }

      // Reproduce when well-fed (much less frequently)
      if (
        this.canReproduce() &&
        this.hunger < this.maxHunger * 0.3 &&
        Math.random() < this.reproductionRate * deltaTime
      ) {
        this.state = EntityState.REPRODUCING;
      }
    }
  }

  eat(food: IPlant): void {
    this.hunger = Math.max(0, this.hunger - food.foodValue);
    this.health = Math.min(this.maxHealth, this.health + food.foodValue * 0.5);
  }
}

// Carnivore entity interface
export interface ICarnivore extends IEntity {
  species: string;
  speed: number;
  hunger: number;
  maxHunger: number;
  attackPower: number;
  reproductionRate: number;
  hunt(prey: IHerbivore): void;
}

// Carnivore entity
export class Carnivore extends Entity implements ICarnivore {
  public species: string;
  public speed: number;
  public hunger: number;
  public maxHunger: number;
  public attackPower: number;
  public reproductionRate: number;

  constructor(
    id: string,
    position: Position,
    species: string = "rat",
    roomId: string = ""
  ) {
    super(id, EntityType.CARNIVORE, position, 100, roomId);
    this.species = species;
    this.speed = 2.5; // Rats are fast and agile
    this.hunger = 0;
    this.maxHunger = 60;
    this.attackPower = 25;
    this.reproductionRate = 0.0002; // Adjusted for 30 FPS (0.006/30)
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.hunger += deltaTime * 1.5; // Much faster hunger increase for testing

      if (this.hunger > this.maxHunger) {
        this.health -= deltaTime * 0.3;
      }

      // Reproduce when well-fed (much less frequently)
      if (
        this.canReproduce() &&
        this.hunger < this.maxHunger * 0.4 &&
        Math.random() < this.reproductionRate * deltaTime
      ) {
        this.state = EntityState.REPRODUCING;
      }
    }
  }

  hunt(prey: IHerbivore): void {
    if (prey.state === EntityState.ALIVE) {
      prey.health -= this.attackPower;
      this.hunger = Math.max(0, this.hunger - prey.foodValue);
      this.health = Math.min(
        this.maxHealth,
        this.health + prey.foodValue * 0.3
      );
    }
  }
}

// Player entity interface
export interface IPlayer extends IEntity {
  inventory: IEntity[];
  ecoImpact: number;
  observationSkill: number;
  restorationSkill: number;
  characterClass: string;
  move(newPosition: Position): void;
  gather(entity: IEntity): IEntity;
  attack(entity: IEntity): void;
  plant(plantType: string, position: Position): Plant;
  observe(): void;
  restore(area: Position): void;
  heal(): void;
}

// Player entity
export class Player extends Entity implements IPlayer {
  public inventory: IEntity[];
  public ecoImpact: number;
  public observationSkill: number;
  public restorationSkill: number;
  public characterClass: string;

  constructor(
    id: string,
    position: Position,
    characterClass: string = "wanderer",
    roomId: string = ""
  ) {
    super(id, EntityType.PLAYER, position, 200, roomId);
    this.inventory = [];
    this.ecoImpact = 0; // Positive = good for ecosystem, Negative = harmful
    this.observationSkill = 1;
    this.restorationSkill = 1;
    this.characterClass = characterClass;

    // Set character-specific stats
    this.setCharacterStats(characterClass);
  }

  private setCharacterStats(characterClass: string) {
    switch (characterClass) {
      case "ecologist":
        this.maxHealth = 150;
        this.health = 150;
        this.maxEnergy = 120;
        this.energy = 120;
        this.ecoImpact = 5;
        this.observationSkill = 3;
        this.restorationSkill = 3;
        break;
      case "ranger":
        this.maxHealth = 180;
        this.health = 180;
        this.maxEnergy = 100;
        this.energy = 100;
        this.ecoImpact = 0;
        this.observationSkill = 2;
        this.restorationSkill = 1;
        break;
      case "guardian":
        this.maxHealth = 200;
        this.health = 200;
        this.maxEnergy = 80;
        this.energy = 80;
        this.ecoImpact = 2;
        this.observationSkill = 1;
        this.restorationSkill = 4;
        break;
      case "wanderer":
      default:
        this.maxHealth = 160;
        this.health = 160;
        this.maxEnergy = 140;
        this.energy = 140;
        this.ecoImpact = 1;
        this.observationSkill = 2;
        this.restorationSkill = 2;
        break;
    }
  }

  move(newPosition: Position): void {
    this.position = newPosition;
    // Movement has minimal impact
    this.ecoImpact += 0.1;
  }

  gather(entity: IEntity): IEntity {
    this.inventory.push(entity);
    // Gathering has negative impact
    this.ecoImpact -= 2;
    return entity;
  }

  attack(entity: IEntity): void {
    entity.health -= 30;
    // Combat has significant negative impact
    this.ecoImpact -= 5;
  }

  plant(plantType: string, position: Position): Plant {
    // Planting has positive impact
    this.ecoImpact += 3;
    return new Plant(`plant_${Date.now()}`, position, plantType);
  }

  observe(): void {
    // Observation has minimal positive impact
    this.ecoImpact += 0.5;
  }

  restore(area: Position): void {
    // Restoration has significant positive impact
    this.ecoImpact += 10;
  }

  heal(): void {
    // Heal the player
    this.health = Math.min(this.maxHealth, this.health + 20);
    this.energy = Math.min(this.maxEnergy, this.energy + 10);
  }
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  biome: string;
  entities: IEntity[];
  teleporters: Teleporter[];
}

export interface Teleporter {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  connectedRoomId: string;
  direction: "north" | "south" | "east" | "west";
}

// Game state interface
export interface GameState {
  player: Player | null;
  entities: IEntity[];
  dungeonSize: { width: number; height: number };
  ecosystemHealth: EcosystemHealthValue;
  gameTime: number;
  isPaused: boolean;
  messages: GameMessage[];
  selectedEntity: IEntity | null;
  playerPosition: Position;
  rooms: Room[];
  currentRoomId: string;
}

// Game message interface
export interface GameMessage {
  text: string;
  timestamp: number;
}

// Game action interface
export interface GameAction {
  type: string;
  payload?: any;
}

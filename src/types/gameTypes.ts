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

// Position in the dungeon grid
export class Position {
  constructor(public x: number, public y: number) {}

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  distanceTo(other: Position): number {
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

  constructor(
    id: string,
    type: EntityTypeValue,
    position: Position,
    health: number = 100
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

  constructor(id: string, position: Position, species: string = "moss") {
    super(id, EntityType.PLANT, position, 50);
    this.species = species;
    this.growthRate = 0.1;
    this.reproductionRate = 0.05;
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

      // Reproduce occasionally
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

  constructor(id: string, position: Position, species: string = "rat") {
    super(id, EntityType.HERBIVORE, position, 80);
    this.species = species;
    this.speed = 1;
    this.hunger = 0;
    this.maxHunger = 100;
    this.reproductionRate = 0.03;
    this.foodValue = 15;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.hunger += deltaTime * 0.2;

      if (this.hunger > this.maxHunger) {
        this.health -= deltaTime * 0.5;
      }

      // Reproduce when well-fed
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

  constructor(id: string, position: Position, species: string = "spider") {
    super(id, EntityType.CARNIVORE, position, 120);
    this.species = species;
    this.speed = 1.5;
    this.hunger = 0;
    this.maxHunger = 80;
    this.attackPower = 20;
    this.reproductionRate = 0.02;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.hunger += deltaTime * 0.15;

      if (this.hunger > this.maxHunger) {
        this.health -= deltaTime * 0.3;
      }

      // Reproduce when well-fed
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
  move(newPosition: Position): void;
  gather(entity: IEntity): IEntity;
  attack(entity: IEntity): void;
  plant(plantType: string, position: Position): Plant;
  observe(): void;
  restore(area: Position): void;
}

// Player entity
export class Player extends Entity implements IPlayer {
  public inventory: IEntity[];
  public ecoImpact: number;
  public observationSkill: number;
  public restorationSkill: number;

  constructor(id: string, position: Position) {
    super(id, EntityType.PLAYER, position, 200);
    this.inventory = [];
    this.ecoImpact = 0; // Positive = good for ecosystem, Negative = harmful
    this.observationSkill = 1;
    this.restorationSkill = 1;
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

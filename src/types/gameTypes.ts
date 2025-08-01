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

  // Clone the position
  clone(): Position {
    return new Position(this.x, this.y);
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
  weight: number; // Weight in kg - affects hunger and food value
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
  public weight: number;
  public roomId: string;

  constructor(
    id: string,
    type: EntityTypeValue,
    position: Position,
    health: number = 100,
    weight: number = 1.0,
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
    this.weight = weight;
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
    super(id, EntityType.PLANT, position, 50, 0.1, roomId);
    this.species = species;
    this.growthRate = 0.05; // Reduced growth rate
    this.reproductionRate = 0.0003; // Adjusted for 30 FPS (0.01/30)
    this.oxygenProduction = 1;
    this.foodValue = 10;

    // Set species-specific weight and food value
    switch (species) {
      case "moss":
        this.weight = 0.3; // Increased from 0.05 to 0.3 (6x more food)
        this.foodValue = 8;
        break;
      case "fern":
        this.weight = 0.8; // Increased from 0.2 to 0.8 (4x more food)
        this.foodValue = 12;
        break;
      case "mushroom":
        this.weight = 0.5; // Increased from 0.1 to 0.5 (5x more food)
        this.foodValue = 15;
        break;
      case "flower":
        this.weight = 0.6; // Increased from 0.15 to 0.6 (4x more food)
        this.foodValue = 10;
        break;
      case "cactus":
        this.weight = 1.2; // Increased from 0.3 to 1.2 (4x more food)
        this.foodValue = 20;
        break;
      case "desert_flower":
        this.weight = 0.4; // Increased from 0.1 to 0.4 (4x more food)
        this.foodValue = 8;
        break;
      case "dry_grass":
        this.weight = 0.2; // Increased from 0.05 to 0.2 (4x more food)
        this.foodValue = 6;
        break;
      case "mutated_moss":
        this.weight = 0.8; // Increased from 0.2 to 0.8 (4x more food)
        this.foodValue = 25;
        break;
      case "glowing_fungus":
        this.weight = 1.0; // Increased from 0.3 to 1.0 (3.3x more food)
        this.foodValue = 30;
        break;
      case "toxic_plant":
        this.weight = 1.5; // Increased from 0.4 to 1.5 (3.75x more food)
        this.foodValue = 35;
        break;
      default:
        this.weight = 0.5; // Increased from 0.1 to 0.5 (5x more food)
        this.foodValue = 10;
    }
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
  currentTarget: string | undefined; // ID of current eating target
  eat(food: IPlant): void;
  clearTarget(): void;
}

// Herbivore entity
export class Herbivore extends Entity implements IHerbivore {
  public species: string;
  public speed: number;
  public hunger: number;
  public maxHunger: number;
  public reproductionRate: number;
  public foodValue: number;
  public currentTarget: string | undefined;

  constructor(
    id: string,
    position: Position,
    species: string = "rabbit",
    roomId: string = ""
  ) {
    super(id, EntityType.HERBIVORE, position, 60, 2.0, roomId);
    this.species = species;
    this.speed = 3; // Fast for escaping predators
    this.hunger = 0;
    this.maxHunger = 80; // Will be updated based on weight
    this.reproductionRate = 0.00027; // Adjusted for 30 FPS (0.008/30)
    this.foodValue = 20;

    // Set species-specific stats with different speeds and weights
    switch (species) {
      case "rabbit":
        this.speed = 3.5; // Fast and agile
        this.maxHealth = 60;
        this.health = 60;
        this.weight = 2.5; // Light
        this.foodValue = 25;
        break;
      case "deer":
        this.speed = 2.8; // Moderate speed, good stamina
        this.maxHealth = 120;
        this.health = 120;
        this.weight = 80.0; // Heavy
        this.foodValue = 50;
        break;
      case "mouse":
        this.speed = 4.2; // Very fast, small target
        this.maxHealth = 40;
        this.health = 40;
        this.weight = 0.3; // Increased from 0.03 to 0.3 for better hunger balance
        this.foodValue = 15;
        break;
      case "turtle":
        this.speed = 1.2; // Slow but tough
        this.maxHealth = 150;
        this.health = 150;
        this.weight = 15.0; // Medium weight
        this.foodValue = 35;
        break;
      default:
        this.speed = 3.0;
        this.maxHealth = 60;
        this.health = 60;
        this.weight = 2.0;
        this.foodValue = 20;
    }

    // Set max hunger based on weight (heavier creatures need more food)
    this.maxHunger = this.weight * 40; // 40 hunger per kg of body weight
  }

  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.state === EntityState.ALIVE) {
      this.hunger += deltaTime * 0.5; // Reduced hunger increase rate for better balance

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
    // Gradual consumption - only eat a small amount per tick (33 ticks per second)
    const consumptionPerTick = 0.05; // Increased: 0.05 kg per tick = 1.65 kg per second (faster consumption)
    const plantWeight = food.weight;

    // Calculate how much we can eat this tick
    const amountToEat = Math.min(consumptionPerTick, plantWeight);

    // Reduce plant weight (this is the primary consumption)
    food.weight = Math.max(0, food.weight - amountToEat);

    // Reduce health proportionally but more slowly (health should last longer than weight)
    const healthReductionRatio = (amountToEat / plantWeight) * 0.5; // Health reduces at half the rate of weight
    food.health = Math.max(
      0,
      food.health - healthReductionRatio * food.maxHealth
    );

    // Only mark as dead when weight is completely consumed (not when health reaches 0)
    if (food.weight <= 0) {
      food.state = EntityState.DEAD;
      food.health = 0;
    }

    // Calculate hunger satisfaction based on amount eaten
    let hungerSatisfaction = amountToEat * 20; // Increased: 20 hunger per kg of plant for better balance

    switch (this.species) {
      case "rabbit":
        hungerSatisfaction = amountToEat * 22; // Rabbits are efficient grazers
        break;
      case "deer":
        hungerSatisfaction = amountToEat * 18; // Deer need more food per kg
        break;
      case "mouse":
        hungerSatisfaction = amountToEat * 25; // Mice are very efficient
        break;
      case "turtle":
        hungerSatisfaction = amountToEat * 15; // Turtles are slow metabolizers
        break;
      default:
        hungerSatisfaction = amountToEat * 20;
    }

    this.hunger = Math.max(0, this.hunger - hungerSatisfaction);
    this.health = Math.min(
      this.maxHealth,
      this.health + hungerSatisfaction * 0.5
    );
  }

  clearTarget(): void {
    this.currentTarget = undefined;
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
  huntingStyle: "stealth" | "chase" | "ambush"; // New hunting style property
  stealthLevel: number; // How well they can sneak (0-1)
  detectionRange: number; // How far prey can detect them when sneaking
  currentTarget: string | undefined; // ID of current hunting target
  hunt(prey: IHerbivore): void;
  clearTarget(): void;
}

// Carnivore entity
export class Carnivore extends Entity implements ICarnivore {
  public species: string;
  public speed: number;
  public hunger: number;
  public maxHunger: number;
  public attackPower: number;
  public reproductionRate: number;
  public huntingStyle: "stealth" | "chase" | "ambush";
  public stealthLevel: number;
  public detectionRange: number;
  public currentTarget: string | undefined;

  constructor(
    id: string,
    position: Position,
    species: string = "rat",
    roomId: string = ""
  ) {
    super(id, EntityType.CARNIVORE, position, 100, 5.0, roomId);
    this.species = species;
    this.speed = 2.5; // Rats are fast and agile
    this.hunger = 0;
    this.maxHunger = 60; // Will be updated based on weight
    this.attackPower = 25;
    this.reproductionRate = 0.0002; // Adjusted for 30 FPS (0.006/30)

    // Set species-specific stats with different speeds, weights, and hunting styles
    switch (species) {
      case "rat":
        this.speed = 3.2; // Fast and agile
        this.maxHealth = 80;
        this.health = 80;
        this.weight = 0.3; // Very light
        this.attackPower = 20;
        this.huntingStyle = "stealth"; // Rats are sneaky
        this.stealthLevel = 0.8; // High stealth
        this.detectionRange = 30; // Low detection range when sneaking
        break;
      case "wolf":
        this.speed = 3.8; // Very fast, pack hunter
        this.maxHealth = 120;
        this.health = 120;
        this.weight = 40.0; // Medium weight
        this.attackPower = 35;
        this.huntingStyle = "chase"; // Wolves chase their prey
        this.stealthLevel = 0.3; // Low stealth, rely on speed
        this.detectionRange = 80; // High detection range
        break;
      case "snake":
        this.speed = 2.0; // Slow but deadly
        this.maxHealth = 60;
        this.health = 60;
        this.weight = 2.0; // Light
        this.attackPower = 40;
        this.huntingStyle = "ambush"; // Snakes ambush their prey
        this.stealthLevel = 0.9; // Very high stealth
        this.detectionRange = 20; // Very low detection range
        break;
      case "bear":
        this.speed = 1.8; // Slow but powerful
        this.maxHealth = 200;
        this.health = 200;
        this.weight = 300.0; // Very heavy
        this.attackPower = 50;
        this.huntingStyle = "ambush"; // Bears ambush when possible
        this.stealthLevel = 0.6; // Medium stealth for their size
        this.detectionRange = 50; // Medium detection range
        break;
      default:
        this.speed = 2.5;
        this.maxHealth = 100;
        this.health = 100;
        this.weight = 5.0;
        this.attackPower = 25;
        this.huntingStyle = "chase";
        this.stealthLevel = 0.5;
        this.detectionRange = 60;
    }

    // Set max hunger based on weight (heavier predators need more food)
    this.maxHunger = this.weight * 30; // 30 hunger per kg of body weight
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
      // Deal damage to prey
      prey.health -= this.attackPower;

      // Check if prey dies from damage
      if (prey.health <= 0) {
        prey.state = EntityState.DEAD;
        prey.health = 0;
      } else {
        // Prey is injured but alive - set to fleeing state
        prey.state = EntityState.FLEEING;
      }
    } else if (prey.state === EntityState.DEAD) {
      // Eat the dead prey gradually
      const consumptionPerTick = 0.02; // 0.02 kg per tick = 0.66 kg per second
      const preyWeight = prey.weight;

      // Calculate how much we can eat this tick
      const amountToEat = Math.min(consumptionPerTick, preyWeight);

      // Reduce prey weight
      prey.weight = Math.max(0, prey.weight - amountToEat);

      // If prey is completely consumed, remove it
      if (prey.weight <= 0) {
        prey.state = EntityState.DEAD;
        prey.health = 0;
      }

      // Calculate hunger satisfaction based on amount eaten
      let hungerSatisfaction = amountToEat * 2; // Reduced: 2 hunger per kg of prey

      switch (this.species) {
        case "wolf":
          hungerSatisfaction = amountToEat * 2.4; // Wolves are efficient hunters
          break;
        case "bear":
          hungerSatisfaction = amountToEat * 1.6; // Bears need more food per kg
          break;
        case "snake":
          hungerSatisfaction = amountToEat * 3; // Snakes are very efficient
          break;
        case "rat":
          hungerSatisfaction = amountToEat * 2.2; // Rats are somewhat efficient
          break;
        default:
          hungerSatisfaction = amountToEat * 2;
      }

      // Reduce hunger and gain health
      this.hunger = Math.max(0, this.hunger - hungerSatisfaction);
      this.health = Math.min(
        this.maxHealth,
        this.health + hungerSatisfaction * 0.3
      );
    }
  }

  clearTarget(): void {
    this.currentTarget = undefined;
  }
}

// Player entity interface
export interface IPlayer extends IEntity {
  inventory: IEntity[];
  ecoImpact: number;
  observationSkill: number;
  restorationSkill: number;
  characterClass: string;
  // Progression system
  experience: number;
  level: number;
  skillPoints: number;
  experienceToNextLevel: number;
  move(newPosition: Position): void;
  gather(entity: IEntity): IEntity;
  attack(entity: IEntity): void;
  plant(plantType: string, position: Position): Plant;
  observe(): void;
  restore(area: Position): void;
  heal(): void;
  gainExperience(amount: number): void;
  levelUp(): void;
  allocateSkillPoint(skill: "observation" | "restoration"): boolean;
}

// Player entity
export class Player extends Entity implements IPlayer {
  public inventory: IEntity[];
  public ecoImpact: number;
  public observationSkill: number;
  public restorationSkill: number;
  public characterClass: string;
  // Progression system
  public experience: number;
  public level: number;
  public skillPoints: number;
  public experienceToNextLevel: number;

  constructor(
    id: string,
    position: Position,
    characterClass: string = "wanderer",
    roomId: string = ""
  ) {
    super(id, EntityType.PLAYER, position, 200, 70.0, roomId);
    this.inventory = [];
    this.ecoImpact = 0; // Positive = good for ecosystem, Negative = harmful
    this.observationSkill = 1;
    this.restorationSkill = 1;
    this.characterClass = characterClass;

    // Initialize progression system
    this.experience = 0;
    this.level = 1;
    this.skillPoints = 0;
    this.experienceToNextLevel = this.calculateExperienceToNextLevel();

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
    // Small XP gain for exploration
    this.gainExperience(1);
  }

  gather(entity: IEntity): IEntity {
    this.inventory.push(entity);
    // Gathering has negative impact
    this.ecoImpact -= 2;
    // XP gain for gathering
    this.gainExperience(5);
    return entity;
  }

  attack(entity: IEntity): void {
    entity.health -= 30;
    // Combat has significant negative impact
    this.ecoImpact -= 5;
    // XP gain for combat
    this.gainExperience(10);
  }

  plant(plantType: string, position: Position): Plant {
    // Planting has positive impact
    this.ecoImpact += 3;
    // XP gain for positive actions
    this.gainExperience(15);
    return new Plant(`plant_${Date.now()}`, position, plantType);
  }

  observe(): void {
    // Observation has minimal positive impact
    this.ecoImpact += 0.5;
    // XP gain for observation (scaled by observation skill)
    this.gainExperience(3 * this.observationSkill);
  }

  restore(area: Position): void {
    // Restoration has significant positive impact
    this.ecoImpact += 10;
    // XP gain for restoration (scaled by restoration skill)
    this.gainExperience(20 * this.restorationSkill);
  }

  heal(): void {
    // Heal the player
    this.health = Math.min(this.maxHealth, this.health + 20);
    this.energy = Math.min(this.maxEnergy, this.energy + 10);
  }

  // Progression system methods
  private calculateExperienceToNextLevel(): number {
    // Exponential experience curve: level^2 * 100
    return this.level * this.level * 100;
  }

  gainExperience(amount: number): void {
    this.experience += amount;

    // Check if player should level up
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  levelUp(): void {
    this.level++;
    this.skillPoints += 2; // Gain 2 skill points per level
    this.experienceToNextLevel = this.calculateExperienceToNextLevel();

    // Increase base stats on level up
    this.maxHealth += 10;
    this.health = this.maxHealth; // Full heal on level up
    this.maxEnergy += 5;
    this.energy = this.maxEnergy; // Full energy on level up

    // Note: Level up message will be handled by GameContext
  }

  allocateSkillPoint(skill: "observation" | "restoration"): boolean {
    if (this.skillPoints <= 0) {
      return false; // No skill points available
    }

    switch (skill) {
      case "observation":
        this.observationSkill++;
        break;
      case "restoration":
        this.restorationSkill++;
        break;
    }

    this.skillPoints--;
    return true;
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

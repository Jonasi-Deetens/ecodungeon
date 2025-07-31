import {
  Position,
  EntityTypeValue,
  EntityType,
  EntityState,
} from "../types/gameTypes";
import {
  SteeringBehaviors,
  BehaviorStateMachine,
  BehaviorState,
  FlockingBehavior,
  BehaviorFactory,
} from "./BehaviorSystem";

// ============================================================================
// ADVANCED CREATURE AI INTERFACES
// ============================================================================

// Advanced AI interface - separate from old system
export interface AdvancedCreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number,
    huntingStyle?: "stealth" | "chase" | "ambush",
    stealthLevel?: number,
    detectionRange?: number,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number
  ): Position;
  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number,
    biome?: string
  ): boolean;
  shouldEat(hunger: number, maxHunger: number, biome?: string): boolean;
  shouldHunt(
    hunger: number,
    maxHunger: number,
    nearbyPrey: any[],
    biome?: string
  ): boolean;
  getBiomeModifiers(biome: string): BiomeModifiers;
}

// Biome-specific modifiers for AI behavior
export interface BiomeModifiers {
  speedMultiplier: number;
  aggressionMultiplier: number;
  reproductionRate: number;
  foodEfficiency: number;
  territorySize: number;
  packBehavior: boolean;
  memoryRetention: number;
}

// Memory system for creatures
export interface CreatureMemory {
  lastKnownFoodPositions: Position[];
  lastKnownPredatorPositions: Position[];
  lastKnownPreyPositions: Position[];
  successfulHuntingSpots: Position[];
  dangerousAreas: Position[];
  lastUpdateTime: number;
}

// ============================================================================
// ADVANCED CREATURE AI USING BEHAVIOR ALGORITHMS
// ============================================================================

// ============================================================================
// PLANT AI (No movement, just growth)
// ============================================================================

export class AdvancedPlantAI implements AdvancedCreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number,
    huntingStyle?: "stealth" | "chase" | "ambush",
    stealthLevel?: number,
    detectionRange?: number,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number
  ): Position {
    // Plants don't move, they just grow in place
    return position;
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number,
    biome?: string
  ): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return (
      health > maxHealth * 0.8 &&
      energy > maxEnergy * (0.7 * modifiers.reproductionRate)
    );
  }

  shouldEat(hunger: number, maxHunger: number, biome?: string): boolean {
    return false; // Plants don't eat
  }

  shouldHunt(
    hunger: number,
    maxHunger: number,
    nearbyPrey: any[],
    biome?: string
  ): boolean {
    return false; // Plants don't hunt
  }

  getBiomeModifiers(biome: string): BiomeModifiers {
    switch (biome) {
      case "forest":
        return {
          speedMultiplier: 0.0, // Plants don't move
          aggressionMultiplier: 0.0,
          reproductionRate: 1.2, // Good reproduction in forest
          foodEfficiency: 1.0,
          territorySize: 0.5,
          packBehavior: false,
          memoryRetention: 0.0,
        };
      case "desert":
        return {
          speedMultiplier: 0.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 0.6, // Slower reproduction in desert
          foodEfficiency: 0.8,
          territorySize: 1.2,
          packBehavior: false,
          memoryRetention: 0.0,
        };
      case "laboratory":
        return {
          speedMultiplier: 0.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 1.8, // Fast reproduction in lab
          foodEfficiency: 1.3,
          territorySize: 0.3,
          packBehavior: false,
          memoryRetention: 0.0,
        };
      default:
        return {
          speedMultiplier: 0.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 1.0,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 0.0,
        };
    }
  }
}

// ============================================================================
// ADVANCED HERBIVORE AI WITH STEERING BEHAVIORS
// ============================================================================

export class AdvancedHerbivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory = {
    lastKnownFoodPositions: [],
    lastKnownPredatorPositions: [],
    lastKnownPreyPositions: [],
    successfulHuntingSpots: [],
    dangerousAreas: [],
    lastUpdateTime: 0,
  };
  private territoryCenter: Position | null = null;
  private readonly baseSpeed = 80;

  constructor() {
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createHerbivoreBehaviors()
    );
  }

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number,
    huntingStyle?: "stealth" | "chase" | "ambush",
    stealthLevel?: number,
    detectionRange?: number,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number
  ): Position {
    // Safety check for undefined position
    if (!position) {
      return new Position(0, 0);
    }

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = (creatureSpeed || this.baseSpeed) * modifiers.speedMultiplier;

    // Update memory
    this.memory.lastUpdateTime = Date.now();

    // Categorize nearby entities
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE
    );
    const nearbyPlants = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.PLANT &&
        (e.state === EntityState.ALIVE ||
          (e.state === EntityState.DEAD && e.weight > 0))
    );
    const nearbyHerbivores = nearbyEntities.filter(
      (e) => e.type === EntityType.HERBIVORE
    );

    // Update food memory
    nearbyPlants.forEach((plant) => {
      if (
        plant.position &&
        !this.memory.lastKnownFoodPositions.some(
          (p) => p.distanceTo(plant.position) < 30
        )
      ) {
        this.memory.lastKnownFoodPositions.push(plant.position.clone());
        if (this.memory.lastKnownFoodPositions.length > 10) {
          this.memory.lastKnownFoodPositions.shift();
        }
      }
    });

    // Update predator memory
    nearbyPredators.forEach((predator) => {
      if (
        predator.position &&
        !this.memory.lastKnownPredatorPositions.some(
          (p) => p.distanceTo(predator.position) < 50
        )
      ) {
        this.memory.lastKnownPredatorPositions.push(predator.position.clone());
        if (this.memory.lastKnownPredatorPositions.length > 5) {
          this.memory.lastKnownPredatorPositions.shift();
        }
      }
    });

    // Simple movement logic with visible speeds
    const moveSpeed = 100; // 100 pixels per second
    let moveX = 0;
    let moveY = 0;

    // Flee from predators only when they're in fleeing range
    const fleeDetectionRange = 80; // Distance at which herbivores detect predators
    let shouldFlee = false;
    let fleeDirection = { x: 0, y: 0 };

    for (const predator of nearbyPredators) {
      const dx = position.x - predator.position.x;
      const dy = position.y - predator.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only flee if predator is within fleeing detection range
      if (distance <= fleeDetectionRange && distance > 0) {
        shouldFlee = true;
        // Add this predator's flee direction (weighted by distance)
        const weight = 1 - distance / fleeDetectionRange; // Closer = stronger flee
        fleeDirection.x += (dx / distance) * weight;
        fleeDirection.y += (dy / distance) * weight;
      }
    }

    if (shouldFlee) {
      // Normalize flee direction and apply flee speed
      const fleeMagnitude = Math.sqrt(
        fleeDirection.x * fleeDirection.x + fleeDirection.y * fleeDirection.y
      );
      if (fleeMagnitude > 0) {
        moveX += (fleeDirection.x / fleeMagnitude) * moveSpeed * 2.5; // Strong flee
        moveY += (fleeDirection.y / fleeMagnitude) * moveSpeed * 2.5;
      }
    }
    // Seek food when hungry
    else if (
      hunger &&
      maxHunger &&
      hunger > maxHunger * 0.6 &&
      nearbyPlants.length > 0
    ) {
      // Choose the closest plant consistently (this will be the same plant until it's consumed)
      let targetPlant = nearbyPlants[0];

      // If there are multiple plants, choose the closest one
      if (nearbyPlants.length > 1) {
        let closestDistance = Infinity;
        for (const plant of nearbyPlants) {
          const distance = position.distanceTo(plant.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            targetPlant = plant;
          }
        }
      }

      const dx = targetPlant.position.x - position.x;
      const dy = targetPlant.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // If close enough to eat, stop moving and eat
        if (distance <= 20) {
          // Eating range
          // Eat the plant (this will be handled in GameContext)
          // For now, just stop moving
          moveX = 0;
          moveY = 0;
        } else {
          // Move towards plant
          moveX += (dx / distance) * moveSpeed;
          moveY += (dy / distance) * moveSpeed;
        }
      }
    }
    // Wander randomly
    else {
      const time = Date.now() * 0.001;
      moveX = Math.cos(time + position.x * 0.01) * moveSpeed * 0.5;
      moveY = Math.sin(time + position.y * 0.01) * moveSpeed * 0.5;
    }

    // Apply movement
    const newX = position.x + moveX * deltaTime;
    const newY = position.y + moveY * deltaTime;

    return new Position(newX, newY);
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number,
    biome?: string
  ): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return (
      health > maxHealth * 0.8 &&
      energy > maxEnergy * (0.9 * modifiers.reproductionRate)
    );
  }

  shouldEat(hunger: number, maxHunger: number, biome?: string): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return hunger > maxHunger * (0.6 * modifiers.foodEfficiency);
  }

  shouldHunt(
    hunger: number,
    maxHunger: number,
    nearbyPrey: any[],
    biome?: string
  ): boolean {
    return false; // Herbivores don't hunt
  }

  getBiomeModifiers(biome: string): BiomeModifiers {
    switch (biome) {
      case "forest":
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.5,
          reproductionRate: 1.0,
          foodEfficiency: 1.2, // Good food efficiency in forest
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
      case "desert":
        return {
          speedMultiplier: 1.3, // Faster to escape predators in open terrain
          aggressionMultiplier: 0.3,
          reproductionRate: 0.7, // Slower reproduction in harsh environment
          foodEfficiency: 0.8, // Poor food efficiency
          territorySize: 1.5, // Larger territory for scarce resources
          packBehavior: true, // Group behavior for survival
          memoryRetention: 1.4, // Better memory for food locations
        };
      case "laboratory":
        return {
          speedMultiplier: 1.2, // Slightly faster due to mutations
          aggressionMultiplier: 0.8, // More aggressive due to mutations
          reproductionRate: 1.3, // Fast reproduction
          foodEfficiency: 0.9, // Slightly reduced efficiency
          territorySize: 0.8, // Smaller territory
          packBehavior: false,
          memoryRetention: 0.7, // Poor memory due to mutations
        };
      default:
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.5,
          reproductionRate: 1.0,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
    }
  }
}

// ============================================================================
// ADVANCED CARNIVORE AI WITH HUNTING BEHAVIORS
// ============================================================================

export class AdvancedCarnivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory = {
    lastKnownFoodPositions: [],
    lastKnownPredatorPositions: [],
    lastKnownPreyPositions: [],
    successfulHuntingSpots: [],
    dangerousAreas: [],
    lastUpdateTime: 0,
  };
  private territoryCenter: Position | null = null;
  private readonly baseSpeed = 100;
  private readonly baseHuntRange = 60;

  constructor() {
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createCarnivoreBehaviors()
    );
  }

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number,
    huntingStyle?: "stealth" | "chase" | "ambush",
    stealthLevel?: number,
    detectionRange?: number,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number
  ): Position {
    // Safety check for undefined position
    if (!position) {
      return new Position(0, 0);
    }

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = (creatureSpeed || this.baseSpeed) * modifiers.speedMultiplier;

    // Update memory
    this.memory.lastUpdateTime = Date.now();

    // Categorize nearby entities
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE
    );
    const nearbyHerbivores = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.HERBIVORE &&
        (e.state === EntityState.ALIVE ||
          (e.state === EntityState.DEAD && e.weight > 0))
    );

    // Update prey memory
    nearbyHerbivores.forEach((prey) => {
      if (
        prey.position &&
        !this.memory.lastKnownPreyPositions.some(
          (p) => p.distanceTo(prey.position) < 50
        )
      ) {
        this.memory.lastKnownPreyPositions.push(prey.position.clone());
        if (this.memory.lastKnownPreyPositions.length > 8) {
          this.memory.lastKnownPreyPositions.shift();
        }
      }
    });

    // Simple movement logic with visible speeds
    const moveSpeed = 120; // 120 pixels per second (faster than herbivores)
    let moveX = 0;
    let moveY = 0;

    // Hunt when hungry and prey is available
    if (
      hunger &&
      maxHunger &&
      hunger > maxHunger * 0.7 &&
      nearbyHerbivores.length > 0
    ) {
      // Choose the closest prey consistently (this will be the same prey until it's consumed)
      let closestPrey = nearbyHerbivores[0];

      // If there are multiple prey, choose the closest one
      if (nearbyHerbivores.length > 1) {
        let closestDistance = Infinity;
        for (const prey of nearbyHerbivores) {
          const distance = position.distanceTo(prey.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPrey = prey;
          }
        }
      }

      const dx = closestPrey.position.x - position.x;
      const dy = closestPrey.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // If close enough to attack, stop moving and attack
        if (distance <= 25) {
          // Attack range
          // Attack the prey (this will be handled in GameContext)
          // For now, just stop moving
          moveX = 0;
          moveY = 0;
        } else {
          // Move directly towards prey with hunting speed
          moveX = (dx / distance) * moveSpeed * 1.5; // 1.5x speed when hunting
          moveY = (dy / distance) * moveSpeed * 1.5;
        }
      }
    }
    // Move towards remembered prey location if no nearby prey
    else if (
      hunger &&
      maxHunger &&
      hunger > maxHunger * 0.7 &&
      this.memory.lastKnownPreyPositions.length > 0
    ) {
      const rememberedPrey = this.memory.lastKnownPreyPositions[0];
      if (rememberedPrey) {
        const dx = rememberedPrey.x - position.x;
        const dy = rememberedPrey.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          moveX += (dx / distance) * moveSpeed;
          moveY += (dy / distance) * moveSpeed;
        }
      }
    }
    // Wander randomly when not hunting
    else {
      const time = Date.now() * 0.001;
      moveX = Math.cos(time + position.x * 0.01) * moveSpeed * 0.6;
      moveY = Math.sin(time + position.y * 0.01) * moveSpeed * 0.6;
    }

    // Apply movement
    const newX = position.x + moveX * deltaTime;
    const newY = position.y + moveY * deltaTime;

    return new Position(newX, newY);
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number,
    biome?: string
  ): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return (
      health > maxHealth * 0.8 &&
      energy > maxEnergy * (0.9 * modifiers.reproductionRate)
    );
  }

  shouldEat(hunger: number, maxHunger: number, biome?: string): boolean {
    return false; // Carnivores hunt, they don't "eat" plants
  }

  shouldHunt(
    hunger: number,
    maxHunger: number,
    nearbyPrey: any[],
    biome?: string
  ): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return (
      hunger > maxHunger * 0.7 && // Only hunt when 70% hungry
      nearbyPrey.length > 0
    );
  }

  getBiomeModifiers(biome: string): BiomeModifiers {
    switch (biome) {
      case "forest":
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 1.0,
          reproductionRate: 1.0,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
      case "desert":
        return {
          speedMultiplier: 1.2, // Faster for hunting in open terrain
          aggressionMultiplier: 1.3, // More aggressive due to scarce resources
          reproductionRate: 0.8,
          foodEfficiency: 1.2,
          territorySize: 1.5, // Larger territory
          packBehavior: true, // Pack hunting in harsh environment
          memoryRetention: 1.3, // Better memory for prey locations
        };
      case "laboratory":
        return {
          speedMultiplier: 1.5, // Very fast due to mutations
          aggressionMultiplier: 2.0, // Highly aggressive
          reproductionRate: 1.5, // Fast reproduction
          foodEfficiency: 0.7, // Poor efficiency due to mutations
          territorySize: 0.8, // Smaller territory
          packBehavior: true, // Pack behavior for survival
          memoryRetention: 0.6, // Poor memory due to mutations
        };
      default:
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 1.0,
          reproductionRate: 1.0,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
    }
  }
}

// ============================================================================
// ADVANCED AI FACTORY
// ============================================================================

export class AdvancedCreatureAIFactory {
  static createAI(
    creatureType: EntityTypeValue,
    species: string
  ): AdvancedCreatureAI {
    switch (creatureType) {
      case EntityType.PLANT:
        return new AdvancedPlantAI();
      case EntityType.HERBIVORE:
        return new AdvancedHerbivoreAI();
      case EntityType.CARNIVORE:
        return new AdvancedCarnivoreAI();
      default:
        return new AdvancedHerbivoreAI(); // Default fallback
    }
  }
}

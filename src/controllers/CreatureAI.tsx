import { Position, EntityTypeValue, EntityType } from "../types/gameTypes";

// Enhanced AI interface with biome awareness and memory
export interface CreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number
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

// Plant AI - Simple growth and reproduction
export class PlantAI implements CreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number
  ): Position {
    // Safety check for undefined position
    if (!position) {
      return new Position(0, 0);
    }
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
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 1.2, // Plants grow well in forest
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 0.0,
        };
      case "desert":
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 0.7, // Slower growth in desert
          foodEfficiency: 0.8,
          territorySize: 1.5, // Larger territory for scarce resources
          packBehavior: false,
          memoryRetention: 0.0,
        };
      case "laboratory":
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 1.8, // Fast but unstable growth
          foodEfficiency: 1.5,
          territorySize: 0.8,
          packBehavior: false,
          memoryRetention: 0.0,
        };
      default:
        return {
          speedMultiplier: 1.0,
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

// Enhanced Herbivore AI with memory and biome-specific behavior
export class HerbivoreAI implements CreatureAI {
  private wanderDirection = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
  private wanderTimer = 0;
  private readonly wanderInterval = 0.5;
  private readonly baseSpeed = 50;
  private fleeDirection = { x: 0, y: 0 };
  private isFleeing = false;
  private fleeTimer = 0;
  private memory: CreatureMemory = {
    lastKnownFoodPositions: [],
    lastKnownPredatorPositions: [],
    lastKnownPreyPositions: [],
    successfulHuntingSpots: [],
    dangerousAreas: [],
    lastUpdateTime: 0,
  };
  private territoryCenter: Position | null = null;
  private territoryTimer = 0;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number
  ): Position {
    // Safety check for undefined position
    if (!position) {
      return new Position(0, 0);
    }

    this.wanderTimer += deltaTime;
    this.fleeTimer += deltaTime;
    this.territoryTimer += deltaTime;

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = this.baseSpeed * modifiers.speedMultiplier;

    // Update memory with current time
    this.memory.lastUpdateTime = Date.now();

    // Check for nearby predators and update memory
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE
    );

    // Update predator memory
    nearbyPredators.forEach((predator) => {
      if (
        predator.position &&
        !this.memory.lastKnownPredatorPositions.some(
          (p) => p.distanceTo(predator.position) < 50
        )
      ) {
        this.memory.lastKnownPredatorPositions.push(predator.position.clone());
        // Keep only recent predator positions
        if (this.memory.lastKnownPredatorPositions.length > 5) {
          this.memory.lastKnownPredatorPositions.shift();
        }
      }
    });

    const closestPredator = nearbyPredators[0];
    if (closestPredator) {
      const distanceToPredator = position.distanceTo(closestPredator.position);
      const fleeThreshold = 80 * modifiers.territorySize;

      if (distanceToPredator < fleeThreshold) {
        this.isFleeing = true;
        this.fleeTimer = 0;

        const fleeX = position.x - closestPredator.position.x;
        const fleeY = position.y - closestPredator.position.y;
        const fleeDistance = Math.sqrt(fleeX * fleeX + fleeY * fleeY);

        if (fleeDistance > 0) {
          this.fleeDirection = {
            x: fleeX / fleeDistance,
            y: fleeY / fleeDistance,
          };
        }
      }
    }

    // Continue fleeing with biome-specific duration and wall avoidance
    if (this.isFleeing && this.fleeTimer < 2 * modifiers.memoryRetention) {
      let newX = position.x + this.fleeDirection.x * speed * 1.5 * deltaTime;
      let newY = position.y + this.fleeDirection.y * speed * 1.5 * deltaTime;

      // Wall avoidance during fleeing
      if (roomBounds) {
        const wallBuffer = 50; // Distance from wall to start avoiding

        // If we're heading towards a wall, adjust direction
        if (newX < roomBounds.minX + wallBuffer && this.fleeDirection.x < 0) {
          // Bounce off left wall - reverse X direction
          this.fleeDirection.x = Math.abs(this.fleeDirection.x);
          newX = position.x + this.fleeDirection.x * speed * 1.5 * deltaTime;
        } else if (
          newX > roomBounds.maxX - wallBuffer &&
          this.fleeDirection.x > 0
        ) {
          // Bounce off right wall - reverse X direction
          this.fleeDirection.x = -Math.abs(this.fleeDirection.x);
          newX = position.x + this.fleeDirection.x * speed * 1.5 * deltaTime;
        }

        if (newY < roomBounds.minY + wallBuffer && this.fleeDirection.y < 0) {
          // Bounce off top wall - reverse Y direction
          this.fleeDirection.y = Math.abs(this.fleeDirection.y);
          newY = position.y + this.fleeDirection.y * speed * 1.5 * deltaTime;
        } else if (
          newY > roomBounds.maxY - wallBuffer &&
          this.fleeDirection.y > 0
        ) {
          // Bounce off bottom wall - reverse Y direction
          this.fleeDirection.y = -Math.abs(this.fleeDirection.y);
          newY = position.y + this.fleeDirection.y * speed * 1.5 * deltaTime;
        }
      }

      return new Position(newX, newY);
    } else {
      this.isFleeing = false;
    }

    // Establish territory if not set
    if (!this.territoryCenter) {
      this.territoryCenter = position.clone();
    }

    // Return to territory periodically
    const territoryRadius = 200 * modifiers.territorySize;
    const distanceFromTerritory = this.territoryCenter
      ? position.distanceTo(this.territoryCenter)
      : 0;

    if (
      this.territoryCenter &&
      distanceFromTerritory > territoryRadius &&
      this.territoryTimer > 5
    ) {
      const direction = {
        x: this.territoryCenter.x - position.x,
        y: this.territoryCenter.y - position.y,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (distance > 0) {
        const normalizedDirection = {
          x: direction.x / distance,
          y: direction.y / distance,
        };

        return new Position(
          position.x + normalizedDirection.x * speed * deltaTime,
          position.y + normalizedDirection.y * speed * deltaTime
        );
      }
    }

    // Use provided room bounds or default
    const bounds = roomBounds || { minX: 0, maxX: 4000, minY: 0, maxY: 2000 };
    const nearBoundary =
      position.x < bounds.minX + 100 ||
      position.x > bounds.maxX - 100 ||
      position.y < bounds.minY + 100 ||
      position.y > bounds.maxY - 100;

    // Change wander direction periodically or when near boundary
    if (this.wanderTimer >= this.wanderInterval || nearBoundary) {
      if (nearBoundary) {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        this.wanderDirection = {
          x: centerX - position.x,
          y: centerY - position.y,
        };
      } else {
        this.wanderDirection = {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        };
      }

      const length = Math.sqrt(
        this.wanderDirection.x * this.wanderDirection.x +
          this.wanderDirection.y * this.wanderDirection.y
      );
      if (length > 0) {
        this.wanderDirection.x /= length;
        this.wanderDirection.y /= length;
      }
      this.wanderTimer = 0;
    }

    // Enhanced food seeking with memory
    const foodDetectionRange = 50 * modifiers.foodEfficiency;
    const nearbyPlants = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.PLANT &&
        position.distanceTo(e.position) <= foodDetectionRange
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

    if (nearbyPlants.length > 0) {
      let closestPlant = nearbyPlants[0];
      let closestDistance = position.distanceTo(closestPlant.position);

      for (const plant of nearbyPlants) {
        const distance = position.distanceTo(plant.position);
        if (distance < closestDistance) {
          closestPlant = plant;
          closestDistance = distance;
        }
      }

      const direction = {
        x: closestPlant.position.x - position.x,
        y: closestPlant.position.y - position.y,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (distance > 0) {
        const normalizedDirection = {
          x: direction.x / distance,
          y: direction.y / distance,
        };

        const foodSeekingSpeed = speed * 1.2;
        return new Position(
          position.x + normalizedDirection.x * foodSeekingSpeed * deltaTime,
          position.y + normalizedDirection.y * foodSeekingSpeed * deltaTime
        );
      }
    }

    // Wander randomly within territory
    return new Position(
      position.x + this.wanderDirection.x * speed * deltaTime,
      position.y + this.wanderDirection.y * speed * deltaTime
    );
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
      health > maxHealth * 0.7 &&
      energy > maxEnergy * (0.8 * modifiers.reproductionRate)
    );
  }

  shouldEat(hunger: number, maxHunger: number, biome?: string): boolean {
    const modifiers = this.getBiomeModifiers(biome || "forest");
    return hunger > maxHunger * (0.6 / modifiers.foodEfficiency);
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
          aggressionMultiplier: 0.0,
          reproductionRate: 1.2,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
      case "desert":
        return {
          speedMultiplier: 1.3, // Faster to escape predators
          aggressionMultiplier: 0.0,
          reproductionRate: 0.8,
          foodEfficiency: 1.5, // Better at finding scarce food
          territorySize: 1.8, // Larger territory for scarce resources
          packBehavior: false,
          memoryRetention: 1.5, // Better memory for food locations
        };
      case "laboratory":
        return {
          speedMultiplier: 0.7, // Slower due to mutations
          aggressionMultiplier: 0.0,
          reproductionRate: 0.6, // Reduced reproduction
          foodEfficiency: 0.8,
          territorySize: 0.6, // Smaller territory
          packBehavior: false,
          memoryRetention: 0.5, // Poor memory due to mutations
        };
      default:
        return {
          speedMultiplier: 1.0,
          aggressionMultiplier: 0.0,
          reproductionRate: 1.0,
          foodEfficiency: 1.0,
          territorySize: 1.0,
          packBehavior: false,
          memoryRetention: 1.0,
        };
    }
  }
}

// Enhanced Carnivore AI with memory, pack behavior, and biome-specific hunting
export class CarnivoreAI implements CreatureAI {
  private wanderDirection = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
  private wanderTimer = 0;
  private readonly wanderInterval = 0.4;
  private readonly baseSpeed = 60;
  private readonly baseHuntRange = 80; // Reduced for more aggressive hunting
  private packBehavior = false;
  private packTimer = 0;
  private memory: CreatureMemory = {
    lastKnownFoodPositions: [],
    lastKnownPredatorPositions: [],
    lastKnownPreyPositions: [],
    successfulHuntingSpots: [],
    dangerousAreas: [],
    lastUpdateTime: 0,
  };
  private territoryCenter: Position | null = null;
  private territoryTimer = 0;
  private lastHuntSuccess = false;
  private huntSuccessRate = 0.5;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    difficulty?: number
  ): Position {
    // Safety check for undefined position
    if (!position) {
      return new Position(0, 0);
    }

    this.wanderTimer += deltaTime;
    this.packTimer += deltaTime;
    this.territoryTimer += deltaTime;

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = this.baseSpeed * modifiers.speedMultiplier;
    const huntRange = this.baseHuntRange * modifiers.aggressionMultiplier;

    // Update memory
    this.memory.lastUpdateTime = Date.now();

    // Enhanced pack behavior with biome-specific modifiers
    const nearbyPackMembers = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE && e.species !== "rat"
    );

    if (modifiers.packBehavior && nearbyPackMembers.length > 1) {
      this.packBehavior = true;
      this.packTimer = 0;
    } else if (this.packTimer > 3) {
      this.packBehavior = false;
    }

    // Advanced hunting with memory and learning
    const nearbyHerbivores = nearbyEntities.filter(
      (e) => e.type === EntityType.HERBIVORE
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

    if (nearbyHerbivores.length > 0) {
      // Enhanced hunting with pack behavior and learning
      const huntSpeed = this.packBehavior ? speed * 1.4 : speed;
      const effectiveHuntRange = this.packBehavior
        ? huntRange * 1.3
        : huntRange;

      // Choose target based on success rate and distance
      let bestTarget = nearbyHerbivores[0];
      let bestScore = 0;

      for (const prey of nearbyHerbivores) {
        const distance = position.distanceTo(prey.position);
        // Always pursue prey, not just when within hunt range
        const distanceScore = 1 - distance / (effectiveHuntRange * 2); // Extended range for pursuit
        const successScore = this.huntSuccessRate;
        const totalScore = distanceScore * 0.7 + successScore * 0.3;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestTarget = prey;
        }
      }

      if (bestTarget) {
        const direction = {
          x: bestTarget.position.x - position.x,
          y: bestTarget.position.y - position.y,
        };
        const distance = Math.sqrt(
          direction.x * direction.x + direction.y * direction.y
        );

        if (distance > 0) {
          const normalizedDirection = {
            x: direction.x / distance,
            y: direction.y / distance,
          };

          // Update hunting success rate based on proximity
          if (distance < 30) {
            this.huntSuccessRate = Math.min(1.0, this.huntSuccessRate + 0.1);
            this.memory.successfulHuntingSpots.push(position.clone());
            if (this.memory.successfulHuntingSpots.length > 5) {
              this.memory.successfulHuntingSpots.shift();
            }
          }

          return new Position(
            position.x + normalizedDirection.x * huntSpeed * deltaTime,
            position.y + normalizedDirection.y * huntSpeed * deltaTime
          );
        }
      }
    }

    // Establish territory if not set
    if (!this.territoryCenter) {
      this.territoryCenter = position.clone();
    }

    // Return to territory periodically
    const territoryRadius = 300 * modifiers.territorySize;
    const distanceFromTerritory = this.territoryCenter
      ? position.distanceTo(this.territoryCenter)
      : 0;

    if (
      this.territoryCenter &&
      distanceFromTerritory > territoryRadius &&
      this.territoryTimer > 8
    ) {
      const direction = {
        x: this.territoryCenter.x - position.x,
        y: this.territoryCenter.y - position.y,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (distance > 0) {
        const normalizedDirection = {
          x: direction.x / distance,
          y: direction.y / distance,
        };

        return new Position(
          position.x + normalizedDirection.x * speed * deltaTime,
          position.y + normalizedDirection.y * speed * deltaTime
        );
      }
    }

    // Use provided room bounds or default
    const bounds = roomBounds || { minX: 0, maxX: 4000, minY: 0, maxY: 2000 };
    const nearBoundary =
      position.x < bounds.minX + 100 ||
      position.x > bounds.maxX - 100 ||
      position.y < bounds.minY + 100 ||
      position.y > bounds.maxY - 100;

    // Change wander direction periodically or when near boundary
    if (this.wanderTimer >= this.wanderInterval || nearBoundary) {
      if (nearBoundary) {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        this.wanderDirection = {
          x: centerX - position.x,
          y: centerY - position.y,
        };
      } else {
        this.wanderDirection = {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        };
      }

      const length = Math.sqrt(
        this.wanderDirection.x * this.wanderDirection.x +
          this.wanderDirection.y * this.wanderDirection.y
      );
      if (length > 0) {
        this.wanderDirection.x /= length;
        this.wanderDirection.y /= length;
      }
      this.wanderTimer = 0;
    }

    // Wander randomly within territory
    return new Position(
      position.x + this.wanderDirection.x * speed * deltaTime,
      position.y + this.wanderDirection.y * speed * deltaTime
    );
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
      hunger > 40 / modifiers.aggressionMultiplier && nearbyPrey.length > 0
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

// AI Factory
export class CreatureAIFactory {
  static createAI(creatureType: EntityTypeValue, species: string): CreatureAI {
    switch (creatureType) {
      case EntityType.PLANT:
        return new PlantAI();
      case EntityType.HERBIVORE:
        return new HerbivoreAI();
      case EntityType.CARNIVORE:
        return new CarnivoreAI();
      default:
        return new PlantAI(); // Default fallback
    }
  }
}

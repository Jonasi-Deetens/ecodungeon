import { Position, EntityTypeValue, EntityType } from "../types/gameTypes";

export interface CreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position;
  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number
  ): boolean;
  shouldEat(hunger: number, maxHunger: number): boolean;
  shouldHunt(hunger: number, maxHunger: number, nearbyPrey: any[]): boolean;
}

// Plant AI - Simple growth and reproduction
export class PlantAI implements CreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position {
    // Plants don't move, they just grow in place
    return position;
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number
  ): boolean {
    return health > maxHealth * 0.8 && energy > maxEnergy * 0.7;
  }

  shouldEat(hunger: number, maxHunger: number): boolean {
    return false; // Plants don't eat
  }

  shouldHunt(hunger: number, maxHunger: number, nearbyPrey: any[]): boolean {
    return false; // Plants don't hunt
  }
}

// Herbivore AI - Rabbits are skittish and prefer to flee from predators
export class HerbivoreAI implements CreatureAI {
  private wanderDirection = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
  private wanderTimer = 0;
  private readonly wanderInterval = 0.5; // Change direction every 0.5 seconds (15 frames at 30 FPS)
  private readonly speed = 50; // Much higher speed for visible movement
  private fleeDirection = { x: 0, y: 0 };
  private isFleeing = false;
  private fleeTimer = 0;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position {
    this.wanderTimer += deltaTime;
    this.fleeTimer += deltaTime;

    // Check for nearby predators (carnivores)
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE
    );
    const closestPredator = nearbyPredators[0];

    if (closestPredator) {
      const distanceToPredator = position.distanceTo(closestPredator.position);

      // Flee if predator is too close
      if (distanceToPredator < 80) {
        this.isFleeing = true;
        this.fleeTimer = 0;

        // Calculate flee direction (away from predator)
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

    // Continue fleeing for a short time after predator is gone
    if (this.isFleeing && this.fleeTimer < 2) {
      return new Position(
        position.x + this.fleeDirection.x * this.speed * 1.5 * deltaTime,
        position.y + this.fleeDirection.y * this.speed * 1.5 * deltaTime
      );
    } else {
      this.isFleeing = false;
    }

    // Check if near world boundaries and change direction if needed
    const worldBounds = { minX: 50, maxX: 2950, minY: 50, maxY: 2950 };
    const nearBoundary =
      position.x < worldBounds.minX + 100 ||
      position.x > worldBounds.maxX - 100 ||
      position.y < worldBounds.minY + 100 ||
      position.y > worldBounds.maxY - 100;

    // Change wander direction periodically or when near boundary
    if (this.wanderTimer >= this.wanderInterval || nearBoundary) {
      // If near boundary, move away from it
      if (nearBoundary) {
        const centerX = (worldBounds.minX + worldBounds.maxX) / 2;
        const centerY = (worldBounds.minY + worldBounds.maxY) / 2;
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

      // Normalize the direction
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

    // Move towards nearby plants if hungry (only within food detection range)
    const foodDetectionRange = 50; // Same as the green circle range
    const nearbyPlants = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.PLANT &&
        position.distanceTo(e.position) <= foodDetectionRange
    );

    if (nearbyPlants.length > 0) {
      // Find the closest plant within range
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

        // Move faster towards food when hungry
        const foodSeekingSpeed = this.speed * 1.2;
        return new Position(
          position.x + normalizedDirection.x * foodSeekingSpeed * deltaTime,
          position.y + normalizedDirection.y * foodSeekingSpeed * deltaTime
        );
      }
    }

    // Otherwise wander randomly
    return new Position(
      position.x + this.wanderDirection.x * this.speed * deltaTime,
      position.y + this.wanderDirection.y * this.speed * deltaTime
    );
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number
  ): boolean {
    return health > maxHealth * 0.7 && energy > maxEnergy * 0.8;
  }

  shouldEat(hunger: number, maxHunger: number): boolean {
    return hunger > maxHunger * 0.6;
  }

  shouldHunt(hunger: number, maxHunger: number, nearbyPrey: any[]): boolean {
    return false; // Herbivores don't hunt
  }
}

// Carnivore AI - Rats hunt in packs and are aggressive
export class CarnivoreAI implements CreatureAI {
  private wanderDirection = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
  private wanderTimer = 0;
  private readonly wanderInterval = 0.4; // Change direction every 0.4 seconds (12 frames at 30 FPS)
  private readonly speed = 60; // Much higher speed for visible movement
  private readonly huntRange = 120; // Larger hunt range
  private packBehavior = false;
  private packTimer = 0;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position {
    this.wanderTimer += deltaTime;
    this.packTimer += deltaTime;

    // Check for nearby pack members (other rats)
    const nearbyRats = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE && e.species === "rat"
    );

    // Activate pack behavior if other rats are nearby
    if (nearbyRats.length > 1) {
      this.packBehavior = true;
      this.packTimer = 0;
    } else if (this.packTimer > 3) {
      this.packBehavior = false;
    }

    // Look for nearby herbivores to hunt
    const nearbyHerbivores = nearbyEntities.filter(
      (e) => e.type === EntityType.HERBIVORE
    );

    if (nearbyHerbivores.length > 0) {
      // In pack mode, rats are more aggressive and hunt together
      const huntSpeed = this.packBehavior ? this.speed * 1.3 : this.speed;
      const huntRange = this.packBehavior
        ? this.huntRange * 1.2
        : this.huntRange;

      const closestHerbivore = nearbyHerbivores[0];
      const direction = {
        x: closestHerbivore.position.x - position.x,
        y: closestHerbivore.position.y - position.y,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (distance > 0 && distance < huntRange) {
        const normalizedDirection = {
          x: direction.x / distance,
          y: direction.y / distance,
        };

        return new Position(
          position.x + normalizedDirection.x * huntSpeed * deltaTime,
          position.y + normalizedDirection.y * huntSpeed * deltaTime
        );
      }
    }

    // Check if near world boundaries and change direction if needed
    const worldBounds = { minX: 50, maxX: 2950, minY: 50, maxY: 2950 };
    const nearBoundary =
      position.x < worldBounds.minX + 100 ||
      position.x > worldBounds.maxX - 100 ||
      position.y < worldBounds.minY + 100 ||
      position.y > worldBounds.maxY - 100;

    // Change wander direction periodically or when near boundary
    if (this.wanderTimer >= this.wanderInterval || nearBoundary) {
      // If near boundary, move away from it
      if (nearBoundary) {
        const centerX = (worldBounds.minX + worldBounds.maxX) / 2;
        const centerY = (worldBounds.minY + worldBounds.maxY) / 2;
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

      // Normalize the direction
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

    // Wander randomly
    return new Position(
      position.x + this.wanderDirection.x * this.speed * deltaTime,
      position.y + this.wanderDirection.y * this.speed * deltaTime
    );
  }

  shouldReproduce(
    health: number,
    maxHealth: number,
    energy: number,
    maxEnergy: number
  ): boolean {
    return health > maxHealth * 0.8 && energy > maxEnergy * 0.9;
  }

  shouldEat(hunger: number, maxHunger: number): boolean {
    return false; // Carnivores hunt, they don't "eat" plants
  }

  shouldHunt(hunger: number, maxHunger: number, nearbyPrey: any[]): boolean {
    return hunger > 40 && nearbyPrey.length > 0;
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

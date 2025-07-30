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

// Herbivore AI - Wanders around looking for plants to eat
export class HerbivoreAI implements CreatureAI {
  private wanderDirection = { x: 0, y: 0 };
  private wanderTimer = 0;
  private readonly wanderInterval = 3; // Change direction every 3 seconds
  private readonly speed = 2;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position {
    this.wanderTimer += deltaTime;

    // Change wander direction periodically
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderDirection = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      };
      this.wanderTimer = 0;
    }

    // Move towards nearby plants if hungry
    const nearbyPlants = nearbyEntities.filter(
      (e) => e.type === EntityType.PLANT
    );
    if (nearbyPlants.length > 0) {
      const closestPlant = nearbyPlants[0];
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

        return new Position(
          position.x + normalizedDirection.x * this.speed * deltaTime,
          position.y + normalizedDirection.y * this.speed * deltaTime
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

// Carnivore AI - Hunts herbivores and wanders when not hunting
export class CarnivoreAI implements CreatureAI {
  private wanderDirection = { x: 0, y: 0 };
  private wanderTimer = 0;
  private readonly wanderInterval = 2; // Change direction every 2 seconds
  private readonly speed = 2.5;
  private readonly huntRange = 100;

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[]
  ): Position {
    this.wanderTimer += deltaTime;

    // Look for nearby herbivores to hunt
    const nearbyHerbivores = nearbyEntities.filter(
      (e) => e.type === EntityType.HERBIVORE
    );
    if (nearbyHerbivores.length > 0) {
      const closestHerbivore = nearbyHerbivores[0];
      const direction = {
        x: closestHerbivore.position.x - position.x,
        y: closestHerbivore.position.y - position.y,
      };
      const distance = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );

      if (distance > 0 && distance < this.huntRange) {
        const normalizedDirection = {
          x: direction.x / distance,
          y: direction.y / distance,
        };

        return new Position(
          position.x + normalizedDirection.x * this.speed * deltaTime,
          position.y + normalizedDirection.y * this.speed * deltaTime
        );
      }
    }

    // Change wander direction periodically
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderDirection = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      };
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

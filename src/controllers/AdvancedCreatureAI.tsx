import { Position } from "../types/gameTypes";
import { 
  BehaviorStateMachine, 
  BehaviorFactory, 
  SteeringBehaviors, 
  SteeringForce,
  BehaviorState,
  PersonalityTraits,
  CreatureMemory
} from "./BehaviorSystem";

export interface AdvancedCreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string };
}

export interface BiomeModifiers {
  speedMultiplier: number;
  aggressionMultiplier: number;
  reproductionRate: number;
  foodEfficiency: number;
  energyEfficiency: number;
}

// Simplified Plant AI (plants don't move)
export class AdvancedPlantAI implements AdvancedCreatureAI {
  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string } {
    // Plants don't move
    return { position, state: "growing" };
  }
}

// Simplified Herbivore AI
export class AdvancedHerbivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory;
  private personality: PersonalityTraits;
  private currentTarget: any = null; // Target plant entity
  private id: string;
  private species: string;

  constructor(species: string = "rabbit") {
    this.species = species;
    this.id = Math.random().toString(36).substr(2, 9);
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createHerbivoreBehaviors(),
      BehaviorFactory.generateMemory(),
      BehaviorFactory.generatePersonality()
    );
    this.memory = BehaviorFactory.generateMemory();
    this.personality = BehaviorFactory.generatePersonality();
  }

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string } {
    // Separate entities by type with distance limits
    const nearbyPlants = nearbyEntities.filter(e => e.type === "plant" && e.state === "alive");
    const nearbyPredators = nearbyEntities.filter(e => 
      e.type === "carnivore" && 
      e.state === "alive" && 
      position.distanceTo(e.position) <= 200 // Only consider predators within 200px for fleeing
    );
    const nearbyHerbivores = nearbyEntities.filter(e => e.type === "herbivore" && e.state === "alive");

    // Calculate context for state machine
    const hungerPercent = (hunger || 0) / (maxHunger || 100);
    const energyPercent = (energy || 100) / (maxEnergy || 100);
    const healthPercent = (health || 100) / (maxHealth || 100);

    // Check if close to food
    const isCloseToFood = nearbyPlants.some(plant => 
      position.distanceTo(plant.position) <= 25
    );

    const context = {
      hunger: hunger || 0,
      maxHunger: maxHunger || 100,
      health: health || 100,
      maxHealth: maxHealth || 100,
      energy: energy || 100,
      maxEnergy: maxEnergy || 100,
      nearbyPredators: nearbyPredators.length,
      nearbyFood: nearbyPlants.length,
      isCloseToFood,
    };

    // Update state machine
    const newState = this.stateMachine.update(deltaTime, context);
    
    // Debug logging for fleeing behavior
    if (newState === "fleeing" && Math.random() < 0.1) {
      console.log(`🦘 Herbivore ${this.id.slice(-4)} fleeing from ${nearbyPredators.length} predators within 200px`);
      nearbyPredators.forEach(predator => {
        const distance = position.distanceTo(predator.position);
        console.log(`  - Predator ${predator.id.slice(-4)} at distance ${distance.toFixed(1)}px`);
      });
    }

    // Calculate movement based on state
    const speed = (creatureSpeed || 80) * (this.getBiomeModifiers(biome || "forest").speedMultiplier);
    let steeringForce: SteeringForce = { x: 0, y: 0 };

    switch (newState) {
      case BehaviorState.EATING:
        // Complete stillness when eating
        steeringForce = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        break;

      case BehaviorState.RESTING:
        // Complete stillness when resting
        steeringForce = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        break;

      case BehaviorState.FLEEING:
        // Flee from closest predator
        if (nearbyPredators.length > 0) {
          const closestPredator = nearbyPredators.reduce((closest, predator) => {
            const distance = position.distanceTo(predator.position);
            const closestDistance = position.distanceTo(closest.position);
            return distance < closestDistance ? predator : closest;
          });
          steeringForce = SteeringBehaviors.flee(position, closestPredator.position, speed * 1.5, this.currentVelocity);
        }
        break;

      case BehaviorState.GRAZING:
        // Move toward target plant - stick to chosen target
        if (nearbyPlants.length > 0) {
          // If no current target, choose the closest plant
          if (!this.currentTarget) {
            this.currentTarget = nearbyPlants.reduce((closest, plant) => {
              const distance = position.distanceTo(plant.position);
              const closestDistance = position.distanceTo(closest.position);
              return distance < closestDistance ? plant : closest;
            });
          } else {
            // Check if current target is still valid
            const targetStillValid = nearbyPlants.some(plant => plant.id === this.currentTarget.id);
            if (!targetStillValid) {
              // Target is no longer valid, choose new target
              this.currentTarget = nearbyPlants.reduce((closest, plant) => {
                const distance = position.distanceTo(plant.position);
                const closestDistance = position.distanceTo(closest.position);
                return distance < closestDistance ? plant : closest;
              });
            }
          }
          
          const distanceToPlant = position.distanceTo(this.currentTarget.position);
          
          if (distanceToPlant <= 25) {
            // Close enough to eat - stand still
            steeringForce = { x: 0, y: 0 };
            this.currentVelocity = { x: 0, y: 0 };
          } else {
            // Move toward target plant - full speed when hungry
            steeringForce = SteeringBehaviors.arrive(position, this.currentTarget.position, speed, 25, this.currentVelocity);
          }
        } else {
          // No plants nearby, clear target
          this.currentTarget = null;
        }
        break;

      case BehaviorState.WANDERING:
      default:
        // Random wandering movement
        steeringForce = SteeringBehaviors.wander(this.currentVelocity, 50, 100, 10);
        // Clear target when wandering
        this.currentTarget = null;
        break;
    }

    // Update velocity based on steering force
    const maxForce = speed * 0.1;
    const forceMagnitude = Math.sqrt(steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y);
    
    if (forceMagnitude > maxForce) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * maxForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * maxForce;
    }

    // Apply steering force to velocity
    this.currentVelocity.x += steeringForce.x * deltaTime;
    this.currentVelocity.y += steeringForce.y * deltaTime;

    // Limit velocity to speed
    const velocityMagnitude = Math.sqrt(this.currentVelocity.x * this.currentVelocity.x + this.currentVelocity.y * this.currentVelocity.y);
    if (velocityMagnitude > speed) {
      this.currentVelocity.x = (this.currentVelocity.x / velocityMagnitude) * speed;
      this.currentVelocity.y = (this.currentVelocity.y / velocityMagnitude) * speed;
    }

    // Update position
    const newPosition = new Position(
      position.x + this.currentVelocity.x * deltaTime,
      position.y + this.currentVelocity.y * deltaTime
    );

    // Keep within bounds if provided
    if (roomBounds) {
      newPosition.x = Math.max(roomBounds.minX + 50, Math.min(roomBounds.maxX - 50, newPosition.x));
      newPosition.y = Math.max(roomBounds.minY + 50, Math.min(roomBounds.maxY - 50, newPosition.y));
    }

    return { position: newPosition, state: newState };
  }

  private getBiomeModifiers(biome: string): BiomeModifiers {
    switch (biome) {
      case "forest":
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
      case "desert":
        return { speedMultiplier: 1.2, aggressionMultiplier: 1.1, reproductionRate: 0.8, foodEfficiency: 0.9, energyEfficiency: 0.8 };
      case "arctic":
        return { speedMultiplier: 0.8, aggressionMultiplier: 0.9, reproductionRate: 0.7, foodEfficiency: 1.1, energyEfficiency: 1.2 };
      case "swamp":
        return { speedMultiplier: 0.9, aggressionMultiplier: 1.0, reproductionRate: 1.1, foodEfficiency: 1.0, energyEfficiency: 0.9 };
      case "cave":
        return { speedMultiplier: 0.7, aggressionMultiplier: 1.2, reproductionRate: 0.9, foodEfficiency: 0.8, energyEfficiency: 1.1 };
      case "volcanic":
        return { speedMultiplier: 1.1, aggressionMultiplier: 1.3, reproductionRate: 0.6, foodEfficiency: 0.7, energyEfficiency: 0.8 };
      case "laboratory":
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
      default:
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
    }
  }
}

// Simplified Carnivore AI with single target system
export class AdvancedCarnivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory;
  private personality: PersonalityTraits;
  private currentTarget: any = null; // Single target system
  private id: string;
  private species: string;

  constructor(species: string = "rat") {
    this.species = species;
    this.id = Math.random().toString(36).substr(2, 9);
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createCarnivoreBehaviors(),
      BehaviorFactory.generateMemory(),
      BehaviorFactory.generatePersonality()
    );
    this.memory = BehaviorFactory.generateMemory();
    this.personality = BehaviorFactory.generatePersonality();
  }

  update(
    deltaTime: number,
    position: Position,
    nearbyEntities: any[],
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number },
    biome?: string,
    hunger?: number,
    maxHunger?: number,
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string } {
    // Separate entities by type with distance limits
    const nearbyLivePrey = nearbyEntities.filter(e => e.type === "herbivore" && e.state === "alive");
    const nearbyDeadPrey = nearbyEntities.filter(e => e.type === "herbivore" && e.state === "dead" && e.weight > 0);
    const nearbyPrey = [...nearbyLivePrey, ...nearbyDeadPrey]; // Combine live and dead prey
    const nearbyPredators = nearbyEntities.filter(e => 
      e.type === "carnivore" && 
      e.state === "alive" && 
      e.id !== this.id &&
      position.distanceTo(e.position) <= 200 // Only consider predators within 200px for fleeing
    );

    // Calculate context for state machine
    const hungerPercent = (hunger || 0) / (maxHunger || 100);
    const energyPercent = (energy || 100) / (maxEnergy || 100);
    const healthPercent = (health || 100) / (maxHealth || 100);

    // Check if close to current target or any dead prey
    const isCloseToPrey = (this.currentTarget && 
      position.distanceTo(this.currentTarget.position) <= 30) ||
      nearbyDeadPrey.some(prey => position.distanceTo(prey.position) <= 30);

    const context = {
      hunger: hunger || 0,
      maxHunger: maxHunger || 100,
      health: health || 100,
      maxHealth: maxHealth || 100,
      energy: energy || 100,
      maxEnergy: maxEnergy || 100,
      nearbyPredators: nearbyPredators.length,
      nearbyFood: 0, // Carnivores don't eat plants
      nearbyPrey: nearbyLivePrey.length, // Only count live prey for hunting
      isCloseToPrey,
    };

    // Update state machine
    const newState = this.stateMachine.update(deltaTime, context);

    // Calculate movement based on state
    const speed = (creatureSpeed || 100) * (this.getBiomeModifiers(biome || "forest").speedMultiplier);
    let steeringForce: SteeringForce = { x: 0, y: 0 };

    switch (newState) {
      case BehaviorState.EATING:
        // Complete stillness when eating
        steeringForce = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        break;

      case BehaviorState.RESTING:
        // Complete stillness when resting
        steeringForce = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        break;

      case BehaviorState.FLEEING:
        // Flee from closest predator
        if (nearbyPredators.length > 0) {
          const closestPredator = nearbyPredators.reduce((closest, predator) => {
            const distance = position.distanceTo(predator.position);
            const closestDistance = position.distanceTo(closest.position);
            return distance < closestDistance ? predator : closest;
          });
          steeringForce = SteeringBehaviors.flee(position, closestPredator.position, speed * 1.5, this.currentVelocity);
        }
        break;

      case BehaviorState.HUNTING:
        // Single target hunting system - ONLY hunt live prey
        if (nearbyLivePrey.length > 0) {
          // If no current target, choose the closest live prey
          if (!this.currentTarget) {
            this.currentTarget = nearbyLivePrey.reduce((closest, prey) => {
              const distance = position.distanceTo(prey.position);
              const closestDistance = position.distanceTo(closest.position);
              return distance < closestDistance ? prey : closest;
            });
          } else {
            // Check if current target is still valid (must be live prey)
            const targetStillValid = nearbyLivePrey.some(prey => prey.id === this.currentTarget.id);
            if (!targetStillValid) {
              // Target is no longer valid, choose new live prey target
              this.currentTarget = nearbyLivePrey.reduce((closest, prey) => {
                const distance = position.distanceTo(prey.position);
                const closestDistance = position.distanceTo(closest.position);
                return distance < closestDistance ? prey : closest;
              });
            }
          }

          // Move toward current target
          if (this.currentTarget) {
            const distanceToTarget = position.distanceTo(this.currentTarget.position);
            
            if (distanceToTarget <= 30) {
              // Close enough to attack - stand still
              steeringForce = { x: 0, y: 0 };
              this.currentVelocity = { x: 0, y: 0 };
            } else {
              // Move toward target
              steeringForce = SteeringBehaviors.seek(position, this.currentTarget.position, speed, this.currentVelocity);
            }
          }
        } else {
          // No live prey nearby, clear target
          this.currentTarget = null;
        }
        break;

      case BehaviorState.WANDERING:
      default:
        // Random wandering movement
        steeringForce = SteeringBehaviors.wander(this.currentVelocity, 50, 100, 10);
        // Clear target when wandering
        this.currentTarget = null;
        break;
    }

    // Update velocity based on steering force
    const maxForce = speed * 0.1;
    const forceMagnitude = Math.sqrt(steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y);
    
    if (forceMagnitude > maxForce) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * maxForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * maxForce;
    }

    // Apply steering force to velocity
    this.currentVelocity.x += steeringForce.x * deltaTime;
    this.currentVelocity.y += steeringForce.y * deltaTime;

    // Limit velocity to speed
    const velocityMagnitude = Math.sqrt(this.currentVelocity.x * this.currentVelocity.x + this.currentVelocity.y * this.currentVelocity.y);
    if (velocityMagnitude > speed) {
      this.currentVelocity.x = (this.currentVelocity.x / velocityMagnitude) * speed;
      this.currentVelocity.y = (this.currentVelocity.y / velocityMagnitude) * speed;
    }

    // Update position
    const newPosition = new Position(
      position.x + this.currentVelocity.x * deltaTime,
      position.y + this.currentVelocity.y * deltaTime
    );

    // Keep within bounds if provided
    if (roomBounds) {
      newPosition.x = Math.max(roomBounds.minX + 50, Math.min(roomBounds.maxX - 50, newPosition.x));
      newPosition.y = Math.max(roomBounds.minY + 50, Math.min(roomBounds.maxY - 50, newPosition.y));
    }

    return { position: newPosition, state: newState };
  }

  private getBiomeModifiers(biome: string): BiomeModifiers {
    switch (biome) {
      case "forest":
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
      case "desert":
        return { speedMultiplier: 1.2, aggressionMultiplier: 1.1, reproductionRate: 0.8, foodEfficiency: 0.9, energyEfficiency: 0.8 };
      case "arctic":
        return { speedMultiplier: 0.8, aggressionMultiplier: 0.9, reproductionRate: 0.7, foodEfficiency: 1.1, energyEfficiency: 1.2 };
      case "swamp":
        return { speedMultiplier: 0.9, aggressionMultiplier: 1.0, reproductionRate: 1.1, foodEfficiency: 1.0, energyEfficiency: 0.9 };
      case "cave":
        return { speedMultiplier: 0.7, aggressionMultiplier: 1.2, reproductionRate: 0.9, foodEfficiency: 0.8, energyEfficiency: 1.1 };
      case "volcanic":
        return { speedMultiplier: 1.1, aggressionMultiplier: 1.3, reproductionRate: 0.6, foodEfficiency: 0.7, energyEfficiency: 0.8 };
      case "laboratory":
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
      default:
        return { speedMultiplier: 1.0, aggressionMultiplier: 1.0, reproductionRate: 1.0, foodEfficiency: 1.0, energyEfficiency: 1.0 };
    }
  }
}

// AI Factory
export class AdvancedCreatureAIFactory {
  static createAI(creatureType: string, species: string): AdvancedCreatureAI {
    switch (creatureType) {
      case "plant":
        return new AdvancedPlantAI();
      case "herbivore":
        return new AdvancedHerbivoreAI(species);
      case "carnivore":
        return new AdvancedCarnivoreAI(species);
      default:
        throw new Error(`Unknown creature type: ${creatureType}`);
    }
  }
}

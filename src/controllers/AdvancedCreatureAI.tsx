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
  CreatureMemory,
  PersonalityTraits,
  Territory,
  SteeringForce,
} from "./BehaviorSystem";

// ============================================================================
// ENHANCED CREATURE AI INTERFACES
// ============================================================================

// Enhanced AI interface with realistic behavior
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
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string };
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
  getPersonality(): PersonalityTraits;
  getMemory(): CreatureMemory;
  getTerritory(): Territory | null;
}

// Enhanced biome modifiers
export interface BiomeModifiers {
  speedMultiplier: number;
  aggressionMultiplier: number;
  reproductionRate: number;
  foodEfficiency: number;
  territorySize: number;
  packBehavior: boolean;
  memoryRetention: number;
  energyEfficiency: number;
  stealthBonus: number;
  huntingSuccessRate: number;
}

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
  ): { position: Position; state: string } {
    // Plants don't move, just return current position and state
    return { position, state: "growing" };
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
          energyEfficiency: 0.8,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.0,
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
          energyEfficiency: 0.7,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.0,
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
          energyEfficiency: 1.0,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.0,
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
          energyEfficiency: 0.8,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.0,
        };
    }
  }

  getPersonality(): PersonalityTraits {
    return {
      boldness: 0.6,
      sociability: 0.7,
      curiosity: 0.3,
      aggression: 0.5,
      intelligence: 0.4,
      energy: 0.5,
      territoriality: 0.2,
      loyalty: 0.8,
    };
  }

  getMemory(): CreatureMemory {
    return BehaviorFactory.generateMemory();
  }

  getTerritory(): Territory | null {
    return null;
  }
}

// ============================================================================
// ADVANCED HERBIVORE AI WITH REALISTIC BEHAVIOR
// ============================================================================

export class AdvancedHerbivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory;
  private personality: PersonalityTraits;
  private territoryCenter: Position | null = null;
  private readonly baseSpeed = 80;
  private energy = 100;
  private maxEnergy = 100;
  private lastStateChange = Date.now();
  private currentTarget: Position | null = null;
  private flockingBehavior: FlockingBehavior;
  private id: string;
  private lastTargetTime: number = 0;

  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.personality = BehaviorFactory.generatePersonality();
    this.memory = BehaviorFactory.generateMemory();
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createHerbivoreBehaviors(),
      this.memory,
      this.personality
    );
    this.flockingBehavior = new FlockingBehavior();
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
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string } {
    // Safety check for undefined position
    if (!position) {
      return { position: new Position(0, 0), state: "idle" };
    }

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = (creatureSpeed || this.baseSpeed) * modifiers.speedMultiplier;

    // Debug logging for speed calculation
    if (Math.random() < 0.01) {
      console.log(`Speed Debug:`);
      console.log(`  creatureSpeed: ${creatureSpeed}`);
      console.log(`  baseSpeed: ${this.baseSpeed}`);
      console.log(`  biome: ${biome || "forest"}`);
      console.log(`  speedMultiplier: ${modifiers.speedMultiplier}`);
      console.log(`  final speed: ${speed}`);
    }

    // Update energy
    this.energy = energy || this.energy;
    this.maxEnergy = maxEnergy || this.maxEnergy;

    // Categorize nearby entities
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE && e.id !== this.id
    );
    const nearbyPlants = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.PLANT &&
        (e.state === EntityState.ALIVE ||
          (e.state === EntityState.DEAD && e.weight > 0))
    );
    const nearbyHerbivores = nearbyEntities.filter(
      (e) => e.type === EntityType.HERBIVORE && e.id !== this.id
    );

    // Update memory with current observations
    this.updateMemory(
      position,
      nearbyPlants,
      nearbyPredators,
      nearbyHerbivores
    );

    // Create context for state machine
    const context = {
      hunger: hunger || 0,
      maxHunger: maxHunger || 100,
      health: health || 100,
      maxHealth: maxHealth || 100,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      nearbyPredators: nearbyPredators.length,
      nearbyFood: nearbyPlants.length,
      nearbyAllies: nearbyHerbivores.length,
      timeOfDay: 12, // Default to noon
      weather: "clear",
      season: "summer",
    };

    // Debug logging for state machine context
    if (Math.random() < 0.1) {
      // Increased from 0.01 to 0.1 (10% frequency)
      console.log(`State Machine Context Debug:`);
      console.log(`  Current State: ${this.stateMachine.getCurrentState()}`);
      console.log(
        `  Hunger: ${context.hunger}/${context.maxHunger} (${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `  Health: ${context.health}/${context.maxHealth} (${(
          (context.health / context.maxHealth) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `  Energy: ${context.energy}/${context.maxEnergy} (${(
          (context.energy / context.maxEnergy) *
          100
        ).toFixed(1)}%)`
      );
      console.log(`  Nearby Predators: ${context.nearbyPredators}`);
      console.log(`  Nearby Food: ${context.nearbyFood}`);
      console.log(`  Nearby Allies: ${context.nearbyAllies}`);

      // Add specific grazing condition check
      const hungerPercent = context.hunger / context.maxHunger;
      const canGraze =
        hungerPercent >= 0.1 && hungerPercent <= 1.0 && context.nearbyFood >= 1;
      console.log(
        `  Can Graze: ${canGraze} (hunger: ${(hungerPercent * 100).toFixed(
          1
        )}% >= 10%, food: ${context.nearbyFood} >= 1)`
      );
    }

    // Update state machine
    const currentState = this.stateMachine.getCurrentState();
    this.stateMachine.update(deltaTime, context);
    const newState = this.stateMachine.getCurrentState();

    // Debug logging for state transitions (increased frequency)
    if (Math.random() < 0.05) {
      // 5% frequency
      console.log(`State Machine Update Debug:`);
      console.log(`  AI ID: ${this.id}`);
      console.log(`  Previous State: ${currentState}`);
      console.log(`  New State: ${newState}`);
      console.log(`  State Changed: ${currentState !== newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );

      // Add emergency transition check
      const shouldFlee = context.nearbyPredators >= 1;
      const shouldSleep = context.energy < 20; // Low energy
      console.log(
        `  Should Flee: ${shouldFlee} (predators: ${context.nearbyPredators})`
      );
      console.log(
        `  Should Sleep: ${shouldSleep} (energy: ${context.energy}%)`
      );
    }

    // Debug logging for state transitions
    if (currentState !== newState) {
      console.log(`State Transition Debug:`);
      console.log(`  ${currentState} -> ${newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );
    }

    // Log state changes
    if (currentState !== newState) {
      console.log(`Herbivore state change: ${currentState} -> ${newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );
    }

    // Debug logging for movement
    if (Math.random() < 0.01) {
      // Log 1% of the time
      console.log(`Herbivore AI Debug:`);
      console.log(`  Current State: ${newState}`);
      console.log(`  Speed: ${speed}`);
      console.log(
        `  Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
      );
      console.log(
        `  Velocity: (${this.currentVelocity.x.toFixed(
          1
        )}, ${this.currentVelocity.y.toFixed(1)})`
      );
      console.log(`  Nearby Plants: ${nearbyPlants.length}`);
      console.log(`  Nearby Predators: ${nearbyPredators.length}`);
    }

    // Calculate movement based on current state
    let steeringForce = { x: 0, y: 0 };

    switch (newState) {
      case BehaviorState.FLEEING:
        steeringForce = this.calculateFleeingForce(
          position,
          nearbyPredators,
          speed
        );
        break;

      case BehaviorState.GRAZING:
        steeringForce = this.calculateFoodSeekingForce(
          position,
          nearbyPlants,
          speed,
          roomBounds
        );

        // Debug logging for grazing behavior
        if (Math.random() < 0.05) {
          // Increased from 0.01 to 0.05 for more frequent logging
          console.log(`Grazing Debug:`);
          console.log(`  Nearby Plants: ${nearbyPlants.length}`);
          console.log(
            `  Hunger: ${(((hunger || 0) / (maxHunger || 100)) * 100).toFixed(
              1
            )}%`
          );
          console.log(
            `  Steering Force: (${steeringForce.x.toFixed(
              3
            )}, ${steeringForce.y.toFixed(3)})`
          );
          console.log(
            `  Steering Force Magnitude: ${Math.sqrt(
              steeringForce.x * steeringForce.x +
                steeringForce.y * steeringForce.y
            ).toFixed(3)}`
          );
          console.log(
            `  Current Velocity: (${this.currentVelocity.x.toFixed(
              3
            )}, ${this.currentVelocity.y.toFixed(3)})`
          );
          console.log(`  Speed: ${speed.toFixed(1)}`);
          console.log(`  Grazing Speed: ${(speed * 3.0).toFixed(1)}`);
          if (nearbyPlants.length > 0) {
            const closestPlant = nearbyPlants[0];
            const distance = position.distanceTo(closestPlant.position);
            console.log(`  Closest Plant Distance: ${distance.toFixed(1)}`);
            console.log(
              `  Closest Plant Position: (${closestPlant.position.x.toFixed(
                1
              )}, ${closestPlant.position.y.toFixed(1)})`
            );
            console.log(
              `  Current Position: (${position.x.toFixed(
                1
              )}, ${position.y.toFixed(1)})`
            );
            console.log(
              `  Direction to Plant: (${(
                closestPlant.position.x - position.x
              ).toFixed(1)}, ${(closestPlant.position.y - position.y).toFixed(
                1
              )})`
            );
          }
        }
        break;

      case BehaviorState.RESTING:
        // Stop moving when resting
        steeringForce = { x: 0, y: 0 };
        break;

      case BehaviorState.SLEEPING:
        // Minimal movement when sleeping
        steeringForce = { x: 0, y: 0 };
        break;

      case BehaviorState.SOCIALIZING:
        steeringForce = this.calculateSocializingForce(
          position,
          nearbyHerbivores,
          speed
        );
        break;

      case BehaviorState.PATROLLING_TERRITORY:
        steeringForce = this.calculateTerritoryPatrolForce(position, speed);
        break;

      case BehaviorState.EXPLORING:
        steeringForce = this.calculateExplorationForce(
          position,
          speed,
          roomBounds
        );

        // Debug logging for exploration behavior
        if (Math.random() < 0.05) {
          // Increased from 0.01 to 0.05 for more frequent logging
          console.log(`Exploration Debug:`);
          console.log(
            `  Hunger: ${(((hunger || 0) / (maxHunger || 100)) * 100).toFixed(
              1
            )}%`
          );
          console.log(`  Nearby Plants: ${nearbyPlants.length}`);
          console.log(
            `  Remembered Food Locations: ${this.memory.lastKnownFoodPositions.length}`
          );
          console.log(
            `  Steering Force: (${steeringForce.x.toFixed(
              3
            )}, ${steeringForce.y.toFixed(3)})`
          );
          if (this.currentTarget) {
            const distanceToTarget = position.distanceTo(this.currentTarget);
            console.log(`  Distance to Target: ${distanceToTarget.toFixed(1)}`);
            console.log(
              `  Target: (${this.currentTarget.x.toFixed(
                1
              )}, ${this.currentTarget.y.toFixed(1)})`
            );
          }
          console.log(
            `  Current Velocity: (${this.currentVelocity.x.toFixed(
              3
            )}, ${this.currentVelocity.y.toFixed(3)})`
          );
          console.log(`  Speed: ${speed.toFixed(1)}`);
          console.log(`  Exploration Speed: ${(speed * 4.0).toFixed(1)}`);
        }
        break;

      case BehaviorState.WANDERING:
      default:
        steeringForce = this.calculateWanderingForce(position, speed);
        break;
    }

    // Debug logging for steering force calculation
    if (Math.random() < 0.05) {
      // Increased frequency
      console.log(`Steering Force Debug:`);
      console.log(`  Current State: ${newState}`);
      console.log(
        `  Raw Steering Force: (${steeringForce.x.toFixed(
          3
        )}, ${steeringForce.y.toFixed(3)})`
      );
      console.log(
        `  Force Magnitude: ${Math.sqrt(
          steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y
        ).toFixed(3)}`
      );
      console.log(`  Min Force: ${(speed * 0.5).toFixed(3)}`);
      console.log(`  Max Force: ${(speed * 0.1).toFixed(3)}`);
      console.log(`  Speed: ${speed.toFixed(1)}`);
    }

    // Apply flocking behavior if other herbivores are nearby
    if (nearbyHerbivores.length > 0) {
      const flockingForce = FlockingBehavior.calculateFlockingForce(
        position,
        this.currentVelocity,
        nearbyHerbivores.map((e) => e.position),
        this.personality,
        50,
        100,
        150,
        speed
      );

      // Blend flocking with current behavior
      const flockingWeight = Math.min(0.3, nearbyHerbivores.length * 0.1);
      steeringForce.x =
        steeringForce.x * (1 - flockingWeight) +
        flockingForce.x * flockingWeight;
      steeringForce.y =
        steeringForce.y * (1 - flockingWeight) +
        flockingForce.y * flockingWeight;
    }

    // Apply wall avoidance if room bounds are provided
    if (roomBounds) {
      const wallAvoidance = SteeringBehaviors.avoidWalls(
        position,
        roomBounds,
        speed
      );
      steeringForce.x += wallAvoidance.x * 0.5;
      steeringForce.y += wallAvoidance.y * 0.5;
    }

    // Update velocity with steering force
    const maxForce = speed * 0.1; // Limit steering force
    const forceMagnitude = Math.sqrt(
      steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y
    );

    // Ensure minimum steering force to start movement
    const minForce = speed * 0.5; // Increased from 0.2 to 0.5 (2.5x stronger minimum force)
    if (forceMagnitude < minForce && forceMagnitude > 0) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * minForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * minForce;
    } else if (forceMagnitude > maxForce) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * maxForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * maxForce;
    }

    // Update velocity with steering force - INCREASED SCALE FOR VISIBLE MOVEMENT
    this.currentVelocity.x += steeringForce.x * deltaTime * 100; // Increased from 50 to 100 (2x stronger)
    this.currentVelocity.y += steeringForce.y * deltaTime * 100; // Increased from 50 to 100 (2x stronger)

    // Ensure minimum movement for grazing state
    if (newState === "grazing" && nearbyPlants.length > 0) {
      const minVelocity = speed * 0.1; // Minimum 10% of speed
      const currentVelocityMagnitude = Math.sqrt(
        this.currentVelocity.x * this.currentVelocity.x +
          this.currentVelocity.y * this.currentVelocity.y
      );

      if (currentVelocityMagnitude < minVelocity) {
        // Force movement towards closest plant
        const closestPlant = nearbyPlants[0];
        const directionX = closestPlant.position.x - position.x;
        const directionY = closestPlant.position.y - position.y;
        const distance = Math.sqrt(
          directionX * directionX + directionY * directionY
        );

        if (distance > 0) {
          this.currentVelocity.x = (directionX / distance) * minVelocity;
          this.currentVelocity.y = (directionY / distance) * minVelocity;
        }
      }
    }

    // Ensure minimum movement for exploring state
    if (newState === "exploring") {
      const minVelocity = speed * 0.2; // Minimum 20% of speed for exploration
      const currentVelocityMagnitude = Math.sqrt(
        this.currentVelocity.x * this.currentVelocity.x +
          this.currentVelocity.y * this.currentVelocity.y
      );

      if (currentVelocityMagnitude < minVelocity) {
        // Force movement towards exploration target or random direction
        if (this.currentTarget) {
          const directionX = this.currentTarget.x - position.x;
          const directionY = this.currentTarget.y - position.y;
          const distance = Math.sqrt(
            directionX * directionX + directionY * directionY
          );

          if (distance > 0) {
            this.currentVelocity.x = (directionX / distance) * minVelocity;
            this.currentVelocity.y = (directionY / distance) * minVelocity;
          }
        } else {
          // Random direction if no target
          const randomAngle = Math.random() * Math.PI * 2;
          this.currentVelocity.x = Math.cos(randomAngle) * minVelocity;
          this.currentVelocity.y = Math.sin(randomAngle) * minVelocity;
        }
      }
    }

    // Debug logging for velocity updates
    if (Math.random() < 0.01) {
      console.log(`Velocity Update Debug:`);
      console.log(
        `  Steering Force: (${steeringForce.x.toFixed(
          3
        )}, ${steeringForce.y.toFixed(3)})`
      );
      console.log(`  Delta Time: ${deltaTime.toFixed(3)}`);
      console.log(
        `  Velocity Change: (${(steeringForce.x * deltaTime).toFixed(3)}, ${(
          steeringForce.y * deltaTime
        ).toFixed(3)})`
      );
      console.log(
        `  Old Velocity: (${(
          this.currentVelocity.x -
          steeringForce.x * deltaTime
        ).toFixed(3)}, ${(
          this.currentVelocity.y -
          steeringForce.y * deltaTime
        ).toFixed(3)})`
      );
      console.log(
        `  New Velocity: (${this.currentVelocity.x.toFixed(
          3
        )}, ${this.currentVelocity.y.toFixed(3)})`
      );
    }

    // Limit velocity to max speed
    const velocityMagnitude = Math.sqrt(
      this.currentVelocity.x * this.currentVelocity.x +
        this.currentVelocity.y * this.currentVelocity.y
    );
    if (velocityMagnitude > speed) {
      this.currentVelocity.x =
        (this.currentVelocity.x / velocityMagnitude) * speed;
      this.currentVelocity.y =
        (this.currentVelocity.y / velocityMagnitude) * speed;
    }

    // Apply velocity to position
    const newX = position.x + this.currentVelocity.x * deltaTime;
    const newY = position.y + this.currentVelocity.y * deltaTime;

    // Debug logging for position changes
    if (Math.random() < 0.05) {
      // Increased from 0.01 to 0.05 for more frequent logging
      console.log(`Position Change Debug:`);
      console.log(
        `  Old Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
      );
      console.log(`  New Position: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
      console.log(
        `  Position Delta: (${(newX - position.x).toFixed(3)}, ${(
          newY - position.y
        ).toFixed(3)})`
      );
      console.log(
        `  Velocity: (${this.currentVelocity.x.toFixed(
          3
        )}, ${this.currentVelocity.y.toFixed(3)})`
      );
      console.log(`  Delta Time: ${deltaTime.toFixed(3)}`);
    }

    return { position: new Position(newX, newY), state: newState };
  }

  private updateMemory(
    position: Position,
    nearbyPlants: any[],
    nearbyPredators: any[],
    nearbyHerbivores: any[]
  ): void {
    // Update food memory
    nearbyPlants.forEach((plant) => {
      if (
        plant.position &&
        !this.memory.lastKnownFoodPositions.some(
          (p) => p.position.distanceTo(plant.position) < 30
        )
      ) {
        this.memory.lastKnownFoodPositions.push({
          position: plant.position.clone(),
          timestamp: Date.now(),
          value: 1.0,
        });
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
          (p) => p.position.distanceTo(predator.position) < 50
        )
      ) {
        this.memory.lastKnownPredatorPositions.push({
          position: predator.position.clone(),
          timestamp: Date.now(),
          threat: 1.0,
        });
        if (this.memory.lastKnownPredatorPositions.length > 5) {
          this.memory.lastKnownPredatorPositions.shift();
        }
      }
    });

    // Update dangerous areas
    if (nearbyPredators.length > 0) {
      const dangerousArea = {
        position: position.clone(),
        threatLevel: nearbyPredators.length,
        lastVisit: Date.now(),
      };

      const existingIndex = this.memory.dangerousAreas.findIndex(
        (area) => area.position.distanceTo(position) < 50
      );

      if (existingIndex >= 0) {
        this.memory.dangerousAreas[existingIndex] = dangerousArea;
      } else {
        this.memory.dangerousAreas.push(dangerousArea);
        if (this.memory.dangerousAreas.length > 8) {
          this.memory.dangerousAreas.shift();
        }
      }
    }
  }

  private calculateFleeingForce(
    position: Position,
    predators: any[],
    speed: number
  ): SteeringForce {
    if (predators.length === 0) {
      return { x: 0, y: 0, magnitude: 0 };
    }

    let fleeForce = { x: 0, y: 0 };

    predators.forEach((predator) => {
      const fleeDirection = SteeringBehaviors.flee(
        position,
        predator.position,
        speed
      );
      fleeForce.x += fleeDirection.x;
      fleeForce.y += fleeDirection.y;
    });

    // Normalize and apply flee speed multiplier
    const magnitude = Math.sqrt(
      fleeForce.x * fleeForce.x + fleeForce.y * fleeForce.y
    );
    if (magnitude > 0) {
      fleeForce.x = (fleeForce.x / magnitude) * speed * 2.0;
      fleeForce.y = (fleeForce.y / magnitude) * speed * 2.0;
    }

    return { ...fleeForce, magnitude };
  }

  private calculateFoodSeekingForce(
    position: Position,
    plants: any[],
    speed: number,
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): SteeringForce {
    if (plants.length === 0) {
      // No nearby plants, use memory or explore
      if (this.memory.lastKnownFoodPositions.length > 0) {
        const rememberedFood = this.memory.lastKnownFoodPositions[0];
        if (rememberedFood) {
          const timeSinceSeen = Date.now() - rememberedFood.timestamp;
          if (timeSinceSeen < 30000) {
            // 30 seconds
            return SteeringBehaviors.seek(
              position,
              rememberedFood.position,
              speed * 1.5, // Move faster when seeking remembered food
              this.currentVelocity
            );
          }
        }
      }
      // Fall back to exploration with room bounds
      return this.calculateExplorationForce(position, speed, roomBounds);
    }

    // Find closest plant
    let closestPlant = plants[0];
    let closestDistance = position.distanceTo(closestPlant.position);

    for (const plant of plants) {
      const distance = position.distanceTo(plant.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlant = plant;
      }
    }

    // Calculate direct steering force towards plant (much more aggressive)
    const directionX = closestPlant.position.x - position.x;
    const directionY = closestPlant.position.y - position.y;
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY
    );

    if (distance > 0) {
      // Normalize direction and apply aggressive grazing speed
      const grazingSpeed = speed * 3.0; // 3x faster when grazing (very aggressive)
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;

      // Create a strong steering force directly towards the plant
      const steeringForce = {
        x: normalizedX * grazingSpeed,
        y: normalizedY * grazingSpeed,
        magnitude: grazingSpeed,
      };

      return steeringForce;
    }

    // Fallback to normal seek if distance is zero
    const grazingSpeed = speed * 1.8;
    return SteeringBehaviors.seek(
      position,
      closestPlant.position,
      grazingSpeed,
      this.currentVelocity
    );
  }

  private calculateSocializingForce(
    position: Position,
    allies: any[],
    speed: number
  ): SteeringForce {
    if (allies.length === 0) {
      return this.calculateWanderingForce(position, speed);
    }

    // Move towards the center of nearby allies
    let centerX = 0;
    let centerY = 0;

    allies.forEach((ally) => {
      centerX += ally.position.x;
      centerY += ally.position.y;
    });

    centerX /= allies.length;
    centerY /= allies.length;

    const centerPosition = new Position(centerX, centerY);
    return SteeringBehaviors.seek(
      position,
      centerPosition,
      speed * 0.5,
      this.currentVelocity
    );
  }

  private calculateTerritoryPatrolForce(
    position: Position,
    speed: number
  ): SteeringForce {
    if (!this.territoryCenter) {
      this.territoryCenter = position.clone();
    }

    // Create a patrol pattern around territory center
    const time = Date.now() * 0.001;
    const patrolRadius = 50;
    const patrolX =
      this.territoryCenter.x + Math.cos(time * 0.5) * patrolRadius;
    const patrolY =
      this.territoryCenter.y + Math.sin(time * 0.5) * patrolRadius;

    const patrolTarget = new Position(patrolX, patrolY);
    return SteeringBehaviors.seek(
      position,
      patrolTarget,
      speed * 0.3,
      this.currentVelocity
    );
  }

  private calculateExplorationForce(
    position: Position,
    speed: number,
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): SteeringForce {
    // Check if we have remembered food locations first
    if (this.memory.lastKnownFoodPositions.length > 0) {
      const rememberedFood = this.memory.lastKnownFoodPositions[0];
      if (rememberedFood) {
        const timeSinceSeen = Date.now() - rememberedFood.timestamp;
        // If we saw food recently (within 60 seconds), go back to that area
        if (timeSinceSeen < 60000) {
          return SteeringBehaviors.seek(
            position,
            rememberedFood.position,
            speed * 1.5, // Move faster when exploring for food
            this.currentVelocity
          );
        }
      }
    }

    // Initialize exploration target if we don't have one
    if (!this.currentTarget || this.shouldChangeExplorationTarget(position)) {
      this.currentTarget = this.generateExplorationTarget(position, roomBounds);
    }

    // Move towards current exploration target
    if (this.currentTarget) {
      const distanceToTarget = position.distanceTo(this.currentTarget);

      // If we're close to target, generate a new one
      if (distanceToTarget < 50) {
        this.currentTarget = this.generateExplorationTarget(
          position,
          roomBounds
        );
      }

      // Use aggressive seek behavior for exploration
      const explorationSpeed = speed * 4.0; // Increased from 2.0 to 4.0 (2x faster exploration)
      return SteeringBehaviors.seek(
        position,
        this.currentTarget,
        explorationSpeed,
        this.currentVelocity
      );
    }

    // Fallback to aggressive wander if no target
    const explorationSpeed = speed * 3.5; // Increased from 1.8 to 3.5 (almost 2x faster fallback)
    const wanderForce = SteeringBehaviors.wander(
      this.currentVelocity,
      120, // Increased from 80 to 120 (larger wander radius)
      100, // Increased from 60 to 100 (longer wander distance)
      40 // Increased from 25 to 40 (more jitter for aggressive movement)
    );

    return {
      x: wanderForce.x * (explorationSpeed / 100),
      y: wanderForce.y * (explorationSpeed / 100),
      magnitude: wanderForce.magnitude * (explorationSpeed / 100),
    };
  }

  private shouldChangeExplorationTarget(position: Position): boolean {
    if (!this.currentTarget) return true;

    const distanceToTarget = position.distanceTo(this.currentTarget);
    const timeSinceTargetSet = Date.now() - (this.lastTargetTime || 0);

    // Change target if:
    // 1. We're stuck (too close to target for too long)
    // 2. We've been moving towards this target for too long
    // 3. Random chance to explore different areas
    return (
      (distanceToTarget < 30 && timeSinceTargetSet > 3000) || // Stuck for 3 seconds
      timeSinceTargetSet > 8000 || // Target for 8 seconds
      Math.random() < 0.1 // 10% chance to change target
    );
  }

  private generateExplorationTarget(
    position: Position,
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    this.lastTargetTime = Date.now();

    if (roomBounds) {
      // Use room bounds for systematic exploration
      const roomWidth = roomBounds.maxX - roomBounds.minX;
      const roomHeight = roomBounds.maxY - roomBounds.minY;

      // Choose exploration strategy based on personality and random chance
      const strategy = Math.random();

      if (strategy < 0.3) {
        // Wall following - move along room boundaries
        return this.generateWallTarget(position, roomBounds);
      } else if (strategy < 0.6) {
        // Grid search - systematic coverage
        return this.generateGridTarget(position, roomBounds);
      } else {
        // Random waypoint - explore random areas
        return this.generateRandomTarget(position, roomBounds);
      }
    }

    // Fallback to random target if no room bounds
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDistance = 100 + Math.random() * 200;
    return new Position(
      position.x + Math.cos(randomAngle) * randomDistance,
      position.y + Math.sin(randomAngle) * randomDistance
    );
  }

  private generateWallTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;

    // Choose a wall to follow
    const wall = Math.floor(Math.random() * 4);
    const margin = 50; // Stay away from exact walls

    switch (wall) {
      case 0: // Top wall
        return new Position(
          roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
          roomBounds.minY + margin
        );
      case 1: // Right wall
        return new Position(
          roomBounds.maxX - margin,
          roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
        );
      case 2: // Bottom wall
        return new Position(
          roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
          roomBounds.maxY - margin
        );
      case 3: // Left wall
        return new Position(
          roomBounds.minX + margin,
          roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
        );
      default:
        return new Position(
          roomBounds.minX + Math.random() * roomWidth,
          roomBounds.minY + Math.random() * roomHeight
        );
    }
  }

  private generateGridTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;

    // Create a grid of exploration points
    const gridSize = 8;
    const cellWidth = roomWidth / gridSize;
    const cellHeight = roomHeight / gridSize;

    // Choose a random grid cell
    const gridX = Math.floor(Math.random() * gridSize);
    const gridY = Math.floor(Math.random() * gridSize);

    // Return a random point within that cell
    return new Position(
      roomBounds.minX + gridX * cellWidth + Math.random() * cellWidth,
      roomBounds.minY + gridY * cellHeight + Math.random() * cellHeight
    );
  }

  private generateRandomTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;
    const margin = 50;

    return new Position(
      roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
      roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
    );
  }

  private calculateWanderingForce(
    position: Position,
    speed: number
  ): SteeringForce {
    // Use wander behavior with personality influence
    const wanderSpeed = speed * (0.3 + this.personality.curiosity * 0.2);
    const wanderForce = SteeringBehaviors.wander(this.currentVelocity, 40, 25);

    // Scale the wander force by the calculated wander speed
    return {
      x: wanderForce.x * (wanderSpeed / 100), // Scale relative to base speed
      y: wanderForce.y * (wanderSpeed / 100),
      magnitude: wanderForce.magnitude * (wanderSpeed / 100),
    };
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
          energyEfficiency: 0.9,
          stealthBonus: 0.1,
          huntingSuccessRate: 0.8,
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
          energyEfficiency: 0.7,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.6,
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
          energyEfficiency: 1.0,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.9,
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
          energyEfficiency: 0.8,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.8,
        };
    }
  }

  getPersonality(): PersonalityTraits {
    return {
      boldness: 0.6,
      sociability: 0.7,
      curiosity: 0.3,
      aggression: 0.5,
      intelligence: 0.4,
      energy: 0.5,
      territoriality: 0.2,
      loyalty: 0.8,
    };
  }

  getMemory(): CreatureMemory {
    return this.memory;
  }

  getTerritory(): Territory | null {
    return null;
  }
}

// ============================================================================
// ADVANCED CARNIVORE AI WITH REALISTIC HUNTING BEHAVIORS
// ============================================================================

export class AdvancedCarnivoreAI implements AdvancedCreatureAI {
  private currentVelocity = { x: 0, y: 0 };
  private stateMachine: BehaviorStateMachine;
  private memory: CreatureMemory;
  private personality: PersonalityTraits;
  private territoryCenter: Position | null = null;
  private readonly baseSpeed = 100;
  private readonly baseHuntRange = 60;
  private energy = 100;
  private maxEnergy = 100;
  private lastStateChange = Date.now();
  private currentTarget: Position | null = null;
  private flockingBehavior: FlockingBehavior;
  private id: string;
  private huntingStyle: "stealth" | "chase" | "ambush" = "chase";
  private stealthLevel = 0.5;
  private detectionRange = 80;
  private lastTargetTime: number = 0;

  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.personality = BehaviorFactory.generatePersonality();
    this.memory = BehaviorFactory.generateMemory();
    this.stateMachine = new BehaviorStateMachine(
      BehaviorFactory.createCarnivoreBehaviors(),
      this.memory,
      this.personality
    );
    this.flockingBehavior = new FlockingBehavior();
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
    creatureSpeed?: number,
    health?: number,
    maxHealth?: number,
    energy?: number,
    maxEnergy?: number
  ): { position: Position; state: string } {
    // Safety check for undefined position
    if (!position) {
      return { position: new Position(0, 0), state: "idle" };
    }

    const modifiers = this.getBiomeModifiers(biome || "forest");
    const speed = (creatureSpeed || this.baseSpeed) * modifiers.speedMultiplier;

    // Debug logging for speed calculation
    if (Math.random() < 0.01) {
      console.log(`Speed Debug:`);
      console.log(`  creatureSpeed: ${creatureSpeed}`);
      console.log(`  baseSpeed: ${this.baseSpeed}`);
      console.log(`  biome: ${biome || "forest"}`);
      console.log(`  speedMultiplier: ${modifiers.speedMultiplier}`);
      console.log(`  final speed: ${speed}`);
    }

    // Update energy and hunting parameters
    this.energy = energy || this.energy;
    this.maxEnergy = maxEnergy || this.maxEnergy;
    this.huntingStyle = huntingStyle || this.huntingStyle;
    this.stealthLevel = stealthLevel || this.stealthLevel;
    this.detectionRange = detectionRange || this.detectionRange;

    // Categorize nearby entities
    const nearbyPredators = nearbyEntities.filter(
      (e) => e.type === EntityType.CARNIVORE && e.id !== this.id
    );
    const nearbyHerbivores = nearbyEntities.filter(
      (e) =>
        e.type === EntityType.HERBIVORE &&
        (e.state === EntityState.ALIVE ||
          (e.state === EntityState.DEAD && e.weight > 0))
    );

    // Update memory with current observations
    this.updateMemory(position, nearbyHerbivores, nearbyPredators);

    // Create context for state machine
    const context = {
      hunger: hunger || 0,
      maxHunger: maxHunger || 100,
      health: health || 100,
      maxHealth: maxHealth || 100,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      nearbyPredators: nearbyPredators.length,
      nearbyFood: nearbyHerbivores.length,
      nearbyAllies: nearbyPredators.length,
      timeOfDay: 12, // Default to noon
      weather: "clear",
      season: "summer",
    };

    // Debug logging for state machine context
    if (Math.random() < 0.1) {
      // Increased from 0.01 to 0.1 (10% frequency)
      console.log(`State Machine Context Debug:`);
      console.log(`  Current State: ${this.stateMachine.getCurrentState()}`);
      console.log(
        `  Hunger: ${context.hunger}/${context.maxHunger} (${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `  Health: ${context.health}/${context.maxHealth} (${(
          (context.health / context.maxHealth) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `  Energy: ${context.energy}/${context.maxEnergy} (${(
          (context.energy / context.maxEnergy) *
          100
        ).toFixed(1)}%)`
      );
      console.log(`  Nearby Predators: ${context.nearbyPredators}`);
      console.log(`  Nearby Food: ${context.nearbyFood}`);
      console.log(`  Nearby Allies: ${context.nearbyAllies}`);

      // Add specific hunting condition check
      const hungerPercent = context.hunger / context.maxHunger;
      const canHunt =
        hungerPercent >= 0.5 && hungerPercent <= 1.0 && context.nearbyFood >= 1;
      console.log(
        `  Can Hunt: ${canHunt} (hunger: ${(hungerPercent * 100).toFixed(
          1
        )}% >= 50%, food: ${context.nearbyFood} >= 1)`
      );
    }

    // Update state machine
    const currentState = this.stateMachine.getCurrentState();
    this.stateMachine.update(deltaTime, context);
    const newState = this.stateMachine.getCurrentState();

    // Debug logging for state transitions (increased frequency)
    if (Math.random() < 0.05) {
      // 5% frequency
      console.log(`State Machine Update Debug:`);
      console.log(`  AI ID: ${this.id}`);
      console.log(`  Previous State: ${currentState}`);
      console.log(`  New State: ${newState}`);
      console.log(`  State Changed: ${currentState !== newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );

      // Add emergency transition check
      const shouldFlee = context.nearbyPredators >= 1;
      const shouldSleep = context.energy < 20; // Low energy
      console.log(
        `  Should Flee: ${shouldFlee} (predators: ${context.nearbyPredators})`
      );
      console.log(
        `  Should Sleep: ${shouldSleep} (energy: ${context.energy}%)`
      );
    }

    // Debug logging for state transitions
    if (currentState !== newState) {
      console.log(`State Transition Debug:`);
      console.log(`  ${currentState} -> ${newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );
    }

    // Log state changes
    if (currentState !== newState) {
      console.log(`Carnivore state change: ${currentState} -> ${newState}`);
      console.log(
        `  Context: hunger=${(
          (context.hunger / context.maxHunger) *
          100
        ).toFixed(1)}%, nearbyFood=${context.nearbyFood}, nearbyPredators=${
          context.nearbyPredators
        }`
      );
    }

    // Debug logging for movement
    if (Math.random() < 0.01) {
      // Log 1% of the time
      console.log(`Carnivore AI Debug:`);
      console.log(`  Current State: ${newState}`);
      console.log(`  Speed: ${speed}`);
      console.log(
        `  Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
      );
      console.log(
        `  Velocity: (${this.currentVelocity.x.toFixed(
          1
        )}, ${this.currentVelocity.y.toFixed(1)})`
      );
      console.log(`  Nearby Prey: ${nearbyHerbivores.length}`);
      console.log(`  Nearby Predators: ${nearbyPredators.length}`);
    }

    // Calculate movement based on current state
    let steeringForce = { x: 0, y: 0 };

    switch (newState) {
      case BehaviorState.HUNTING:
        steeringForce = this.calculateHuntingForce(
          position,
          nearbyHerbivores,
          speed
        );
        break;

      case BehaviorState.FLEEING:
        steeringForce = this.calculateFleeingForce(
          position,
          nearbyPredators,
          speed
        );
        break;

      case BehaviorState.RESTING:
        // Stop moving when resting
        steeringForce = { x: 0, y: 0 };
        break;

      case BehaviorState.SLEEPING:
        // Minimal movement when sleeping
        steeringForce = { x: 0, y: 0 };
        break;

      case BehaviorState.SOCIALIZING:
        steeringForce = this.calculateSocializingForce(
          position,
          nearbyPredators,
          speed
        );
        break;

      case BehaviorState.PATROLLING_TERRITORY:
        steeringForce = this.calculateTerritoryPatrolForce(position, speed);
        break;

      case BehaviorState.EXPLORING:
        steeringForce = this.calculateExplorationForce(
          position,
          speed,
          roomBounds
        );
        break;

      case BehaviorState.WANDERING:
      default:
        steeringForce = this.calculateWanderingForce(position, speed);
        break;
    }

    // Debug logging for steering force calculation
    if (Math.random() < 0.05) {
      // Increased frequency
      console.log(`Steering Force Debug:`);
      console.log(`  Current State: ${newState}`);
      console.log(
        `  Raw Steering Force: (${steeringForce.x.toFixed(
          3
        )}, ${steeringForce.y.toFixed(3)})`
      );
      console.log(
        `  Force Magnitude: ${Math.sqrt(
          steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y
        ).toFixed(3)}`
      );
      console.log(`  Min Force: ${(speed * 0.5).toFixed(3)}`);
      console.log(`  Max Force: ${(speed * 0.1).toFixed(3)}`);
      console.log(`  Speed: ${speed.toFixed(1)}`);
    }

    // Apply pack behavior if other carnivores are nearby
    if (nearbyPredators.length > 0 && modifiers.packBehavior) {
      const packForce = FlockingBehavior.calculateFlockingForce(
        position,
        this.currentVelocity,
        nearbyPredators.map((e) => e.position),
        this.personality,
        60,
        120,
        180,
        speed
      );

      // Blend pack behavior with current behavior
      const packWeight = Math.min(0.4, nearbyPredators.length * 0.15);
      steeringForce.x =
        steeringForce.x * (1 - packWeight) + packForce.x * packWeight;
      steeringForce.y =
        steeringForce.y * (1 - packWeight) + packForce.y * packWeight;
    }

    // Apply wall avoidance if room bounds are provided
    if (roomBounds) {
      const wallAvoidance = SteeringBehaviors.avoidWalls(
        position,
        roomBounds,
        speed
      );
      steeringForce.x += wallAvoidance.x * 0.5;
      steeringForce.y += wallAvoidance.y * 0.5;
    }

    // Update velocity with steering force
    const maxForce = speed * 0.15; // Higher force limit for carnivores
    const forceMagnitude = Math.sqrt(
      steeringForce.x * steeringForce.x + steeringForce.y * steeringForce.y
    );

    // Ensure minimum steering force to start movement
    const minForce = speed * 0.5; // Increased from 0.2 to 0.5 (2.5x stronger minimum force)
    if (forceMagnitude < minForce && forceMagnitude > 0) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * minForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * minForce;
    } else if (forceMagnitude > maxForce) {
      steeringForce.x = (steeringForce.x / forceMagnitude) * maxForce;
      steeringForce.y = (steeringForce.y / forceMagnitude) * maxForce;
    }

    // Update velocity with steering force - INCREASED SCALE FOR VISIBLE MOVEMENT
    this.currentVelocity.x += steeringForce.x * deltaTime * 50; // Increased from 10 to 50 (5x stronger)
    this.currentVelocity.y += steeringForce.y * deltaTime * 50; // Increased from 10 to 50 (5x stronger)

    // Debug logging for velocity updates
    if (Math.random() < 0.01) {
      console.log(`Velocity Update Debug:`);
      console.log(
        `  Steering Force: (${steeringForce.x.toFixed(
          3
        )}, ${steeringForce.y.toFixed(3)})`
      );
      console.log(`  Delta Time: ${deltaTime.toFixed(3)}`);
      console.log(
        `  Velocity Change: (${(steeringForce.x * deltaTime).toFixed(3)}, ${(
          steeringForce.y * deltaTime
        ).toFixed(3)})`
      );
      console.log(
        `  Old Velocity: (${(
          this.currentVelocity.x -
          steeringForce.x * deltaTime
        ).toFixed(3)}, ${(
          this.currentVelocity.y -
          steeringForce.y * deltaTime
        ).toFixed(3)})`
      );
      console.log(
        `  New Velocity: (${this.currentVelocity.x.toFixed(
          3
        )}, ${this.currentVelocity.y.toFixed(3)})`
      );
    }

    // Limit velocity to max speed
    const velocityMagnitude = Math.sqrt(
      this.currentVelocity.x * this.currentVelocity.x +
        this.currentVelocity.y * this.currentVelocity.y
    );
    if (velocityMagnitude > speed) {
      this.currentVelocity.x =
        (this.currentVelocity.x / velocityMagnitude) * speed;
      this.currentVelocity.y =
        (this.currentVelocity.y / velocityMagnitude) * speed;
    }

    // Apply velocity to position
    const newX = position.x + this.currentVelocity.x * deltaTime;
    const newY = position.y + this.currentVelocity.y * deltaTime;

    // Debug logging for steering forces
    if (Math.random() < 0.01) {
      console.log(`Carnivore Position Change Debug:`);
      console.log(
        `  Old Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
      );
      console.log(`  New Position: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
      console.log(
        `  Position Delta: (${(newX - position.x).toFixed(3)}, ${(
          newY - position.y
        ).toFixed(3)})`
      );
      console.log(
        `  Velocity: (${this.currentVelocity.x.toFixed(
          3
        )}, ${this.currentVelocity.y.toFixed(3)})`
      );
      console.log(`  Delta Time: ${deltaTime.toFixed(3)}`);
    }

    return { position: new Position(newX, newY), state: newState };
  }

  private updateMemory(
    position: Position,
    nearbyHerbivores: any[],
    nearbyPredators: any[]
  ): void {
    // Update prey memory
    nearbyHerbivores.forEach((prey) => {
      if (
        prey.position &&
        !this.memory.lastKnownPreyPositions.some(
          (p) => p.position.distanceTo(prey.position) < 50
        )
      ) {
        this.memory.lastKnownPreyPositions.push({
          position: prey.position.clone(),
          timestamp: Date.now(),
          success: false,
        });
        if (this.memory.lastKnownPreyPositions.length > 8) {
          this.memory.lastKnownPreyPositions.shift();
        }
      }
    });

    // Update predator memory (for territorial disputes)
    nearbyPredators.forEach((predator) => {
      if (
        predator.position &&
        !this.memory.lastKnownPredatorPositions.some(
          (p) => p.position.distanceTo(predator.position) < 50
        )
      ) {
        this.memory.lastKnownPredatorPositions.push({
          position: predator.position.clone(),
          timestamp: Date.now(),
          threat: 1.0,
        });
        if (this.memory.lastKnownPredatorPositions.length > 5) {
          this.memory.lastKnownPredatorPositions.shift();
        }
      }
    });

    // Update successful hunting spots
    if (nearbyHerbivores.length > 0) {
      const huntingSpot = {
        position: position.clone(),
        successRate: 0.8, // Will be updated based on actual success
        lastVisit: Date.now(),
      };

      const existingIndex = this.memory.successfulHuntingSpots.findIndex(
        (spot) => spot.position.distanceTo(position) < 30
      );

      if (existingIndex >= 0) {
        this.memory.successfulHuntingSpots[existingIndex] = huntingSpot;
      } else {
        this.memory.successfulHuntingSpots.push(huntingSpot);
        if (this.memory.successfulHuntingSpots.length > 6) {
          this.memory.successfulHuntingSpots.shift();
        }
      }
    }
  }

  private calculateHuntingForce(
    position: Position,
    prey: any[],
    speed: number
  ): SteeringForce {
    if (prey.length === 0) {
      // No nearby prey, use memory or explore
      if (this.memory.lastKnownPreyPositions.length > 0) {
        const rememberedPrey = this.memory.lastKnownPreyPositions[0];
        if (rememberedPrey) {
          const timeSinceSeen = Date.now() - rememberedPrey.timestamp;
          if (timeSinceSeen < 45000) {
            // 45 seconds for carnivores
            return SteeringBehaviors.seek(
              position,
              rememberedPrey.position,
              speed,
              this.currentVelocity
            );
          }
        }
      }
      // Fall back to exploration
      return this.calculateExplorationForce(position, speed);
    }

    // Find best prey target based on hunting style
    let targetPrey = prey[0];

    if (this.huntingStyle === "stealth") {
      // Choose prey that's least likely to detect us
      targetPrey = prey.reduce((best, current) => {
        const bestDistance = position.distanceTo(best.position);
        const currentDistance = position.distanceTo(current.position);
        return currentDistance > bestDistance ? current : best;
      });
    } else if (this.huntingStyle === "ambush") {
      // Choose prey that's closest to cover/terrain features
      targetPrey = prey.reduce((best, current) => {
        const bestDistance = position.distanceTo(best.position);
        const currentDistance = position.distanceTo(current.position);
        return currentDistance < bestDistance ? current : best;
      });
    } else {
      // Chase: choose closest prey
      targetPrey = prey.reduce((best, current) => {
        const bestDistance = position.distanceTo(best.position);
        const currentDistance = position.distanceTo(current.position);
        return currentDistance < bestDistance ? current : best;
      });
    }

    const distance = position.distanceTo(targetPrey.position);

    if (distance <= 25) {
      // Close enough to attack - stop moving
      return { x: 0, y: 0, magnitude: 0 };
    } else if (distance <= this.detectionRange) {
      // In detection range - use appropriate hunting behavior
      if (this.huntingStyle === "stealth") {
        // Move slowly and carefully
        return SteeringBehaviors.seek(
          position,
          targetPrey.position,
          speed * 0.3,
          this.currentVelocity
        );
      } else if (this.huntingStyle === "ambush") {
        // Move to intercept position
        const interceptPosition = this.calculateInterceptPosition(
          position,
          targetPrey
        );
        return SteeringBehaviors.seek(
          position,
          interceptPosition,
          speed * 0.8,
          this.currentVelocity
        );
      } else {
        // Chase: move directly towards prey at high speed
        return SteeringBehaviors.seek(
          position,
          targetPrey.position,
          speed * 1.5,
          this.currentVelocity
        );
      }
    } else {
      // Out of detection range - move towards prey location
      return SteeringBehaviors.seek(
        position,
        targetPrey.position,
        speed * 0.6,
        this.currentVelocity
      );
    }
  }

  private calculateInterceptPosition(position: Position, prey: any): Position {
    // Simple interception calculation
    const dx = prey.position.x - position.x;
    const dy = prey.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return position;

    // Predict where prey will be in 2 seconds
    const predictionTime = 2.0;
    const predictedX =
      prey.position.x + (prey.velocity?.x || 0) * predictionTime;
    const predictedY =
      prey.position.y + (prey.velocity?.y || 0) * predictionTime;

    return new Position(predictedX, predictedY);
  }

  private calculateFleeingForce(
    position: Position,
    predators: any[],
    speed: number
  ): SteeringForce {
    if (predators.length === 0) {
      return { x: 0, y: 0, magnitude: 0 };
    }

    let fleeForce = { x: 0, y: 0 };

    predators.forEach((predator) => {
      const fleeDirection = SteeringBehaviors.flee(
        position,
        predator.position,
        speed
      );
      fleeForce.x += fleeDirection.x;
      fleeForce.y += fleeDirection.y;
    });

    // Normalize and apply flee speed multiplier
    const magnitude = Math.sqrt(
      fleeForce.x * fleeForce.x + fleeForce.y * fleeForce.y
    );
    if (magnitude > 0) {
      fleeForce.x = (fleeForce.x / magnitude) * speed * 2.5; // Carnivores flee faster
      fleeForce.y = (fleeForce.y / magnitude) * speed * 2.5;
    }

    return { ...fleeForce, magnitude };
  }

  private calculateSocializingForce(
    position: Position,
    allies: any[],
    speed: number
  ): SteeringForce {
    if (allies.length === 0) {
      return this.calculateWanderingForce(position, speed);
    }

    // Move towards the center of nearby allies
    let centerX = 0;
    let centerY = 0;

    allies.forEach((ally) => {
      centerX += ally.position.x;
      centerY += ally.position.y;
    });

    centerX /= allies.length;
    centerY /= allies.length;

    const centerPosition = new Position(centerX, centerY);
    return SteeringBehaviors.seek(
      position,
      centerPosition,
      speed * 0.4,
      this.currentVelocity
    );
  }

  private calculateTerritoryPatrolForce(
    position: Position,
    speed: number
  ): SteeringForce {
    if (!this.territoryCenter) {
      this.territoryCenter = position.clone();
    }

    // Create a patrol pattern around territory center
    const time = Date.now() * 0.001;
    const patrolRadius = 80; // Larger territory for carnivores
    const patrolX =
      this.territoryCenter.x + Math.cos(time * 0.3) * patrolRadius;
    const patrolY =
      this.territoryCenter.y + Math.sin(time * 0.3) * patrolRadius;

    const patrolTarget = new Position(patrolX, patrolY);
    return SteeringBehaviors.seek(
      position,
      patrolTarget,
      speed * 0.4,
      this.currentVelocity
    );
  }

  private calculateExplorationForce(
    position: Position,
    speed: number,
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): SteeringForce {
    // Check if we have remembered prey locations first
    if (this.memory.lastKnownPreyPositions.length > 0) {
      const rememberedPrey = this.memory.lastKnownPreyPositions[0];
      if (rememberedPrey) {
        const timeSinceSeen = Date.now() - rememberedPrey.timestamp;
        // If we saw prey recently (within 90 seconds), go back to that area
        if (timeSinceSeen < 90000) {
          return SteeringBehaviors.seek(
            position,
            rememberedPrey.position,
            speed * 1.8, // Move faster when exploring for prey
            this.currentVelocity
          );
        }
      }
    }

    // Initialize exploration target if we don't have one
    if (!this.currentTarget || this.shouldChangeExplorationTarget(position)) {
      this.currentTarget = this.generateExplorationTarget(position, roomBounds);
    }

    // Move towards current exploration target
    if (this.currentTarget) {
      const distanceToTarget = position.distanceTo(this.currentTarget);

      // If we're close to target, generate a new one
      if (distanceToTarget < 60) {
        this.currentTarget = this.generateExplorationTarget(
          position,
          roomBounds
        );
      }

      // Use aggressive seek behavior for exploration
      const explorationSpeed = speed * 4.0; // Increased from 2.0 to 4.0 (2x faster exploration)
      return SteeringBehaviors.seek(
        position,
        this.currentTarget,
        explorationSpeed,
        this.currentVelocity
      );
    }

    // Fallback to aggressive wander if no target
    const explorationSpeed = speed * 3.5; // Increased from 1.8 to 3.5 (almost 2x faster fallback)
    const wanderForce = SteeringBehaviors.wander(
      this.currentVelocity,
      120, // Increased from 80 to 120 (larger wander radius)
      100, // Increased from 60 to 100 (longer wander distance)
      40 // Increased from 25 to 40 (more jitter for aggressive movement)
    );

    return {
      x: wanderForce.x * (explorationSpeed / 100),
      y: wanderForce.y * (explorationSpeed / 100),
      magnitude: wanderForce.magnitude * (explorationSpeed / 100),
    };
  }

  private shouldChangeExplorationTarget(position: Position): boolean {
    if (!this.currentTarget) return true;

    const distanceToTarget = position.distanceTo(this.currentTarget);
    const timeSinceTargetSet = Date.now() - (this.lastTargetTime || 0);

    // Change target if:
    // 1. We're stuck (too close to target for too long)
    // 2. We've been moving towards this target for too long
    // 3. Random chance to explore different areas
    return (
      (distanceToTarget < 40 && timeSinceTargetSet > 2000) || // Stuck for 2 seconds (carnivores are more impatient)
      timeSinceTargetSet > 6000 || // Target for 6 seconds
      Math.random() < 0.15 // 15% chance to change target (more aggressive)
    );
  }

  private generateExplorationTarget(
    position: Position,
    roomBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    this.lastTargetTime = Date.now();

    if (roomBounds) {
      // Use room bounds for systematic exploration
      const roomWidth = roomBounds.maxX - roomBounds.minX;
      const roomHeight = roomBounds.maxY - roomBounds.minY;

      // Choose exploration strategy based on personality and random chance
      const strategy = Math.random();

      if (strategy < 0.4) {
        // Wall following - move along room boundaries (good for ambush)
        return this.generateWallTarget(position, roomBounds);
      } else if (strategy < 0.7) {
        // Grid search - systematic coverage
        return this.generateGridTarget(position, roomBounds);
      } else {
        // Random waypoint - explore random areas
        return this.generateRandomTarget(position, roomBounds);
      }
    }

    // Fallback to random target if no room bounds
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDistance = 120 + Math.random() * 250; // Longer distances for carnivores
    return new Position(
      position.x + Math.cos(randomAngle) * randomDistance,
      position.y + Math.sin(randomAngle) * randomDistance
    );
  }

  private generateWallTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;

    // Choose a wall to follow
    const wall = Math.floor(Math.random() * 4);
    const margin = 60; // Stay away from exact walls (carnivores prefer cover)

    switch (wall) {
      case 0: // Top wall
        return new Position(
          roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
          roomBounds.minY + margin
        );
      case 1: // Right wall
        return new Position(
          roomBounds.maxX - margin,
          roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
        );
      case 2: // Bottom wall
        return new Position(
          roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
          roomBounds.maxY - margin
        );
      case 3: // Left wall
        return new Position(
          roomBounds.minX + margin,
          roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
        );
      default:
        return new Position(
          roomBounds.minX + Math.random() * roomWidth,
          roomBounds.minY + Math.random() * roomHeight
        );
    }
  }

  private generateGridTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;

    // Create a grid of exploration points
    const gridSize = 6; // Smaller grid for carnivores (more focused)
    const cellWidth = roomWidth / gridSize;
    const cellHeight = roomHeight / gridSize;

    // Choose a random grid cell
    const gridX = Math.floor(Math.random() * gridSize);
    const gridY = Math.floor(Math.random() * gridSize);

    // Return a random point within that cell
    return new Position(
      roomBounds.minX + gridX * cellWidth + Math.random() * cellWidth,
      roomBounds.minY + gridY * cellHeight + Math.random() * cellHeight
    );
  }

  private generateRandomTarget(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): Position {
    const roomWidth = roomBounds.maxX - roomBounds.minX;
    const roomHeight = roomBounds.maxY - roomBounds.minY;
    const margin = 60;

    return new Position(
      roomBounds.minX + margin + Math.random() * (roomWidth - 2 * margin),
      roomBounds.minY + margin + Math.random() * (roomHeight - 2 * margin)
    );
  }

  private calculateWanderingForce(
    position: Position,
    speed: number
  ): SteeringForce {
    // Use wander behavior with personality influence
    const wanderSpeed = speed * (0.4 + this.personality.curiosity * 0.3);
    const wanderForce = SteeringBehaviors.wander(this.currentVelocity, 50, 30);

    // Scale the wander force by the calculated wander speed
    return {
      x: wanderForce.x * (wanderSpeed / 100), // Scale relative to base speed
      y: wanderForce.y * (wanderSpeed / 100),
      magnitude: wanderForce.magnitude * (wanderSpeed / 100),
    };
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
          energyEfficiency: 0.9,
          stealthBonus: 0.1,
          huntingSuccessRate: 0.8,
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
          energyEfficiency: 0.7,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.6,
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
          energyEfficiency: 1.0,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.9,
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
          energyEfficiency: 0.8,
          stealthBonus: 0.0,
          huntingSuccessRate: 0.8,
        };
    }
  }

  getPersonality(): PersonalityTraits {
    return {
      boldness: 0.6,
      sociability: 0.7,
      curiosity: 0.3,
      aggression: 0.5,
      intelligence: 0.4,
      energy: 0.5,
      territoriality: 0.2,
      loyalty: 0.8,
    };
  }

  getMemory(): CreatureMemory {
    return this.memory;
  }

  getTerritory(): Territory | null {
    return null;
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

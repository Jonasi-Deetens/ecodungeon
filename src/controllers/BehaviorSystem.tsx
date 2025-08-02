import { Position } from "../types/gameTypes";

// ============================================================================
// REALISTIC ANIMAL BEHAVIOR SYSTEM
// Based on 20 years of game AI experience
// ============================================================================

export interface SteeringForce {
  x: number;
  y: number;
  magnitude: number;
}

// Enhanced steering behaviors for realistic movement
export class SteeringBehaviors {
  // Seek: Move towards a target with realistic acceleration
  static seek(
    position: Position,
    target: Position,
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desired = {
      x: target.x - position.x,
      y: target.y - position.y,
    };

    const distance = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

    if (distance > 0) {
      desired.x /= distance;
      desired.y /= distance;
      desired.x *= maxSpeed;
      desired.y *= maxSpeed;
    }

    // Calculate steering force (desired velocity - current velocity)
    return {
      x: desired.x - currentVelocity.x,
      y: desired.y - currentVelocity.y,
      magnitude: distance,
    };
  }

  // Flee: Move away from a target with panic behavior
  static flee(
    position: Position,
    target: Position,
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desired = {
      x: position.x - target.x,
      y: position.y - target.y,
    };

    const distance = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

    if (distance > 0) {
      desired.x /= distance;
      desired.y /= distance;
      desired.x *= maxSpeed * 1.5; // Panic speed
      desired.y *= maxSpeed * 1.5;
    }

    return {
      x: desired.x - currentVelocity.x,
      y: desired.y - currentVelocity.y,
      magnitude: distance,
    };
  }

  // Arrive: Seek with realistic deceleration
  static arrive(
    position: Position,
    target: Position,
    maxSpeed: number,
    slowingRadius: number = 100,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desired = {
      x: target.x - position.x,
      y: target.y - position.y,
    };

    const distance = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

    if (distance > 0) {
      desired.x /= distance;
      desired.y /= distance;

      if (distance < slowingRadius) {
        // Decelerate when close to target
        const speed = maxSpeed * (distance / slowingRadius);
        desired.x *= speed;
        desired.y *= speed;
      } else {
        desired.x *= maxSpeed;
        desired.y *= maxSpeed;
      }
    }

    return {
      x: desired.x - currentVelocity.x,
      y: desired.y - currentVelocity.y,
      magnitude: distance,
    };
  }

  // Wander: Move in a random direction with natural variation
  static wander(
    currentVelocity: { x: number; y: number },
    wanderRadius: number = 50,
    wanderDistance: number = 100,
    wanderJitter: number = 10
  ): SteeringForce {
    // If current velocity is zero or very small, start with a random direction
    let direction = { x: currentVelocity.x, y: currentVelocity.y };
    const velocityMagnitude = Math.sqrt(
      currentVelocity.x * currentVelocity.x +
        currentVelocity.y * currentVelocity.y
    );

    if (velocityMagnitude < 0.1) {
      // Start with a random direction
      const randomAngle = Math.random() * Math.PI * 2;
      direction = {
        x: Math.cos(randomAngle),
        y: Math.sin(randomAngle),
      };
    } else {
      // Normalize current velocity
      direction.x /= velocityMagnitude;
      direction.y /= velocityMagnitude;
    }

    // Add random jitter to direction
    const jitteredDirection = {
      x: direction.x + (Math.random() - 0.5) * wanderJitter * 0.1,
      y: direction.y + (Math.random() - 0.5) * wanderJitter * 0.1,
    };

    // Normalize
    const length = Math.sqrt(
      jitteredDirection.x * jitteredDirection.x +
        jitteredDirection.y * jitteredDirection.y
    );
    if (length > 0) {
      jitteredDirection.x /= length;
      jitteredDirection.y /= length;
    }

    // Create wander target in front of the creature
    const wanderTarget = {
      x: jitteredDirection.x * wanderRadius,
      y: jitteredDirection.y * wanderRadius,
    };

    // Calculate steering force towards the wander target
    const steering = {
      x: wanderTarget.x - currentVelocity.x,
      y: wanderTarget.y - currentVelocity.y,
    };

    // Normalize and scale the steering force
    const steeringMagnitude = Math.sqrt(
      steering.x * steering.x + steering.y * steering.y
    );
    if (steeringMagnitude > 0) {
      // Use a much stronger scaling factor to ensure visible movement
      const scaleFactor = wanderRadius * 2.0; // Increased from 0.5 to 2.0 (4x stronger)
      steering.x = (steering.x / steeringMagnitude) * scaleFactor;
      steering.y = (steering.y / steeringMagnitude) * scaleFactor;
    }

    return {
      x: steering.x,
      y: steering.y,
      magnitude: Math.sqrt(steering.x * steering.x + steering.y * steering.y),
    };
  }

  // Separation: Avoid crowding neighbors
  static separation(
    position: Position,
    neighbors: Position[],
    separationRadius: number = 50
  ): SteeringForce {
    const steering = { x: 0, y: 0 };
    let neighborCount = 0;

    for (const neighbor of neighbors) {
      const distance = position.distanceTo(neighbor);

      if (distance > 0 && distance < separationRadius) {
        const diff = {
          x: position.x - neighbor.x,
          y: position.y - neighbor.y,
        };

        // Weight by distance (closer neighbors have more influence)
        const weight = 1 - distance / separationRadius;
        diff.x *= weight;
        diff.y *= weight;

        steering.x += diff.x;
        steering.y += diff.y;
        neighborCount++;
      }
    }

    if (neighborCount > 0) {
      steering.x /= neighborCount;
      steering.y /= neighborCount;
    }

    return {
      x: steering.x,
      y: steering.y,
      magnitude: Math.sqrt(steering.x * steering.x + steering.y * steering.y),
    };
  }

  // Alignment: Match velocity with neighbors (flocking)
  static alignment(
    neighbors: Position[],
    currentVelocity: { x: number; y: number }
  ): SteeringForce {
    const steering = { x: 0, y: 0 };
    let neighborCount = 0;

    for (const neighbor of neighbors) {
      // In a real implementation, you'd have velocity data
      // For now, we'll use position differences as a proxy
      steering.x += neighbor.x;
      steering.y += neighbor.y;
      neighborCount++;
    }

    if (neighborCount > 0) {
      steering.x /= neighborCount;
      steering.y /= neighborCount;

      // Normalize and scale
      const length = Math.sqrt(
        steering.x * steering.x + steering.y * steering.y
      );
      if (length > 0) {
        steering.x /= length;
        steering.y /= length;
      }
    }

    return {
      x: steering.x,
      y: steering.y,
      magnitude: Math.sqrt(steering.x * steering.x + steering.y * steering.y),
    };
  }

  // Cohesion: Move toward center of neighbors
  static cohesion(position: Position, neighbors: Position[]): SteeringForce {
    const center = { x: 0, y: 0 };
    let neighborCount = 0;

    for (const neighbor of neighbors) {
      center.x += neighbor.x;
      center.y += neighbor.y;
      neighborCount++;
    }

    if (neighborCount > 0) {
      center.x /= neighborCount;
      center.y /= neighborCount;

      return this.seek(position, new Position(center.x, center.y), 1);
    }

    return { x: 0, y: 0, magnitude: 0 };
  }

  // Avoid obstacles/walls with realistic behavior
  static avoidWalls(
    position: Position,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number },
    lookAheadDistance: number = 50
  ): SteeringForce {
    const steering = { x: 0, y: 0 };
    const margin = 30; // Distance from wall to start avoiding

    // Check if heading toward walls
    if (position.x < roomBounds.minX + margin) {
      steering.x += 1; // Move right
    } else if (position.x > roomBounds.maxX - margin) {
      steering.x -= 1; // Move left
    }

    if (position.y < roomBounds.minY + margin) {
      steering.y += 1; // Move down
    } else if (position.y > roomBounds.maxY - margin) {
      steering.y -= 1; // Move up
    }

    return {
      x: steering.x,
      y: steering.y,
      magnitude: Math.sqrt(steering.x * steering.x + steering.y * steering.y),
    };
  }

  // Pursue: Predict where target will be and intercept
  static pursue(
    position: Position,
    target: Position,
    targetVelocity: { x: number; y: number },
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const distance = position.distanceTo(target);
    const timeToReach = distance / maxSpeed;

    // Predict future position
    const futurePosition = new Position(
      target.x + targetVelocity.x * timeToReach,
      target.y + targetVelocity.y * timeToReach
    );

    return this.seek(position, futurePosition, maxSpeed, currentVelocity);
  }

  // Evade: Predict where predator will be and avoid
  static evade(
    position: Position,
    predator: Position,
    predatorVelocity: { x: number; y: number },
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const distance = position.distanceTo(predator);
    const timeToReach = distance / maxSpeed;

    // Predict future position
    const futurePosition = new Position(
      predator.x + predatorVelocity.x * timeToReach,
      predator.y + predatorVelocity.y * timeToReach
    );

    return this.flee(position, futurePosition, maxSpeed, currentVelocity);
  }
}

// ============================================================================
// ENHANCED STATE MACHINE FOR REALISTIC BEHAVIOR
// ============================================================================

export enum BehaviorState {
  // Core survival states
  SLEEPING = "sleeping",
  RESTING = "resting",
  GRAZING = "grazing",
  HUNTING = "hunting",
  FLEEING = "fleeing",

  // Social states
  SOCIALIZING = "socializing",
  COURTSHIP = "courtship",
  MATING = "mating",
  CARING_FOR_YOUNG = "caring_for_young",

  // Territory states
  PATROLLING_TERRITORY = "patrolling_territory",
  MARKING_TERRITORY = "marking_territory",
  DEFENDING_TERRITORY = "defending_territory",

  // Movement states
  WANDERING = "wandering",
  MIGRATING = "migrating",
  EXPLORING = "exploring",

  // Special states
  GROOMING = "grooming",
  PLAYING = "playing",
  INVESTIGATING = "investigating",

  // Health states
  INJURED = "injured",
  SICK = "sick",
  DEAD = "dead",
}

export interface BehaviorStateConfig {
  state: BehaviorState;
  priority: number;
  duration: { min: number; max: number };
  energyCost: number;
  conditions: {
    hunger?: { min: number; max: number };
    energy?: { min: number; max: number };
    health?: { min: number; max: number };
    nearbyPredators?: number;
    nearbyFood?: number;
    nearbyAllies?: number;
    timeOfDay?: { start: number; end: number };
    weather?: string[];
    season?: string[];
  };
  transitions: {
    to: BehaviorState;
    conditions: any;
    probability: number;
  }[];
}

// Enhanced memory system for realistic behavior
export interface CreatureMemory {
  // Spatial memory
  lastKnownFoodPositions: {
    position: Position;
    timestamp: number;
    value: number;
  }[];
  lastKnownPredatorPositions: {
    position: Position;
    timestamp: number;
    threat: number;
  }[];
  lastKnownPreyPositions: {
    position: Position;
    timestamp: number;
    success: boolean;
  }[];
  successfulHuntingSpots: {
    position: Position;
    successRate: number;
    lastVisit: number;
  }[];
  dangerousAreas: {
    position: Position;
    threatLevel: number;
    lastVisit: number;
  }[];

  // Social memory
  knownIndividuals: { id: string; relationship: number; lastSeen: number }[];
  packMembers: { id: string; role: string; lastSeen: number }[];

  // Territory memory
  territoryBoundaries: Position[];
  territoryMarkers: { position: Position; timestamp: number }[];

  // Temporal memory
  dailyRoutines: {
    time: number;
    behavior: BehaviorState;
    location: Position;
  }[];
  seasonalPatterns: { season: string; behaviors: BehaviorState[] }[];

  // Learning
  learnedBehaviors: {
    behavior: string;
    successRate: number;
    lastUsed: number;
  }[];

  lastUpdateTime: number;
}

// Territory system for realistic animal behavior
export interface Territory {
  center: Position;
  radius: number;
  boundaries: Position[];
  resources: { type: string; position: Position; value: number }[];
  threats: { type: string; position: Position; threat: number }[];
  lastPatrolled: number;
  ownership: string; // Entity ID
}

// Enhanced state machine with realistic transitions
export class BehaviorStateMachine {
  private currentState: BehaviorState = BehaviorState.WANDERING;
  private stateTimer: number = 0;
  private states: BehaviorStateConfig[];
  private memory: CreatureMemory;
  private territory: Territory | null = null;
  private energy: number = 100;
  private maxEnergy: number = 100;
  private personality: PersonalityTraits;

  constructor(
    states: BehaviorStateConfig[],
    memory: CreatureMemory,
    personality: PersonalityTraits
  ) {
    this.states = states.sort((a, b) => b.priority - a.priority);
    this.memory = memory;
    this.personality = personality;
  }

  update(
    deltaTime: number,
    context: {
      hunger: number;
      maxHunger: number;
      health: number;
      maxHealth: number;
      energy: number;
      maxEnergy: number;
      nearbyPredators: number;
      nearbyFood: number;
      nearbyAllies: number;
      timeOfDay: number;
      weather: string;
      season: string;
    }
  ): BehaviorState {
    this.stateTimer += deltaTime;
    this.energy = context.energy;
    this.maxEnergy = context.maxEnergy;

    // Update memory
    this.updateMemory(context);

    // Debug logging for state machine (5% frequency)
    if (Math.random() < 0.05) {
      console.log(`State Machine Internal Debug:`);
      console.log(`  Current State: ${this.currentState}`);
      console.log(`  State Timer: ${this.stateTimer.toFixed(2)}s`);
      console.log(
        `  Context: predators=${context.nearbyPredators}, food=${
          context.nearbyFood
        }, hunger=${((context.hunger / context.maxHunger) * 100).toFixed(1)}%`
      );
    }

    // Check for emergency transitions (highest priority)
    const emergencyState = this.checkEmergencyTransitions(context);
    if (emergencyState) {
      if (this.currentState !== emergencyState) {
        console.log(
          `Emergency Transition: ${this.currentState} -> ${emergencyState}`
        );
        this.currentState = emergencyState;
        this.stateTimer = 0;
      }
      return this.currentState;
    }

    // Check normal state transitions
    const newState = this.checkNormalTransitions(context);
    if (newState && newState !== this.currentState) {
      console.log(`Normal Transition: ${this.currentState} -> ${newState}`);
      this.currentState = newState;
      this.stateTimer = 0;
    }

    // Check if current state has expired
    const currentConfig = this.states.find(
      (s) => s.state === this.currentState
    );
    if (currentConfig && this.stateTimer > currentConfig.duration.max) {
      // Fall back to appropriate default state
      const defaultState = this.getDefaultState(context);
      console.log(`State Expired: ${this.currentState} -> ${defaultState}`);
      this.currentState = defaultState;
      this.stateTimer = 0;
    }

    return this.currentState;
  }

  private checkEmergencyTransitions(context: any): BehaviorState | null {
    // Flee from immediate danger
    if (
      context.nearbyPredators > 0 &&
      context.health < context.maxHealth * 0.3
    ) {
      return BehaviorState.FLEEING;
    }

    // Sleep when extremely tired
    if (context.energy < context.maxEnergy * 0.1) {
      return BehaviorState.SLEEPING;
    }

    // Rest when injured
    if (context.health < context.maxHealth * 0.5) {
      return BehaviorState.RESTING;
    }

    return null;
  }

  private checkNormalTransitions(context: any): BehaviorState | null {
    // Get current state configuration
    const currentConfig = this.states.find(
      (s) => s.state === this.currentState
    );

    // Don't allow transitions until minimum duration has passed
    if (currentConfig && this.stateTimer < currentConfig.duration.min) {
      return null;
    }

    // Sort states by priority (highest first)
    const sortedStates = [...this.states].sort(
      (a, b) => b.priority - a.priority
    );

    for (const stateConfig of sortedStates) {
      // Skip if this is the current state
      if (stateConfig.state === this.currentState) {
        continue;
      }

      if (this.shouldTransitionToState(stateConfig, context)) {
        return stateConfig.state;
      }
    }
    return null;
  }

  private shouldTransitionToState(
    stateConfig: BehaviorStateConfig,
    context: any
  ): boolean {
    const conditions = stateConfig.conditions;

    // Check all conditions
    if (conditions.hunger) {
      const hungerPercent = context.hunger / context.maxHunger;
      if (
        hungerPercent < conditions.hunger.min ||
        hungerPercent > conditions.hunger.max
      ) {
        return false;
      }
    }

    if (conditions.energy) {
      const energyPercent = context.energy / context.maxEnergy;
      if (
        energyPercent < conditions.energy.min ||
        energyPercent > conditions.energy.max
      ) {
        return false;
      }
    }

    if (conditions.health) {
      const healthPercent = context.health / context.maxHealth;
      if (
        healthPercent < conditions.health.min ||
        healthPercent > conditions.health.max
      ) {
        return false;
      }
    }

    if (
      conditions.nearbyPredators !== undefined &&
      context.nearbyPredators < conditions.nearbyPredators
    ) {
      return false;
    }

    if (
      conditions.nearbyFood !== undefined &&
      context.nearbyFood < conditions.nearbyFood
    ) {
      return false;
    }

    if (
      conditions.nearbyAllies !== undefined &&
      context.nearbyAllies < conditions.nearbyAllies
    ) {
      return false;
    }

    if (conditions.timeOfDay) {
      const time = context.timeOfDay;
      if (
        time < conditions.timeOfDay.start ||
        time > conditions.timeOfDay.end
      ) {
        return false;
      }
    }

    if (conditions.weather && !conditions.weather.includes(context.weather)) {
      return false;
    }

    if (conditions.season && !conditions.season.includes(context.season)) {
      return false;
    }

    return true;
  }

  private getDefaultState(context: any): BehaviorState {
    // Choose appropriate default based on context
    if (context.energy < context.maxEnergy * 0.3) {
      return BehaviorState.RESTING;
    }
    if (context.hunger > context.maxHunger * 0.7) {
      return BehaviorState.GRAZING;
    }
    return BehaviorState.WANDERING;
  }

  private updateMemory(context: any): void {
    // Update temporal patterns
    this.memory.dailyRoutines.push({
      time: context.timeOfDay,
      behavior: this.currentState,
      location: new Position(0, 0), // Would be actual position
    });

    // Keep only recent routines
    if (this.memory.dailyRoutines.length > 24) {
      this.memory.dailyRoutines.shift();
    }

    this.memory.lastUpdateTime = Date.now();
  }

  getCurrentState(): BehaviorState {
    return this.currentState;
  }

  getMemory(): CreatureMemory {
    return this.memory;
  }

  getTerritory(): Territory | null {
    return this.territory;
  }
}

// Personality system for individual variation
export interface PersonalityTraits {
  boldness: number; // 0-1: How willing to take risks
  sociability: number; // 0-1: How social the animal is
  curiosity: number; // 0-1: How exploratory
  aggression: number; // 0-1: How aggressive
  intelligence: number; // 0-1: How smart/adaptable
  energy: number; // 0-1: How energetic
  territoriality: number; // 0-1: How territorial
  loyalty: number; // 0-1: How loyal to pack/family
}

// Enhanced flocking behavior with personality
export class FlockingBehavior {
  static calculateFlockingForce(
    position: Position,
    velocity: { x: number; y: number },
    neighbors: Position[],
    personality: PersonalityTraits,
    separationRadius: number = 50,
    alignmentRadius: number = 100,
    cohesionRadius: number = 150,
    maxSpeed: number = 1
  ): SteeringForce {
    const separation = SteeringBehaviors.separation(
      position,
      neighbors,
      separationRadius
    );
    const alignment = SteeringBehaviors.alignment(neighbors, velocity);
    const cohesion = SteeringBehaviors.cohesion(position, neighbors);

    // Weight forces based on personality
    const separationWeight = 1.5 + personality.territoriality * 0.5;
    const alignmentWeight = personality.sociability;
    const cohesionWeight = personality.sociability * 0.8;

    const weightedSeparation = {
      x: separation.x * separationWeight,
      y: separation.y * separationWeight,
    };
    const weightedAlignment = {
      x: alignment.x * alignmentWeight,
      y: alignment.y * alignmentWeight,
    };
    const weightedCohesion = {
      x: cohesion.x * cohesionWeight,
      y: cohesion.y * cohesionWeight,
    };

    // Combine forces
    const combined = {
      x: weightedSeparation.x + weightedAlignment.x + weightedCohesion.x,
      y: weightedSeparation.y + weightedAlignment.y + weightedCohesion.y,
    };

    // Limit maximum force
    const magnitude = Math.sqrt(
      combined.x * combined.x + combined.y * combined.y
    );
    if (magnitude > maxSpeed) {
      combined.x = (combined.x / magnitude) * maxSpeed;
      combined.y = (combined.y / magnitude) * maxSpeed;
    }

    return {
      x: combined.x,
      y: combined.y,
      magnitude,
    };
  }
}

// ============================================================================
// REALISTIC BEHAVIOR FACTORIES
// ============================================================================

export class BehaviorFactory {
  static createHerbivoreBehaviors(): BehaviorStateConfig[] {
    return [
      // Emergency states (highest priority)
      {
        state: BehaviorState.FLEEING,
        priority: 10,
        duration: { min: 2, max: 8 },
        energyCost: 15,
        conditions: { nearbyPredators: 1, energy: { min: 0.1, max: 1.0 } },
        transitions: [],
      },
      {
        state: BehaviorState.SLEEPING,
        priority: 9,
        duration: { min: 4, max: 8 },
        energyCost: -10, // Regain energy
        conditions: {
          energy: { min: 0, max: 0.2 },
          timeOfDay: { start: 22, end: 6 },
        },
        transitions: [],
      },
      {
        state: BehaviorState.INJURED,
        priority: 8,
        duration: { min: 10, max: 30 },
        energyCost: 5,
        conditions: { health: { min: 0, max: 0.3 } },
        transitions: [],
      },

      // Survival states
      {
        state: BehaviorState.GRAZING,
        priority: 8, // Increased from 7 to 8 (higher than social states)
        duration: { min: 10, max: 25 }, // Increased from 5-15 to 10-25 seconds
        energyCost: 8,
        conditions: {
          hunger: { min: 0.1, max: 1.0 }, // Lowered from 0.2 to 0.1 (10% to 100% hunger)
          energy: { min: 0.2, max: 1.0 },
          nearbyFood: 1, // Require at least 1 plant nearby to graze
        },
        transitions: [],
      },
      {
        state: BehaviorState.EXPLORING,
        priority: 6,
        duration: { min: 8, max: 20 },
        energyCost: 10,
        conditions: {
          hunger: { min: 0.08, max: 1.0 }, // Lowered from 0.15 to 0.08 (8% to 100% hunger)
          energy: { min: 0.3, max: 1.0 },
          nearbyFood: 0, // No food nearby - actively search
        },
        transitions: [],
      },
      {
        state: BehaviorState.RESTING,
        priority: 5,
        duration: { min: 3, max: 8 },
        energyCost: -5,
        conditions: { energy: { min: 0, max: 0.5 } },
        transitions: [],
      },

      // Social states
      {
        state: BehaviorState.SOCIALIZING,
        priority: 3, // Lowered from 5 to 3
        duration: { min: 0.5, max: 6 }, // Reduced from 2 to 0.5 seconds
        energyCost: 3,
        conditions: {
          nearbyAllies: 2,
          health: { min: 0.6, max: 1.0 },
          energy: { min: 0.3, max: 1.0 },
        },
        transitions: [],
      },
      {
        state: BehaviorState.COURTSHIP,
        priority: 2, // Lowered from 4 to 2
        duration: { min: 0.5, max: 8 }, // Reduced from 3 to 0.5 seconds
        energyCost: 5,
        conditions: {
          nearbyAllies: 1,
          health: { min: 0.8, max: 1.0 },
          energy: { min: 0.7, max: 1.0 },
        },
        transitions: [],
      },

      // Territory states
      {
        state: BehaviorState.PATROLLING_TERRITORY,
        priority: 2, // Lowered from 3
        duration: { min: 0.5, max: 10 }, // Reduced from 4 to 0.5 seconds
        energyCost: 6,
        conditions: {
          energy: { min: 0.4, max: 1.0 },
          health: { min: 0.7, max: 1.0 },
        },
        transitions: [],
      },

      // Movement states
      {
        state: BehaviorState.WANDERING,
        priority: 2,
        duration: { min: 0.5, max: 8 }, // Reduced from 3 to 0.5 seconds for faster transitions
        energyCost: 4,
        conditions: { energy: { min: 0.2, max: 1.0 } },
        transitions: [],
      },
      {
        state: BehaviorState.EXPLORING,
        priority: 1,
        duration: { min: 2, max: 6 },
        energyCost: 5,
        conditions: { energy: { min: 0.5, max: 1.0 } },
        transitions: [],
      },
    ];
  }

  static createCarnivoreBehaviors(): BehaviorStateConfig[] {
    return [
      // Emergency states
      {
        state: BehaviorState.FLEEING,
        priority: 10,
        duration: { min: 2, max: 6 },
        energyCost: 20,
        conditions: { nearbyPredators: 1, energy: { min: 0.1, max: 1.0 } },
        transitions: [],
      },
      {
        state: BehaviorState.SLEEPING,
        priority: 9,
        duration: { min: 6, max: 12 },
        energyCost: -15,
        conditions: {
          energy: { min: 0, max: 0.15 },
          timeOfDay: { start: 0, end: 6 },
        },
        transitions: [],
      },
      {
        state: BehaviorState.INJURED,
        priority: 8,
        duration: { min: 15, max: 45 },
        energyCost: 8,
        conditions: { health: { min: 0, max: 0.4 } },
        transitions: [],
      },

      // Hunting states
      {
        state: BehaviorState.HUNTING,
        priority: 7,
        duration: { min: 8, max: 20 },
        energyCost: 12,
        conditions: {
          hunger: { min: 0.5, max: 1.0 }, // Allow up to 100% hunger
          nearbyFood: 1, // Require prey to be present
          energy: { min: 0.4, max: 1.0 },
          health: { min: 0.6, max: 1.0 },
        },
        transitions: [],
      },

      // Territory states
      {
        state: BehaviorState.DEFENDING_TERRITORY,
        priority: 4, // Lowered from 6
        duration: { min: 5, max: 15 },
        energyCost: 10,
        conditions: {
          energy: { min: 0.5, max: 1.0 },
          health: { min: 0.8, max: 1.0 },
        },
        transitions: [],
      },
      {
        state: BehaviorState.PATROLLING_TERRITORY,
        priority: 3, // Lowered from 5
        duration: { min: 6, max: 12 },
        energyCost: 8,
        conditions: {
          energy: { min: 0.3, max: 1.0 },
          health: { min: 0.7, max: 1.0 },
        },
        transitions: [],
      },

      // Social states
      {
        state: BehaviorState.SOCIALIZING,
        priority: 4,
        duration: { min: 3, max: 8 },
        energyCost: 4,
        conditions: {
          nearbyAllies: 1,
          health: { min: 0.8, max: 1.0 },
          energy: { min: 0.5, max: 1.0 },
        },
        transitions: [],
      },

      // Rest states
      {
        state: BehaviorState.RESTING,
        priority: 3,
        duration: { min: 4, max: 10 },
        energyCost: -3,
        conditions: { energy: { min: 0, max: 0.6 } },
        transitions: [],
      },

      // Movement states
      {
        state: BehaviorState.WANDERING,
        priority: 2,
        duration: { min: 4, max: 10 },
        energyCost: 6,
        conditions: { energy: { min: 0.2, max: 1.0 } },
        transitions: [],
      },
      {
        state: BehaviorState.EXPLORING,
        priority: 1,
        duration: { min: 3, max: 8 },
        energyCost: 7,
        conditions: { energy: { min: 0.6, max: 1.0 } },
        transitions: [],
      },
    ];
  }

  // Generate random personality traits
  static generatePersonality(): PersonalityTraits {
    return {
      boldness: Math.random(),
      sociability: Math.random(),
      curiosity: Math.random(),
      aggression: Math.random(),
      intelligence: Math.random(),
      energy: Math.random(),
      territoriality: Math.random(),
      loyalty: Math.random(),
    };
  }

  // Generate initial memory
  static generateMemory(): CreatureMemory {
    return {
      lastKnownFoodPositions: [],
      lastKnownPredatorPositions: [],
      lastKnownPreyPositions: [],
      successfulHuntingSpots: [],
      dangerousAreas: [],
      knownIndividuals: [],
      packMembers: [],
      territoryBoundaries: [],
      territoryMarkers: [],
      dailyRoutines: [],
      seasonalPatterns: [],
      learnedBehaviors: [],
      lastUpdateTime: Date.now(),
    };
  }
}

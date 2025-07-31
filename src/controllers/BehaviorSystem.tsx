import { Position } from "../types/gameTypes";

// ============================================================================
// STEERING BEHAVIORS (Based on Craig Reynolds' algorithms)
// ============================================================================

export interface SteeringForce {
  x: number;
  y: number;
  magnitude: number;
}

export class SteeringBehaviors {
  // Seek: Move towards a target
  static seek(
    position: Position,
    target: Position,
    maxSpeed: number
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

    return {
      x: desired.x,
      y: desired.y,
      magnitude: distance,
    };
  }

  // Flee: Move away from a target
  static flee(
    position: Position,
    target: Position,
    maxSpeed: number
  ): SteeringForce {
    const desired = {
      x: position.x - target.x,
      y: position.y - target.y,
    };

    const distance = Math.sqrt(desired.x * desired.x + desired.y * desired.y);

    if (distance > 0) {
      desired.x /= distance;
      desired.y /= distance;
      desired.x *= maxSpeed;
      desired.y *= maxSpeed;
    }

    return {
      x: desired.x,
      y: desired.y,
      magnitude: distance,
    };
  }

  // Arrive: Seek with deceleration near target
  static arrive(
    position: Position,
    target: Position,
    maxSpeed: number,
    slowingRadius: number = 100
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
      x: desired.x,
      y: desired.y,
      magnitude: distance,
    };
  }

  // Wander: Natural random movement
  static wander(
    currentDirection: { x: number; y: number },
    wanderRadius: number = 50,
    wanderDistance: number = 100,
    wanderJitter: number = 10
  ): SteeringForce {
    // Add random jitter to current direction
    const jitteredDirection = {
      x: currentDirection.x + (Math.random() - 0.5) * wanderJitter,
      y: currentDirection.y + (Math.random() - 0.5) * wanderJitter,
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

    // Project to wander circle
    const wanderTarget = {
      x:
        currentDirection.x * wanderDistance +
        jitteredDirection.x * wanderRadius,
      y:
        currentDirection.y * wanderDistance +
        jitteredDirection.y * wanderRadius,
    };

    return {
      x: wanderTarget.x,
      y: wanderTarget.y,
      magnitude: wanderRadius,
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

  // Alignment: Match velocity with neighbors
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

  // Avoid obstacles/walls
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
}

// ============================================================================
// STATE MACHINE FOR BEHAVIOR SWITCHING
// ============================================================================

export enum BehaviorState {
  WANDERING = "wandering",
  SEEKING_FOOD = "seeking_food",
  FLEEING = "fleeing",
  HUNTING = "hunting",
  RESTING = "resting",
  SOCIALIZING = "socializing",
}

export interface BehaviorStateConfig {
  state: BehaviorState;
  priority: number;
  duration: number;
  conditions: {
    hunger?: { min: number; max: number };
    health?: { min: number; max: number };
    nearbyPredators?: number;
    nearbyFood?: number;
    nearbyAllies?: number;
  };
}

export class BehaviorStateMachine {
  private currentState: BehaviorState = BehaviorState.WANDERING;
  private stateTimer: number = 0;
  private states: BehaviorStateConfig[];

  constructor(states: BehaviorStateConfig[]) {
    this.states = states.sort((a, b) => b.priority - a.priority); // Sort by priority
  }

  update(
    deltaTime: number,
    context: {
      hunger: number;
      maxHunger: number;
      health: number;
      maxHealth: number;
      nearbyPredators: number;
      nearbyFood: number;
      nearbyAllies: number;
    }
  ): BehaviorState {
    this.stateTimer += deltaTime;

    // Check if we should transition to a higher priority state
    for (const stateConfig of this.states) {
      if (this.shouldTransitionToState(stateConfig, context)) {
        if (this.currentState !== stateConfig.state) {
          this.currentState = stateConfig.state;
          this.stateTimer = 0;
        }
        break;
      }
    }

    // Check if current state has expired
    const currentConfig = this.states.find(
      (s) => s.state === this.currentState
    );
    if (currentConfig && this.stateTimer > currentConfig.duration) {
      // Fall back to wandering
      this.currentState = BehaviorState.WANDERING;
      this.stateTimer = 0;
    }

    return this.currentState;
  }

  private shouldTransitionToState(
    stateConfig: BehaviorStateConfig,
    context: any
  ): boolean {
    const conditions = stateConfig.conditions;

    if (conditions.hunger) {
      const hungerPercent = context.hunger / context.maxHunger;
      if (
        hungerPercent < conditions.hunger.min ||
        hungerPercent > conditions.hunger.max
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

    return true;
  }

  getCurrentState(): BehaviorState {
    return this.currentState;
  }
}

// ============================================================================
// FLOCKING BEHAVIOR
// ============================================================================

export class FlockingBehavior {
  static calculateFlockingForce(
    position: Position,
    velocity: { x: number; y: number },
    neighbors: Position[],
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

    // Weight the forces
    const weightedSeparation = { x: separation.x * 1.5, y: separation.y * 1.5 };
    const weightedAlignment = { x: alignment.x * 1.0, y: alignment.y * 1.0 };
    const weightedCohesion = { x: cohesion.x * 1.0, y: cohesion.y * 1.0 };

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
// BEHAVIOR FACTORY
// ============================================================================

export class BehaviorFactory {
  static createHerbivoreBehaviors(): BehaviorStateConfig[] {
    return [
      {
        state: BehaviorState.FLEEING,
        priority: 5,
        duration: 3,
        conditions: { nearbyPredators: 1 },
      },
      {
        state: BehaviorState.SEEKING_FOOD,
        priority: 4,
        duration: 10,
        conditions: { hunger: { min: 0.6, max: 1.0 }, nearbyFood: 1 },
      },
      {
        state: BehaviorState.SOCIALIZING,
        priority: 2,
        duration: 5,
        conditions: { nearbyAllies: 2, health: { min: 0.7, max: 1.0 } },
      },
      {
        state: BehaviorState.RESTING,
        priority: 1,
        duration: 8,
        conditions: { health: { min: 0.3, max: 0.7 } },
      },
      {
        state: BehaviorState.WANDERING,
        priority: 0,
        duration: 15,
        conditions: {},
      },
    ];
  }

  static createCarnivoreBehaviors(): BehaviorStateConfig[] {
    return [
      {
        state: BehaviorState.HUNTING,
        priority: 4,
        duration: 8,
        conditions: { hunger: { min: 0.7, max: 1.0 } },
      },
      {
        state: BehaviorState.SOCIALIZING,
        priority: 3,
        duration: 6,
        conditions: { nearbyAllies: 1, health: { min: 0.8, max: 1.0 } },
      },
      {
        state: BehaviorState.RESTING,
        priority: 2,
        duration: 10,
        conditions: { health: { min: 0.4, max: 0.8 } },
      },
      {
        state: BehaviorState.WANDERING,
        priority: 1,
        duration: 12,
        conditions: {},
      },
    ];
  }
}

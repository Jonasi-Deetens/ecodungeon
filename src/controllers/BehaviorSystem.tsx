import { Position } from "../types/gameTypes";

// Simplified steering force interface
export interface SteeringForce {
  x: number;
  y: number;
  magnitude?: number;
}

// Basic steering behaviors
export class SteeringBehaviors {
  static seek(
    position: Position,
    target: Position,
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desiredVelocity = {
      x: target.x - position.x,
      y: target.y - position.y,
    };

    const distance = Math.sqrt(desiredVelocity.x * desiredVelocity.x + desiredVelocity.y * desiredVelocity.y);

    if (distance > 0) {
      desiredVelocity.x = (desiredVelocity.x / distance) * maxSpeed;
      desiredVelocity.y = (desiredVelocity.y / distance) * maxSpeed;
    }

    return {
      x: desiredVelocity.x - currentVelocity.x,
      y: desiredVelocity.y - currentVelocity.y,
    };
  }

  static flee(
    position: Position,
    target: Position,
    maxSpeed: number,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desiredVelocity = {
      x: position.x - target.x,
      y: position.y - target.y,
    };

    const distance = Math.sqrt(desiredVelocity.x * desiredVelocity.x + desiredVelocity.y * desiredVelocity.y);

    if (distance > 0) {
      desiredVelocity.x = (desiredVelocity.x / distance) * maxSpeed;
      desiredVelocity.y = (desiredVelocity.y / distance) * maxSpeed;
    }

    return {
      x: desiredVelocity.x - currentVelocity.x,
      y: desiredVelocity.y - currentVelocity.y,
    };
  }

  static wander(
    currentVelocity: { x: number; y: number },
    wanderRadius: number = 50,
    wanderDistance: number = 100,
    wanderJitter: number = 10
  ): SteeringForce {
    // Create a circle in front of the agent
    const circleCenter = {
      x: currentVelocity.x,
      y: currentVelocity.y,
    };

    const circleCenterLength = Math.sqrt(circleCenter.x * circleCenter.x + circleCenter.y * circleCenter.y);
    if (circleCenterLength > 0) {
      circleCenter.x = (circleCenter.x / circleCenterLength) * wanderDistance;
      circleCenter.y = (circleCenter.y / circleCenterLength) * wanderDistance;
    }

    // Add random displacement
    const displacement = {
      x: (Math.random() - 0.5) * 2 * wanderJitter,
      y: (Math.random() - 0.5) * 2 * wanderJitter,
    };

    // Move the circle center by the displacement
    const wanderTarget = {
      x: circleCenter.x + displacement.x,
      y: circleCenter.y + displacement.y,
    };

    // Project the target back onto the circle
    const targetLength = Math.sqrt(wanderTarget.x * wanderTarget.x + wanderTarget.y * wanderTarget.y);
    if (targetLength > 0) {
      wanderTarget.x = (wanderTarget.x / targetLength) * wanderRadius;
      wanderTarget.y = (wanderTarget.y / targetLength) * wanderRadius;
    }

    return {
      x: wanderTarget.x,
      y: wanderTarget.y,
    };
  }

  static arrive(
    position: Position,
    target: Position,
    maxSpeed: number,
    slowingRadius: number = 100,
    currentVelocity: { x: number; y: number } = { x: 0, y: 0 }
  ): SteeringForce {
    const desiredVelocity = {
      x: target.x - position.x,
      y: target.y - position.y,
    };

    const distance = Math.sqrt(desiredVelocity.x * desiredVelocity.x + desiredVelocity.y * desiredVelocity.y);

    if (distance > 0) {
      let targetSpeed = maxSpeed;
      if (distance < slowingRadius) {
        targetSpeed = maxSpeed * (distance / slowingRadius);
      }

      desiredVelocity.x = (desiredVelocity.x / distance) * targetSpeed;
      desiredVelocity.y = (desiredVelocity.y / distance) * targetSpeed;
    }

    return {
      x: desiredVelocity.x - currentVelocity.x,
      y: desiredVelocity.y - currentVelocity.y,
    };
  }
}

// Simplified behavior states - only the essential ones
export enum BehaviorState {
  WANDERING = "wandering",
  GRAZING = "grazing", 
  EATING = "eating",
  HUNTING = "hunting",
  FLEEING = "fleeing",
  RESTING = "resting",
}

// Simplified state configuration
export interface BehaviorStateConfig {
  state: BehaviorState;
  priority: number; // Higher number = higher priority
  duration: { min: number; max: number }; // How long to stay in this state
  energyCost: number; // Energy consumed per second
  conditions: {
    hunger?: { min: number; max: number }; // Hunger percentage range
    energy?: { min: number; max: number }; // Energy percentage range
    health?: { min: number; max: number }; // Health percentage range
    nearbyPredators?: number; // Minimum predators required
    nearbyFood?: number; // Minimum food required
    nearbyPrey?: number; // Minimum prey required (for carnivores)
    isCloseToFood?: boolean; // Must be close to food
    isCloseToPrey?: boolean; // Must be close to prey (for carnivores)
  };
}

// Simplified personality traits
export interface PersonalityTraits {
  boldness: number; // 0-1: How willing to take risks
  sociability: number; // 0-1: How social
  aggression: number; // 0-1: How aggressive
  energy: number; // 0-1: How energetic
}

// Simplified memory system
export interface CreatureMemory {
  lastKnownFoodPositions: { position: Position; timestamp: number }[];
  lastKnownPredatorPositions: { position: Position; timestamp: number }[];
  lastKnownPreyPositions: { position: Position; timestamp: number }[];
  lastUpdateTime: number;
}

// Simplified behavior state machine
export class BehaviorStateMachine {
  private currentState: BehaviorState = BehaviorState.WANDERING;
  private stateTimer: number = 0;
  private states: BehaviorStateConfig[];
  private memory: CreatureMemory;
  private personality: PersonalityTraits;
  private currentTarget: Position | null = null;

  constructor(
    states: BehaviorStateConfig[],
    memory: CreatureMemory,
    personality: PersonalityTraits
  ) {
    this.states = states;
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
      nearbyPrey?: number;
      isCloseToFood?: boolean;
      isCloseToPrey?: boolean;
    }
  ): BehaviorState {
    // Update state timer
    this.stateTimer += deltaTime;

    // Check for emergency transitions first (highest priority)
    const emergencyState = this.checkEmergencyTransitions(context);
    if (emergencyState) {
      this.transitionToState(emergencyState);
      return emergencyState;
    }

    // Check if current state conditions are still met
    const currentConfig = this.states.find(s => s.state === this.currentState);
    if (currentConfig && this.stateTimer >= currentConfig.duration.min) {
      if (!this.shouldStayInState(currentConfig, context)) {
        // Find a better state to transition to
        const newState = this.findBestState(context);
        if (newState && newState !== this.currentState) {
          this.transitionToState(newState);
          return newState;
        }
      }
    }

    // Check if minimum duration has passed and we should transition
    if (currentConfig && this.stateTimer >= currentConfig.duration.max) {
      const newState = this.findBestState(context);
      if (newState && newState !== this.currentState) {
        this.transitionToState(newState);
        return newState;
      }
    }

    return this.currentState;
  }

  private checkEmergencyTransitions(context: any): BehaviorState | null {
    // FLEEING has highest priority - if predators nearby, flee immediately
    if (context.nearbyPredators > 0) {
      return BehaviorState.FLEEING;
    }

    // RESTING if energy is critically low
    if (context.energy < 20) {
      return BehaviorState.RESTING;
    }

    return null;
  }

  private shouldStayInState(stateConfig: BehaviorStateConfig, context: any): boolean {
    const hungerPercent = context.hunger / context.maxHunger;
    const energyPercent = context.energy / context.maxEnergy;
    const healthPercent = context.health / context.maxHealth;

    // Check hunger conditions
    if (stateConfig.conditions.hunger) {
      if (hungerPercent < stateConfig.conditions.hunger.min || 
          hungerPercent > stateConfig.conditions.hunger.max) {
        return false;
      }
    }

    // Check energy conditions
    if (stateConfig.conditions.energy) {
      if (energyPercent < stateConfig.conditions.energy.min || 
          energyPercent > stateConfig.conditions.energy.max) {
        return false;
      }
    }

    // Check health conditions
    if (stateConfig.conditions.health) {
      if (healthPercent < stateConfig.conditions.health.min || 
          healthPercent > stateConfig.conditions.health.max) {
        return false;
      }
    }

    // Check nearby predators
    if (stateConfig.conditions.nearbyPredators !== undefined) {
      if (context.nearbyPredators < stateConfig.conditions.nearbyPredators) {
        return false;
      }
    }

    // Check nearby food
    if (stateConfig.conditions.nearbyFood !== undefined) {
      if (context.nearbyFood < stateConfig.conditions.nearbyFood) {
        return false;
      }
    }

    // Check nearby prey (for carnivores)
    if (stateConfig.conditions.nearbyPrey !== undefined) {
      if (context.nearbyPrey < stateConfig.conditions.nearbyPrey) {
        return false;
      }
    }

    // Check if close to food
    if (stateConfig.conditions.isCloseToFood !== undefined) {
      if (context.isCloseToFood !== stateConfig.conditions.isCloseToFood) {
        return false;
      }
    }

    // Check if close to prey (for carnivores)
    if (stateConfig.conditions.isCloseToPrey !== undefined) {
      if (context.isCloseToPrey !== stateConfig.conditions.isCloseToPrey) {
        return false;
      }
    }

    return true;
  }

  private findBestState(context: any): BehaviorState {
    // Sort states by priority (highest first)
    const sortedStates = [...this.states].sort((a, b) => b.priority - a.priority);

    for (const stateConfig of sortedStates) {
      if (this.shouldStayInState(stateConfig, context)) {
        return stateConfig.state;
      }
    }

    // Default to wandering if no other state is suitable
    return BehaviorState.WANDERING;
  }

  private transitionToState(newState: BehaviorState): void {
    if (newState !== this.currentState) {
      console.log(`State transition: ${this.currentState} -> ${newState}`);
      this.currentState = newState;
      this.stateTimer = 0;
    }
  }

  getCurrentState(): BehaviorState {
    return this.currentState;
  }

  getMemory(): CreatureMemory {
    return this.memory;
  }

  setTarget(target: Position | null): void {
    this.currentTarget = target;
  }

  getTarget(): Position | null {
    return this.currentTarget;
  }
}

// Simplified behavior factory
export class BehaviorFactory {
  static createHerbivoreBehaviors(): BehaviorStateConfig[] {
    return [
      {
        state: BehaviorState.FLEEING,
        priority: 10, // Highest priority
        duration: { min: 2, max: 8 },
        energyCost: 15,
        conditions: {
          nearbyPredators: 1, // At least 1 predator nearby
        },
      },
      {
        state: BehaviorState.RESTING,
        priority: 8,
        duration: { min: 3, max: 10 },
        energyCost: -10, // Regain energy
        conditions: {
          energy: { min: 0, max: 0.3 }, // Low energy
        },
      },
      {
        state: BehaviorState.EATING,
        priority: 7,
        duration: { min: 0.5, max: 8 }, // Reduced min duration from 2s to 0.5s
        energyCost: 2,
        conditions: {
          hunger: { min: 0.3, max: 1.0 }, // Start eating at 30% hunger (was 50%)
          nearbyFood: 1, // Food nearby
          isCloseToFood: true, // Must be close to food
        },
      },
      {
        state: BehaviorState.GRAZING,
        priority: 6,
        duration: { min: 1, max: 15 }, // Reduced min duration from 3s to 1s
        energyCost: 8,
        conditions: {
          hunger: { min: 0.4, max: 1.0 }, // Start grazing at 40% hunger (was 60%)
          nearbyFood: 1, // Food nearby
          isCloseToFood: false, // Only graze when NOT close to food (prevents flickering)
        },
      },
      {
        state: BehaviorState.WANDERING,
        priority: 1, // Lowest priority
        duration: { min: 2, max: 10 },
        energyCost: 4,
        conditions: {
          energy: { min: 0.2, max: 1.0 }, // Not too tired
        },
      },
    ];
  }

  static createCarnivoreBehaviors(): BehaviorStateConfig[] {
    return [
      {
        state: BehaviorState.FLEEING,
        priority: 10, // Highest priority
        duration: { min: 2, max: 8 },
        energyCost: 15,
        conditions: {
          nearbyPredators: 1, // At least 1 predator nearby
        },
      },
      {
        state: BehaviorState.RESTING,
        priority: 8,
        duration: { min: 3, max: 10 },
        energyCost: -10, // Regain energy
        conditions: {
          energy: { min: 0, max: 0.3 }, // Low energy
        },
      },
      {
        state: BehaviorState.EATING,
        priority: 8, // Higher priority than hunting
        duration: { min: 0.5, max: 8 }, // Reduced min duration from 2s to 0.5s
        energyCost: 2,
        conditions: {
          hunger: { min: 0.3, max: 1.0 }, // Start eating at 30% hunger (was 50%)
          nearbyPrey: 1, // Dead prey nearby
          isCloseToPrey: true, // Must be close to dead prey
        },
      },
      {
        state: BehaviorState.HUNTING,
        priority: 7,
        duration: { min: 1, max: 15 }, // Reduced min duration from 3s to 1s
        energyCost: 12,
        conditions: {
          hunger: { min: 0.4, max: 1.0 }, // Start hunting at 40% hunger (was 50%)
          nearbyPrey: 1, // Live prey nearby (not dead prey)
          isCloseToPrey: false, // Only hunt when NOT close to prey (prevents flickering)
        },
      },
      {
        state: BehaviorState.WANDERING,
        priority: 1, // Lowest priority
        duration: { min: 2, max: 10 },
        energyCost: 4,
        conditions: {
          energy: { min: 0.2, max: 1.0 }, // Not too tired
        },
      },
    ];
  }

  static generatePersonality(): PersonalityTraits {
    return {
      boldness: Math.random(),
      sociability: Math.random(),
      aggression: Math.random(),
      energy: Math.random(),
    };
  }

  static generateMemory(): CreatureMemory {
    return {
      lastKnownFoodPositions: [],
      lastKnownPredatorPositions: [],
      lastKnownPreyPositions: [],
      lastUpdateTime: Date.now(),
    };
  }
}

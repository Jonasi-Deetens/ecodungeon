import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  EntityType,
  EcosystemHealth,
  PlayerAction,
  EntityState,
  Position,
  Plant,
  Herbivore,
  Carnivore,
  Player,
  IEntity,
  GameState,
  GameMessage,
  GameAction,
  Room,
} from "../types/gameTypes";
import {
  AdvancedCreatureAIFactory,
  AdvancedCreatureAI,
} from "../controllers/AdvancedCreatureAI";

import { RoomFactory } from "../factories/RoomFactory";
import { DungeonGenerator } from "../factories/DungeonGenerator";
import { RoomController } from "../controllers/RoomController";

// Game state structure
const initialState: GameState = {
  player: null,
  entities: [],
  dungeonSize: { width: 30000, height: 30000 }, // 10x bigger world
  ecosystemHealth: EcosystemHealth.GOOD,
  gameTime: 0,
  isPaused: false,
  messages: [],
  selectedEntity: null,
  playerPosition: new Position(1500, 1500), // Will be set to room center
  rooms: [],
  currentRoomId: "",
};

// Room controller instance
const roomController = new RoomController();

// Action types
const GameActions = {
  INITIALIZE_GAME: "INITIALIZE_GAME",
  UPDATE_GAME: "UPDATE_GAME",
  MOVE_PLAYER: "MOVE_PLAYER",
  PERFORM_ACTION: "PERFORM_ACTION",
  ADD_ENTITY: "ADD_ENTITY",
  REMOVE_ENTITY: "REMOVE_ENTITY",
  UPDATE_ENTITY: "UPDATE_ENTITY",
  ADD_MESSAGE: "ADD_MESSAGE",
  SELECT_ENTITY: "SELECT_ENTITY",
  TOGGLE_PAUSE: "TOGGLE_PAUSE",
  RESET_GAME: "RESET_GAME",
  CHANGE_ROOM: "CHANGE_ROOM",
} as const;

type GameActionType = (typeof GameActions)[keyof typeof GameActions];

interface InitializeGameAction {
  type: typeof GameActions.INITIALIZE_GAME;
  payload: {
    player: Player;
    entities: IEntity[];
    rooms: Room[];
    currentRoomId: string;
  };
}

interface UpdateGameAction {
  type: typeof GameActions.UPDATE_GAME;
  payload: {
    deltaTime: number;
    entities: IEntity[];
    ecosystemHealth: (typeof EcosystemHealth)[keyof typeof EcosystemHealth];
  };
}

interface MovePlayerAction {
  type: typeof GameActions.MOVE_PLAYER;
  payload: {
    player: Player;
  };
}

interface PerformActionAction {
  type: typeof GameActions.PERFORM_ACTION;
  payload: {
    player: Player;
    entities: IEntity[];
    message: GameMessage;
  };
}

interface AddEntityAction {
  type: typeof GameActions.ADD_ENTITY;
  payload: {
    entity: IEntity;
  };
}

interface RemoveEntityAction {
  type: typeof GameActions.REMOVE_ENTITY;
  payload: {
    entityId: string;
  };
}

interface UpdateEntityAction {
  type: typeof GameActions.UPDATE_ENTITY;
  payload: {
    entity: IEntity;
  };
}

interface AddMessageAction {
  type: typeof GameActions.ADD_MESSAGE;
  payload: {
    message: GameMessage;
  };
}

interface SelectEntityAction {
  type: typeof GameActions.SELECT_ENTITY;
  payload: {
    entity: IEntity | null;
  };
}

interface TogglePauseAction {
  type: typeof GameActions.TOGGLE_PAUSE;
}

interface ResetGameAction {
  type: typeof GameActions.RESET_GAME;
}

interface ChangeRoomAction {
  type: typeof GameActions.CHANGE_ROOM;
  payload: {
    newRoomId: string;
  };
}

type GameReducerAction =
  | InitializeGameAction
  | UpdateGameAction
  | MovePlayerAction
  | PerformActionAction
  | AddEntityAction
  | RemoveEntityAction
  | UpdateEntityAction
  | AddMessageAction
  | SelectEntityAction
  | TogglePauseAction
  | ResetGameAction
  | ChangeRoomAction;

// Game reducer
function gameReducer(state: GameState, action: GameReducerAction): GameState {
  switch (action.type) {
    case GameActions.INITIALIZE_GAME:
      return {
        ...state,
        player: action.payload.player,
        entities: action.payload.entities,
        rooms: action.payload.rooms,
        currentRoomId: action.payload.currentRoomId,
        ecosystemHealth: EcosystemHealth.GOOD,
        gameTime: 0,
        messages: [],
        selectedEntity: null,
        playerPosition: action.payload.player.position,
      };

    case GameActions.UPDATE_GAME:
      return {
        ...state,
        gameTime: state.gameTime + action.payload.deltaTime,
        entities: action.payload.entities,
        ecosystemHealth: action.payload.ecosystemHealth,
      };

    case GameActions.MOVE_PLAYER:
      return {
        ...state,
        player: action.payload.player,
        playerPosition: action.payload.player.position,
      };

    case GameActions.PERFORM_ACTION:
      return {
        ...state,
        player: action.payload.player,
        entities: action.payload.entities,
        messages: [...state.messages, action.payload.message],
      };

    case GameActions.ADD_ENTITY:
      return {
        ...state,
        entities: [...state.entities, action.payload.entity],
      };

    case GameActions.REMOVE_ENTITY:
      return {
        ...state,
        entities: state.entities.filter(
          (e) => e.id !== action.payload.entityId
        ),
      };

    case GameActions.UPDATE_ENTITY:
      if (!action.payload.entity) {
        return state; // Return unchanged state if entity is undefined
      }
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.payload.entity.id ? action.payload.entity : e
        ),
      };

    case GameActions.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload.message],
      };

    case GameActions.SELECT_ENTITY:
      return {
        ...state,
        selectedEntity: action.payload.entity,
      };

    case GameActions.TOGGLE_PAUSE:
      return {
        ...state,
        isPaused: !state.isPaused,
      };

    case GameActions.RESET_GAME:
      return initialState;

    case GameActions.CHANGE_ROOM:
      return {
        ...state,
        currentRoomId: action.payload.newRoomId,
      };

    default:
      return state;
  }
}

// Context interface
interface GameContextType extends GameState {
  movePlayer: (newPosition: Position) => void;
  performAction: (
    action: (typeof PlayerAction)[keyof typeof PlayerAction],
    targetEntity?: IEntity
  ) => void;
  selectEntity: (entity: IEntity | null) => void;
  togglePause: () => void;
  resetGame: (characterClass?: string) => void;
  changeRoom: (newRoomId: string) => void;
  allocateSkillPoint: (skill: "observation" | "restoration") => void;
  // Room management
  getRoomController: () => RoomController;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game provider component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize the game world with multiple rooms
  const initializeGame = useCallback((characterClass: string = "wanderer") => {
    // Generate multiple rooms using DungeonGenerator
    const rooms = DungeonGenerator.generateDungeon();
    const startingRoom = rooms[0]; // Start in the first room

    if (!startingRoom) {
      throw new Error("Failed to generate starting room");
    }

    const roomCenterX = startingRoom.x + startingRoom.width / 2;
    const roomCenterY = startingRoom.y + startingRoom.height / 2;

    const player = new Player(
      "player_1",
      new Position(roomCenterX, roomCenterY),
      characterClass,
      startingRoom.id
    );

    // Combine all entities from all rooms
    const allEntities: IEntity[] = rooms.flatMap((room) => room.entities);

    dispatch({
      type: GameActions.INITIALIZE_GAME,
      payload: {
        player,
        entities: allEntities,
        rooms,
        currentRoomId: startingRoom.id,
      },
    });
  }, []);

  // Calculate ecosystem health based on entity balance
  const calculateEcosystemHealth = useCallback(
    (
      entities: IEntity[]
    ): (typeof EcosystemHealth)[keyof typeof EcosystemHealth] => {
      const plants = entities.filter(
        (e) => e.type === EntityType.PLANT && e.state === EntityState.ALIVE
      ).length;
      const herbivores = entities.filter(
        (e) => e.type === EntityType.HERBIVORE && e.state === EntityState.ALIVE
      ).length;
      const carnivores = entities.filter(
        (e) => e.type === EntityType.CARNIVORE && e.state === EntityState.ALIVE
      ).length;

      // Simple balance calculation
      const totalEntities = plants + herbivores + carnivores;
      if (totalEntities === 0) return EcosystemHealth.CRITICAL;

      const plantRatio = plants / totalEntities;
      const herbivoreRatio = herbivores / totalEntities;
      const carnivoreRatio = carnivores / totalEntities;

      // Ideal ratios: 60% plants, 30% herbivores, 10% carnivores
      const plantBalance = Math.abs(plantRatio - 0.6);
      const herbivoreBalance = Math.abs(herbivoreRatio - 0.3);
      const carnivoreBalance = Math.abs(carnivoreRatio - 0.1);

      const totalImbalance = plantBalance + herbivoreBalance + carnivoreBalance;

      if (totalImbalance < 0.1) return EcosystemHealth.EXCELLENT;
      if (totalImbalance < 0.2) return EcosystemHealth.GOOD;
      if (totalImbalance < 0.3) return EcosystemHealth.FAIR;
      if (totalImbalance < 0.4) return EcosystemHealth.POOR;
      return EcosystemHealth.CRITICAL;
    },
    []
  );

  // Handle entity interactions (predation, reproduction, etc.)
  const handleEntityInteractions = useCallback(
    (entities: IEntity[]): IEntity[] => {
      const newEntities = [...entities];

      // Handle carnivore hunting - only when hungry
      entities.forEach((carnivoreEntity) => {
        if (
          carnivoreEntity.type === EntityType.CARNIVORE &&
          carnivoreEntity.state === EntityState.ALIVE
        ) {
          const carnivore = carnivoreEntity as Carnivore;
          const nearbyHerbivores = entities.filter(
            (e) =>
              e.type === EntityType.HERBIVORE &&
              (e.state === EntityState.ALIVE ||
                (e.state === EntityState.DEAD && e.weight > 0)) &&
              carnivore.position.distanceTo(e.position) <= 25 // Attack range matches AI
          ) as Herbivore[];

          // Only hunt when significantly hungry (more realistic behavior)
          const hungerThreshold = carnivore.maxHunger * 0.7; // 70% hungry
          const isHungry = carnivore.hunger > hungerThreshold;

          // Continue hunting current target even if not hungry, but only start hunting new targets when hungry
          const hasCurrentTarget =
            carnivore.currentTarget &&
            nearbyHerbivores.find((p) => p.id === carnivore.currentTarget);

          if (nearbyHerbivores.length > 0 && (isHungry || hasCurrentTarget)) {
            let target: Herbivore | undefined;

            // If we have a current target, try to stick with it
            if (carnivore.currentTarget) {
              target = nearbyHerbivores.find(
                (prey) => prey.id === carnivore.currentTarget
              );
              if (target) {
              } else {
                console.log(
                  `Carnivore ${carnivore.id} current target ${carnivore.currentTarget} not found in nearby prey`
                );
              }
            }

            // If no current target, choose a new one (but ONLY if we don't have a current target)
            if (!target) {
              // Choose the closest prey (same logic as AI)
              let closestPrey = nearbyHerbivores[0];

              // If there are multiple prey, choose the closest one
              if (nearbyHerbivores.length > 1) {
                let closestDistance = Infinity;
                for (const prey of nearbyHerbivores) {
                  const distance = carnivore.position.distanceTo(prey.position);
                  if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPrey = prey;
                  }
                }
              }
              target = closestPrey;

              // Set the new target
              if (target) {
                console.log(
                  `Carnivore ${carnivore.id} setting new target ${
                    target.id
                  } (prey state: ${
                    target.state
                  }, weight: ${target.weight.toFixed(2)})`
                );
                carnivore.currentTarget = target.id;
              }
            } else {
              // We have a current target but it's not in nearbyHerbivores - check if it still exists in the broader entity list
              const targetPrey = entities.find(
                (e) => e.id === carnivore.currentTarget
              ) as Herbivore;
              if (
                targetPrey &&
                (targetPrey.state === EntityState.ALIVE ||
                  (targetPrey.state === EntityState.DEAD &&
                    targetPrey.weight > 0))
              ) {
                // Prey exists but is too far away - keep the target and let AI move toward it
                console.log(
                  `Carnivore ${carnivore.id} current target ${
                    carnivore.currentTarget
                  } too far away (${carnivore.position
                    .distanceTo(targetPrey.position)
                    .toFixed(1)}px) - keeping target`
                );
                target = targetPrey; // Keep the target for AI movement
              } else {
                // Prey is consumed or doesn't exist - clear the target
                console.log(
                  `Carnivore ${carnivore.id} current target ${
                    carnivore.currentTarget
                  } consumed or doesn't exist - clearing target (available prey: ${nearbyHerbivores
                    .map((p) => `${p.id}(${p.state},${p.weight.toFixed(2)})`)
                    .join(", ")})`
                );
                carnivore.clearTarget();
                target = undefined; // Force choosing a new target
              }
            }

            if (target) {
              // Add hunting cooldown to prevent instant killing
              const now = Date.now();
              const lastHuntTime = (carnivore as any).lastHuntTime || 0;
              const huntCooldown = 500; // 500ms between attacks

              if (now - lastHuntTime >= huntCooldown) {
                const distance = carnivore.position.distanceTo(target.position);
                console.log(
                  `Carnivore ${carnivore.id} hunting target ${
                    target.id
                  } at distance ${distance.toFixed(
                    1
                  )}px (prey weight: ${target.weight.toFixed(2)})`
                );
                carnivore.hunt(target);
                (carnivore as any).lastHuntTime = now;
              }
            }
          } else {
            // No nearby prey or not hungry - clear target
            if (carnivore.currentTarget) {
              console.log(
                `Carnivore ${carnivore.id} clearing target ${carnivore.currentTarget} (no prey/hungry)`
              );
            }
            carnivore.clearTarget();
          }
        }
      });

      // Handle herbivore eating - only when hungry
      entities.forEach((herbivoreEntity) => {
        if (
          herbivoreEntity.type === EntityType.HERBIVORE &&
          herbivoreEntity.state === EntityState.ALIVE
        ) {
          const herbivore = herbivoreEntity as Herbivore;
          const nearbyPlants = entities.filter(
            (e) =>
              e.type === EntityType.PLANT &&
              (e.state === EntityState.ALIVE ||
                (e.state === EntityState.DEAD && e.weight > 0)) &&
              herbivore.position.distanceTo(e.position) <= 40 // Increased eating range for better plant detection
          ) as Plant[];

          // Eat when hungry OR when we have a current target (continue eating until full or plant is dead)
          const hungerThreshold = herbivore.maxHunger * 0.6; // 60% hungry
          const isHungry = herbivore.hunger > hungerThreshold;
          const isFull = herbivore.hunger <= 0; // Stop eating when completely full

          // Continue eating current target even if not hungry, but only start eating new targets when hungry
          const hasCurrentTarget =
            herbivore.currentTarget &&
            nearbyPlants.find((p) => p.id === herbivore.currentTarget);

          if (
            nearbyPlants.length > 0 &&
            (isHungry || hasCurrentTarget) &&
            !isFull
          ) {
            let target: Plant | undefined;

            // If we have a current target, try to stick with it
            if (herbivore.currentTarget) {
              target = nearbyPlants.find(
                (plant) => plant.id === herbivore.currentTarget
              );
              if (target) {
              } else {
              }
            }

            // If no current target, choose a new one (but ONLY if we don't have a current target)
            if (!target) {
              // Choose the closest plant to eat
              let closestPlant: Plant | undefined = nearbyPlants[0];
              let closestDistance = closestPlant
                ? herbivore.position.distanceTo(closestPlant.position)
                : Infinity;

              for (const plant of nearbyPlants) {
                const distance = herbivore.position.distanceTo(plant.position);
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestPlant = plant;
                }
              }
              target = closestPlant;

              // Set the new target
              if (target) {
                herbivore.currentTarget = target.id;
              }
            } else {
              // We have a current target but it's not in nearbyPlants - check if it still exists in the broader entity list
              const targetPlant = entities.find(
                (e) => e.id === herbivore.currentTarget
              ) as Plant;
              if (
                targetPlant &&
                targetPlant.state === EntityState.ALIVE &&
                targetPlant.weight > 0
              ) {
                // Plant exists but is too far away - keep the target and let AI move toward it

                target = targetPlant; // Keep the target for AI movement
              } else {
                // Plant is consumed or doesn't exist - clear the target

                herbivore.clearTarget();
                target = undefined; // Force choosing a new target
              }
            }

            if (target) {
              // Add eating cooldown to prevent instant consumption
              const now = Date.now();
              const lastEatTime = (herbivore as any).lastEatTime || 0;
              const eatCooldown = 200; // 200ms between eating ticks

              if (now - lastEatTime >= eatCooldown) {
                const distance = herbivore.position.distanceTo(target.position);
                herbivore.eat(target);
                (herbivore as any).lastEatTime = now;
              }
            }
          } else {
            herbivore.clearTarget();
          }
        }
      });

      // Handle reproduction
      entities.forEach((reproducingEntity) => {
        if (reproducingEntity.state === EntityState.REPRODUCING) {
          const newPosition = new Position(
            reproducingEntity.position.x + (Math.random() - 0.5) * 200,
            reproducingEntity.position.y + (Math.random() - 0.5) * 200
          );

          // Ensure position is within room bounds
          const currentRoom = state.rooms.find(
            (room) => room.id === state.currentRoomId
          );
          if (currentRoom) {
            newPosition.x = Math.max(
              currentRoom.x + 50,
              Math.min(currentRoom.x + currentRoom.width - 50, newPosition.x)
            );
            newPosition.y = Math.max(
              currentRoom.y + 50,
              Math.min(currentRoom.y + currentRoom.height - 50, newPosition.y)
            );
          }

          let newEntity: IEntity;
          if (reproducingEntity.type === EntityType.PLANT) {
            const plant = reproducingEntity as Plant;
            newEntity = new Plant(
              `plant_${Date.now()}_${Math.random()}`,
              newPosition,
              plant.species,
              reproducingEntity.roomId
            );
          } else if (reproducingEntity.type === EntityType.HERBIVORE) {
            const herbivore = reproducingEntity as Herbivore;
            newEntity = new Herbivore(
              `herbivore_${Date.now()}_${Math.random()}`,
              newPosition,
              herbivore.species,
              reproducingEntity.roomId
            );
          } else if (reproducingEntity.type === EntityType.CARNIVORE) {
            const carnivore = reproducingEntity as Carnivore;
            newEntity = new Carnivore(
              `carnivore_${Date.now()}_${Math.random()}`,
              newPosition,
              carnivore.species,
              reproducingEntity.roomId
            );
          } else {
            return;
          }

          newEntities.push(newEntity);
          reproducingEntity.state = EntityState.ALIVE;
        }
      });

      return newEntities;
    },
    []
  );

  // Update game loop
  const updateGame = useCallback(
    (deltaTime: number) => {
      if (state.isPaused) return;

      // Update all entities using AI system
      const updatedEntities = state.entities.map((entity) => {
        // Update basic entity properties (health, energy, age, hunger)
        entity.update(deltaTime);

        // Use AI for movement and behavior
        if (
          entity.state === EntityState.ALIVE &&
          entity.type !== EntityType.PLAYER
        ) {
          const ai = AdvancedCreatureAIFactory.createAI(
            entity.type,
            (entity as any).species
          );

          // Get nearby entities for AI decision making (within reasonable range)
          const nearbyEntities = state.entities.filter(
            (e) =>
              e.id !== entity.id &&
              e.state === EntityState.ALIVE &&
              entity.position.distanceTo(e.position) <= 200 // Only consider entities within 200px
          );

          // Get room bounds for this entity
          const entityRoom = state.rooms.find(
            (room) => room.id === entity.roomId
          );
          const roomBounds = entityRoom
            ? {
                minX: entityRoom.x + 50,
                maxX: entityRoom.x + entityRoom.width - 50,
                minY: entityRoom.y + 50,
                maxY: entityRoom.y + entityRoom.height - 50,
              }
            : undefined;

          // Update position using AI with room bounds, biome, and difficulty
          const newPosition = ai.update(
            deltaTime,
            entity.position,
            nearbyEntities,
            roomBounds,
            entityRoom?.biome,
            entityRoom ? 1 : 0, // Default difficulty
            entity.type === EntityType.CARNIVORE
              ? (entity as Carnivore).huntingStyle
              : undefined,
            entity.type === EntityType.CARNIVORE
              ? (entity as Carnivore).stealthLevel
              : undefined,
            entity.type === EntityType.CARNIVORE
              ? (entity as Carnivore).detectionRange
              : undefined,
            entity.type === EntityType.HERBIVORE ||
              entity.type === EntityType.CARNIVORE
              ? (entity as Herbivore | Carnivore).hunger
              : undefined,
            entity.type === EntityType.HERBIVORE ||
              entity.type === EntityType.CARNIVORE
              ? (entity as Herbivore | Carnivore).maxHunger
              : undefined,
            entity.type === EntityType.HERBIVORE ||
              entity.type === EntityType.CARNIVORE
              ? (entity as Herbivore | Carnivore).speed
              : undefined
          );

          // Keep entity within its own room bounds
          if (entityRoom) {
            newPosition.x = Math.max(
              entityRoom.x + 50,
              Math.min(entityRoom.x + entityRoom.width - 50, newPosition.x)
            );
            newPosition.y = Math.max(
              entityRoom.y + 50,
              Math.min(entityRoom.y + entityRoom.height - 50, newPosition.y)
            );
          }

          entity.position = newPosition;
        }

        return entity;
      });

      // Handle entity interactions
      const finalEntities = handleEntityInteractions(updatedEntities);

      // Remove dead entities (either state DEAD or fully consumed entities with weight <= 0)
      const deadEntities = finalEntities.filter(
        (e) => e.state === EntityState.DEAD || e.weight <= 0
      );

      const aliveEntities = finalEntities.filter(
        (e) => !(e.state === EntityState.DEAD || e.weight <= 0)
      );

      // Calculate ecosystem health
      const ecosystemHealth = calculateEcosystemHealth(aliveEntities);

      dispatch({
        type: GameActions.UPDATE_GAME,
        payload: {
          deltaTime,
          entities: aliveEntities,
          ecosystemHealth,
        },
      });
    },
    [
      state.isPaused,
      state.entities,
      calculateEcosystemHealth,
      handleEntityInteractions,
    ]
  );

  // Player actions
  const movePlayer = useCallback(
    (newPosition: Position) => {
      if (!state.player) return;

      // Get current room bounds for player movement
      const currentRoom = state.rooms.find(
        (room) => room.id === state.currentRoomId
      );

      if (currentRoom) {
        // Ensure position is within current room bounds
        newPosition.x = Math.max(
          currentRoom.x + 50,
          Math.min(currentRoom.x + currentRoom.width - 50, newPosition.x)
        );
        newPosition.y = Math.max(
          currentRoom.y + 50,
          Math.min(currentRoom.y + currentRoom.height - 50, newPosition.y)
        );
      } else {
        // Fallback to world bounds if no room found
        newPosition.x = Math.max(50, Math.min(2950, newPosition.x));
        newPosition.y = Math.max(50, Math.min(2950, newPosition.y));
      }

      state.player.move(newPosition);

      dispatch({
        type: GameActions.MOVE_PLAYER,
        payload: { player: state.player },
      });
    },
    [state.player, state.rooms, state.currentRoomId]
  );

  const performAction = useCallback(
    (
      action: (typeof PlayerAction)[keyof typeof PlayerAction],
      targetEntity?: IEntity
    ) => {
      if (!state.player) return;

      let message = "";
      let updatedEntities = [...state.entities];

      switch (action) {
        case PlayerAction.GATHER:
          if (
            targetEntity &&
            targetEntity.position.distanceTo(state.player.position) <= 50
          ) {
            state.player.gather(targetEntity);
            updatedEntities = updatedEntities.filter(
              (e) => e.id !== targetEntity.id
            );
            message = `Gathered ${targetEntity.type}`;
          } else {
            message = "No target to gather nearby";
          }
          break;

        case PlayerAction.ATTACK:
          if (
            targetEntity &&
            targetEntity.position.distanceTo(state.player.position) <= 50
          ) {
            state.player.attack(targetEntity);
            message = `Attacked ${targetEntity.type}`;
          } else {
            message = "No target to attack nearby";
          }
          break;

        case PlayerAction.PLANT:
          const newPlant = state.player.plant("moss", state.player.position);
          updatedEntities.push(newPlant);
          message = "Planted new moss";
          break;

        case PlayerAction.OBSERVE:
          if (state.player) {
            state.player.observe();
            // Find nearby entities for observation
            const nearbyEntities = updatedEntities.filter(
              (e) => e.position.distanceTo(state.player!.position) <= 100
            );
            const plantCount = nearbyEntities.filter(
              (e) => e.type === EntityType.PLANT
            ).length;
            const herbivoreCount = nearbyEntities.filter(
              (e) => e.type === EntityType.HERBIVORE
            ).length;
            const carnivoreCount = nearbyEntities.filter(
              (e) => e.type === EntityType.CARNIVORE
            ).length;
            message = `Observed: ${plantCount} plants, ${herbivoreCount} herbivores, ${carnivoreCount} carnivores`;
          }
          break;

        case PlayerAction.RESTORE:
          if (state.player) {
            state.player.restore(state.player.position);
            // Heal nearby entities
            const entitiesToHeal = updatedEntities.filter(
              (e) => e.position.distanceTo(state.player!.position) <= 80
            );
            entitiesToHeal.forEach((healingEntity) => {
              healingEntity.health = Math.min(
                healingEntity.maxHealth,
                healingEntity.health + 10
              );
            });
            message = `Restored area, healed ${entitiesToHeal.length} entities`;
          }
          break;
      }

      // Check if player leveled up during this action
      const previousLevel = state.player.level;

      dispatch({
        type: GameActions.PERFORM_ACTION,
        payload: {
          player: state.player,
          entities: updatedEntities,
          message: { text: message, timestamp: Date.now() },
        },
      });

      // Add level up message if player leveled up
      if (state.player.level > previousLevel) {
        dispatch({
          type: GameActions.ADD_MESSAGE,
          payload: {
            message: {
              text: `🎉 LEVEL UP! You are now level ${state.player.level}! You gained 2 skill points!`,
              timestamp: Date.now(),
            },
          },
        });
      }
    },
    [state.player, state.entities]
  );

  const selectEntity = useCallback((entity: IEntity | null) => {
    dispatch({
      type: GameActions.SELECT_ENTITY,
      payload: { entity },
    });
  }, []);

  const togglePause = useCallback(() => {
    dispatch({ type: GameActions.TOGGLE_PAUSE });
  }, []);

  const resetGame = useCallback(
    (characterClass?: string) => {
      dispatch({ type: GameActions.RESET_GAME });
      initializeGame(characterClass || "wanderer");
    },
    [initializeGame]
  );

  const changeRoom = useCallback((newRoomId: string) => {
    dispatch({
      type: GameActions.CHANGE_ROOM,
      payload: { newRoomId },
    });
  }, []);

  const allocateSkillPoint = useCallback(
    (skill: "observation" | "restoration") => {
      if (!state.player) return;

      const success = state.player.allocateSkillPoint(skill);
      if (success) {
        dispatch({
          type: GameActions.UPDATE_ENTITY,
          payload: { entity: state.player },
        });

        // Add a message about the skill allocation
        dispatch({
          type: GameActions.ADD_MESSAGE,
          payload: {
            message: {
              text: `🎯 ${
                skill.charAt(0).toUpperCase() + skill.slice(1)
              } skill increased to ${
                skill === "observation"
                  ? state.player.observationSkill
                  : state.player.restorationSkill
              }!`,
              timestamp: Date.now(),
            },
          },
        });
      }
    },
    [state.player]
  );

  // Room management methods
  const getRoomController = useCallback(() => {
    return roomController;
  }, []);

  // Initialize game on mount
  useEffect(() => {
    initializeGame("wanderer");
  }, [initializeGame]);

  // Game loop - 30 FPS
  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame(1 / 30); // 30 FPS = 1/30 second intervals
    }, 1000 / 30); // 33.33ms intervals

    return () => clearInterval(gameLoop);
  }, [updateGame]);

  const value: GameContextType = {
    ...state,
    movePlayer,
    performAction,
    selectEntity,
    togglePause,
    resetGame,
    changeRoom,
    allocateSkillPoint,
    // Room management
    getRoomController,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// Custom hook to use game context
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

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
} from "../types/gameTypes";
import { CreatureAIFactory } from "../controllers/CreatureAI";

// Game state structure
const initialState: GameState = {
  player: null,
  entities: [],
  dungeonSize: { width: 3000, height: 3000 }, // Large world for free movement
  ecosystemHealth: EcosystemHealth.GOOD,
  gameTime: 0,
  isPaused: false,
  messages: [],
  selectedEntity: null,
  playerPosition: new Position(1500, 1500), // Center of the world
};

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
} as const;

type GameActionType = (typeof GameActions)[keyof typeof GameActions];

interface InitializeGameAction {
  type: typeof GameActions.INITIALIZE_GAME;
  payload: {
    player: Player;
    entities: IEntity[];
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
  | ResetGameAction;

// Game reducer
function gameReducer(state: GameState, action: GameReducerAction): GameState {
  switch (action.type) {
    case GameActions.INITIALIZE_GAME:
      return {
        ...state,
        player: action.payload.player,
        entities: action.payload.entities,
        ecosystemHealth: EcosystemHealth.GOOD,
        gameTime: 0,
        messages: [],
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
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game provider component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize the game world
  const initializeGame = useCallback((characterClass: string = "wanderer") => {
    const player = new Player(
      "player_1",
      new Position(1500, 1500),
      characterClass
    );

    // Create initial ecosystem
    const entities: IEntity[] = [];

    // Add plants scattered across the world
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 3000;
      const y = Math.random() * 3000;
      const plant = new Plant(`plant_${i}`, new Position(x, y), "moss");
      entities.push(plant);
    }

    // Add herbivores (rabbits) scattered across the world
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * 3000;
      const y = Math.random() * 3000;
      const herbivore = new Herbivore(
        `herbivore_${i}`,
        new Position(x, y),
        "rabbit"
      );
      entities.push(herbivore);
    }

    // Add carnivores (rats) scattered across the world
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * 3000;
      const y = Math.random() * 3000;
      const carnivore = new Carnivore(
        `carnivore_${i}`,
        new Position(x, y),
        "rat"
      );
      entities.push(carnivore);
    }

    dispatch({
      type: GameActions.INITIALIZE_GAME,
      payload: { player, entities },
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

      // Handle carnivore hunting
      entities.forEach((entity) => {
        if (
          entity.type === EntityType.CARNIVORE &&
          entity.state === EntityState.ALIVE
        ) {
          const carnivore = entity as Carnivore;
          const nearbyHerbivores = entities.filter(
            (e) =>
              e.type === EntityType.HERBIVORE &&
              e.state === EntityState.ALIVE &&
              entity.position.distanceTo(e.position) <= 100
          ) as Herbivore[];

          if (
            nearbyHerbivores.length > 0 &&
            carnivore.hunger > carnivore.maxHunger * 0.5
          ) {
            const target =
              nearbyHerbivores[
                Math.floor(Math.random() * nearbyHerbivores.length)
              ];
            if (target) {
              carnivore.hunt(target);
            }
          }
        }
      });

      // Handle herbivore eating
      entities.forEach((entity) => {
        if (
          entity.type === EntityType.HERBIVORE &&
          entity.state === EntityState.ALIVE
        ) {
          const herbivore = entity as Herbivore;
          const nearbyPlants = entities.filter(
            (e) =>
              e.type === EntityType.PLANT &&
              e.state === EntityState.ALIVE &&
              entity.position.distanceTo(e.position) <= 50
          ) as Plant[];

          if (
            nearbyPlants.length > 0 &&
            herbivore.hunger > herbivore.maxHunger * 0.6
          ) {
            const target =
              nearbyPlants[Math.floor(Math.random() * nearbyPlants.length)];
            if (target) {
              herbivore.eat(target);
            }
          }
        }
      });

      // Handle reproduction
      entities.forEach((entity) => {
        if (entity.state === EntityState.REPRODUCING) {
          const newPosition = new Position(
            entity.position.x + (Math.random() - 0.5) * 200,
            entity.position.y + (Math.random() - 0.5) * 200
          );

          // Ensure position is within bounds
          newPosition.x = Math.max(50, Math.min(2950, newPosition.x));
          newPosition.y = Math.max(50, Math.min(2950, newPosition.y));

          let newEntity: IEntity;
          if (entity.type === EntityType.PLANT) {
            const plant = entity as Plant;
            newEntity = new Plant(
              `plant_${Date.now()}_${Math.random()}`,
              newPosition,
              plant.species
            );
          } else if (entity.type === EntityType.HERBIVORE) {
            const herbivore = entity as Herbivore;
            newEntity = new Herbivore(
              `herbivore_${Date.now()}_${Math.random()}`,
              newPosition,
              herbivore.species
            );
          } else if (entity.type === EntityType.CARNIVORE) {
            const carnivore = entity as Carnivore;
            newEntity = new Carnivore(
              `carnivore_${Date.now()}_${Math.random()}`,
              newPosition,
              carnivore.species
            );
          } else {
            return;
          }

          newEntities.push(newEntity);
          entity.state = EntityState.ALIVE;
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
          const ai = CreatureAIFactory.createAI(
            entity.type,
            (entity as any).species
          );

          // Get nearby entities for AI decision making
          const nearbyEntities = state.entities.filter(
            (e) => e.id !== entity.id && e.state === EntityState.ALIVE
          );

          // Update position using AI
          const newPosition = ai.update(
            deltaTime,
            entity.position,
            nearbyEntities
          );

          // Keep entity within world bounds
          newPosition.x = Math.max(50, Math.min(2950, newPosition.x));
          newPosition.y = Math.max(50, Math.min(2950, newPosition.y));

          entity.position = newPosition;
        }

        return entity;
      });

      // Handle entity interactions
      const finalEntities = handleEntityInteractions(updatedEntities);

      // Calculate ecosystem health
      const ecosystemHealth = calculateEcosystemHealth(finalEntities);

      dispatch({
        type: GameActions.UPDATE_GAME,
        payload: {
          deltaTime,
          entities: finalEntities,
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

      // Ensure position is within bounds
      newPosition.x = Math.max(50, Math.min(2950, newPosition.x));
      newPosition.y = Math.max(50, Math.min(2950, newPosition.y));

      state.player.move(newPosition);

      dispatch({
        type: GameActions.MOVE_PLAYER,
        payload: { player: state.player },
      });
    },
    [state.player]
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
            entitiesToHeal.forEach((entity) => {
              entity.health = Math.min(entity.maxHealth, entity.health + 10);
            });
            message = `Restored area, healed ${entitiesToHeal.length} entities`;
          }
          break;
      }

      dispatch({
        type: GameActions.PERFORM_ACTION,
        payload: {
          player: state.player,
          entities: updatedEntities,
          message: { text: message, timestamp: Date.now() },
        },
      });
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

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useGame } from "../context/GameContext";
import { Position } from "../types/gameTypes";
import Joystick from "./Joystick";
import Player from "./Player";
import Room from "./Room";
import { usePlayerController } from "../controllers/PlayerController";
import { Teleporter } from "../types/gameTypes";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface GameScreenProps {
  selectedCharacter: string | null;
  onBackToMenu: () => void;
}

// World dimensions (10x bigger)
const WORLD_WIDTH = 30000;
const WORLD_HEIGHT = 30000;

// Room dimensions
const ROOM_WIDTH = 3000;
const ROOM_HEIGHT = 1500;

// Player movement speed
const MOVEMENT_SPEED = 15; // Increased from 3 to 15 for faster movement

const GameScreen: React.FC<GameScreenProps> = ({
  selectedCharacter,
  onBackToMenu,
}) => {
  const game = useGame();
  const [playerPosition, setPlayerPosition] = useState(new Position(0, 0));
  const [cameraPosition, setCameraPosition] = useState(new Position(0, 0));
  const [showRanges, setShowRanges] = useState(false);
  const [showSkillAllocation, setShowSkillAllocation] = useState(false);
  const [teleporterStates, setTeleporterStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Update camera to follow player
  const updateCameraPosition = useCallback(
    (pos: Position) => {
      const newCameraX = pos.x - screenWidth / 2;
      const newCameraY = pos.y - screenHeight / 2;

      // Calculate bounds based on actual room positions, not fixed world bounds
      const minX = 0;
      const maxX =
        Math.max(...game.rooms.map((room) => room.x + room.width)) -
        screenWidth;
      const minY = 0;
      const maxY =
        Math.max(...game.rooms.map((room) => room.y + room.height)) -
        screenHeight;

      setCameraPosition(
        new Position(
          Math.max(minX, Math.min(newCameraX, maxX)),
          Math.max(minY, Math.min(newCameraY, maxY))
        )
      );
    },
    [screenWidth, screenHeight, game.rooms]
  );

  // Handle teleporter activation
  const handleTeleporterActivation = useCallback(
    (teleporterId: string, activated: boolean) => {
      setTeleporterStates((prev) => {
        const newStates = { ...prev, [teleporterId]: activated };

        // Find the linked teleporter and activate it too
        const currentRoom = game.rooms.find(
          (room) => room.id === game.currentRoomId
        );
        if (currentRoom) {
          const teleporter = currentRoom.teleporters.find(
            (t) => t.id === teleporterId
          );
          if (teleporter) {
            // Find the linked teleporter in the connected room
            const connectedRoom = game.rooms.find(
              (room) => room.id === teleporter.connectedRoomId
            );
            if (connectedRoom) {
              const linkedTeleporter = connectedRoom.teleporters.find(
                (t) => t.connectedRoomId === currentRoom.id
              );
              if (linkedTeleporter) {
                newStates[linkedTeleporter.id] = activated;
              }
            }
          }
        }

        return newStates;
      });
    },
    [game.rooms, game.currentRoomId]
  );

  // Memoized position change handler
  const handlePositionChange = useCallback(
    (newPosition: Position) => {
      setPlayerPosition(newPosition);
      updateCameraPosition(newPosition);

      // Check if player has moved to a different room
      const currentRoom = game.rooms.find(
        (room) => room.id === game.currentRoomId
      );
      if (currentRoom) {
        const withinCurrentRoom =
          newPosition.x >= currentRoom.x + 50 &&
          newPosition.x <= currentRoom.x + currentRoom.width - 50 &&
          newPosition.y >= currentRoom.y + 50 &&
          newPosition.y <= currentRoom.y + currentRoom.height - 50;

        if (!withinCurrentRoom) {
          // Player is outside current room, find which room they're in
          for (const room of game.rooms) {
            const withinRoom =
              newPosition.x >= room.x + 50 &&
              newPosition.x <= room.x + room.width - 50 &&
              newPosition.y >= room.y + 50 &&
              newPosition.y <= room.y + room.height - 50;

            if (withinRoom && room.id !== game.currentRoomId) {
              // Player has moved to a different room
              game.changeRoom(room.id);
              break;
            }
          }
        }
      }

      // Update game context player position without dispatching action
      if (game.player) {
        game.player.position = newPosition;
      }
    },
    [
      updateCameraPosition,
      game.player,
      game.rooms,
      game.currentRoomId,
      game.changeRoom,
    ]
  );

  // Memoized action handler
  const handleAction = useCallback(
    (action: string) => {
      game.performAction(action as any);
    },
    [game]
  );

  // Player controller
  const playerController = usePlayerController({
    playerPosition,
    onPositionChange: handlePositionChange,
    onAction: handleAction,
    worldBounds: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    movementSpeed: MOVEMENT_SPEED,
    rooms: game.rooms,
    currentRoomId: game.currentRoomId,
  });

  // Initialize player position when game starts (only runs once)
  useEffect(() => {
    if (game.player && game.rooms.length > 0) {
      const currentRoom = game.rooms.find(
        (room) => room.id === game.currentRoomId
      );
      if (currentRoom) {
        const roomCenterX = currentRoom.x + currentRoom.width / 2;
        const roomCenterY = currentRoom.y + currentRoom.height / 2;
        const roomCenter = new Position(roomCenterX, roomCenterY);
        setPlayerPosition(roomCenter);
        updateCameraPosition(roomCenter);
      }
    }
  }, [game.player, game.rooms]); // Only run when game.player or game.rooms change, not on room changes

  // Initialize game with selected character
  useEffect(() => {
    if (selectedCharacter) {
      game.resetGame(selectedCharacter);
    }
  }, [selectedCharacter, game.resetGame]);

  // Initialize teleporter states when rooms are loaded
  useEffect(() => {
    if (game.rooms.length > 0) {
      const initialTeleporterStates: { [key: string]: boolean } = {};

      // Initialize all teleporters to deactivated (false)
      game.rooms.forEach((room) => {
        room.teleporters.forEach((teleporter) => {
          initialTeleporterStates[teleporter.id] = false;
        });
      });

      setTeleporterStates(initialTeleporterStates);
    }
  }, [game.rooms]);

  // Handle joystick movement
  const handleJoystickMove = (direction: { x: number; y: number }) => {
    playerController.handleJoystickMove(direction);
  };

  const handleTeleport = useCallback(
    (teleporter: Teleporter) => {
      // Teleport player to the connected room
      const targetRoom = game.rooms.find(
        (r) => r.id === teleporter.connectedRoomId
      );

      if (targetRoom) {
        // Find the specific target teleporter
        const targetTeleporter = targetRoom.teleporters.find(
          (t) => t.connectedRoomId === game.currentRoomId
        );

        if (targetTeleporter) {
          // Position player near the target teleporter but not exactly on it
          // Add offset based on teleporter direction to avoid immediate re-teleportation
          let offsetX = 0;
          let offsetY = 0;

          switch (targetTeleporter.direction) {
            case "north":
              offsetY = 200; // Move player 200px south of the teleporter
              break;
            case "south":
              offsetY = -200; // Move player 200px north of the teleporter
              break;
            case "east":
              offsetX = -200; // Move player 200px west of the teleporter
              break;
            case "west":
              offsetX = 200; // Move player 200px east of the teleporter
              break;
          }

          // Teleporter coordinates are already in world coordinates
          const teleporterCenterX =
            targetTeleporter.x + targetTeleporter.width / 2;
          const teleporterCenterY =
            targetTeleporter.y + targetTeleporter.height / 2;

          const newX = teleporterCenterX + offsetX;
          const newY = teleporterCenterY + offsetY;
          const newPosition = new Position(newX, newY);

          setPlayerPosition(newPosition);
          updateCameraPosition(newPosition);
          game.changeRoom(teleporter.connectedRoomId);

          if (game.player) {
            game.player.position = newPosition;
          }
        }
      }
    },
    [
      game.rooms,
      game.currentRoomId,
      game.changeRoom,
      game.player,
      updateCameraPosition,
    ]
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Game World */}
      <View style={styles.gameWorld}>
        {/* Rooms */}
        {game.rooms
          .filter((room) => {
            // Only render current room and adjacent rooms
            if (room.id === game.currentRoomId) return true;

            // Check if this room is connected to current room
            const currentRoom = game.rooms.find(
              (r) => r.id === game.currentRoomId
            );
            if (!currentRoom) return false;

            return currentRoom.teleporters.some(
              (teleporter) => teleporter.connectedRoomId === room.id
            );
          })
          .map((room) => {
            // Calculate linked teleporters for this room
            const linkedTeleporters: { [key: string]: any } = {};
            room.teleporters.forEach((teleporter) => {
              const connectedRoom = game.rooms.find(
                (r) => r.id === teleporter.connectedRoomId
              );
              if (connectedRoom) {
                const linkedTeleporter = connectedRoom.teleporters.find(
                  (t) => t.connectedRoomId === room.id
                );
                if (linkedTeleporter) {
                  linkedTeleporters[teleporter.id] = linkedTeleporter;
                }
              }
            });

            return (
              <Room
                key={room.id}
                config={{
                  room: room,
                  cameraPosition: cameraPosition,
                  showRanges: showRanges,
                  onTeleport: handleTeleport,
                  playerPosition: playerPosition,
                  screenWidth: screenWidth,
                  screenHeight: screenHeight,
                  teleporterStates: teleporterStates,
                  onTeleporterActivation: handleTeleporterActivation,
                  linkedTeleporters: linkedTeleporters,
                }}
              />
            );
          })}

        {/* Player */}
        {game.player && (
          <Player
            position={playerPosition}
            cameraPosition={cameraPosition}
            characterClass={game.player.characterClass}
            health={game.player.health}
            maxHealth={game.player.maxHealth}
            energy={game.player.energy}
            maxEnergy={game.player.maxEnergy}
          />
        )}
      </View>

      {/* UI Overlay */}
      <View style={styles.uiOverlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuButton} onPress={onBackToMenu}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              Lv. {game.player?.level || 1} {selectedCharacter}
            </Text>
            <Text style={styles.playerStats}>
              ❤️ {game.player?.health || 0} | ⚡ {game.player?.energy || 0}
            </Text>
            {game.player && game.player.skillPoints > 0 && (
              <TouchableOpacity
                style={styles.skillPointsButton}
                onPress={() => setShowSkillAllocation(true)}
              >
                <Text style={styles.skillPointsButtonText}>
                  +{game.player.skillPoints}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ecosystemInfo}>
            <Text style={styles.ecosystemHealth}>
              🌿 {game.ecosystemHealth}
            </Text>
            <Text style={styles.currentRoom}>
              🏠 Room: {game.currentRoomId}
            </Text>
          </View>
        </View>

        {/* Skill Allocation Modal */}
        {showSkillAllocation && game.player && (
          <View style={styles.modalOverlay}>
            <View style={styles.skillAllocationModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Allocate Skill Points</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSkillAllocation(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                You have {game.player?.skillPoints || 0} skill point
                {(game.player?.skillPoints || 0) > 1 ? "s" : ""} to allocate
              </Text>

              <View style={styles.skillOptions}>
                <TouchableOpacity
                  style={styles.skillOption}
                  onPress={() => {
                    game.allocateSkillPoint("observation");
                    if ((game.player?.skillPoints || 0) <= 1) {
                      setShowSkillAllocation(false);
                    }
                  }}
                  disabled={(game.player?.skillPoints || 0) <= 0}
                >
                  <Text style={styles.skillOptionTitle}>👁️ Observation</Text>
                  <Text style={styles.skillOptionLevel}>
                    Level {game.player.observationSkill}
                  </Text>
                  <Text style={styles.skillOptionDesc}>
                    Increases XP from observing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skillOption}
                  onPress={() => {
                    game.allocateSkillPoint("restoration");
                    if ((game.player?.skillPoints || 0) <= 1) {
                      setShowSkillAllocation(false);
                    }
                  }}
                  disabled={(game.player?.skillPoints || 0) <= 0}
                >
                  <Text style={styles.skillOptionTitle}>✨ Restoration</Text>
                  <Text style={styles.skillOptionLevel}>
                    Level {game.player.restorationSkill}
                  </Text>
                  <Text style={styles.skillOptionDesc}>
                    Increases XP from restoring
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Joystick */}
        <View style={styles.joystickContainer}>
          <Joystick onMove={handleJoystickMove} size={120} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => game.performAction("observe")}
          >
            <Text style={styles.actionButtonIcon}>👁️</Text>
            <Text style={styles.actionButtonText}>Observe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => game.performAction("plant")}
          >
            <Text style={styles.actionButtonIcon}>🌱</Text>
            <Text style={styles.actionButtonText}>Plant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => game.performAction("restore")}
          >
            <Text style={styles.actionButtonIcon}>✨</Text>
            <Text style={styles.actionButtonText}>Restore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (game.player) {
                game.player.heal();
              }
            }}
          >
            <Text style={styles.actionButtonIcon}>💚</Text>
            <Text style={styles.actionButtonText}>Heal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              showRanges && { backgroundColor: "rgba(59, 130, 246, 0.3)" },
            ]}
            onPress={() => setShowRanges(!showRanges)}
          >
            <Text style={styles.actionButtonIcon}>🎯</Text>
            <Text style={styles.actionButtonText}>Ranges</Text>
          </TouchableOpacity>
        </View>

        {/* Game Messages */}
        {game.messages.length > 0 && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {game.messages[game.messages.length - 1]?.text}
            </Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  gameWorld: {
    position: "absolute",
    width: screenWidth,
    height: screenHeight,
    overflow: "hidden",
  },

  entity: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  entityIcon: {
    fontSize: 20,
  },
  player: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ade80",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  playerIcon: {
    fontSize: 24,
  },
  uiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  menuButton: {
    padding: 8,
    backgroundColor: "#334155",
    borderRadius: 8,
  },
  menuButtonText: {
    fontSize: 18,
    color: "#e2e8f0",
  },
  playerInfo: {
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e2e8f0",
    textTransform: "capitalize",
  },
  playerStats: {
    fontSize: 12,
    color: "#94a3b8",
  },
  ecosystemInfo: {
    alignItems: "center",
  },
  ecosystemHealth: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4ade80",
    textTransform: "capitalize",
  },
  currentRoom: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  joystickContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
  },
  actionButtons: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    minWidth: 80,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: "600",
  },
  messageContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  messageText: {
    fontSize: 14,
    color: "#e2e8f0",
    textAlign: "center",
  },
  progressionContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  skillPointsButton: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  skillPointsButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  skillAllocationModal: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: "#334155",
    minWidth: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#94a3b8",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  skillOptions: {
    gap: 12,
  },
  skillOption: {
    backgroundColor: "#334155",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#475569",
  },
  skillOptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e2e8f0",
    marginBottom: 4,
  },
  skillOptionLevel: {
    fontSize: 14,
    color: "#4ade80",
    marginBottom: 4,
  },
  skillOptionDesc: {
    fontSize: 12,
    color: "#94a3b8",
  },
});

export default GameScreen;

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
  const [playerPosition, setPlayerPosition] = useState(
    new Position(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
  );
  const [cameraPosition, setCameraPosition] = useState(new Position(0, 0));
  const [showRanges, setShowRanges] = useState(false);

  // Update camera to follow player
  const updateCameraPosition = useCallback(
    (pos: Position) => {
      const newCameraX = pos.x - screenWidth / 2;
      const newCameraY = pos.y - screenHeight / 2;
      setCameraPosition(
        new Position(
          Math.max(0, Math.min(newCameraX, WORLD_WIDTH - screenWidth)),
          Math.max(0, Math.min(newCameraY, WORLD_HEIGHT - screenHeight))
        )
      );
    },
    [screenWidth, screenHeight]
  );

  // Memoized position change handler
  const handlePositionChange = useCallback(
    (newPosition: Position) => {
      setPlayerPosition(newPosition);
      updateCameraPosition(newPosition);

      // Debug: Log player position and current room
      const currentRoom = game.rooms.find(
        (room) => room.id === game.currentRoomId
      );
      if (currentRoom) {
        console.log(
          `Player at (${Math.round(newPosition.x)}, ${Math.round(
            newPosition.y
          )}) in room ${currentRoom.id} at (${currentRoom.x}, ${currentRoom.y})`
        );
      }

      // Check if player has moved to a different room
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

  // Initialize player position when game starts
  useEffect(() => {
    if (game.player && game.rooms.length > 0) {
      const currentRoom = game.rooms.find(
        (room) => room.id === game.currentRoomId
      );
      if (currentRoom) {
        const roomCenterX = currentRoom.x + currentRoom.width / 2;
        const roomCenterY = currentRoom.y + currentRoom.height / 2;
        const newPos = new Position(roomCenterX, roomCenterY);
        setPlayerPosition(newPos);
        updateCameraPosition(newPos);
      }
    }
  }, [game.player, game.rooms, game.currentRoomId]);

  // Initialize game with selected character
  useEffect(() => {
    if (selectedCharacter) {
      game.resetGame(selectedCharacter);
    }
  }, [selectedCharacter, game.resetGame]);

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
        // Find the corresponding teleporter in the target room
        const targetTeleporter = targetRoom.teleporters.find(
          (t) => t.connectedRoomId === game.currentRoomId
        );

        if (targetTeleporter) {
          // Position player near the target teleporter
          const newX = targetTeleporter.x + targetTeleporter.width / 2;
          const newY = targetTeleporter.y + targetTeleporter.height / 2;
          const newPosition = new Position(newX, newY);

          setPlayerPosition(newPosition);
          updateCameraPosition(newPosition);
          game.changeRoom(teleporter.connectedRoomId);

          if (game.player) {
            game.player.position = newPosition;
          }

          console.log(`Teleported to room ${teleporter.connectedRoomId}`);
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
          .map((room) => (
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
              }}
            />
          ))}

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
            <Text style={styles.playerName}>{selectedCharacter}</Text>
            <Text style={styles.playerStats}>
              ❤️ {game.player?.health || 0} | ⚡ {game.player?.energy || 0}
            </Text>
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
});

export default GameScreen;

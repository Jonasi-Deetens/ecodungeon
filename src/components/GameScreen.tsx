import React, { useState, useEffect, useRef } from "react";
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

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface GameScreenProps {
  selectedCharacter: string | null;
  onBackToMenu: () => void;
}

// Game world dimensions (larger than screen for scrolling)
const WORLD_WIDTH = screenWidth * 3;
const WORLD_HEIGHT = screenHeight * 3;

// Player movement speed
const MOVEMENT_SPEED = 3;

const GameScreen: React.FC<GameScreenProps> = ({
  selectedCharacter,
  onBackToMenu,
}) => {
  const game = useGame();
  const [playerPosition, setPlayerPosition] = useState({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
  });
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [movementDirection, setMovementDirection] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Initialize player position when game starts
  useEffect(() => {
    if (game.player) {
      const newPos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
      setPlayerPosition(newPos);
      updateCameraPosition(newPos);
    }
  }, [game.player]);

  // Update camera to follow player
  const updateCameraPosition = (pos: { x: number; y: number }) => {
    const newCameraX = pos.x - screenWidth / 2;
    const newCameraY = pos.y - screenHeight / 2;
    setCameraPosition({
      x: Math.max(0, Math.min(newCameraX, WORLD_WIDTH - screenWidth)),
      y: Math.max(0, Math.min(newCameraY, WORLD_HEIGHT - screenHeight)),
    });
  };

  // Handle player movement
  const movePlayer = (direction: { x: number; y: number }) => {
    if (!game.player) return;

    const newX = playerPosition.x + direction.x * MOVEMENT_SPEED;
    const newY = playerPosition.y + direction.y * MOVEMENT_SPEED;

    // Keep player within world bounds
    const boundedX = Math.max(50, Math.min(newX, WORLD_WIDTH - 50));
    const boundedY = Math.max(50, Math.min(newY, WORLD_HEIGHT - 50));

    const newPosition = { x: boundedX, y: boundedY };
    setPlayerPosition(newPosition);
    updateCameraPosition(newPosition);

    // Update game context
    game.movePlayer(new Position(boundedX, boundedY));
  };

  // Continuous movement loop
  useEffect(() => {
    if (movementDirection.x !== 0 || movementDirection.y !== 0) {
      const animate = () => {
        movePlayer(movementDirection);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [movementDirection]);

  // Render entities in the world
  const renderEntities = () => {
    return game.entities.map((entity) => {
      const screenX = entity.position.x - cameraPosition.x;
      const screenY = entity.position.y - cameraPosition.y;

      // Only render entities visible on screen
      if (
        screenX < -50 ||
        screenX > screenWidth + 50 ||
        screenY < -50 ||
        screenY > screenHeight + 50
      ) {
        return null;
      }

      let entityIcon = "❓";
      let entityColor = "#94a3b8";

      switch (entity.type) {
        case "plant":
          entityIcon = "🌱";
          entityColor = "#4ade80";
          break;
        case "herbivore":
          entityIcon = "🐀";
          entityColor = "#fbbf24";
          break;
        case "carnivore":
          entityIcon = "🕷️";
          entityColor = "#ef4444";
          break;
      }

      return (
        <View
          key={entity.id}
          style={[
            styles.entity,
            {
              left: screenX - 15,
              top: screenY - 15,
              backgroundColor: entityColor,
            },
          ]}
        >
          <Text style={styles.entityIcon}>{entityIcon}</Text>
        </View>
      );
    });
  };

  // Handle joystick movement
  const handleJoystickMove = (direction: { x: number; y: number }) => {
    setMovementDirection(direction);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Game World */}
      <View style={styles.gameWorld}>
        {/* Background */}
        <View
          style={[
            styles.background,
            { width: WORLD_WIDTH, height: WORLD_HEIGHT },
          ]}
        />

        {/* Entities */}
        {renderEntities()}

        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: playerPosition.x - cameraPosition.x - 20,
              top: playerPosition.y - cameraPosition.y - 20,
            },
          ]}
        >
          <Text style={styles.playerIcon}>🧙</Text>
        </View>
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
  background: {
    backgroundColor: "#1e293b",
    position: "absolute",
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

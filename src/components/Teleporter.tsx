import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Teleporter as TeleporterType } from "../types/gameTypes";

interface TeleporterProps {
  teleporter: TeleporterType;
  cameraPosition: { x: number; y: number };
  playerPosition: { x: number; y: number };
  onTeleport: (teleporter: TeleporterType) => void;
  linkedTeleporter?: TeleporterType | undefined; // The teleporter this connects to
}

const Teleporter: React.FC<TeleporterProps> = ({
  teleporter,
  cameraPosition,
  playerPosition,
  onTeleport,
  linkedTeleporter,
}) => {
  const [isActivated, setIsActivated] = useState(false);

  const isPlayerNearby = () => {
    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - teleporterCenterX, 2) +
        Math.pow(playerPosition.y - teleporterCenterY, 2)
    );
    return distance <= 50; // 50px for walking over
  };

  const isPlayerInRange = () => {
    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - teleporterCenterX, 2) +
        Math.pow(playerPosition.y - teleporterCenterY, 2)
    );
    return distance <= 100; // 100px for clicking
  };

  const getTeleporterIcon = () => {
    switch (teleporter.direction) {
      case "north":
        return "⬆️";
      case "south":
        return "⬇️";
      case "east":
        return "➡️";
      case "west":
        return "⬅️";
      default:
        return "🌀";
    }
  };

  const getTeleporterColor = () => {
    if (!isActivated) return "#666666"; // Gray when deactivated
    if (isPlayerNearby()) return "#00ff00"; // Green when player is on it
    if (isPlayerInRange()) return "#ffff00"; // Yellow when in click range
    return "#8888ff"; // Blue when activated but not in range
  };

  const handlePress = () => {
    if (isPlayerInRange()) {
      setIsActivated(!isActivated);
      console.log(
        `Teleporter ${teleporter.direction} ${
          isActivated ? "deactivated" : "activated"
        }`
      );
    }
  };

  // Auto-teleport when walking over activated teleporter
  React.useEffect(() => {
    if (isActivated && isPlayerNearby() && linkedTeleporter) {
      console.log(
        `Auto-teleporting from ${teleporter.direction} to ${linkedTeleporter.direction}`
      );
      onTeleport(teleporter);
    }
  }, [isActivated, playerPosition, linkedTeleporter, onTeleport, teleporter]);

  return (
    <TouchableOpacity
      style={[
        styles.teleporter,
        {
          left: teleporter.x - cameraPosition.x,
          top: teleporter.y - cameraPosition.y,
          width: teleporter.width,
          height: teleporter.height,
          backgroundColor: getTeleporterColor(),
          borderColor: isPlayerInRange() ? "#ffff00" : "#4444ff",
          borderWidth: isPlayerInRange() ? 3 : 2,
        },
      ]}
      onPress={handlePress}
      disabled={!isPlayerInRange()}
    >
      <Text style={styles.teleporterIcon}>{getTeleporterIcon()}</Text>
      <Text style={styles.roomName}>
        {teleporter.id.split("_")[1]}_{teleporter.id.split("_")[2]}
      </Text>
      <Text style={styles.debugText}>
        Pos: {Math.round(teleporter.x)}, {Math.round(teleporter.y)}
      </Text>
      <Text style={styles.statusText}>{isActivated ? "ON" : "OFF"}</Text>
      {isPlayerInRange() && (
        <Text style={styles.interactionText}>
          {isActivated ? "Click to Deactivate" : "Click to Activate"}
        </Text>
      )}
      {isActivated && isPlayerNearby() && (
        <Text style={styles.teleportText}>Teleporting...</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  teleporter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  teleporterIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  roomName: {
    fontSize: 10,
    color: "#000",
    fontWeight: "bold",
    marginTop: 1,
  },
  statusText: {
    fontSize: 8,
    color: "#000",
    fontWeight: "bold",
    marginTop: 1,
  },
  interactionText: {
    fontSize: 8,
    color: "#000",
    fontWeight: "bold",
    marginTop: 1,
  },
  debugText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 1,
  },
  teleportText: {
    fontSize: 10,
    color: "#ff0000",
    fontWeight: "bold",
    marginTop: 2,
  },
});

export default Teleporter;

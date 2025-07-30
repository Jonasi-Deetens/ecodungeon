import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Door as DoorType } from "../types/gameTypes";

interface DoorProps {
  door: DoorType;
  cameraPosition: { x: number; y: number };
  onDoorInteract: (door: DoorType) => void;
  playerPosition: { x: number; y: number };
}

const Door: React.FC<DoorProps> = ({
  door,
  cameraPosition,
  onDoorInteract,
  playerPosition,
}) => {
  const isPlayerNearby = () => {
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - (door.x + door.width / 2), 2) +
        Math.pow(playerPosition.y - (door.y + door.height / 2), 2)
    );
    return distance < 150; // Player can interact within 150px
  };

  const getDoorIcon = () => {
    if (door.isOpen) {
      return "🚪"; // Open door
    }
    return "🚪"; // Closed door
  };

  const getDoorColor = () => {
    if (door.isOpen) {
      return "#8B4513"; // Brown when open
    }
    return "#654321"; // Darker brown when closed
  };

  return (
    <TouchableOpacity
      style={[
        styles.door,
        {
          left: door.x - cameraPosition.x,
          top: door.y - cameraPosition.y,
          width: door.width,
          height: door.height,
          backgroundColor: getDoorColor(),
          borderColor: isPlayerNearby() ? "#FFD700" : "#654321", // Gold border when nearby
          borderWidth: isPlayerNearby() ? 3 : 2,
        },
      ]}
      onPress={() => onDoorInteract(door)}
      disabled={!isPlayerNearby()}
    >
      <Text style={styles.doorIcon}>{getDoorIcon()}</Text>
      {isPlayerNearby() && (
        <Text style={styles.interactionText}>
          {door.isOpen ? "Close" : "Open"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  door: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  doorIcon: {
    fontSize: 24,
  },
  interactionText: {
    position: "absolute",
    bottom: -20,
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Door;

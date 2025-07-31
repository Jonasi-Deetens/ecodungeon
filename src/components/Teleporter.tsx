import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Teleporter as TeleporterType } from "../types/gameTypes";

interface TeleporterProps {
  teleporter: TeleporterType;
  cameraPosition: { x: number; y: number };
  playerPosition: { x: number; y: number };
  onTeleport: (teleporter: TeleporterType) => void;
  linkedTeleporter?: TeleporterType | undefined; // The teleporter this connects to
  isActivated?: boolean;
  onActivationChange?: (teleporterId: string, activated: boolean) => void;
  roomPosition?: { x: number; y: number }; // Room's world position for coordinate conversion
}

const Teleporter: React.FC<TeleporterProps> = ({
  teleporter,
  cameraPosition,
  playerPosition,
  onTeleport,
  linkedTeleporter,
  isActivated = false,
  onActivationChange,
  roomPosition,
}) => {
  const [isTeleporting, setIsTeleporting] = useState(false);
  const isTeleportingRef = useRef(false);
  const teleportTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync the ref with state
  useEffect(() => {
    isTeleportingRef.current = isTeleporting;
  }, [isTeleporting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (teleportTimeoutRef.current) {
        clearTimeout(teleportTimeoutRef.current);
      }
    };
  }, []);

  const isPlayerNearby = () => {
    // Convert player position to room-relative coordinates
    const playerRoomX = roomPosition
      ? playerPosition.x - roomPosition.x
      : playerPosition.x;
    const playerRoomY = roomPosition
      ? playerPosition.y - roomPosition.y
      : playerPosition.y;

    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerRoomX - teleporterCenterX, 2) +
        Math.pow(playerRoomY - teleporterCenterY, 2)
    );

    return distance <= 80; // 80px for walking over (decreased from 100px)
  };

  const isPlayerInRange = () => {
    // Convert player position to room-relative coordinates
    const playerRoomX = roomPosition
      ? playerPosition.x - roomPosition.x
      : playerPosition.x;
    const playerRoomY = roomPosition
      ? playerPosition.y - roomPosition.y
      : playerPosition.y;

    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerRoomX - teleporterCenterX, 2) +
        Math.pow(playerRoomY - teleporterCenterY, 2)
    );
    return distance <= 150; // 150px for clicking (increased from 100px)
  };

  const getTeleporterColor = () => {
    if (isTeleporting) return "#ff0000"; // Red when teleporting
    if (!isActivated) return "#666666"; // Gray when deactivated
    if (isPlayerNearby()) return "#00ff00"; // Green when player is on it
    if (isPlayerInRange()) return "#ffff00"; // Yellow when in click range
    return "#8888ff"; // Blue when activated but not in range
  };

  const handlePress = () => {
    if (isPlayerInRange() && !isTeleporting && onActivationChange) {
      const newActivatedState = !isActivated;
      onActivationChange(teleporter.id, newActivatedState);
    }
  };

  // Auto-teleport when walking over activated teleporter
  useEffect(() => {
    const nearby = isPlayerNearby();
    const inRange = isPlayerInRange();

    // Only start teleportation if all conditions are met and not already teleporting
    if (
      isActivated &&
      nearby &&
      linkedTeleporter &&
      !isTeleportingRef.current
    ) {
      // Set teleporting state immediately
      setIsTeleporting(true);

      // Clear any existing timeout
      if (teleportTimeoutRef.current) {
        clearTimeout(teleportTimeoutRef.current);
      }

      // Add delay before teleporting
      teleportTimeoutRef.current = setTimeout(() => {
        // Call the teleport function
        onTeleport(teleporter);

        // Reset teleporting state after a delay
        setTimeout(() => {
          setIsTeleporting(false);
        }, 3000); // 3 seconds cooldown

        // Clear the timeout ref
        teleportTimeoutRef.current = null;
      }, 500); // 500ms delay before teleport
    }
  }, [isActivated, playerPosition, linkedTeleporter, onTeleport, teleporter]);

  return (
    <TouchableOpacity
      style={[
        styles.teleporter,
        {
          left: teleporter.x,
          top: teleporter.y,
          width: teleporter.width,
          height: teleporter.height,
          backgroundColor: getTeleporterColor(),
          borderColor: isPlayerInRange() ? "#ffff00" : "#4444ff",
          borderWidth: isPlayerInRange() ? 3 : 2,
        },
      ]}
      onPress={handlePress}
      disabled={!isPlayerInRange() || isTeleporting}
    >
      {/* Main teleporter portal effect */}
      <View style={styles.portalRing}>
        <View style={styles.portalInner} />
      </View>

      {/* Status indicator */}
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: isActivated ? "#00ff00" : "#ff0000" },
        ]}
      />

      {/* Teleporting animation */}
      {isTeleporting && (
        <View style={styles.teleportingEffect}>
          <Text style={styles.teleportText}>TELEPORTING</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  teleporter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50, // Make it circular
    borderWidth: 3,
    borderStyle: "solid",
  },
  portalRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#ffffff",
    borderStyle: "solid",
    justifyContent: "center",
    alignItems: "center",
  },
  portalInner: {
    width: "70%",
    height: "70%",
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "#ffffff",
    borderStyle: "solid",
  },

  statusIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  teleportingEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  teleportText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "bold",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Teleporter;

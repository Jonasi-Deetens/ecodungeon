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
    const playerRoomX = roomPosition ? playerPosition.x - roomPosition.x : playerPosition.x;
    const playerRoomY = roomPosition ? playerPosition.y - roomPosition.y : playerPosition.y;
    
    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerRoomX - teleporterCenterX, 2) +
        Math.pow(playerRoomY - teleporterCenterY, 2)
    );
    
    // Debug logging when close to teleporter
    if (distance < 200 && isActivated && !isTeleporting) {
      console.log(`Teleporter ${teleporter.direction}: Player at (${playerRoomX.toFixed(0)}, ${playerRoomY.toFixed(0)}), Teleporter at (${teleporterCenterX.toFixed(0)}, ${teleporterCenterY.toFixed(0)}), Distance: ${distance.toFixed(0)}`);
    }
    
    return distance <= 100; // 100px for walking over (increased from 50px)
  };

  const isPlayerInRange = () => {
    // Convert player position to room-relative coordinates
    const playerRoomX = roomPosition ? playerPosition.x - roomPosition.x : playerPosition.x;
    const playerRoomY = roomPosition ? playerPosition.y - roomPosition.y : playerPosition.y;
    
    const teleporterCenterX = teleporter.x + teleporter.width / 2;
    const teleporterCenterY = teleporter.y + teleporter.height / 2;
    const distance = Math.sqrt(
      Math.pow(playerRoomX - teleporterCenterX, 2) +
        Math.pow(playerRoomY - teleporterCenterY, 2)
    );
    return distance <= 150; // 150px for clicking (increased from 100px)
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
    
    // Debug logging for teleportation conditions
    if (isActivated && nearby && !isTeleportingRef.current) {
      console.log(`🔍 Teleporter ${teleporter.direction} ready for teleportation`);
      console.log(`🔗 Linked teleporter:`, linkedTeleporter ? {
        id: linkedTeleporter.id,
        direction: linkedTeleporter.direction,
        connectedRoomId: linkedTeleporter.connectedRoomId
      } : 'null');
    }
    
    // Only start teleportation if all conditions are met and not already teleporting
    if (isActivated && nearby && linkedTeleporter && !isTeleportingRef.current) {
      console.log(`🚀 Starting teleportation from ${teleporter.direction} to ${linkedTeleporter.direction}`);
      console.log(`📊 Conditions: activated=${isActivated}, nearby=${nearby}, hasLinked=${!!linkedTeleporter}, notTeleporting=${!isTeleportingRef.current}`);
      
      // Set teleporting state immediately
      setIsTeleporting(true);
      
      // Clear any existing timeout
      if (teleportTimeoutRef.current) {
        clearTimeout(teleportTimeoutRef.current);
      }
      
      // Add delay before teleporting
      teleportTimeoutRef.current = setTimeout(() => {
        console.log(`✨ Teleporting from ${teleporter.direction} to ${linkedTeleporter.direction}`);
        console.log(`📞 Calling onTeleport with:`, {
          teleporterId: teleporter.id,
          teleporterDirection: teleporter.direction,
          onTeleportType: typeof onTeleport
        });
        
        // Call the teleport function
        onTeleport(teleporter);
        
        // Reset teleporting state after a delay
        setTimeout(() => {
          setIsTeleporting(false);
        }, 3000); // 3 seconds cooldown (increased from 2 seconds)
        
        // Clear the timeout ref
        teleportTimeoutRef.current = null;
      }, 500); // 500ms delay before teleport
    } else if (isActivated && nearby && !isTeleportingRef.current) {
      // Debug why teleportation isn't starting
      console.log(`❌ Teleportation blocked: activated=${isActivated}, nearby=${nearby}, hasLinked=${!!linkedTeleporter}, notTeleporting=${!isTeleportingRef.current}`);
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
      <Text style={styles.teleporterIcon}>{getTeleporterIcon()}</Text>
      <Text style={styles.roomName}>
        {teleporter.id.split("_")[1]}_{teleporter.id.split("_")[2]}
      </Text>
      <Text style={styles.statusText}>{isActivated ? "ON" : "OFF"}</Text>
      {isPlayerInRange() && !isTeleporting && (
        <Text style={styles.interactionText}>
          {isActivated ? "Click to Deactivate" : "Click to Activate"}
        </Text>
      )}
      {isTeleporting && (
        <Text style={styles.teleportText}>Teleporting...</Text>
      )}
      {/* Debug info */}
      <Text style={styles.debugText}>
        D: {Math.sqrt(
          Math.pow((roomPosition ? playerPosition.x - roomPosition.x : playerPosition.x) - (teleporter.x + teleporter.width / 2), 2) +
          Math.pow((roomPosition ? playerPosition.y - roomPosition.y : playerPosition.y) - (teleporter.y + teleporter.height / 2), 2)
        ).toFixed(0)}
      </Text>
      <Text style={styles.debugText}>
        {isActivated ? "A" : "D"} {isPlayerNearby() ? "N" : ""} {isPlayerInRange() ? "R" : ""}
      </Text>
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
